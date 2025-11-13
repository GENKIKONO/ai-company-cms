/**
 * JSON-LD統合バリデーションシステム
 * 全エンティティのJSON-LD生成とバリデーションを統合管理
 */

import { Organization, Service, CaseStudy, FAQ } from '@/types/database';
import {
  validateOrganizationJsonLd,
  type OrganizationJsonLdValidationResult,
} from './organization';
import {
  validateServiceJsonLd,
  type ServiceJsonLdValidationResult,
} from './service';
import {
  validateCaseStudyJsonLd,
  type CaseStudyJsonLdValidationResult,
} from './case-study';
import {
  validateFAQPageJsonLd,
  type FAQJsonLdValidationResult,
} from './faq';

/**
 * 統合バリデーション結果
 */
export interface JsonLdValidationSummary {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  results: {
    organization?: OrganizationJsonLdValidationResult;
    services?: ServiceJsonLdValidationResult[];
    caseStudies?: CaseStudyJsonLdValidationResult[];
    faqs?: FAQJsonLdValidationResult[];
  };
  summary: {
    passedCount: number;
    failedCount: number;
    warningCount: number;
  };
}

/**
 * 企業全体のJSON-LDバリデーション
 */
export function validateOrganizationJsonLdComplete(
  organization: Organization,
  services?: Service[],
  caseStudies?: CaseStudy[],
  faqs?: FAQ[]
): JsonLdValidationSummary {
  const results: JsonLdValidationSummary['results'] = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;

  // Organization バリデーション
  const orgResult = validateOrganizationJsonLd(organization);
  results.organization = orgResult;
  totalErrors += orgResult.errors.length;
  totalWarnings += orgResult.warnings.length;
  
  if (orgResult.errors.length > 0) {
    failedCount++;
  } else {
    passedCount++;
    if (orgResult.warnings.length > 0) {
      warningCount++;
    }
  }

  // Services バリデーション
  if (services && services.length > 0) {
    results.services = services.map(service => {
      const serviceResult = validateServiceJsonLd(service, organization);
      totalErrors += serviceResult.errors.length;
      totalWarnings += serviceResult.warnings.length;
      
      if (serviceResult.errors.length > 0) {
        failedCount++;
      } else {
        passedCount++;
        if (serviceResult.warnings.length > 0) {
          warningCount++;
        }
      }
      
      return serviceResult;
    });
  }

  // Case Studies バリデーション
  if (caseStudies && caseStudies.length > 0) {
    results.caseStudies = caseStudies.map(caseStudy => {
      const caseStudyResult = validateCaseStudyJsonLd(caseStudy, organization);
      totalErrors += caseStudyResult.errors.length;
      totalWarnings += caseStudyResult.warnings.length;
      
      if (caseStudyResult.errors.length > 0) {
        failedCount++;
      } else {
        passedCount++;
        if (caseStudyResult.warnings.length > 0) {
          warningCount++;
        }
      }
      
      return caseStudyResult;
    });
  }

  // FAQs バリデーション
  if (faqs && faqs.length > 0) {
    const faqResult = validateFAQPageJsonLd(faqs, organization);
    results.faqs = [faqResult];
    totalErrors += faqResult.errors.length;
    totalWarnings += faqResult.warnings.length;
    
    if (faqResult.errors.length > 0) {
      failedCount++;
    } else {
      passedCount++;
      if (faqResult.warnings.length > 0) {
        warningCount++;
      }
    }
  }

  return {
    isValid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    results,
    summary: {
      passedCount,
      failedCount,
      warningCount,
    },
  };
}

/**
 * バリデーション結果をマークダウン形式で出力
 */
