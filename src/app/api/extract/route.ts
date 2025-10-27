import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { JSDOM } from 'jsdom';
import { logger } from '@/lib/utils/logger';

interface ExtractionResult {
  title?: string;
  description?: string;
  content?: string;
  telephone?: string;
  address?: string;
  url?: string;
  email?: string;
}

function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(?:\+81[-\s]?|0)\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g;
  return Array.from(new Set(text.match(phoneRegex) || []));
}

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set(text.match(emailRegex) || []));
}

function extractAddresses(text: string): string[] {
  const addressPatterns = [
    /(?:〒\d{3}-\d{4})\s*[^\n]+/g,
    /[都道府県][市区町村][^\n]{10,50}/g,
    /\d{3}-\d{4}\s*[^\n]+/g
  ];
  
  const addresses: string[] = [];
  addressPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    addresses.push(...matches);
  });
  
  return Array.from(new Set(addresses));
}

async function extractFromURL(url: string): Promise<ExtractionResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIOHub-Bot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    const title = document.querySelector('title')?.textContent?.trim() || 
                 document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                 document.querySelector('h1')?.textContent?.trim() || '';
    
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                       document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                       document.querySelector('p')?.textContent?.trim().substring(0, 300) || '';
    
    const bodyText = document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
    
    const phones = extractPhoneNumbers(bodyText);
    const emails = extractEmails(bodyText);
    const addresses = extractAddresses(bodyText);
    
    return {
      title,
      description,
      content: bodyText.substring(0, 1000),
      telephone: phones[0],
      email: emails[0],
      address: addresses[0],
      url
    };
  } catch (error) {
    logger.error('URL extraction error', error instanceof Error ? error : new Error(String(error)));
    throw new Error('URLからの情報抽出に失敗しました');
  }
}

async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  // PDF解析は一時的に無効化（ライブラリの問題により）
  throw new Error('PDF解析機能は現在メンテナンス中です。URLからの抽出をご利用ください。');
}

export async function POST(request: NextRequest) {
  try {
    const supabaseBrowser = await supabaseServer();
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const contentType = request.headers.get('content-type') || '';
    
    let result: ExtractionResult;
    
    if (contentType.includes('application/json')) {
      // URL extraction
      const { url } = await request.json();
      
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'URLが指定されていません' },
          { status: 400 }
        );
      }
      
      // URL validation
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: '有効なURLを指定してください' },
          { status: 400 }
        );
      }
      
      result = await extractFromURL(url);
      
    } else if (contentType.includes('multipart/form-data')) {
      // PDF extraction
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'ファイルが指定されていません' },
          { status: 400 }
        );
      }
      
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'PDFファイルを指定してください' },
          { status: 400 }
        );
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await extractFromPDF(buffer);
      
    } else {
      return NextResponse.json(
        { error: '不正なリクエスト形式です' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Extraction API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}