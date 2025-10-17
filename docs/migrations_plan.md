# 移行計画

## 移行方針

### 目標
既存のB2B2C（代理店中心）システムを、**セルフサーブ＋代理店併存モデル**に移行。ダウンタイム0、データ損失0、機能退行0を実現。

### 移行原則
1. **後方互換性維持**: 既存機能・データは100%保護
2. **段階的展開**: 機能ごとの漸進的リリース
3. **フォールバック可能**: 問題時の即座復旧
4. **検証可能**: 各段階での動作確認

## データベース移行

### 現在のスキーマ分析
```
既存マイグレーション:
- 0001_init.sql: 基本スキーマ
- 001_initial_schema.sql: 初期テーブル定義
- 002_rls_policies.sql: Row Level Security
- ~~003_sample_data.sql: サンプルデータ~~ (削除済み)
- 20250922_add_setup_fee.sql: セットアップ費用対応
- 20250923_create_app_users.sql: ユーザーテーブル
- 20250927_*.sql: 監査・サブリソース・RLS修正
- 20250927_production_recovery.sql: 本番復旧用
```

### 移行段階

#### Phase 1: スキーマ拡張（後方互換）
```sql
-- 20250928_dual_flow_migration.sql
-- セルフサーブ対応のスキーマ拡張

-- organizations テーブル拡張
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 既存データのcreated_by設定（代理店作成の場合）
UPDATE organizations 
SET created_by = (
  SELECT user_id FROM organization_profiles 
  WHERE organization_id = organizations.id 
  AND role = 'org_owner' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- NOT NULL制約追加（後方互換保証後）
ALTER TABLE organizations 
ALTER COLUMN created_by SET NOT NULL;

-- is_published カラム追加（デフォルト既存動作維持）
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 既存データはすべて公開済み扱い
UPDATE organizations SET is_published = true WHERE is_published IS NULL;
```

#### Phase 2: RLS ポリシー更新
```sql
-- 20250928_dual_flow_rls.sql  
-- 併存モードのRLSポリシー

-- 既存ポリシー削除（安全に）
DROP POLICY IF EXISTS "organization_access_policy" ON organizations;

-- セルフサーブポリシー
CREATE POLICY "selfserve_organizations_access" ON organizations
  FOR ALL USING (
    -- セルフサーブ: 自分が作成した組織のみ
    (auth.uid() = created_by AND 
     (auth.jwt()->>'user_metadata'->>'role' IS NULL OR 
      auth.jwt()->>'user_metadata'->>'role' IN ('org_owner', 'org_editor')))
    OR
    -- 代理店: organization_profiles経由でのアクセス
    (auth.jwt()->>'user_metadata'->>'role' = 'partner' AND
     EXISTS (
       SELECT 1 FROM organization_profiles op
       WHERE op.organization_id = id 
       AND op.user_id = auth.uid()
       AND op.role IN ('org_owner', 'org_editor')
     ))
    OR  
    -- 管理者: 全アクセス
    (auth.jwt()->>'user_metadata'->>'role' = 'admin')
  );

-- 同様に services, case_studies, faqs, posts も更新
```

#### Phase 3: API エンドポイント追加
```sql
-- 20250928_api_audit_log.sql
-- API使用状況の監査ログ

CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  flow_type VARCHAR(20), -- 'self_serve', 'partner', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
```

### 移行実行手順

#### 事前準備
```bash
# 1. 現在のDBバックアップ
supabase db dump --file backup_pre_migration.sql

# 2. テスト環境での移行検証
supabase db reset --linked
supabase db push

# 3. 移行用マイグレーション適用テスト
supabase migration new dual_flow_migration
supabase migration new dual_flow_rls  
supabase migration new api_audit_log
```

#### 本番移行（ダウンタイム最小化）
```bash
# 1. メンテナンスモード開始（読み取り専用）
# アプリケーションレベルでの制御

# 2. 最終バックアップ
supabase db dump --file backup_production_final.sql

# 3. マイグレーション実行（<5分）
supabase db push --linked

# 4. 整合性確認
npm run verify:migration

# 5. アプリケーション再起動・メンテナンス解除
# 新機能有効化
```

#### ロールバック計画
```bash
# 問題発生時の即座復旧
# 1. アプリケーション停止
# 2. DB復旧（バックアップから）
supabase db reset --linked
psql < backup_production_final.sql

# 3. 旧バージョンアプリケーション復旧
vercel --prod --env=production-rollback
```

## Stripe移行

### 現在のStripe設定確認
```typescript
// 既存設定
interface CurrentStripeConfig {
  price_id: string;           // 月額プラン
  setup_fee_product: string;  // セットアップ費用
  commission_model: string;   // 代理店手数料
}

// 新設定（併存）
interface DualStripeConfig {
  basic_price_id: string;     // ¥5,000/月（セルフサーブ）
  partner_pricing: 'none';    // 代理店は無料（既存維持）
  degraded_mode: boolean;     // 未設定時の基本機能利用
}
```

### Stripe移行戦略

#### Phase 1: 価格プラン追加
```javascript
// Stripe Dashboard または API で実行
const basicPlan = await stripe.prices.create({
  product: 'prod_basic_cms',
  unit_amount: 500000, // ¥5,000 in 円
  currency: 'jpy',
  recurring: { interval: 'month' },
  nickname: 'Basic Plan - Self Serve'
});

// 環境変数更新
STRIPE_BASIC_PRICE_ID = basicPlan.id
```

