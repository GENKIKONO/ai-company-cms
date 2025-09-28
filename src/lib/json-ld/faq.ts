/**
 * FAQ JSON-LD 生成
 * 要件定義準拠: FAQPage スキーマ、空出力禁止
 */

interface Faq {
  id: string;
  question: string;
  answer: string;
  order?: number;
  status?: string;
}

interface FaqPageJsonLd {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

/**
 * FAQ配列からFAQPage JSON-LDを生成
 * 要件定義準拠: 空のFAQは出力しない
 */
export function generateFaqPageJsonLd(faqs: Faq[]): FaqPageJsonLd | null {
  // 有効なFAQのみフィルタリング
  const validFaqs = faqs.filter(faq => 
    faq.question?.trim() && 
    faq.answer?.trim() &&
    faq.status === 'published'
  );

  // 有効なFAQがない場合はnullを返す（要件定義準拠: 空出力禁止）
  if (validFaqs.length === 0) {
    return null;
  }

  // orderでソート
  validFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));

  const jsonLd: FaqPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer.trim(),
      },
    })),
  };

  return jsonLd;
}

/**
 * FAQ JSON-LD の内部検証
 */
export interface FaqJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validFaqCount: number;
}

export function validateFaqJsonLd(faqs: Faq[]): FaqJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validFaqCount = 0;

  faqs.forEach((faq, index) => {
    const faqNumber = index + 1;

    // 必須項目チェック
    if (!faq.question?.trim()) {
      errors.push(`FAQ ${faqNumber}: Question is required`);
      return;
    }

    if (!faq.answer?.trim()) {
      errors.push(`FAQ ${faqNumber}: Answer is required`);
      return;
    }

    // 公開ステータスチェック
    if (faq.status !== 'published') {
      warnings.push(`FAQ ${faqNumber}: Not published, will be excluded from JSON-LD`);
      return;
    }

    // 長さチェック
    if (faq.question.length < 10) {
      warnings.push(`FAQ ${faqNumber}: Question is quite short, consider adding more detail`);
    }

    if (faq.answer.length < 20) {
      warnings.push(`FAQ ${faqNumber}: Answer is quite short, consider adding more detail`);
    }

    if (faq.question.length > 500) {
      warnings.push(`FAQ ${faqNumber}: Question is very long, consider shortening`);
    }

    if (faq.answer.length > 2000) {
      warnings.push(`FAQ ${faqNumber}: Answer is very long, consider shortening`);
    }

    validFaqCount++;
  });

  // 全体チェック
  if (validFaqCount === 0) {
    errors.push('No valid FAQs found for JSON-LD generation');
  } else if (validFaqCount < 3) {
    warnings.push('Consider adding more FAQs for better SEO impact');
  }

  return {
    isValid: errors.length === 0 && validFaqCount > 0,
    errors,
    warnings,
    validFaqCount,
  };
}

/**
 * FAQ JSON-LD をHTML用文字列として出力
 */
export function faqJsonLdToHtml(faqs: Faq[]): string | null {
  const jsonLd = generateFaqPageJsonLd(faqs);
  
  if (!jsonLd) {
    return null;
  }

  return JSON.stringify(jsonLd, null, 2);
}