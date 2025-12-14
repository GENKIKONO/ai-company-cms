import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// Constants for org docs management
const ORG_DOCS_BUCKET_ID = 'user-uploads' as const;

interface FileMetadata {
  doc_type: 'org_pdf';
  organization_id: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  content_hash?: string;
  source: 'ai_org_chat';
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック (Server-side)
    const supabase = await createClient();
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
    const allowedTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are allowed' 
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    // 組織の所有権確認 (通常のサーバーサイドクライアントを使用)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organizationId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization not found or access denied' 
      }, { status: 403 });
    }

    // ファイル名の準備（RLS要件: user.id先頭/組織ID/安全なファイル名）
    const fileId = crypto.randomUUID();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectPath = `${user.id}/${organizationId}/${fileId}_${cleanFileName}`;

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
      .from(ORG_DOCS_BUCKET_ID)
      .upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false // 同名ファイルの上書きを禁止
      });

    if (uploadError) {
      logger.error('Document upload error:', { data: uploadError });
      return NextResponse.json({ 
        success: false, 
        error: uploadError.message 
      }, { status: 500 });
    }

    // Private URLを取得（認証が必要）
    const { data: urlData } = await serviceSupabase.storage
      .from(ORG_DOCS_BUCKET_ID)
      .createSignedUrl(objectPath, 3600); // 1時間有効

    const documentUrl = urlData?.signedUrl || null;

    // file_metadata テーブルにメタデータを保存
    const metadata: FileMetadata = {
      doc_type: 'org_pdf',
      organization_id: organizationId,
      status: 'uploaded',
      source: 'ai_org_chat'
    };

    const { data: fileMetadata, error: metadataError } = await serviceSupabase
      .from('file_metadata')
      .insert({
        id: fileId,
        bucket_id: ORG_DOCS_BUCKET_ID,
        object_path: objectPath,
        language_code: 'ja',
        display_name: file.name,
        metadata: metadata,
        created_by: user.id
      })
      .select()
      .single();

    if (metadataError) {
      logger.error('File metadata insert error:', { data: metadataError });
      // ストレージからアップロードファイルを削除
      await serviceSupabase.storage.from(ORG_DOCS_BUCKET_ID).remove([objectPath]);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save file metadata' 
      }, { status: 500 });
    }

    try {
      // PDFテキスト抽出 + Embedding生成のジョブを非同期で開始
      // これはfire-and-forgetパターン（MVP要件）
      const extractionResult = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/org-docs-ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          file_metadata_id: fileId,
          bucket_id: ORG_DOCS_BUCKET_ID,
          object_path: objectPath,
          display_name: file.name,
          file_size: file.size,
          uploaded_by: user.id
        })
      });

      if (!extractionResult.ok) {
        logger.warn('PDF extraction job failed to start', { 
          objectPath, 
          status: extractionResult.status 
        });
      }
    } catch (extractionError) {
      // PDF抽出が失敗してもファイルアップロード自体は成功とする（MVP）
      logger.warn('PDF extraction job failed', { 
        objectPath, 
        error: extractionError instanceof Error ? extractionError.message : 'Unknown error'
      });
    }

    return NextResponse.json({ 
      success: true,
      id: fileId,
      display_name: file.name,
      status: 'uploaded',
      bucket_id: ORG_DOCS_BUCKET_ID,
      object_path: objectPath,
      file_size: file.size,
      document_url: documentUrl,
      message: 'Document uploaded successfully. Processing will begin shortly.'
    });

  } catch (error: any) {
    logger.error('Document upload API error:', {
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

// GET: 組織の文書一覧取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // URLパラメータからorganizationIdを取得
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'organizationId parameter is required' 
      }, { status: 400 });
    }

    // 組織の所有権確認
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organizationId)
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization not found or access denied' 
      }, { status: 403 });
    }

    // Service Role権限でfile_metadataから文書一覧を取得
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

    const { data: files, error: listError } = await serviceSupabase
      .from('file_metadata')
      .select('*')
      .eq('bucket_id', ORG_DOCS_BUCKET_ID)
      .eq('metadata->>doc_type', 'org_pdf')
      .eq('metadata->>organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (listError) {
      logger.error('Document list error:', { data: listError });
      return NextResponse.json({ 
        success: false, 
        error: listError.message 
      }, { status: 500 });
    }

    const documents = files.map(file => ({
      id: file.id,
      display_name: file.display_name,
      status: (file.metadata as FileMetadata)?.status || 'unknown',
      bucket_id: file.bucket_id,
      object_path: file.object_path,
      created_at: file.created_at,
      language_code: file.language_code
    }));

    return NextResponse.json({ 
      success: true, 
      documents
    });

  } catch (error: any) {
    logger.error('Document list API error:', {
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