#### Phase 2: Webhook拡張
```typescript
// webhook handler 更新
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, signature, secret);
  
  switch (event.type) {
    case 'invoice.payment_succeeded':
      // セルフサーブ課金の処理
      if (event.data.object.subscription) {
        await handleSelfServePayment(event.data.object);
      }
      break;
      
    case 'customer.subscription.deleted':
      // サブスクリプション停止時の処理
      await handleSubscriptionCancellation(event.data.object);
      break;
  }
}
```

#### Phase 3: Degraded モード実装
```typescript
// 課金状態に応じた機能制限
interface FeatureAccess {
  basic_features: boolean;      // 常に利用可能
  advanced_features: boolean;   // 課金時のみ
  storage_limit: number;        // GB
  api_rate_limit: number;       // req/hour
}

function calculateFeatureAccess(subscription: Subscription | null): FeatureAccess {
  if (!subscription || subscription.status !== 'active') {
    return {
      basic_features: true,
      advanced_features: false,
      storage_limit: 1,        // 1GB
      api_rate_limit: 100      // 100 req/hour
    };
  }
  
  return {
    basic_features: true,
    advanced_features: true,
    storage_limit: 10,       // 10GB
    api_rate_limit: 1000     // 1000 req/hour
  };
}
```

## 段階的ロールアウト

### ロールアウト戦略

#### Week 1: 基盤移行（0% ユーザー影響）
- [ ] DBスキーマ拡張
- [ ] RLSポリシー更新
- [ ] 内部API整備
- [ ] 管理者ツール準備

#### Week 2: セルフサーブ機能リリース（10% 段階展開）
- [ ] フィーチャーフラグでセルフサーブ有効化
- [ ] 新規登録フローテスト
- [ ] 課金システム接続
- [ ] 10%ユーザーでのA/Bテスト

#### Week 3: 代理店機能更新（50% 展開）
- [ ] 代理店向けUI更新
- [ ] 複数組織管理機能
- [ ] 権限分離確認
- [ ] 50%ユーザーに展開

#### Week 4: 全面展開（100% 移行完了）
- [ ] 全ユーザーに新機能展開
- [ ] 旧機能の段階的廃止
- [ ] 監視・最適化
- [ ] ドキュメント更新

### フィーチャーフラグ制御

#### 環境変数による制御
```bash
# 段階的展開用フラグ
ENABLE_SELF_SERVE_REGISTRATION=true
ENABLE_DUAL_FLOW_UI=true
ENABLE_NEW_BILLING_SYSTEM=true
SELF_SERVE_ROLLOUT_PERCENTAGE=100

# 緊急停止用フラグ
EMERGENCY_DISABLE_NEW_FEATURES=false
FALLBACK_TO_LEGACY_UI=false
```

#### アプリケーション内制御
```typescript
// Feature Flag Manager
class FeatureFlags {
  static isEnabled(flag: string, userId?: string): boolean {
    if (process.env.EMERGENCY_DISABLE_NEW_FEATURES === 'true') {
      return false;
    }
    
    switch (flag) {
      case 'self_serve_registration':
        return process.env.ENABLE_SELF_SERVE_REGISTRATION === 'true';
      case 'dual_flow_ui':
        return process.env.ENABLE_DUAL_FLOW_UI === 'true';
      case 'new_billing':
        return process.env.ENABLE_NEW_BILLING_SYSTEM === 'true';
      default:
        return false;
    }
  }
  
  static getRolloutPercentage(feature: string): number {
    return parseInt(process.env.SELF_SERVE_ROLLOUT_PERCENTAGE || '0');
  }
}
```

## 検証・監視

### 移行成功指標

#### 技術指標
- [ ] DB移行完了: 100%のテーブル・制約・インデックス
- [ ] API互換性: 既存API 100%動作継続
- [ ] パフォーマンス: 移行前後でレスポンス時間±10%以内
- [ ] データ整合性: 全データの検証完了

#### ビジネス指標
- [ ] 既存ユーザー: 100%の機能継続利用
- [ ] 新規ユーザー: セルフサーブ登録の正常動作
- [ ] 代理店: 既存ワークフローの100%保持
- [ ] 課金: Stripe連携の正常動作

### 継続監視項目

#### システム監視
```typescript
interface MigrationMonitoring {
  api_endpoints: {
    legacy_success_rate: number;    // 既存API成功率
    new_success_rate: number;       // 新API成功率
    response_time_delta: number;    // レスポンス時間変化
  };
  
  database: {
    query_performance: number;      // クエリパフォーマンス
    connection_pool_usage: number;  // 接続プール使用率
    rls_policy_hits: number;        // RLSポリシー適用回数
  };
  
  user_experience: {
    bounce_rate: number;            // 離脱率変化
    conversion_rate: number;        // コンバージョン率
    error_reports: number;          // エラーレポート数
  };
}
```

#### アラート設定
- **Critical**: レガシーAPI成功率 < 99%
- **Warning**: 新API成功率 < 95%
- **Info**: レスポンス時間 > 120% (移行前比)

---

**移行責務**: この計画に従って段階的・安全な移行を実施。問題時は即座にロールバック実行。