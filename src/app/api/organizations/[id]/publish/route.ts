import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserServer } from '@/lib/supabase-server';
import { runComprehensivePreflight } from '@/lib/validation';
import { trackBusinessEvent, notifyError, withErrorHandling } from '@/lib/monitoring';

interface PublishGateResult {
  canPublish: boolean;
  errors: string[];
  warnings: string[];
  requiredActions: string[];
}

async function checkPublishGate(organizationId: string): Promise<PublishGateResult> {
  const supabaseBrowser = supabaseBrowserServer();

  try {
    // 組織とその関連データを取得
    const { data: org, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select(`
        *,
        services(*),
        faqs(*),
        case_studies(*),
        subscriptions(id, status, stripe_subscription_id)
      `)
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return {
        canPublish: false,
        errors: ['組織が見つかりません'],
        warnings: [],
        requiredActions: ['組織情報を確認してください']
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredActions: string[] = [];

    // 1. 基本的なバリデーション（Preflight）
    const preflightResult = await runComprehensivePreflight(
      org,
      org.services,
      org.faqs,
      org.case_studies
    );

    if (!preflightResult.success) {
      errors.push(...preflightResult.errors);
      warnings.push(...preflightResult.warnings);
    }

    // 2. サブスクリプション状態チェック
    const activeSubscription = org.subscriptions?.find(
      (sub: any) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      errors.push('アクティブなサブスクリプションが必要です');
      requiredActions.push('サブスクリプションを開始してください');
    }

    // 3. 組織ステータスチェック
    if (org.status === 'archived') {
      errors.push('アーカイブされた組織は公開できません');
      requiredActions.push('組織のステータスを変更してください');
    }

    // 4. 必須コンテンツチェック
    if (!org.services || org.services.length === 0) {
      warnings.push('サービス情報が登録されていません');
      requiredActions.push('少なくとも1つのサービスを登録することをお勧めします');
    }

    // 5. 画像・メディアチェック
    if (!org.logo_url) {
      warnings.push('企業ロゴが設定されていません');
      requiredActions.push('ロゴを設定することでSEO効果が向上します');
    }

    // 6. SEO最適化チェック
    if (org.description && org.description.length < 100) {
      warnings.push('企業説明が短すぎます（100文字以上推奨）');
      requiredActions.push('企業説明を詳しく記載してください');
    }

    if (org.description && org.description.length > 500) {
      warnings.push('企業説明が長すぎます（500文字以下推奨）');
      requiredActions.push('企業説明を簡潔にまとめてください');
    }

    // 7. 連絡先情報の公開設定チェック
    if (!org.email_public && !org.telephone) {
      warnings.push('公開可能な連絡手段が限られています');
      requiredActions.push('メールアドレスの公開設定を確認してください');
    }

    return {
      canPublish: errors.length === 0,
      errors,
      warnings,
      requiredActions
    };

  } catch (error) {
    console.error('Publish gate check error:', error);
    return {
      canPublish: false,
      errors: ['公開チェック中にエラーが発生しました'],
      warnings: [],
      requiredActions: ['システム管理者に連絡してください']
    };
  }
}

export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { action } = await request.json();
    const organizationId = params.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: '組織IDが必要です' },
        { status: 400 }
      );
    }

    const supabaseBrowser = supabaseBrowserServer();

    // 認証チェック
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 組織の所有者またはパートナーかチェック
    const { data: org, error: orgError } = await supabaseBrowser
      .from('organizations')
      .select('owner_user_id, partner_id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: '組織が見つかりません' },
        { status: 404 }
      );
    }

    const { data: appUser, error: userError } = await supabaseBrowser
      .from('app_users')
      .select('role, partner_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    const isOwner = org.owner_user_id === user.id;
    const isPartner = appUser.partner_id === org.partner_id;
    const isAdmin = appUser.role === 'admin';

    if (!isOwner && !isPartner && !isAdmin) {
      return NextResponse.json(
        { error: '公開権限がありません' },
        { status: 403 }
      );
    }

    if (action === 'check') {
      // Publish Gateチェックのみ実行
      const gateResult = await checkPublishGate(organizationId);
      return NextResponse.json(gateResult);
    }

    if (action === 'publish') {
      // Publish Gateチェックを実行
      const gateResult = await checkPublishGate(organizationId);

      if (!gateResult.canPublish) {
        return NextResponse.json({
          success: false,
          message: '公開前チェックに失敗しました',
          errors: gateResult.errors,
          warnings: gateResult.warnings,
          requiredActions: gateResult.requiredActions
        }, { status: 400 });
      }

      // Publish Gateを通過した場合、公開処理を実行
      const { error: updateError } = await supabaseBrowser
        .from('organizations')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (updateError) {
        console.error('Organization publish error:', updateError);
        return NextResponse.json(
          { error: '公開処理に失敗しました' },
          { status: 500 }
        );
      }

      // 公開履歴を記録
      await supabaseBrowser
        .from('approval_history')
        .insert({
          organization_id: organizationId,
          action: 'published',
          actor_user_id: user.id,
          actor_email: user.email || '',
          metadata: {
            published_by: isAdmin ? 'admin' : isPartner ? 'partner' : 'owner',
            publish_gate_passed: true,
            warnings_count: gateResult.warnings.length,
          }
        });

      // ビジネスイベントを記録
      await trackBusinessEvent(
        'organization_published',
        user.id,
        organizationId,
        {
          published_by: isAdmin ? 'admin' : isPartner ? 'partner' : 'owner',
          warnings_count: gateResult.warnings.length,
          has_subscription: !!gateResult
        }
      );

      return NextResponse.json({
        success: true,
        message: '組織を公開しました',
        warnings: gateResult.warnings,
        status: 'published'
      });
    }

    return NextResponse.json(
      { error: '無効なアクションです' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Publish API error:', error);
    if (error instanceof Error) {
      await notifyError(error, { 
        api: 'publish',
        organizationId: params.id,
        action: request.method 
      });
    }
    return NextResponse.json(
      { error: '公開処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
});