export function formatValidationResultAsMarkdown(summary: JsonLdValidationSummary): string {
  const lines: string[] = [];
  
  lines.push('# JSON-LD Validation Report');
  lines.push('');
  
  // サマリー
  lines.push('## Summary');
  lines.push(`- **Status**: ${summary.isValid ? '✅ Valid' : '❌ Invalid'}`);
  lines.push(`- **Total Errors**: ${summary.totalErrors}`);
  lines.push(`- **Total Warnings**: ${summary.totalWarnings}`);
  lines.push(`- **Passed**: ${summary.summary.passedCount}`);
  lines.push(`- **Failed**: ${summary.summary.failedCount}`);
  lines.push(`- **With Warnings**: ${summary.summary.warningCount}`);
  lines.push('');
  
  // Organization結果
  if (summary.results.organization) {
    lines.push('## Organization');
    const org = summary.results.organization;
    lines.push(`**Status**: ${org.errors.length === 0 ? '✅ Valid' : '❌ Invalid'}`);
    
    if (org.errors.length > 0) {
      lines.push('### Errors:');
      org.errors.forEach(error => lines.push(`- ${error}`));
      lines.push('');
    }
    
    if (org.warnings.length > 0) {
      lines.push('### Warnings:');
      org.warnings.forEach(warning => lines.push(`- ${warning}`));
      lines.push('');
    }
  }
  
  // Services結果
  if (summary.results.services && summary.results.services.length > 0) {
    lines.push('## Services');
    summary.results.services.forEach((service, index) => {
      lines.push(`### Service ${index + 1}`);
      lines.push(`**Status**: ${service.errors.length === 0 ? '✅ Valid' : '❌ Invalid'}`);
      
      if (service.errors.length > 0) {
        lines.push('#### Errors:');
        service.errors.forEach(error => lines.push(`- ${error}`));
      }
      
      if (service.warnings.length > 0) {
        lines.push('#### Warnings:');
        service.warnings.forEach(warning => lines.push(`- ${warning}`));
      }
      lines.push('');
    });
  }
  
  // Case Studies結果
  if (summary.results.caseStudies && summary.results.caseStudies.length > 0) {
    lines.push('## Case Studies');
    summary.results.caseStudies.forEach((caseStudy, index) => {
      lines.push(`### Case Study ${index + 1}`);
      lines.push(`**Status**: ${caseStudy.errors.length === 0 ? '✅ Valid' : '❌ Invalid'}`);
      
      if (caseStudy.errors.length > 0) {
        lines.push('#### Errors:');
        caseStudy.errors.forEach(error => lines.push(`- ${error}`));
      }
      
      if (caseStudy.warnings.length > 0) {
        lines.push('#### Warnings:');
        caseStudy.warnings.forEach(warning => lines.push(`- ${warning}`));
      }
      lines.push('');
    });
  }
  
  // FAQs結果
  if (summary.results.faqs && summary.results.faqs.length > 0) {
    lines.push('## FAQs');
    const faqResult = summary.results.faqs[0];
    lines.push(`**Status**: ${faqResult.errors.length === 0 ? '✅ Valid' : '❌ Invalid'}`);
    
    if (faqResult.errors.length > 0) {
      lines.push('### Errors:');
      faqResult.errors.forEach(error => lines.push(`- ${error}`));
    }
    
    if (faqResult.warnings.length > 0) {
      lines.push('### Warnings:');
      faqResult.warnings.forEach(warning => lines.push(`- ${warning}`));
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Google構造化データテストツール用のURL生成
 */
export function generateStructuredDataTestUrl(jsonLdString: string): string {
  const encodedJsonLd = encodeURIComponent(jsonLdString);
  return `https://search.google.com/test/rich-results?code=${encodedJsonLd}`;
}

/**
 * JSON-LDバリデーション結果をJSON形式で出力
 */
export function exportValidationResultAsJson(summary: JsonLdValidationSummary): string {
  return JSON.stringify(summary, null, 2);
}

/**
 * 重要度レベル別エラー/警告分類
 */
export interface ValidationIssuesByLevel {
  critical: string[];  // SEOに重大な影響
  important: string[]; // SEOに影響する可能性
  minor: string[];     // 推奨改善項目
}

/**
 * バリデーション結果を重要度別に分類
 */
export function classifyValidationIssues(summary: JsonLdValidationSummary): ValidationIssuesByLevel {
  const classification: ValidationIssuesByLevel = {
    critical: [],
    important: [],
    minor: [],
  };
  
  // 全ての結果をチェック
  const allResults = [
    summary.results.organization,
    ...(summary.results.services || []),
    ...(summary.results.caseStudies || []),
    ...(summary.results.faqs || []),
  ].filter(Boolean);
  
  allResults.forEach(result => {
    if (!result) return;
    
    // エラーは基本的にcriticalまたはimportant
    result.errors.forEach(error => {
      if (error.includes('required') || error.includes('必須')) {
        classification.critical.push(error);
      } else {
        classification.important.push(error);
      }
    });
    
    // 警告は基本的にimportantまたはminor
    result.warnings.forEach(warning => {
      if (warning.includes('推奨') || warning.includes('recommend')) {
        classification.minor.push(warning);
      } else {
        classification.important.push(warning);
      }
    });
  });
  
  return classification;
}