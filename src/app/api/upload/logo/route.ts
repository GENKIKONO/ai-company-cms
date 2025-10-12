import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase-server';

// Organization logo upload API with Service Role bypass (fixed auth)
export async function POST(request: NextRequest) {
  try {
    // 認証チェック (Server-side)
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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

    // ファイル検証
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 1 * 1024 * 1024; // 1MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PNG, JPG, and WebP files are allowed' 
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 1MB' 
      }, { status: 400 });
    }

    // 組織の所有権確認 (通常のサーバーサイドクライアントを使用)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organizationId)
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization not found or access denied' 
      }, { status: 403 });
    }

    // ファイル拡張子の決定
    const getFileExtension = (fileType: string): string => {
      if (fileType === 'image/png') return '.png';
      if (fileType === 'image/jpeg') return '.jpg';
      if (fileType === 'image/webp') return '.webp';
      return '.png'; // fallback
    };

    const fileExtension = getFileExtension(file.type);
    const fileName = `${organizationId}/logo${fileExtension}`;

    // Service Role権限でストレージアップロード
    const serviceSupabase = createClient(
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
      console.error('Logo upload error:', uploadError);
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
      console.error('Database update error:', updateError);
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

  } catch (error: any) {
    console.error('Logo upload API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}