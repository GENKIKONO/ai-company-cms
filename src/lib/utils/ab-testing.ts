/**
 * A/Bテスト機能 (K2)
 * 機能フラグベースのA/Bテスト実装
 */

export interface ABTestConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  variants: Array<{
    id: string;
    name: string;
    weight: number; // 0-100の重み
    config?: Record<string, any>;
  }>;
  targeting?: {
    userAttributes?: Record<string, string[]>;
    segments?: string[];
    percentage?: number; // 0-100
  };
  startDate?: Date;
  endDate?: Date;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  attributes?: Record<string, any>;
}

/**
 * A/Bテスト管理クラス
 */
export class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();
  private storagePrefix = 'ab_test_';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * テスト設定を追加/更新
   */
  setTest(config: ABTestConfig): void {
    // バリデーション
    if (!this.validateTestConfig(config)) {
      throw new Error(`Invalid test configuration: ${config.id}`);
    }

    this.tests.set(config.id, config);
    this.saveToStorage();
  }

  /**
   * ユーザーのバリアント割り当て
   */
  getVariant(
    testId: string, 
    userId?: string, 
    sessionId?: string,
    attributes?: Record<string, any>
  ): string | null {
    const test = this.tests.get(testId);
    if (!test || !test.enabled) {
      return null;
    }

    // 日付範囲チェック
    const now = new Date();
    if (test.startDate && now < test.startDate) return null;
    if (test.endDate && now > test.endDate) return null;

    // ターゲティングチェック
    if (!this.matchesTargeting(test, userId, attributes)) {
      return null;
    }

    const identifier = userId || sessionId || 'anonymous';
    
    // 既存の割り当てをチェック
    const existingAssignment = this.getUserAssignment(testId, identifier);
    if (existingAssignment) {
      return existingAssignment;
    }

    // 新しい割り当て
    const variant = this.assignVariant(test, identifier);
    if (variant) {
      this.setUserAssignment(testId, identifier, variant);
      this.trackAssignment(testId, variant, userId, sessionId, attributes);
    }

    return variant;
  }

  /**
   * バリアント設定の取得
   */
  getVariantConfig(testId: string, variantId: string): Record<string, any> | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * 機能フラグチェック
   */
  isFeatureEnabled(
    featureKey: string,
    userId?: string,
    sessionId?: string,
    attributes?: Record<string, any>
  ): boolean {
    const variant = this.getVariant(featureKey, userId, sessionId, attributes);
    return variant === 'enabled' || variant === 'true';
  }

  /**
   * A/Bテスト結果の記録
   */
  trackConversion(
    testId: string,
    conversionType: string,
    value?: number,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    const identifier = userId || sessionId || 'anonymous';
    const variant = this.getUserAssignment(testId, identifier);
    
    if (!variant) return;

    // 分析データとして送信
    this.sendAnalyticsEvent('ab_test_conversion', {
      testId,
      variantId: variant,
      conversionType,
      value,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * テスト一覧取得
   */
  getActiveTests(): ABTestConfig[] {
    const now = new Date();
    return Array.from(this.tests.values()).filter(test => {
      return test.enabled && 
             (!test.startDate || now >= test.startDate) &&
             (!test.endDate || now <= test.endDate);
    });
  }

  /**
   * ユーザーの全割り当て取得
   */
  getUserAssignments(userId?: string, sessionId?: string): Record<string, string> {
    const identifier = userId || sessionId || 'anonymous';
    return Object.fromEntries(this.userAssignments.get(identifier) || new Map());
  }

  private validateTestConfig(config: ABTestConfig): boolean {
    // 基本検証
    if (!config.id || !config.name || !Array.isArray(config.variants)) {
      return false;
    }

    // バリアント検証
    if (config.variants.length === 0) return false;
    
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) return false;

    // ID重複チェック
    const variantIds = config.variants.map(v => v.id);
    if (new Set(variantIds).size !== variantIds.length) return false;

    return true;
  }

  private matchesTargeting(
    test: ABTestConfig,
    userId?: string,
    attributes?: Record<string, any>
  ): boolean {
    if (!test.targeting) return true;

    // パーセンテージチェック
    if (test.targeting.percentage !== undefined) {
      const identifier = userId || 'anonymous';
      const hash = this.hashString(identifier + test.id);
      const percentage = hash % 100;
      if (percentage >= test.targeting.percentage) return false;
    }

    // ユーザー属性チェック
    if (test.targeting.userAttributes && attributes) {
      for (const [key, values] of Object.entries(test.targeting.userAttributes)) {
        const userValue = attributes[key];
        if (!userValue || !values.includes(userValue)) return false;
      }
    }

    return true;
  }

  private assignVariant(test: ABTestConfig, identifier: string): string | null {
    const hash = this.hashString(identifier + test.id);
    const randomValue = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        return variant.id;
      }
    }

    return null;
  }

  private getUserAssignment(testId: string, identifier: string): string | null {
    const userTests = this.userAssignments.get(identifier);
    return userTests?.get(testId) || null;
  }

  private setUserAssignment(testId: string, identifier: string, variant: string): void {
    if (!this.userAssignments.has(identifier)) {
      this.userAssignments.set(identifier, new Map());
    }
    
    this.userAssignments.get(identifier)!.set(testId, variant);
    this.saveAssignmentToStorage(identifier, testId, variant);
  }

  private trackAssignment(
    testId: string,
    variantId: string,
    userId?: string,
    sessionId?: string,
    attributes?: Record<string, any>
  ): void {
    this.sendAnalyticsEvent('ab_test_assignment', {
      testId,
      variantId,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      attributes
    });
  }

  private sendAnalyticsEvent(eventName: string, data: Record<string, any>): void {
    // Plausible Analytics
    if (typeof window !== 'undefined' && (window as any).plausible) {
      try {
        (window as any).plausible(eventName, { props: data });
      } catch (error) {
        console.warn('Failed to send event to Plausible:', error);
      }
    }

    // カスタム分析エンドポイント
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data })
      }).catch(() => {
        // エラーは無視（分析データのため）
      });
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // テスト設定の読み込み
      const testsData = localStorage.getItem(this.storagePrefix + 'tests');
      if (testsData) {
        const tests = JSON.parse(testsData);
        for (const [id, config] of Object.entries(tests)) {
          this.tests.set(id, config as ABTestConfig);
        }
      }

      // ユーザー割り当ての読み込み
      const assignmentsData = localStorage.getItem(this.storagePrefix + 'assignments');
      if (assignmentsData) {
        const assignments = JSON.parse(assignmentsData);
        for (const [userId, userTests] of Object.entries(assignments)) {
          this.userAssignments.set(userId, new Map(Object.entries(userTests as Record<string, string>)));
        }
      }
    } catch (error) {
      console.warn('Failed to load A/B test data from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const testsData = Object.fromEntries(this.tests.entries());
      localStorage.setItem(this.storagePrefix + 'tests', JSON.stringify(testsData));
    } catch (error) {
      console.warn('Failed to save A/B test data to storage:', error);
    }
  }

  private saveAssignmentToStorage(identifier: string, testId: string, variant: string): void {
    if (typeof window === 'undefined') return;

    try {
      const assignmentsData = localStorage.getItem(this.storagePrefix + 'assignments');
      const assignments = assignmentsData ? JSON.parse(assignmentsData) : {};
      
      if (!assignments[identifier]) {
        assignments[identifier] = {};
      }
      assignments[identifier][testId] = variant;
      
      localStorage.setItem(this.storagePrefix + 'assignments', JSON.stringify(assignments));
    } catch (error) {
      console.warn('Failed to save assignment to storage:', error);
    }
  }
}

