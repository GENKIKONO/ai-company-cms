import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractionRateLimit } from '@/lib/rate-limit';
import { trackBusinessEvent } from '@/lib/monitoring';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const rateLimitResponse = await extractionRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 認証チェック
    const supabaseBrowser = await createClient();
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが必要です' },
        { status: 400 }
      );
    }

    // ファイルタイプとサイズチェック
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDFファイルのみサポートされています' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（10MB以下）' },
        { status: 400 }
      );
    }

    try {
      // Node.js環境でのPDF解析（簡易版）
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // シンプルなPDFテキスト抽出（実際の本格的なPDF解析ライブラリが必要な場合は後で追加）
      let text = '';
      const title = file.name.replace('.pdf', '');
      const headings: string[] = [];

      // PDFからのテキスト抽出は簡易版として、ファイル名と基本情報を返す
      // 実際の実装では pdf-parse や pdf2pic などのライブラリを使用
      const bufferString = buffer.toString('binary');
      
      // PDFから基本的なテキストを抽出（簡易版）
      const textMatches = bufferString.match(/\(([^)]+)\)/g);
      if (textMatches) {
        text = textMatches
          .map(match => match.slice(1, -1))
          .filter(str => str.length > 3 && /[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str))
          .join(' ')
          .slice(0, 5000);
      }

      // タイトルからメタデータを推測
      if (title.includes('会社') || title.includes('企業') || title.includes('概要')) {
        headings.push('企業概要');
      }
      if (title.includes('サービス') || title.includes('事業')) {
        headings.push('事業内容');
      }

      // テキストが十分に抽出できなかった場合のフォールバック
      if (text.length < 50) {
        text = `PDFファイル「${title}」の内容です。ファイルサイズ: ${Math.round(file.size / 1024)}KB`;
      }

      return NextResponse.json({
        success: true,
        text,
        title,
        headings,
        sourceUrl: `file://${file.name}`
      });

    } catch (error) {
      logger.error('PDF parsing error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'PDFの解析に失敗しました' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('PDF extraction API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'ファイル処理に失敗しました' },
      { status: 500 }
    );
  }
}