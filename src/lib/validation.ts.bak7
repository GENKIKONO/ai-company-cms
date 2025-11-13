import { z } from 'zod';
import { OrganizationData, ServiceData, FAQData, CaseStudyData } from './jsonld';

// バリデーションスキーマ定義
export const organizationSchema = z.object({
  name: z.string().min(1, '企業名は必須です'),
  description: z.string().min(1, '企業説明は必須です'),
  addressRegion: z.string().min(1, '都道府県は必須です'),
  addressLocality: z.string().min(1, '市区町村は必須です'),
  telephone: z.string().min(1, '電話番号は必須です'),
  url: z.string().url('有効なURLを入力してください'),
  logoUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  established_at: z.string().optional(),
  streetAddress: z.string().optional(),
  postalCode: z.string().regex(/^\d{3}-\d{4}$/, '郵便番号は000-0000の形式で入力してください').optional().or(z.literal('')),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  areaServed: z.array(z.string()).optional(),
  sameAs: z.array(z.string().url()).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, 'サービス名は必須です').max(100, 'サービス名は100文字以内で入力してください'),
  summary: z.string().min(10, 'サービス概要は10文字以上で入力してください').max(500, 'サービス概要は500文字以内で入力してください'),
  features: z.array(z.string()).optional(),
  category: z.string().optional(),
  price: z.string().optional(),
  cta_url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
});

export const faqSchema = z.object({
  question: z.string().min(1, '質問は必須です').max(200, '質問は200文字以内で入力してください'),
  answer: z.string().min(1, '回答は必須です').max(1000, '回答は1000文字以内で入力してください'),
  sort_order: z.number().int().min(1).optional(),
});

export const caseStudySchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  clientType: z.string().optional(),
  clientName: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  outcome: z.string().optional(),
  metrics: z.record(z.union([z.string(), z.number()])).optional(),
  publishedAt: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

// Preflight検証結果の型定義
export type PreflightResult = {
  success: boolean;
  errors: string[];
  warnings: string[];
};

