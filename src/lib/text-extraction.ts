// テキスト抽出ユーティリティ（PDF/URL対応）

export interface ExtractionResult {
  success: boolean;
  text: string;
  title?: string;
  headings: string[];
  error?: string;
  sourceType: 'url' | 'pdf';
}

export interface ExtractedCandidates {
  name?: string;
  description?: string;
  services?: string[];
  telephone?: string;
  email?: string;
  address?: string;
  url?: string;
}

const TIMEOUT_MS = 10000; // 10秒タイムアウト

// URLからテキストを抽出
export async function extractFromURL(url: string): Promise<ExtractionResult> {
  try {
    // URLバリデーション
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('HTTPまたはHTTPSのURLのみサポートされています');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      text: result.data.content || '',
      title: result.data.title || '',
      headings: [], // APIが見出しを返さない場合は空配列
      sourceType: 'url'
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        text: '',
        headings: [],
        error: 'タイムアウトしました（10秒）',
        sourceType: 'url'
      };
    }

    return {
      success: false,
      text: '',
      headings: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      sourceType: 'url'
    };
  }
}

// PDFファイルからテキストを抽出
export async function extractFromPDF(file: File): Promise<ExtractionResult> {
  try {
    if (file.type !== 'application/pdf') {
      throw new Error('PDFファイルのみサポートされています');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      throw new Error('ファイルサイズが大きすぎます（10MB以下）');
    }

    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      text: result.data.content || '',
      title: result.data.title || file.name,
      headings: [], // APIが見出しを返さない場合は空配列
      sourceType: 'pdf'
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        text: '',
        headings: [],
        error: 'タイムアウトしました（10秒）',
        sourceType: 'pdf'
      };
    }

    return {
      success: false,
      text: '',
      headings: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      sourceType: 'pdf'
    };
  }
}

// 抽出されたテキストから候補データを生成
export function generateCandidates(text: string, title?: string, headings: string[] = []): ExtractedCandidates {
  const candidates: ExtractedCandidates = {};

  // 企業名の候補（タイトルまたは見出しから）
  if (title) {
    const cleanTitle = title
      .replace(/(.+?)\s*[-|｜]\s*.+/, '$1') // 「会社名 - サービス名」の形式から会社名を抽出
      .replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '')
      .trim();
    if (cleanTitle && cleanTitle.length < 50) {
      candidates.name = cleanTitle;
    }
  }

  // メールアドレスの抽出
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    candidates.email = emailMatch[0];
  }

  // 電話番号の抽出
  const phoneMatch = text.match(/(?:tel|TEL|電話|お電話)[:：]?\s*([0-9\-\(\)\s]{10,})/i);
  if (phoneMatch) {
    const phone = phoneMatch[1].replace(/[^\d\-]/g, '');
    if (phone.length >= 10) {
      candidates.telephone = phone;
    }
  }

  // URLの抽出
  const urlMatch = text.match(/https?:\/\/[^\s\)]+/);
  if (urlMatch) {
    candidates.url = urlMatch[0];
  }

  // 住所の抽出（簡易版）
  const addressMatch = text.match(/(?:住所|所在地|本社)[:：]?\s*([^\n\r]{10,100})/);
  if (addressMatch) {
    candidates.address = addressMatch[1].trim();
  }

  // 企業説明の生成（最初の段落から）
  const paragraphs = text.split('\n').filter(p => p.trim().length > 20);
  if (paragraphs.length > 0) {
    let description = paragraphs[0].trim();
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }
    candidates.description = description;
  }

  // サービス候補の抽出（見出しから）
  const serviceKeywords = ['サービス', 'service', '事業', '商品', 'ソリューション', '製品'];
  const serviceHeadings = headings.filter(h => 
    serviceKeywords.some(keyword => h.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (serviceHeadings.length > 0) {
    candidates.services = serviceHeadings.slice(0, 5); // 最大5個
  }

  return candidates;
}

// APIレスポンスから直接候補データを生成する関数を追加
export function generateCandidatesFromAPI(apiData: any): ExtractedCandidates {
  const candidates: ExtractedCandidates = {};

  if (apiData.title) {
    candidates.name = apiData.title;
  }
  
  if (apiData.description) {
    candidates.description = apiData.description;
  }
  
  if (apiData.telephone) {
    candidates.telephone = apiData.telephone;
  }
  
  if (apiData.email) {
    candidates.email = apiData.email;
  }
  
  if (apiData.address) {
    candidates.address = apiData.address;
  }
  
  if (apiData.url) {
    candidates.url = apiData.url;
  }

  return candidates;
}

// テキスト品質の評価
export function evaluateTextQuality(text: string): {
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (text.length < 100) {
    score -= 30;
    issues.push('テキストが短すぎます');
    recommendations.push('より詳細な情報源を使用してください');
  }

  if (text.length > 10000) {
    score -= 10;
    issues.push('テキストが長すぎます');
    recommendations.push('重要な部分を抜粋して使用してください');
  }

  // 日本語の含有率チェック
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const japaneseRatio = japaneseChars ? japaneseChars.length / text.length : 0;
  
  if (japaneseRatio < 0.3) {
    score -= 20;
    issues.push('日本語コンテンツが少ないです');
    recommendations.push('日本語の企業情報ページを使用してください');
  }

  // 構造化データの存在チェック
  if (!text.includes('会社') && !text.includes('企業') && !text.includes('株式会社')) {
    score -= 15;
    issues.push('企業情報らしい内容が見つかりません');
    recommendations.push('企業の公式サイトまたは企業概要を使用してください');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}

// 候補データの信頼度評価
export function evaluateCandidateReliability(candidates: ExtractedCandidates): Partial<Record<keyof ExtractedCandidates, number>> {
  const reliability: Partial<Record<keyof ExtractedCandidates, number>> = {};

  // 企業名の信頼度
  if (candidates.name) {
    let nameScore = 80;
    if (candidates.name.includes('株式会社') || candidates.name.includes('有限会社')) nameScore += 15;
    if (candidates.name.length < 3) nameScore -= 40;
    if (candidates.name.length > 30) nameScore -= 20;
    reliability.name = Math.min(95, nameScore);
  }

  // メールアドレスの信頼度
  if (candidates.email) {
    let emailScore = 90;
    if (candidates.email.includes('@gmail.com') || candidates.email.includes('@yahoo.co.jp')) emailScore -= 30;
    if (!candidates.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) emailScore -= 50;
    reliability.email = Math.max(10, emailScore);
  }

  // 電話番号の信頼度
  if (candidates.telephone) {
    let phoneScore = 85;
    if (!candidates.telephone.match(/^[0-9\-]+$/)) phoneScore -= 30;
    if (candidates.telephone.length < 10 || candidates.telephone.length > 15) phoneScore -= 20;
    reliability.telephone = Math.max(10, phoneScore);
  }

  // URLの信頼度
  if (candidates.url) {
    let urlScore = 75;
    try {
      const url = new URL(candidates.url);
      if (url.protocol === 'https:') urlScore += 10;
      if (url.hostname.includes('.co.jp') || url.hostname.includes('.jp')) urlScore += 15;
    } catch {
      urlScore -= 50;
    }
    reliability.url = Math.max(10, urlScore);
  }

  // その他のフィールドも同様に評価
  if (candidates.description) reliability.description = 70;
  if (candidates.address) reliability.address = 60;
  if (candidates.services) reliability.services = 65;

  return reliability;
}