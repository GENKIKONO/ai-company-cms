/**
 * JSON-LD 統合エクスポート
 * 要件定義準拠: 全エンティティの構造化データ生成
 */

import { generateOrganizationJsonLd } from './organization';
import { generateArticleJsonLd } from './article';
import { generateServiceJsonLd } from './service';
import { generateCaseStudyJsonLd } from './case-study';
import { generateBreadcrumbJsonLd, generateOrganizationBreadcrumb, generateArticleBreadcrumb, generateServiceBreadcrumb, generateCaseStudyBreadcrumb } from './breadcrumb';

// Organization
export {
  generateOrganizationJsonLd,
  validateOrganizationJsonLd,
  organizationJsonLdToHtml,
  type JsonLdValidationResult as OrganizationJsonLdValidationResult,
} from './organization';

// Service
export {
  generateServiceJsonLd,
  serviceJsonLdToHtml,
  validateServiceJsonLd,
  type ServiceJsonLdValidationResult,
} from './service';

// FAQ
export {
  generateFAQPageJsonLd,
  faqPageJsonLdToHtml,
  validateFAQPageJsonLd,
  type FAQJsonLdValidationResult,
} from './faq';

// CaseStudy
export {
  generateCaseStudyJsonLd,
  caseStudyJsonLdToHtml,
  validateCaseStudyJsonLd,
  type CaseStudyJsonLdValidationResult,
} from './case-study';

// Article
export {
  generateArticleJsonLd,
  articleJsonLdToHtml,
  validateArticleJsonLd,
  type ArticleJsonLdValidationResult,
} from './article';

// Breadcrumb
export {
  generateBreadcrumbJsonLd,
  generateOrganizationBreadcrumb,
  generateArticleBreadcrumb,
  generateServiceBreadcrumb,
  generateCaseStudyBreadcrumb,
  breadcrumbJsonLdToHtml,
} from './breadcrumb';

/**
 * 複数のJSON-LDを統合してHTMLに出力
 */
export function combineJsonLdForHtml(...jsonLdObjects: (object | null)[]): string {
  const validObjects = jsonLdObjects.filter(obj => obj !== null);
  
  if (validObjects.length === 0) {
    return '';
  }
  
  if (validObjects.length === 1) {
    return JSON.stringify(validObjects[0], null, 2);
  }
  
  // 複数のJSON-LDを配列として出力
  return JSON.stringify(validObjects, null, 2);
}

/**
 * ページの種類に応じた統合JSON-LD生成
 */
export interface PageJsonLdConfig {
  type: 'organization' | 'article' | 'service' | 'case-study' | 'faq';
  organization: any; // Organization type
  content?: any; // Post, Service, CaseStudy etc.
  baseUrl: string;
  includeBreadcrumb?: boolean;
}

export function generatePageJsonLd(config: PageJsonLdConfig): string {
  const jsonLdObjects: (object | null)[] = [];
  
  // 基本の組織情報
  const orgJsonLd = generateOrganizationJsonLd(config.organization);
  jsonLdObjects.push(orgJsonLd);
  
  // ページタイプ別のJSON-LD
  switch (config.type) {
    case 'article':
      if (config.content) {
        const articleJsonLd = generateArticleJsonLd(config.content, config.organization, config.baseUrl);
        if (articleJsonLd) jsonLdObjects.push(articleJsonLd);
        
        if (config.includeBreadcrumb) {
          const breadcrumbItems = generateArticleBreadcrumb(
            config.organization.name,
            config.organization.slug,
            config.content.title,
            config.content.slug,
            config.baseUrl
          );
          const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
          if (breadcrumbJsonLd) jsonLdObjects.push(breadcrumbJsonLd);
        }
      }
      break;
      
    case 'service':
      if (config.content) {
        const serviceJsonLd = generateServiceJsonLd(config.content, config.organization);
        if (serviceJsonLd) jsonLdObjects.push(serviceJsonLd);
        
        if (config.includeBreadcrumb) {
          const breadcrumbItems = generateServiceBreadcrumb(
            config.organization.name,
            config.organization.slug,
            config.content.name,
            config.content.id,
            config.baseUrl
          );
          const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
          if (breadcrumbJsonLd) jsonLdObjects.push(breadcrumbJsonLd);
        }
      }
      break;
      
    case 'case-study':
      if (config.content) {
        const caseStudyJsonLd = generateCaseStudyJsonLd(config.content, config.organization);
        if (caseStudyJsonLd) jsonLdObjects.push(caseStudyJsonLd);
        
        if (config.includeBreadcrumb) {
          const breadcrumbItems = generateCaseStudyBreadcrumb(
            config.organization.name,
            config.organization.slug,
            config.content.title,
            config.content.id,
            config.baseUrl
          );
          const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
          if (breadcrumbJsonLd) jsonLdObjects.push(breadcrumbJsonLd);
        }
      }
      break;
      
    case 'organization':
      if (config.includeBreadcrumb) {
        const breadcrumbItems = generateOrganizationBreadcrumb(
          config.organization.name,
          config.organization.slug,
          config.baseUrl
        );
        const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
        if (breadcrumbJsonLd) jsonLdObjects.push(breadcrumbJsonLd);
      }
      break;
  }
  
  return combineJsonLdForHtml(...jsonLdObjects);
}