// JSON-LD内部検証関数
export const validateJsonLdStructure = (jsonLd: any): PreflightResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 基本構造チェック
    if (!jsonLd['@context'] || jsonLd['@context'] !== 'https://schema.org') {
      errors.push('@contextが不正です');
    }

    if (!jsonLd['@type']) {
      errors.push('@typeが設定されていません');
    }

    // Organization固有のチェック
    if (jsonLd['@type'] === 'Organization') {
      if (!jsonLd.name) errors.push('企業名が設定されていません');
      if (!jsonLd.description) errors.push('企業説明が設定されていません');
      if (!jsonLd.url) errors.push('企業URLが設定されていません');
      
      // 住所チェック
      if (jsonLd.address) {
        if (!jsonLd.address.addressLocality) errors.push('市区町村が設定されていません');
        if (!jsonLd.address.addressRegion) errors.push('都道府県が設定されていません');
        if (jsonLd.address.addressCountry !== 'JP') warnings.push('国コードがJPではありません');
      } else {
        errors.push('住所情報が設定されていません');
      }

      // 連絡先チェック
      if (jsonLd.contactPoint && Array.isArray(jsonLd.contactPoint)) {
        jsonLd.contactPoint.forEach((contact: any, index: number) => {
          if (!contact.telephone) {
            warnings.push(`連絡先${index + 1}: 電話番号が設定されていません`);
          } else if (!contact.telephone.startsWith('+81')) {
            warnings.push(`連絡先${index + 1}: 電話番号がE.164形式ではありません`);
          }
        });
      }
    }

    // Service固有のチェック
    if (jsonLd['@type'] === 'Service') {
      if (!jsonLd.name) errors.push('サービス名が設定されていません');
      if (!jsonLd.description) errors.push('サービス説明が設定されていません');
      if (!jsonLd.provider) errors.push('提供者情報が設定されていません');
    }

    // FAQ固有のチェック
    if (jsonLd['@type'] === 'FAQPage') {
      if (!jsonLd.mainEntity || !Array.isArray(jsonLd.mainEntity) || jsonLd.mainEntity.length === 0) {
        errors.push('FAQ項目が設定されていません');
      } else {
        jsonLd.mainEntity.forEach((faq: any, index: number) => {
          if (!faq.name) errors.push(`FAQ${index + 1}: 質問が設定されていません`);
          if (!faq.acceptedAnswer?.text) errors.push(`FAQ${index + 1}: 回答が設定されていません`);
        });
      }
    }

    // CaseStudy固有のチェック
    if (jsonLd['@type'] === 'CaseStudy') {
      if (!jsonLd.headline) errors.push('タイトルが設定されていません');
      if (!jsonLd.author) errors.push('著者情報が設定されていません');
      if (!jsonLd.articleBody) warnings.push('本文が設定されていません');
    }

    // 空の配列やオブジェクトチェック
    Object.entries(jsonLd).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        warnings.push(`${key}が空の配列です`);
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) {
        warnings.push(`${key}が空のオブジェクトです`);
      }
    });

  } catch (error) {
    errors.push(`JSON-LD検証エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
};

// 組織データのPreflight検証
export const validateOrganizationPreflight = async (orgData: any): Promise<PreflightResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Zodバリデーション
    const result = organizationSchema.safeParse(orgData);
    if (!result.success) {
      result.error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }

    // URL存在チェック（簡易版）
    if (orgData.url) {
      try {
        new URL(orgData.url);
        if (!orgData.url.startsWith('https://')) {
          warnings.push('URLがHTTPSではありません');
        }
      } catch {
        errors.push('無効なURLです');
      }
    }

    // 電話番号E.164形式チェック
    if (orgData.telephone) {
      const e164Pattern = /^\+81\d{9,10}$/;
      if (!e164Pattern.test(orgData.telephone.replace(/[-\s]/g, ''))) {
        warnings.push('電話番号がE.164形式でない可能性があります');
      }
    }

    // 必須項目の存在チェック（requirements_system.mdから）
    const requiredFields = ['name', 'description', 'addressRegion', 'addressLocality', 'telephone', 'url'];
    requiredFields.forEach(field => {
      if (!orgData[field] || (typeof orgData[field] === 'string' && orgData[field].trim() === '')) {
        errors.push(`必須項目「${field}」が設定されていません`);
      }
    });

  } catch (error) {
    errors.push(`バリデーションエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
};

// サービスデータのPreflight検証
export const validateServicePreflight = async (serviceData: any): Promise<PreflightResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = serviceSchema.safeParse(serviceData);
    if (!result.success) {
      result.error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }

    // 価格フィールドの数値チェック
    if (serviceData.price && serviceData.price.trim() !== '') {
      const numericPrice = parseFloat(serviceData.price.replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice) || numericPrice <= 0) {
        warnings.push('価格が有効な数値ではありません');
      }
    }

  } catch (error) {
    errors.push(`サービスバリデーションエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
};

// 包括的なPreflight検証
export const runComprehensivePreflight = async (orgData: any, services?: any[], faqs?: any[], caseStudies?: any[]): Promise<PreflightResult> => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 組織データ検証
  const orgResult = await validateOrganizationPreflight(orgData);
  allErrors.push(...orgResult.errors);
  allWarnings.push(...orgResult.warnings);

  // サービスデータ検証
  if (services && services.length > 0) {
    for (let i = 0; i < services.length; i++) {
      const serviceResult = await validateServicePreflight(services[i]);
      serviceResult.errors.forEach(error => allErrors.push(`サービス${i + 1}: ${error}`));
      serviceResult.warnings.forEach(warning => allWarnings.push(`サービス${i + 1}: ${warning}`));
    }
  }

  // FAQ検証
  if (faqs && faqs.length > 0) {
    faqs.forEach((faq, index) => {
      const result = faqSchema.safeParse(faq);
      if (!result.success) {
        result.error.errors.forEach(err => {
          allErrors.push(`FAQ${index + 1}: ${err.message}`);
        });
      }
    });
  }

  // 導入事例検証
  if (caseStudies && caseStudies.length > 0) {
    caseStudies.forEach((caseStudy, index) => {
      const result = caseStudySchema.safeParse(caseStudy);
      if (!result.success) {
        result.error.errors.forEach(err => {
          allErrors.push(`導入事例${index + 1}: ${err.message}`);
        });
      }
    });
  }

  return {
    success: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};