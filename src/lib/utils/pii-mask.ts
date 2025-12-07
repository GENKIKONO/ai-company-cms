import { logger } from '@/lib/utils/logger';

// PII（個人識別情報）パターン定義
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(?:\+81|0)\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  japanesePostal: /\b\d{3}[-\s]?\d{4}\b/g,
  // 日本の姓名パターン（ひらがな・カタカナ・漢字）
  japaneseName: /(?:[一-龯]{1,4}\s*[一-龯]{1,4})|(?:[ぁ-ん]{2,8}\s*[ぁ-ん]{2,8})|(?:[ァ-ヶ]{2,8}\s*[ァ-ヶ]{2,8})/g,
  // 住所関連キーワード
  address: /(?:東京都|大阪府|京都府|北海道|[一-龯]{2,3}県)\s*[一-龯市区町村]+\s*[一-龯\d-]+/g,
  // 年齢・生年月日
  birthDate: /(?:19|20)\d{2}年\d{1,2}月\d{1,2}日/g,
  age: /\b\d{1,3}\s*歳/g,
  // 個人的な識別子
  myNumber: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // URLs（個人ページなど）
  personalUrl: /https?:\/\/(?:www\.)?(?:facebook|twitter|instagram|linkedin)\.com\/[\w.-]+/g
};

// マスキング設定
const MASKING_CONFIG = {
  email: (match: string) => `***@${match.split('@')[1]}`,
  phone: () => '***-****-****',
  creditCard: () => '****-****-****-****',
  japanesePostal: () => '***-****',
  japaneseName: () => '***',
  address: () => '***県***市***',
  birthDate: () => '****年**月**日',
  age: () => '**歳',
  myNumber: () => '****-****-****',
  personalUrl: () => '[URL MASKED]'
};

/**
 * PIIを含む可能性のあるテキストをマスキング
 */
export function maskPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let maskedText = text;
  const detectedPII: string[] = [];

  // 各パターンでマスキング実行
  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    const matches = maskedText.match(pattern);
    if (matches) {
      detectedPII.push(...matches.map(match => `${type}:${match.substring(0, 3)}***`));
      maskedText = maskedText.replace(pattern, MASKING_CONFIG[type as keyof typeof MASKING_CONFIG]);
    }
  });

  // PII検出時はログ記録（セキュリティ監査用）
  if (detectedPII.length > 0) {
    logger.warn('PII detected and masked', {
      data: {
        detectedTypes: detectedPII,
        originalLength: text.length,
        maskedLength: maskedText.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  return maskedText;
}

/**
 * PIIが含まれているかチェック（マスキングなし）
 */
export function containsPII(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return Object.values(PII_PATTERNS).some(pattern => pattern.test(text));
}

/**
 * 回答データ全体をマスキング
 */
export function maskAnswers(answers: Record<string, string>): Record<string, string> {
  const maskedAnswers: Record<string, string> = {};
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    maskedAnswers[questionId] = maskPII(answer);
  });

  return maskedAnswers;
}

/**
 * PIIチェック結果を含む検証
 */
export interface PIIValidationResult {
  isValid: boolean;
  containsPII: boolean;
  maskedText: string;
  warnings: string[];
}

export function validateAndMaskAnswer(answer: string): PIIValidationResult {
  if (!answer || typeof answer !== 'string') {
    return {
      isValid: false,
      containsPII: false,
      maskedText: answer,
      warnings: ['Invalid input: answer must be a non-empty string']
    };
  }

  const hasPII = containsPII(answer);
  const maskedText = hasPII ? maskPII(answer) : answer;
  const warnings: string[] = [];

  if (hasPII) {
    warnings.push('Personal information detected and masked');
  }

  if (answer.length > 5000) {
    warnings.push('Answer exceeds recommended length (5000 characters)');
  }

  return {
    isValid: true,
    containsPII: hasPII,
    maskedText,
    warnings
  };
}