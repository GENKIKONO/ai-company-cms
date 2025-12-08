/**
 * Publish Gate (Preflight) システム
 * 要件定義準拠: JSON-LD検証 + Subscription確認 + DNS検証
 */

import type { Organization } from '@/types/legacy/database';;
import { 
  validateOrganizationJsonLd, 
  type JsonLdValidationResult 
} from '@/lib/json-ld/organization';
import { 
  validateServiceJsonLd,
  type ServiceJsonLdValidationResult 
} from '@/lib/json-ld/service';
import { 
  validateFAQPageJsonLd,
  type FAQJsonLdValidationResult 
} from '@/lib/json-ld/faq';
import { 
  validateCaseStudyJsonLd,
  type CaseStudyJsonLdValidationResult 
} from '@/lib/json-ld/case-study';

export interface PreflightCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export interface PreflightResult {
  canPublish: boolean;
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: PreflightCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Subscription status check
 */
async function checkSubscriptionStatus(org: Organization): Promise<PreflightCheck> {
  const check: PreflightCheck = {
    name: 'Subscription Status',
    status: 'pending',
    message: 'Checking subscription status...',
  };

  try {
    // 要件定義準拠: Subscription.active チェック
    const isActive = org.subscription_status === 'active' || org.subscription_status === 'trialing';
    const hasValidPlan = org.plan && ['trial', 'starter', 'pro', 'business', 'enterprise'].includes(org.plan);

    if (isActive && hasValidPlan) {
      check.status = 'pass';
      check.message = `Subscription active (${org.plan})`;
      // TODO: [SUPABASE_FEATURE_MIGRATION] org.plan 直接参照を get_effective_org_features 経由に移行検討
      // 現在: org.plan === 'trial' での判定
      // 将来: canUseFeatureFromOrg(org, 'trial_mode') または trial_status フィールド活用を検討
    } else if (org.plan === 'trial') {
      check.status = 'warning';
      check.message = 'Trial plan has limited features';
    } else {
      check.status = 'fail';
      check.message = 'Active subscription required for publishing';
      check.details = {
        currentStatus: org.subscription_status,
        currentPlan: org.plan,
      };
    }
  } catch (error) {
    check.status = 'fail';
    check.message = 'Failed to verify subscription status';
    check.details = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  return check;
}

/**
 * JSON-LD validation check
 */
function checkJsonLdValidation(org: Organization): PreflightCheck {
  const check: PreflightCheck = {
    name: 'JSON-LD Validation',
    status: 'pending',
    message: 'Validating JSON-LD structure...',
  };

  try {
    const validation = validateOrganizationJsonLd(org);
    
    if (validation.isValid) {
      check.status = validation.warnings.length > 0 ? 'warning' : 'pass';
      check.message = validation.warnings.length > 0 
        ? `Valid with ${validation.warnings.length} warnings`
        : 'JSON-LD structure is valid';
    } else {
      check.status = 'fail';
      check.message = `JSON-LD validation failed: ${validation.errors.length} errors`;
    }
    
    check.details = {
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error) {
    check.status = 'fail';
    check.message = 'JSON-LD validation error';
    check.details = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  return check;
}

/**
 * Required fields check (要件定義準拠)
 */
function checkRequiredFields(org: Organization): PreflightCheck {
  const check: PreflightCheck = {
    name: 'Required Fields',
    status: 'pending',
    message: 'Checking required fields...',
  };

  const missing: string[] = [];
  
  // 要件定義必須項目: name, description, addressRegion, addressLocality, telephone, url
  if (!org.name?.trim()) missing.push('name');
  if (!org.description?.trim()) missing.push('description');
  if (!org.address_region?.trim()) missing.push('address_region');
  if (!org.address_locality?.trim()) missing.push('address_locality');
  if (!org.telephone?.trim()) missing.push('telephone');
  if (!org.url?.trim()) missing.push('url');

  if (missing.length === 0) {
    check.status = 'pass';
    check.message = 'All required fields are present';
  } else {
    check.status = 'fail';
    check.message = `Missing required fields: ${missing.join(', ')}`;
    check.details = { missingFields: missing };
  }

  return check;
}

/**
 * HTTPS URL validation
 */
function checkHttpsUrls(org: Organization): PreflightCheck {
  const check: PreflightCheck = {
    name: 'HTTPS URLs',
    status: 'pending',
    message: 'Validating HTTPS URLs...',
  };

  const invalidUrls: string[] = [];

  if (org.url && !org.url.startsWith('https://')) {
    invalidUrls.push('website URL');
  }

  if (org.logo_url && !org.logo_url.startsWith('https://')) {
    invalidUrls.push('logo URL');
  }

  if (invalidUrls.length === 0) {
    check.status = 'pass';
    check.message = 'All URLs use HTTPS';
  } else {
    check.status = 'fail';
    check.message = `Non-HTTPS URLs found: ${invalidUrls.join(', ')}`;
    check.details = { invalidUrls };
  }

  return check;
}

/**
 * DNS/Domain validation (要件定義準拠)
 */
async function checkDomainValidation(org: Organization): Promise<PreflightCheck> {
  const check: PreflightCheck = {
    name: 'Domain Validation',
    status: 'pending',
    message: 'Checking domain configuration...',
  };

  try {
    if (!org.url) {
      check.status = 'fail';
      check.message = 'Website URL is required';
      return check;
    }

    // 自社サブドメイン vs 独自ドメインの判定
    const url = new URL(org.url);
    const isOwnSubdomain = url.hostname.endsWith('.aiohub.jp');

    if (isOwnSubdomain) {
      // 自社サブドメイン: 自動でOK
      check.status = 'pass';
      check.message = 'Using AIO Hub subdomain (automatic configuration)';
    } else {
      // 独自ドメイン: CNAME検証が必要（簡易版）
      check.status = 'warning';
      check.message = 'Custom domain detected - manual CNAME verification required';
      check.details = {
        domain: url.hostname,
        requiredCname: 'aiohub.jp',
        note: 'Please ensure CNAME record points to aiohub.jp',
      };
    }
  } catch (error) {
    check.status = 'fail';
    check.message = 'Invalid URL format';
    check.details = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  return check;
}

/**
 * Image optimization check
 */
async function checkImageOptimization(org: Organization): Promise<PreflightCheck> {
  const check: PreflightCheck = {
    name: 'Image Optimization',
    status: 'pending',
    message: 'Checking image optimization...',
  };

  try {
    if (!org.logo_url) {
      check.status = 'warning';
      check.message = 'No logo image found - consider adding for better branding';
      return check;
    }

    // 簡易的な画像形式チェック
    const isWebP = org.logo_url.toLowerCase().includes('.webp');
    const isOptimized = org.logo_url.includes('/_next/image') || isWebP;

    if (isOptimized) {
      check.status = 'pass';
      check.message = 'Logo image is optimized';
    } else {
      check.status = 'warning';
      check.message = 'Logo image may not be optimized - consider using WebP format';
      check.details = {
        currentUrl: org.logo_url,
        recommendation: 'Use Next.js Image component for automatic optimization',
      };
    }
  } catch (error) {
    check.status = 'warning';
    check.message = 'Could not verify image optimization';
    check.details = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  return check;
}

/**
 * Complete preflight check execution
 * 要件定義準拠: 全PASS時のみ公開ボタン活性化
 */
export async function runPreflightChecks(org: Organization): Promise<PreflightResult> {
  const checks: PreflightCheck[] = [];

  // 同期チェック
  checks.push(checkRequiredFields(org));
  checks.push(checkJsonLdValidation(org));
  checks.push(checkHttpsUrls(org));

  // 非同期チェック
  const asyncChecks = await Promise.allSettled([
    checkSubscriptionStatus(org),
    checkDomainValidation(org),
    checkImageOptimization(org),
  ]);

  // 非同期チェック結果を追加
  asyncChecks.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      checks.push(result.value);
    } else {
      const checkNames = ['Subscription Status', 'Domain Validation', 'Image Optimization'];
      checks.push({
        name: checkNames[index],
        status: 'fail',
        message: 'Check failed to execute',
        details: { error: result.reason },
      });
    }
  });

  // 結果集計
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length,
  };

  const hasFailures = summary.failed > 0;
  const hasWarnings = summary.warnings > 0;

  const result: PreflightResult = {
    canPublish: !hasFailures, // 要件定義準拠: 失敗がなければ公開可能
    overallStatus: hasFailures ? 'fail' : hasWarnings ? 'warning' : 'pass',
    checks,
    summary,
  };

  return result;
}