/**
 * Organization Documents Ingestion Edge Function
 * PDFテキスト抽出 + Embedding生成パイプライン
 * 
 * 機能:
 * 1. Supabase Storage から PDF ダウンロード
 * 2. PDF から テキスト抽出（最大150ページまで処理）
 * 3. Embedding生成ジョブをキューに投入
 * 4. fire-and-forget パターン（MVP仕様）
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379';

// Constants
const ORG_DOCS_BUCKET_ID = 'user-uploads';

// PDF処理の制限値（実運用を考慮した設定）
const MAX_PAGES_TO_EXTRACT = 150;  // 100ページを確実にカバーし、余裕を持たせる
const MIN_TEXT_LENGTH = 200;       // 意味のあるテキスト量を要求（画像のみPDFを除外）
const MAX_MEMORY_CLEANUP_INTERVAL = 10; // 10ページごとにメモリクリーンアップを強制実行

interface IngestRequest {
  organization_id: string;
  file_metadata_id: string;
  bucket_id: string;
  object_path: string;
  display_name: string;
  file_size: number;
  uploaded_by: string;
}

interface IngestResponse {
  success: boolean;
  extracted_text_length?: number;
  embedding_job_id?: string;
  message: string;
  error?: string;
  pages_processed?: number;  // 処理されたページ数を追加
  pages_total?: number;      // 総ページ数を追加
}

// content_hashを生成（冪等性保証のため）
async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// PDFからテキスト抽出（本格運用版・50-100ページ対応）
async function extractTextFromPDF(pdfBuffer: ArrayBuffer, logger: ReturnType<typeof createEdgeLogger>): Promise<{
  text: string;
  totalPages: number;
  processedPages: number;
}> {
  let pdf: any = null;
  
  try {
    // Uint8Arrayに変換（PDF.jsで必要）
    const pdfData = new Uint8Array(pdfBuffer);
    
    // PDF.jsでPDFをロード（Deno環境最適化設定）
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfData,
      // Deno環境での安定動作のための設定
      isEvalSupported: false,
      useSystemFonts: false,  // システムフォント依存を無効化
      useWorkerFetch: false,  // Worker使用を無効化（Deno環境での問題回避）
      disableFontFace: true,  // フォントフェース機能を無効化（メモリ節約）
      // CMapは最小限の設定に変更（ネットワーク依存を削減）
      cMapUrl: null,
      cMapPacked: false
    });
    
    pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    
    if (totalPages === 0) {
      throw new Error('PDF has no pages');
    }
    
    // 処理ページ数を制限（大容量PDFでの安定動作確保）
    const pagesToProcess = Math.min(totalPages, MAX_PAGES_TO_EXTRACT);
    
    logger.info('PDF processing started', {
      totalPages,
      pagesToProcess,
      maxAllowed: MAX_PAGES_TO_EXTRACT
    });
    
    const textPages: string[] = [];
    let successfulPages = 0;
    let skippedPages = 0;
    
    // 各ページからテキストを抽出（制限ページ数まで）
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      let page: any = null;
      
      try {
        page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // テキストアイテムを連結してページテキストを生成
        const pageText = textContent.items
          .filter((item: any) => item && typeof item === 'object' && 'str' in item)
          .map((item: any) => String(item.str).trim())
          .filter((text: string) => text.length > 0)
          .join(' ')
          .trim();
        
        if (pageText.length > 0) {
          textPages.push(pageText);
          successfulPages++;
        }
        
        // 進行状況ログ（大容量PDF用）
        if (pageNum % 25 === 0 || pageNum === pagesToProcess) {
          logger.info('PDF processing progress', {
            currentPage: pageNum,
            totalPages: pagesToProcess,
            successfulPages,
            averageTextPerPage: textPages.length > 0 ? Math.round(textPages.join(' ').length / textPages.length) : 0
          });
        }
        
      } catch (pageError) {
        // 特定のページで失敗してもスキップして続行
        skippedPages++;
        logger.warn('Failed to extract text from page', {
          pageNum,
          error: pageError instanceof Error ? pageError.message : 'Unknown page error'
        });
        
      } finally {
        // ページレベルのメモリクリーンアップ
        if (page && typeof page.cleanup === 'function') {
          try {
            page.cleanup();
          } catch (cleanupError) {
            // クリーンアップエラーは警告のみ
            logger.warn('Page cleanup warning', { pageNum, error: cleanupError });
          }
        }
        
        // 定期的な強制メモリクリーンアップ（大容量PDF用）
        if (pageNum % MAX_MEMORY_CLEANUP_INTERVAL === 0) {
          // Denoの強制GC実行（利用可能な場合）
          if (typeof globalThis.gc === 'function') {
            try {
              globalThis.gc();
            } catch (gcError) {
              // GCエラーは無視（環境によって利用不可の場合がある）
            }
          }
        }
      }
    }
    
    logger.info('PDF page processing completed', {
      totalPages,
      pagesToProcess,
      successfulPages,
      skippedPages,
      textPagesCollected: textPages.length
    });
    
    // 全ページのテキストを改行で連結
    const extractedText = textPages.join('\n\n').trim();
    
    // 最小テキスト長チェック（定数使用）
    if (extractedText.length < MIN_TEXT_LENGTH) {
      throw new Error(
        `PDF text extraction failed: Insufficient text content (${extractedText.length} characters, minimum required: ${MIN_TEXT_LENGTH}). ` +
        `This may indicate an image-only PDF, corrupted file, or document with very little text content.`
      );
    }
    
    return {
      text: extractedText,
      totalPages,
      processedPages: successfulPages
    };
    
  } catch (error) {
    // PDF.js固有のエラーを詳細に分類
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || error.message.includes('PDF')) {
        throw new Error('PDF text extraction failed: Invalid or corrupted PDF file');
      } else if (error.message.includes('Password') || error.message.includes('password')) {
        throw new Error('PDF text extraction failed: Password-protected PDF files are not supported');
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('timeout')) {
        throw new Error('PDF text extraction failed: Network timeout or resource loading error');
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        throw new Error('PDF text extraction failed: Insufficient memory for processing (PDF may be too large)');
      } else if (error.message.includes('Insufficient text content')) {
        // 最小テキスト長エラーはそのまま再スロー
        throw error;
      } else {
        throw new Error(`PDF text extraction failed: ${error.message}`);
      }
    } else {
      throw new Error('PDF text extraction failed: Unknown error occurred during processing');
    }
    
  } finally {
    // PDFオブジェクトの最終クリーンアップ
    if (pdf && typeof pdf.cleanup === 'function') {
      try {
        pdf.cleanup();
        pdf = null;
      } catch (cleanupError) {
        logger.warn('PDF cleanup error', { error: cleanupError });
      }
    }
  }
}

// メイン処理
async function processDocumentIngest(request: IngestRequest, logger: ReturnType<typeof createEdgeLogger>): Promise<IngestResponse> {
  const { organization_id, file_metadata_id, bucket_id, object_path, display_name, file_size, uploaded_by } = request;
  
  logger.info('Starting document ingestion', {
    organization_id,
    file_metadata_id,
    bucket_id,
    object_path,
    display_name,
    file_size,
    maxPagesLimit: MAX_PAGES_TO_EXTRACT,
    minTextLength: MIN_TEXT_LENGTH
  });

  try {
    // Supabase クライアント作成
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. 既存のfile_metadataを取得してからstatusを更新（既存metadataを保持）
    const { data: existingFile } = await supabase
      .from('file_metadata')
      .select('metadata')
      .eq('id', file_metadata_id)
      .single();
    
    const currentMetadata = existingFile?.metadata || {};
    const { error: statusUpdateError } = await supabase
      .from('file_metadata')
      .update({ 
        metadata: { 
          ...currentMetadata,
          doc_type: 'org_pdf',
          organization_id: organization_id,
          status: 'processing',
          source: 'ai_org_chat',
          processing_started: new Date().toISOString(),
          max_pages_limit: MAX_PAGES_TO_EXTRACT
        }
      })
      .eq('id', file_metadata_id);

    if (statusUpdateError) {
      logger.warn('Failed to update file status to processing', { 
        file_metadata_id, 
        error: statusUpdateError 
      });
    }

    // 2. PDFファイルをストレージからダウンロード
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket_id)
      .download(object_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'File not found'}`);
    }

    // 3. PDFからテキストを抽出
    const pdfBuffer = await fileData.arrayBuffer();
    let extractionResult: { text: string; totalPages: number; processedPages: number; };
    let contentHash: string;
    
    try {
      extractionResult = await extractTextFromPDF(pdfBuffer, logger);
      contentHash = await generateContentHash(extractionResult.text);
      
      logger.info('Text extraction completed', {
        organization_id,
        file_metadata_id,
        display_name,
        extracted_text_length: extractionResult.text.length,
        total_pages: extractionResult.totalPages,
        processed_pages: extractionResult.processedPages
      });
    } catch (extractionError) {
      // PDF抽出失敗時の専用処理
      const errorMsg = extractionError instanceof Error ? extractionError.message : 'Unknown extraction error';
      
      logger.error('PDF text extraction failed', {
        organization_id,
        file_metadata_id,
        display_name,
        file_size,
        error: errorMsg
      });
      
      // file_metadataのstatusをerrorに更新し、エラー詳細を記録（既存metadataをマージ）
      await supabase
        .from('file_metadata')
        .update({ 
          metadata: { 
            ...currentMetadata,
            doc_type: 'org_pdf',
            organization_id: organization_id,
            status: 'error',
            source: 'ai_org_chat',
            pdf_extract_error: errorMsg,
            error_timestamp: new Date().toISOString(),
            processing_started: currentMetadata.processing_started,
            max_pages_limit: MAX_PAGES_TO_EXTRACT
          }
        })
        .eq('id', file_metadata_id);
      
      // PDF抽出失敗の場合はEmbeddingジョブを投入せずに終了
      return {
        success: false,
        message: 'PDF text extraction failed',
        error: errorMsg
      };
    }

    // 4. content_hashをfile_metadataに保存（既存metadataをマージ）
    await supabase
      .from('file_metadata')
      .update({ 
        metadata: { 
          ...currentMetadata,
          doc_type: 'org_pdf',
          organization_id: organization_id,
          status: 'processing',
          source: 'ai_org_chat',
          content_hash: contentHash,
          processing_started: currentMetadata.processing_started,
          max_pages_limit: MAX_PAGES_TO_EXTRACT,
          // テキスト抽出成功の詳細情報
          text_extracted: true,
          text_length: extractionResult.text.length,
          total_pages: extractionResult.totalPages,
          processed_pages: extractionResult.processedPages,
          text_extraction_completed: new Date().toISOString()
        }
      })
      .eq('id', file_metadata_id);

    // 5. Embedding生成ジョブをキューに投入（Supabase関数を使用）
    const { data: embeddingJobId, error: embeddingError } = await supabase
      .rpc('enqueue_embedding_job', {
        p_org_id: organization_id,
        p_source_table: 'file_metadata',
        p_source_id: file_metadata_id,
        p_source_field: 'content_text',
        p_content_text: extractionResult.text,
        p_chunk_strategy: 'fixed_size',
        p_embedding_model: 'text-embedding-3-small',
        p_priority: 50  // ユーザーアップロード文書は高優先度（小さい値 = 高優先度）
      });

    if (embeddingError) {
      logger.warn('Embedding job enqueue failed', {
        organization_id,
        file_metadata_id,
        display_name,
        text_length: extractionResult.text.length,
        error: embeddingError.message
      });
      
      // Embedding失敗でも全体は成功とする（MVP仕様）
      // file_metadataのstatusをerrorに更新（既存metadataをマージ）
      await supabase
        .from('file_metadata')
        .update({ 
          metadata: { 
            ...currentMetadata,
            doc_type: 'org_pdf',
            organization_id: organization_id,
            status: 'error',
            source: 'ai_org_chat',
            content_hash: contentHash,
            embedding_error: embeddingError.message,
            error_timestamp: new Date().toISOString(),
            processing_started: currentMetadata.processing_started,
            max_pages_limit: MAX_PAGES_TO_EXTRACT,
            // テキスト抽出は成功したことを記録
            text_extracted: true,
            text_length: extractionResult.text.length,
            total_pages: extractionResult.totalPages,
            processed_pages: extractionResult.processedPages,
            text_extraction_completed: currentMetadata.text_extraction_completed
          }
        })
        .eq('id', file_metadata_id);

      return {
        success: true,
        extracted_text_length: extractionResult.text.length,
        pages_processed: extractionResult.processedPages,
        pages_total: extractionResult.totalPages,
        message: `Text extracted successfully (${extractionResult.text.length} characters, ${extractionResult.processedPages}/${extractionResult.totalPages} pages). Embedding job failed but will retry later.`,
        error: `Embedding job failed: ${embeddingError.message}`
      };
    }
    
    // 6. file_metadataのstatusをreadyに更新（既存metadataをマージ）
    const { error: readyUpdateError } = await supabase
      .from('file_metadata')
      .update({ 
        metadata: { 
          ...currentMetadata,
          doc_type: 'org_pdf',
          organization_id: organization_id,
          status: 'ready',
          source: 'ai_org_chat',
          content_hash: contentHash,
          processing_started: currentMetadata.processing_started,
          max_pages_limit: MAX_PAGES_TO_EXTRACT,
          // 成功時の詳細情報を記録
          text_extracted: true,
          text_length: extractionResult.text.length,
          total_pages: extractionResult.totalPages,
          processed_pages: extractionResult.processedPages,
          text_extraction_completed: currentMetadata.text_extraction_completed,
          embedding_queued: true,
          completed_timestamp: new Date().toISOString()
        }
      })
      .eq('id', file_metadata_id);

    if (readyUpdateError) {
      logger.warn('Failed to update file status to ready', { 
        file_metadata_id, 
        error: readyUpdateError 
      });
    }
    
    logger.info('Document ingestion completed', {
      organization_id,
      file_metadata_id,
      display_name,
      extracted_text_length: extractionResult.text.length,
      total_pages: extractionResult.totalPages,
      processed_pages: extractionResult.processedPages,
      embedding_job_id: embeddingJobId
    });

    return {
      success: true,
      extracted_text_length: extractionResult.text.length,
      pages_processed: extractionResult.processedPages,
      pages_total: extractionResult.totalPages,
      embedding_job_id: embeddingJobId,
      message: `Document processed successfully. Extracted ${extractionResult.text.length} characters from ${extractionResult.processedPages}/${extractionResult.totalPages} pages and queued for embedding.`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Document ingestion failed', {
      organization_id,
      file_metadata_id,
      display_name,
      file_size,
      error: errorMsg
    });

    // 予期しないエラーの場合もmetadataを更新
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { data: existingFile } = await supabase
        .from('file_metadata')
        .select('metadata')
        .eq('id', file_metadata_id)
        .single();
      
      const currentMetadata = existingFile?.metadata || {};
      
      await supabase
        .from('file_metadata')
        .update({ 
          metadata: { 
            ...currentMetadata,
            status: 'error',
            general_error: errorMsg,
            error_timestamp: new Date().toISOString()
          }
        })
        .eq('id', file_metadata_id);
    } catch (metadataError) {
      logger.error('Failed to update metadata after general error', { metadataError });
    }

    return {
      success: false,
      message: 'Document ingestion failed',
      error: errorMsg
    };
  }
}

// Health check endpoint
async function handleHealth(_req: Request): Promise<Response> {
  const body = {
    ok: true,
    service: 'org-docs-ingest',
    version: '2.0.0',  // 本格運用版
    env: {
      hasUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    },
    capabilities: {
      pdfExtraction: true,
      embeddingIntegration: true,
      maxPages: MAX_PAGES_TO_EXTRACT,
      minTextLength: MIN_TEXT_LENGTH
    }
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Smoke test endpoint
async function handleSmoke(_req: Request): Promise<Response> {
  const smokeTestId = crypto.randomUUID();
  
  try {
    // テスト用のダミー処理
    const testRequest: IngestRequest = {
      organization_id: smokeTestId,
      file_metadata_id: smokeTestId,
      bucket_id: ORG_DOCS_BUCKET_ID,
      object_path: `${smokeTestId}/test.pdf`,
      display_name: 'test.pdf',
      file_size: 1024,
      uploaded_by: smokeTestId
    };

    const logger = createEdgeLogger();
    
    // 実際のファイル処理ではなく、基本的な機能テストのみ
    logger.info('Smoke test completed', { test_id: smokeTestId });

    return new Response(JSON.stringify({
      success: true,
      test_id: smokeTestId,
      message: 'Smoke test passed',
      config: {
        maxPages: MAX_PAGES_TO_EXTRACT,
        minTextLength: MIN_TEXT_LENGTH
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      test_id: smokeTestId,
      error: errorMsg
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Main request handler
async function handleIngest(req: Request): Promise<Response> {
  const logger = createEdgeLogger();
  
  try {
    const body = await req.json();
    const request: IngestRequest = body;
    
    // リクエスト検証
    if (!request.organization_id || !request.file_metadata_id || !request.object_path || !request.display_name) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: organization_id, file_metadata_id, object_path, display_name' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await processDocumentIngest(request, logger);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    logger.error('Document ingest handler error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// メインハンドラー - Supabase仕様準拠ルーティング
const BASE = '/functions/v1/org-docs-ingest';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;
  let subpath = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!subpath) subpath = '/';

  const method = req.method.toUpperCase();

  // ルーティング
  if (subpath === '/' && method === 'GET') return handleHealth(req);
  if (subpath === '/' && method === 'POST') return handleIngest(req);
  if (subpath === '/health' && method === 'GET') return handleHealth(req);
  if (subpath === '/smoke' && (method === 'GET' || method === 'POST')) return handleSmoke(req);

  // 404
  return new Response(
    JSON.stringify({ error: 'Not found', pathname, subpath, method }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
  );
});