/**
 * FAQ JSON-LD 生成
 * @type=FAQPage スキーマ準拠
 */

import type { Organization, FAQ } from '@/types/database';

interface FAQPageJsonLd {
  '@context': string;
  '@type': string;
  mainEntity: QuestionJsonLd[];
  author?: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher?: {
    '@type': string;
    name: string;
    url?: string;
  };
  dateCreated?: string;
  dateModified?: string;
}

interface QuestionJsonLd {
  '@type': string;
  name: string;
  acceptedAnswer: {
    '@type': string;
    text: string;
  };
  dateCreated?: string;
  dateModified?: string;
  keywords?: string;
}

/**
 * 空の値を除外するヘルパー
 */
function omitEmpty<T extends object>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 単独FAQ の JSON-LD を生成
 * @type=Question スキーマを使用
 */
export function generateSingleFAQJsonLd(faq: FAQ, org?: Organization): QuestionJsonLd {
  const jsonLd: QuestionJsonLd = {
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  };

  // 日付情報
  if (faq.created_at) {
    jsonLd.dateCreated = faq.created_at;
  }

  if (faq.updated_at) {
    jsonLd.dateModified = faq.updated_at;
  }

  // カテゴリをキーワードとして使用
  if (faq.category) {
    jsonLd.keywords = faq.category;
  }

  return omitEmpty(jsonLd) as QuestionJsonLd;
}

/**
 * FAQページ の JSON-LD を生成
 * @type=FAQPage スキーマを使用
 */
export function generateFAQPageJsonLd(faqs: FAQ[], org?: Organization): FAQPageJsonLd | null {
  if (faqs.length === 0) return null;

  // FAQを表示順序でソート
  const sortedFaqs = [...faqs].sort((a, b) => {
    if (a.sort_order === b.sort_order) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return a.sort_order - b.sort_order;
  });

  const jsonLd: FAQPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sortedFaqs.map(faq => generateSingleFAQJsonLd(faq, org))
  };

  // 組織情報を含める場合
  if (org) {
    jsonLd.author = {
      '@type': 'Organization',
      name: org.name
    };

    jsonLd.publisher = {
      '@type': 'Organization',
      name: org.name
    };

    if (org.url) {
      jsonLd.author.url = org.url;
      jsonLd.publisher.url = org.url;
    }
  }

  // 作成・更新日時は最も古いものと最も新しいものを使用
  if (sortedFaqs.length > 0) {
    const oldestFaq = sortedFaqs.reduce((prev, current) => {
      return new Date(prev.created_at) < new Date(current.created_at) ? prev : current;
    });

    const newestFaq = sortedFaqs.reduce((prev, current) => {
      return new Date(prev.updated_at) > new Date(current.updated_at) ? prev : current;
    });

    jsonLd.dateCreated = oldestFaq.created_at;
    jsonLd.dateModified = newestFaq.updated_at;
  }

  return omitEmpty(jsonLd) as FAQPageJsonLd;
}

/**
 * カテゴリ別FAQページ の JSON-LD を生成
 * 特定のカテゴリのFAQのみを含む
 */
export function generateCategoryFAQPageJsonLd(
  faqs: FAQ[], 
  category: string, 
  org?: Organization
): FAQPageJsonLd | null {
  const categoryFaqs = faqs.filter(faq => faq.category === category);
  
  if (categoryFaqs.length === 0) return null;

  const jsonLd = generateFAQPageJsonLd(categoryFaqs, org);
  
  if (jsonLd && org) {
    // カテゴリ情報を含めた詳細を追加
    jsonLd.author = {
      '@type': 'Organization',
      name: `${org.name} - ${category}`,
      url: org.url
    };
  }

  return jsonLd;
}

/**
 * FAQ JSON-LD の内部検証
 */
export interface FAQJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFAQPageJsonLd(faqs: FAQ[], org?: Organization): FAQJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック
  if (faqs.length === 0) {
    errors.push('At least one FAQ is required for FAQPage JSON-LD');
  }

  // 各FAQの検証
  faqs.forEach((faq, index) => {
    if (!faq.question?.trim()) {
      errors.push(`FAQ ${index + 1}: Question is required`);
    }

    if (!faq.answer?.trim()) {
      errors.push(`FAQ ${index + 1}: Answer is required`);
    }

    // 推奨項目チェック
    if (!faq.category?.trim()) {
      warnings.push(`FAQ ${index + 1}: Category is recommended for better organization`);
    }

    if (faq.sort_order === undefined || faq.sort_order < 1) {
      warnings.push(`FAQ ${index + 1}: Valid sort_order is recommended for proper ordering`);
    }
  });

  // 組織情報チェック
  if (org) {
    if (!org.name?.trim()) {
      errors.push('Organization name is required when including organization info');
    }

    if (org.url && !org.url.startsWith('https://')) {
      errors.push('Organization URL must use HTTPS');
    }
  }

  // 重複チェック
  const questions = faqs.map(faq => faq.question.toLowerCase().trim());
  const duplicateQuestions = questions.filter((question, index) => questions.indexOf(question) !== index);
  if (duplicateQuestions.length > 0) {
    warnings.push('Duplicate questions found - may affect SEO effectiveness');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * FAQ JSON-LD をHTML用文字列として出力
 */
export function faqPageJsonLdToHtml(faqs: FAQ[], org?: Organization): string | null {
  const jsonLd = generateFAQPageJsonLd(faqs, org);
  if (!jsonLd) return null;
  
  return JSON.stringify(jsonLd, null, 2);
}

/**
 * カテゴリ別FAQ JSON-LD をHTML用文字列として出力
 */
export function categoryFAQPageJsonLdToHtml(
  faqs: FAQ[], 
  category: string, 
  org?: Organization
): string | null {
  const jsonLd = generateCategoryFAQPageJsonLd(faqs, category, org);
  if (!jsonLd) return null;
  
  return JSON.stringify(jsonLd, null, 2);
}