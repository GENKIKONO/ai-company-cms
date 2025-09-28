/**
 * CaseStudy JSON-LD 生成
 * 要件定義準拠: CaseStudy スキーマ
 */

import type { Organization } from '@/types/database';

interface CaseStudy {
  id: string;
  title: string;
  client_type?: string | null;
  client_name?: string | null;
  problem?: string | null;
  solution?: string | null;
  outcome?: string | null;
  published_at?: string | null;
  is_anonymous?: boolean;
  status?: string;
  organization_id: string;
}

interface CaseStudyJsonLd {
  '@context': string;
  '@type': string;
  headline: string;
  about?: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  datePublished?: string;
  articleBody: string;
  inLanguage: string;
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
 * CaseStudy の JSON-LD を生成
 */
export function generateCaseStudyJsonLd(caseStudy: CaseStudy, org: Organization): CaseStudyJsonLd {
  // 記事本文を構築
  const articleParts: string[] = [];
  
  if (caseStudy.problem?.trim()) {
    articleParts.push(`Problem: ${caseStudy.problem.trim()}`);
  }
  
  if (caseStudy.solution?.trim()) {
    articleParts.push(`Solution: ${caseStudy.solution.trim()}`);
  }
  
  if (caseStudy.outcome?.trim()) {
    articleParts.push(`Outcome: ${caseStudy.outcome.trim()}`);
  }

  const jsonLd: CaseStudyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CaseStudy',
    headline: caseStudy.title,
    author: {
      '@type': 'Organization',
      name: org.name,
    },
    articleBody: articleParts.join('\n\n'),
    inLanguage: 'ja',
  };

  // 著者のURL
  if (org.url) {
    jsonLd.author.url = org.url;
  }

  // クライアント情報（匿名化されていない場合）
  if (caseStudy.client_type && !caseStudy.is_anonymous) {
    jsonLd.about = caseStudy.client_type;
  }

  // 公開日
  if (caseStudy.published_at) {
    jsonLd.datePublished = caseStudy.published_at;
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as CaseStudyJsonLd;
}

/**
 * CaseStudy JSON-LD の内部検証
 */
export interface CaseStudyJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCaseStudyJsonLd(caseStudy: CaseStudy, org: Organization): CaseStudyJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック
  if (!caseStudy.title?.trim()) {
    errors.push('Case study title is required');
  }

  if (!org.name?.trim()) {
    errors.push('Organization name is required for case study author');
  }

  // 公開ステータスチェック
  if (caseStudy.status !== 'published') {
    errors.push('Case study must be published for JSON-LD generation');
  }

  // 内容チェック
  if (!caseStudy.problem?.trim() && !caseStudy.solution?.trim() && !caseStudy.outcome?.trim()) {
    errors.push('At least one of problem, solution, or outcome is required');
  }

  // 推奨項目チェック
  if (!caseStudy.problem?.trim()) {
    warnings.push('Problem description is recommended for better context');
  }

  if (!caseStudy.solution?.trim()) {
    warnings.push('Solution description is recommended');
  }

  if (!caseStudy.outcome?.trim()) {
    warnings.push('Outcome description is recommended for credibility');
  }

  if (!caseStudy.published_at) {
    warnings.push('Published date is recommended for freshness signals');
  }

  if (!caseStudy.client_type?.trim()) {
    warnings.push('Client type is recommended for context');
  }

  // URL形式チェック
  if (org.url && !org.url.startsWith('https://')) {
    errors.push('Organization URL must use HTTPS');
  }

  // 長さチェック
  if (caseStudy.title && caseStudy.title.length > 255) {
    warnings.push('Title is quite long, consider shortening for better display');
  }

  const totalContentLength = [
    caseStudy.problem || '',
    caseStudy.solution || '',
    caseStudy.outcome || ''
  ].join('').length;

  if (totalContentLength < 100) {
    warnings.push('Case study content is quite short, consider adding more detail');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * CaseStudy JSON-LD をHTML用文字列として出力
 */
export function caseStudyJsonLdToHtml(caseStudy: CaseStudy, org: Organization): string {
  const jsonLd = generateCaseStudyJsonLd(caseStudy, org);
  return JSON.stringify(jsonLd, null, 2);
}