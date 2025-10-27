import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // お問合せ一覧を取得（現在はダミーデータ）
    // TODO: 実際のお問合せテーブルから取得するように実装
    const dummyContacts = [
      {
        id: '1',
        name: 'サンプル太郎',
        email: 'sample@example.com',
        phone: '03-1234-5678',
        subject: 'サービスについてのお問合せ',
        message: 'こんにちは。御社のサービスについて詳しく教えていただけますでしょうか。特に料金体系について知りたいです。',
        status: 'unread',
        created_at: new Date().toISOString(),
      },
      {
        id: '2', 
        name: 'テスト花子',
        email: 'test@example.com',
        subject: '技術的な質問',
        message: 'APIの利用方法について教えてください。ドキュメントを確認しましたが、もう少し詳しい説明が欲しいです。',
        status: 'read',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ];

    return NextResponse.json({ data: dummyContacts });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}