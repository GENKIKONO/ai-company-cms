import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { validateImageFile, getFileExtension } from '@/lib/security/file-validation';

// Organization logo upload API with Service Role bypass (fixed auth)
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（Core経由）
    const supabase = await createClient();
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // FormDataを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    if (!file || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'File and organizationId are required' 
      }, { status: 400 });
    }

    // ファイル検証（MIMEタイプ + マジックバイト二重検証）
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 1 * 1024 * 1024; // 1MB

    const validationResult = await validateImageFile(file, allowedTypes, maxSize);
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: validationResult.error
      }, { status: 400 });
    }

    // 組織のアクセス権確認（organization_members経由、owner/adminロール必須）
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (membershipError || !membershipData) {
      return NextResponse.json({
        success: false,
        error: 'Organization membership not found'
      }, { status: 403 });
    }

    // owner/adminロール必須チェック
    if (membershipData.role !== 'owner' && membershipData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Owner or admin permission required for logo upload'
      }, { status: 403 });
    }

    // 組織の存在確認
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
      }, { status: 404 });
    }

    // ファイル拡張子の決定（ユーティリティ使用）
    const fileExtension = getFileExtension(file.type);
    const fileName = `${organizationId}/logo${fileExtension}`;

    // Service Role権限でストレージアップロード
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('org-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      logger.error('Logo upload error:', { data: uploadError });
      return NextResponse.json({ 
        success: false, 
        error: uploadError.message 
      }, { status: 500 });
    }

    // Public URLを取得
    const { data: urlData } = serviceSupabase.storage
      .from('org-logos')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // データベースを更新 (Service Role権限で)
    const { error: updateError } = await serviceSupabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      logger.error('Database update error:', { data: updateError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update organization record' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      logoUrl: publicUrl,
      message: 'Logo uploaded successfully'
    });

  } catch (error) {
    // セキュリティ: ログには詳細を記録、クライアントには汎用メッセージ
    logger.error('Logo upload API error:', {
      data: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json({
      success: false,
      error: 'ロゴのアップロードに失敗しました'
    }, { status: 500 });
  }
}