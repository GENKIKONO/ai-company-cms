// DOMPurifyのようなライブラリが不要な場合の簡易実装
// 本番環境では isomorphic-dompurify の使用を推奨

interface SanitizeOptions {
  allowTags?: string[];
  allowAttributes?: { [key: string]: string[] };
  stripTags?: boolean;
}

export function sanitizeHtml(
  input: string,
  options: SanitizeOptions = {}
): string {
  if (typeof input !== 'string') {
    return '';
  }

  const allowedTags = options.allowTags || ['p', 'br', 'strong', 'em'];
  const stripTags = options.stripTags || false;

  if (stripTags) {
    return input.replace(/<[^>]*>/g, '');
  }

  // 基本的なHTMLエスケープ
  let cleaned = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // 許可されたタグのみを復元
  allowedTags.forEach(tag => {
    const openTagRegex = new RegExp(`&lt;${tag}&gt;`, 'gi');
    const closeTagRegex = new RegExp(`&lt;/${tag}&gt;`, 'gi');
    cleaned = cleaned.replace(openTagRegex, `<${tag}>`);
    cleaned = cleaned.replace(closeTagRegex, `</${tag}>`);
  });

  return cleaned;
}

export function stripHtml(input: string): string {
  return sanitizeHtml(input, { stripTags: true, allowTags: [] });
}

// LLM出力専用サニタイズ
export function sanitizeLLMOutput(output: string): string {
  // 1. HTML除去
  let cleaned = stripHtml(output);
  
  // 2. 潜在的なスクリプト除去
  cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  
  // 3. URL検証（HTTPSのみ許可）
  cleaned = cleaned.replace(
    /https?:\/\/[^\s]+/gi,
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' ? url : '[UNSAFE_URL_REMOVED]';
      } catch {
        return '[INVALID_URL_REMOVED]';
      }
    }
  );
  
  return cleaned;
}

// 文字列エスケープ
export function escapeForLogging(input: string): string {
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .substring(0, 1000); // ログ長制限
}