/**
 * A/Bテスト用React Hook
 */
export function useABTest(
  testId: string,
  userId?: string,
  attributes?: Record<string, any>
): {
  variant: string | null;
  config: Record<string, any> | null;
  trackConversion: (type: string, value?: number, metadata?: Record<string, any>) => void;
} {
  const sessionId = getSessionId();
  const variant = abTestManager.getVariant(testId, userId, sessionId, attributes);
  const config = variant ? abTestManager.getVariantConfig(testId, variant) : null;

  const trackConversion = (
    type: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    abTestManager.trackConversion(testId, type, value, userId, sessionId, metadata);
  };

  return { variant, config, trackConversion };
}

/**
 * 機能フラグ用React Hook
 */
export function useFeatureFlag(
  featureKey: string,
  userId?: string,
  attributes?: Record<string, any>
): boolean {
  const sessionId = getSessionId();
  return abTestManager.isFeatureEnabled(featureKey, userId, sessionId, attributes);
}

// セッションID生成
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem('ab_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('ab_session_id', sessionId);
  }
  return sessionId;
}

// グローバルインスタンス
export const abTestManager = new ABTestManager();

// デフォルトテスト設定
if (typeof window !== 'undefined') {
  // サンプルA/Bテスト設定
  abTestManager.setTest({
    id: 'hero_cta_text',
    name: 'Hero CTA Text Test',
    description: 'Test different CTA text in hero section',
    enabled: true,
    variants: [
      { id: 'control', name: 'Control: "今すぐ始める"', weight: 50 },
      { id: 'variant_a', name: 'Variant A: "無料で体験"', weight: 50 }
    ],
    targeting: {
      percentage: 100 // 全ユーザーに表示
    }
  });

  abTestManager.setTest({
    id: 'new_ui_design',
    name: 'New UI Design',
    description: 'Test new UI design for organization pages',
    enabled: false, // 開発中のため無効
    variants: [
      { id: 'current', name: 'Current Design', weight: 80 },
      { id: 'new_design', name: 'New Design', weight: 20 }
    ],
    targeting: {
      percentage: 10 // 10%のユーザーのみ
    }
  });
}