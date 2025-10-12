/**
 * ヒアリング代行サービス法的・コンプライアンス管理
 * 法的リスク防止・コンテンツ検証・規制遵守システム
 */

import { createClient } from '@supabase/supabase-js';

// リスクレベル定義
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// コンプライアンスチェック項目
export enum ComplianceCheckType {
  // 個人情報保護
  PII_DETECTION = 'pii_detection',
  GDPR_COMPLIANCE = 'gdpr_compliance',
  
  // 知的財産権
  COPYRIGHT_CHECK = 'copyright_check',
  TRADEMARK_CHECK = 'trademark_check',
  
  // コンテンツ品質
  MISLEADING_CONTENT = 'misleading_content',
  FALSE_ADVERTISING = 'false_advertising',
  
  // 法的規制
  CONSUMER_PROTECTION = 'consumer_protection',
  MEDICAL_CLAIMS = 'medical_claims',
  FINANCIAL_ADVICE = 'financial_advice',
  
  // セキュリティ
  MALICIOUS_LINKS = 'malicious_links',
  PHISHING_CONTENT = 'phishing_content'
}

// チェック結果構造
interface ComplianceResult {
  checkType: ComplianceCheckType;
  riskLevel: RiskLevel;
  passed: boolean;
  issues: Array<{
    description: string;
    severity: RiskLevel;
    recommendation: string;
    autoFixable: boolean;
  }>;
  metadata?: Record<string, any>;
}

// 同意文テンプレート
export const CONSENT_TEMPLATES = {
  BASIC_DELEGATION: {
    version: '1.0',
    title: 'ヒアリング代行サービス委任同意書',
    content: `
ヒアリング代行サービス委任同意書

【委任内容】
私（依頼者）は、LuxuCareヒアリング代行サービスに以下の権限を委任することに同意します：

1. 委任範囲
   - 指定した組織のコンテンツ（サービス、投稿、FAQ、ケーススタディ）の下書き作成
   - 提供した素材・情報を基とした文書作成支援
   - 下書きの編集・修正作業

2. 委任制限事項
   - 下書きの公開は依頼者の明示的承認後のみ実施
   - 課金・請求情報の変更は一切行わない
   - 個人情報・機密情報の無断使用禁止

3. 依頼者の責任
   - 提供情報の正確性と使用権限の保証
   - 下書き内容の最終確認と承認判断
   - 公開コンテンツの法的責任

4. 代行者の責任
   - 委任範囲内での適切な下書き作成
   - 機密情報の適切な取り扱い
   - 委任期限・範囲の厳守

5. 委任期間
   設定した期限まで有効（期限設定がない場合は依頼者が取り消すまで）

【個人情報の取り扱い】
本委任に関する個人情報は、当社プライバシーポリシーに基づき適切に管理されます。

【同意確認】
上記内容を理解し、委任に同意します。
    `,
    requiredFields: ['client_name', 'organization_name', 'scope', 'hearing_agent']
  },
  
  MATERIAL_USAGE: {
    version: '1.0',
    title: '素材使用権限確認書',
    content: `
素材使用権限確認書

【使用素材について】
アップロードする素材（画像、動画、文書等）について、以下を確認・保証します：

1. 権利関係の確認
   ☐ 私が著作権を有する、または使用許諾を得た素材のみ提供
   ☐ 第三者の肖像権・プライバシー権を侵害しない
   ☐ 商標権・意匠権等の知的財産権を侵害しない

2. 内容の適切性
   ☐ 違法・反社会的内容を含まない
   ☐ 虚偽・誤解を招く情報を含まない
   ☐ 差別的・攻撃的表現を含まない

3. 使用許諾
   ☐ LuxuCareサービス内での使用を許諾
   ☐ 代行作成コンテンツへの組み込みを許諾
   ☐ 必要に応じた編集・加工を許諾

【免責事項】
素材使用に関する法的責任は依頼者が負うものとし、当社は素材内容について一切の責任を負いません。

【確認日時】
{confirmation_datetime}
    `
  }
};

