import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    // 営業資料の存在確認と権限チェック
    const { data: material, error: materialError } = await supabase
      .from('sales_materials')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: 'Material not found or access denied' }, { status: 404 });
    }

    // Service Role権限でファイルダウンロード
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

    const { data: fileData, error: downloadError } = await serviceSupabase.storage
      .from('sales-materials')
      .download(material.file_path);

    if (downloadError) {
      logger.error('File download error:', { data: downloadError });
      return NextResponse.json({ 
        error: 'File download failed',
        details: downloadError.message 
      }, { status: 500 });
    }

    // ファイル名の決定
    const fileName = material.title || `material_${material.id}`;
    const fileExtension = material.file_type ? 
      material.file_type.split('/').pop() : 
      material.file_path.split('.').pop() || 'bin';

    // レスポンスヘッダーの設定
    const headers = new Headers();
    headers.set('Content-Type', material.file_type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName}.${fileExtension}"`);
    headers.set('Cache-Control', 'private, max-age=0');

    return new NextResponse(fileData, {
      status: 200,
      headers
    });

  } catch (error: any) {
    logger.error('Material download API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}