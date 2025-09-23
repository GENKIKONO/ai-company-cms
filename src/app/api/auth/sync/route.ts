import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

interface SyncResponse {
  success: boolean;
  message: string;
  role?: string;
  partnerId?: string | null;
  error?: string;
  requestId: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<SyncResponse>> {
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('Auth sync: Authentication error', {
        requestId,
        error: authError.message
      });
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        message: 'ユーザー認証に失敗しました',
        requestId
      }, { status: 401 });
    }
    
    if (!user) {
      console.warn('Auth sync: No user found', { requestId });
      return NextResponse.json({
        success: false,
        error: 'No user found',
        message: 'ユーザーが見つかりません',
        requestId
      }, { status: 401 });
    }

    console.info('Auth sync request', {
      requestId,
      userId: user.id,
      email: user.email ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 10)}` : 'N/A'
    });

    // 既存のapp_userをチェック
    const { data: existingUser, error: selectError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Auth sync: Database select error', {
        requestId,
        userId: user.id,
        error: selectError.message,
        code: selectError.code,
        details: selectError.details
      });
      
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        message: 'データベースエラーが発生しました',
        requestId
      }, { status: 500 });
    }

    if (!existingUser) {
      console.info('Auth sync: Creating new user profile', {
        requestId,
        userId: user.id
      });
      
      // 新規ユーザーの場合、初期ロールをorg_ownerとして作成
      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          role: 'org_owner', // 初期ロール（後でadminが変更可能）
          partner_id: null
        });

      if (insertError) {
        console.error('Auth sync: Database insert error', {
          requestId,
          userId: user.id,
          error: insertError.message,
          code: insertError.code,
          details: insertError.details
        });
        
        // RLS関連のエラーを特定
        if (insertError.code === '42501' || insertError.message.includes('RLS') || insertError.message.includes('policy')) {
          return NextResponse.json({
            success: false,
            error: 'Permission denied',
            message: 'ユーザープロフィール作成の権限がありません',
            requestId
          }, { status: 403 });
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to create user profile',
          message: 'ユーザープロフィールの作成に失敗しました',
          requestId
        }, { status: 500 });
      }

      console.info('Auth sync: User profile created successfully', {
        requestId,
        userId: user.id,
        role: 'org_owner'
      });

      return NextResponse.json({ 
        success: true, 
        message: 'User profile created',
        role: 'org_owner',
        requestId
      });
    }

    console.info('Auth sync: User profile already exists', {
      requestId,
      userId: user.id,
      role: existingUser.role,
      hasPartner: !!existingUser.partner_id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User already exists',
      role: existingUser.role,
      partnerId: existingUser.partner_id,
      requestId
    });

  } catch (error) {
    console.error('Auth sync: Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'システムエラーが発生しました',
      requestId
    }, { status: 500 });
  }
}