// メインコンプライアンスチェック関数
export async function performComplianceCheck(
  contentType: string,
  content: any,
  organizationId: string
): Promise<{
  overallRisk: RiskLevel;
  results: ComplianceResult[];
  blockers: ComplianceResult[];
  warnings: ComplianceResult[];
  recommendedActions: string[];
}> {
  const results: ComplianceResult[] = [];
  
  try {
    // 各種チェックを並列実行
    const checks = await Promise.allSettled([
      checkPersonalInformation(content),
      checkCopyrightIssues(content),
      checkMisleadingContent(content, contentType),
      checkMaliciousContent(content),
      checkConsumerProtection(content, contentType),
      checkMedicalClaims(content),
      checkFinancialAdvice(content)
    ]);

    // 結果を集約
    checks.forEach((check, index) => {
      if (check.status === 'fulfilled') {
        results.push(check.value);
      } else {
        console.error(`Compliance check ${index} failed:`, check.reason);
      }
    });

    // リスクレベル判定
    const overallRisk = determineOverallRisk(results);
    const blockers = results.filter(r => !r.passed && r.riskLevel === RiskLevel.CRITICAL);
    const warnings = results.filter(r => !r.passed && r.riskLevel !== RiskLevel.CRITICAL);
    const recommendedActions = generateRecommendations(results);

    return {
      overallRisk,
      results,
      blockers,
      warnings,
      recommendedActions
    };

  } catch (error) {
    console.error('Compliance check error:', error);
    
    // エラー時は最高リスクレベルで返す
    return {
      overallRisk: RiskLevel.CRITICAL,
      results: [{
        checkType: ComplianceCheckType.MISLEADING_CONTENT,
        riskLevel: RiskLevel.CRITICAL,
        passed: false,
        issues: [{
          description: 'コンプライアンスチェック中にエラーが発生しました',
          severity: RiskLevel.CRITICAL,
          recommendation: '手動でのレビューが必要です',
          autoFixable: false
        }]
      }],
      blockers: [],
      warnings: [],
      recommendedActions: ['手動レビューを実施してください']
    };
  }
}

// 個人情報検出チェック
async function checkPersonalInformation(content: any): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  // 個人情報パターン検出
  const piiPatterns = [
    { pattern: /\d{3}-\d{4}-\d{4}/, type: '電話番号', severity: RiskLevel.HIGH },
    { pattern: /\d{4}-\d{4}-\d{4}-\d{4}/, type: 'クレジットカード番号', severity: RiskLevel.CRITICAL },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, type: 'メールアドレス', severity: RiskLevel.MEDIUM },
    { pattern: /\d{3}-\d{2}-\d{4}/, type: 'マイナンバー候補', severity: RiskLevel.CRITICAL },
    { pattern: /住所.*[都道府県].*[市区町村]/, type: '住所情報', severity: RiskLevel.HIGH }
  ];

  piiPatterns.forEach(({ pattern, type, severity }) => {
    if (pattern.test(textContent)) {
      issues.push({
        description: `${type}が検出されました`,
        severity,
        recommendation: `${type}を削除または匿名化してください`,
        autoFixable: false
      });
    }
  });

  const maxSeverity = issues.length > 0 
    ? issues.reduce((max, issue) => {
        const severityOrder = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3, [RiskLevel.CRITICAL]: 4 };
        return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
      }, RiskLevel.LOW)
    : RiskLevel.LOW;

  return {
    checkType: ComplianceCheckType.PII_DETECTION,
    riskLevel: maxSeverity,
    passed: issues.length === 0,
    issues
  };
}

