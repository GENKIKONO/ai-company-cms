import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowserServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabaseBrowser = supabaseBrowserServer();
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 既存のapp_userをチェック
    const { data: existingUser } = await supabaseBrowser
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingUser) {
      // 新規ユーザーの場合、初期ロールをorg_ownerとして作成
      const { error: insertError } = await supabaseBrowser
        .from('app_users')
        .insert({
          id: user.id,
          role: 'org_owner', // 初期ロール（後でadminが変更可能）
          partner_id: null
        });

      if (insertError) {
        console.error('Error creating app_user:', insertError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User profile created',
        role: 'org_owner'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User already exists',
      role: existingUser.role,
      partnerId: existingUser.partner_id
    });

  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}