// 著作権チェック
async function checkCopyrightIssues(content: any): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  // 著作権侵害の可能性があるキーワード
  const copyrightKeywords = [
    { keyword: '無断転載', severity: RiskLevel.HIGH },
    { keyword: 'コピー', severity: RiskLevel.MEDIUM },
    { keyword: '引用元不明', severity: RiskLevel.HIGH },
    { keyword: '他社の画像', severity: RiskLevel.HIGH }
  ];

  copyrightKeywords.forEach(({ keyword, severity }) => {
    if (textContent.includes(keyword)) {
      issues.push({
        description: `著作権に関する注意が必要なキーワード「${keyword}」が検出されました`,
        severity,
        recommendation: '使用権限を確認し、適切な出典表示を行ってください',
        autoFixable: false
      });
    }
  });

  // 画像の権利確認
  if (content.images && content.images.length > 0) {
    issues.push({
      description: '画像素材の使用権限確認が必要です',
      severity: RiskLevel.MEDIUM,
      recommendation: '各画像の使用許諾を確認してください',
      autoFixable: false
    });
  }

  return {
    checkType: ComplianceCheckType.COPYRIGHT_CHECK,
    riskLevel: issues.length > 0 ? RiskLevel.MEDIUM : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 誤解を招くコンテンツチェック
async function checkMisleadingContent(content: any, contentType: string): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  // 誤解を招く可能性のある表現
  const misleadingPatterns = [
    { pattern: /100%|絶対|必ず|確実/, description: '断定的表現', severity: RiskLevel.MEDIUM },
    { pattern: /最高|最安|No\.1|業界初/, description: '最上級表現', severity: RiskLevel.MEDIUM },
    { pattern: /即効|すぐに|たった\d+日/, description: '即効性の誇張', severity: RiskLevel.HIGH },
    { pattern: /副作用なし|安全100%/, description: '安全性の過度な主張', severity: RiskLevel.HIGH }
  ];

  misleadingPatterns.forEach(({ pattern, description, severity }) => {
    if (pattern.test(textContent)) {
      issues.push({
        description: `${description}が検出されました`,
        severity,
        recommendation: 'より客観的で根拠のある表現に修正してください',
        autoFixable: false
      });
    }
  });

  // サービス固有のチェック
  if (contentType === 'service' && content.price) {
    if (!textContent.includes('税込') && !textContent.includes('税別')) {
      issues.push({
        description: '価格表示に税込・税別の記載がありません',
        severity: RiskLevel.MEDIUM,
        recommendation: '価格表示に税込み・税別を明記してください',
        autoFixable: false
      });
    }
  }

  return {
    checkType: ComplianceCheckType.MISLEADING_CONTENT,
    riskLevel: issues.length > 0 
      ? issues.reduce((max, issue) => {
          const severityOrder = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3, [RiskLevel.CRITICAL]: 4 };
          return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
        }, RiskLevel.LOW)
      : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 悪意のあるコンテンツチェック
async function checkMaliciousContent(content: any): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content);

  // 悪意のあるURLパターン
  const maliciousPatterns = [
    { pattern: /bit\.ly|tinyurl|short\.link/, description: '短縮URL', severity: RiskLevel.MEDIUM },
    { pattern: /javascript:|data:|vbscript:/, description: 'スクリプトURL', severity: RiskLevel.CRITICAL },
    { pattern: /フィッシング|詐欺|偽サイト/, description: '詐欺関連キーワード', severity: RiskLevel.CRITICAL }
  ];

  maliciousPatterns.forEach(({ pattern, description, severity }) => {
    if (pattern.test(textContent)) {
      issues.push({
        description: `${description}が検出されました`,
        severity,
        recommendation: '該当部分を削除または適切なURLに変更してください',
        autoFixable: false
      });
    }
  });

  return {
    checkType: ComplianceCheckType.MALICIOUS_LINKS,
    riskLevel: issues.length > 0 ? RiskLevel.HIGH : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 消費者保護チェック
async function checkConsumerProtection(content: any, contentType: string): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  if (contentType === 'service') {
    // 特定商取引法関連チェック
    const requiredInfoPatterns = [
      { keyword: 'キャンセル', description: 'キャンセルポリシー' },
      { keyword: '返金', description: '返金規定' },
      { keyword: '利用規約', description: '利用規約' }
    ];

    const missingInfo = requiredInfoPatterns.filter(({ keyword }) => 
      !textContent.includes(keyword)
    );

    if (missingInfo.length > 0) {
      issues.push({
        description: `消費者保護に関する重要情報が不足しています: ${missingInfo.map(i => i.description).join(', ')}`,
        severity: RiskLevel.HIGH,
        recommendation: '特定商取引法に基づく表示を追加してください',
        autoFixable: false
      });
    }
  }

  return {
    checkType: ComplianceCheckType.CONSUMER_PROTECTION,
    riskLevel: issues.length > 0 ? RiskLevel.HIGH : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 医療関連主張チェック
async function checkMedicalClaims(content: any): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  const medicalKeywords = [
    { keyword: '治療|治る|完治', severity: RiskLevel.CRITICAL },
    { keyword: '効果|効能|薬事', severity: RiskLevel.HIGH },
    { keyword: '病気|疾患|症状', severity: RiskLevel.MEDIUM }
  ];

  medicalKeywords.forEach(({ keyword, severity }) => {
    if (new RegExp(keyword).test(textContent)) {
      issues.push({
        description: `医療関連の表現「${keyword}」が検出されました`,
        severity,
        recommendation: '薬機法に抵触する可能性があります。表現を見直してください',
        autoFixable: false
      });
    }
  });

  return {
    checkType: ComplianceCheckType.MEDICAL_CLAIMS,
    riskLevel: issues.length > 0 
      ? issues.reduce((max, issue) => {
          const severityOrder = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3, [RiskLevel.CRITICAL]: 4 };
          return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
        }, RiskLevel.LOW)
      : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 金融アドバイスチェック
async function checkFinancialAdvice(content: any): Promise<ComplianceResult> {
  const issues: any[] = [];
  const textContent = JSON.stringify(content).toLowerCase();

  const financialKeywords = [
    { keyword: '投資|運用|資産', severity: RiskLevel.HIGH },
    { keyword: '利率|配当|リターン', severity: RiskLevel.HIGH },
    { keyword: '確実に儲かる|絶対利益', severity: RiskLevel.CRITICAL }
  ];

  financialKeywords.forEach(({ keyword, severity }) => {
    if (new RegExp(keyword).test(textContent)) {
      issues.push({
        description: `金融関連の表現「${keyword}」が検出されました`,
        severity,
        recommendation: '金融商品取引法に抵触する可能性があります。免責事項を追加してください',
        autoFixable: false
      });
    }
  });

  return {
    checkType: ComplianceCheckType.FINANCIAL_ADVICE,
    riskLevel: issues.length > 0 
      ? issues.reduce((max, issue) => {
          const severityOrder = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3, [RiskLevel.CRITICAL]: 4 };
          return severityOrder[issue.severity] > severityOrder[max] ? issue.severity : max;
        }, RiskLevel.LOW)
      : RiskLevel.LOW,
    passed: issues.length === 0,
    issues
  };
}

// 総合リスクレベル判定
function determineOverallRisk(results: ComplianceResult[]): RiskLevel {
  const riskLevels = results.map(r => r.riskLevel);
  
  if (riskLevels.includes(RiskLevel.CRITICAL)) return RiskLevel.CRITICAL;
  if (riskLevels.includes(RiskLevel.HIGH)) return RiskLevel.HIGH;
  if (riskLevels.includes(RiskLevel.MEDIUM)) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

// 推奨アクション生成
function generateRecommendations(results: ComplianceResult[]): string[] {
  const recommendations = new Set<string>();
  
  results.forEach(result => {
    result.issues.forEach(issue => {
      recommendations.add(issue.recommendation);
    });
  });

  return Array.from(recommendations);
}

// 同意文生成
export function generateConsentText(
  templateType: keyof typeof CONSENT_TEMPLATES,
  variables: Record<string, string>
): string {
  const template = CONSENT_TEMPLATES[templateType];
  let content = template.content;

  // 変数置換
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return content;
}

// コンプライアンス違反報告
export async function reportComplianceViolation(
  violationType: string,
  description: string,
  contentId: string,
  reportedBy: string,
  evidence?: any
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('compliance_violations')
      .insert([{
        violation_type: violationType,
        description,
        content_id: contentId,
        reported_by: reportedBy,
        evidence,
        status: 'reported',
        created_at: new Date().toISOString()
      }]);

    return true;

  } catch (error) {
    console.error('Compliance violation report error:', error);
    return false;
  }
}