# AIOHub Supabase Architecture Guide

> **Phase 7 完了時点のアーキテクチャ概要**  
> このドキュメントは開発者向けのメモとして、Supabase 統合の設計決定と使用パターンをまとめています。

## 🎯 アーキテクチャ原則

- **Supabase を「正」とする**: データベーススキーマとRPC関数をシステムの真実の源（Single Source of Truth）として扱う
- **段階的移行**: 既存機能を壊さずに新システムに移行するための TODO マーカーと互換性レイヤーを提供
- **Fail-Open設計**: エラー時は制限を緩める方向（アクセス拒否よりもデータ不整合を優先）

---

## 🏗️ ドメイン別アーキテクチャ

### 1. Feature / Plan / Quota システム

#### 📊 **テーブル構造**
```
feature_registry      - 機能定義の中央レジストリ
├── feature_key       - 機能識別子 (ai_interview, embeds, materials, etc.)
├── control_type      - 制御タイプ (on_off | limit_number)
├── display_name      - UI表示名
└── description       - 機能説明

plan_features         - プラン別機能設定
├── plan_type         - プラン種別 (starter | pro | business | enterprise)
├── feature_key       - 機能識別子 (→ feature_registry)
├── config_value      - JSONB設定値
│   ├── enabled: boolean    (on_off タイプ用)
│   └── limit: number       (limit_number タイプ用、-1 = 無制限)

organizations         - 組織別オーバーライド
├── entitlements      - JSONB: 組織固有の機能追加・変更
└── feature_flags     - JSONB: 個別機能のON/OFF切り替え
```

#### 🔧 **RPC関数**
```typescript
// 組織の効果的機能設定を取得
get_effective_org_features(org_id: string) → {
  plan: SupabasePlanType,
  features: Record<feature_key, {
    controlType: 'on_off' | 'limit_number',
    enabled?: boolean,
    limit?: number,
    source: 'plan' | 'entitlements' | 'feature_flags'
  }>,
  version: number,
  updated_at: string
}

// 組織のクォータ使用状況を取得
get_org_quota_usage(org_id: string, feature_key: string) → {
  organization_id: string,
  feature: SupabaseFeatureKey,
  window: { type: string, start: string, end: string },
  limits: { effective_limit: number, unlimited: boolean, source: string },
  usage: { used_in_window: number, remaining: number },
  version: number,
  updated_at: string
}
```

#### 💻 **アプリケーション層**
```typescript
// 機能利用可否チェック（RPC優先、フォールバック付き）
canUseFeatureFromOrgAsync(org: Organization, key: FeatureKey): Promise<boolean>

// クォータ制限チェック（RPC ベース）
isFeatureQuotaLimitReached(orgId: string, featureKey: SupabaseFeatureKey): Promise<boolean>

// クォータ使用状況取得（RPC ベース）
fetchOrgQuotaUsage(orgId: string, featureKey: SupabaseFeatureKey): Promise<NormalizedOrgQuotaUsage>
```

#### 🔀 **移行戦略**
- **Admin API**: `feature_registry`, `plan_features` テーブル直接操作
- **Client API**: `get_effective_org_features` RPC 使用
- **Quota API**: `get_org_quota_usage` RPC 使用
- **レガシー**: `src/config/plans.ts` の PLAN_LIMITS は段階的に廃止予定

---

### 2. CMS / Site Settings システム

#### 📊 **テーブル構造**
```
cms_site_settings     - 組織別サイト設定（構造化）
├── organization_id   - UNIQUE: 1組織につき1レコード
├── logo_url          - ロゴ画像URL
├── hero_image_url    - ヒーロー画像URL
├── hero_title        - メインタイトル
├── hero_subtitle     - サブタイトル
├── seo_title         - SEOタイトル
├── seo_description   - SEO説明文
├── seo_keywords      - SEOキーワード配列
└── theme_color       - テーマカラー

organizations.show_*  - コンテンツ表示フラグ
├── show_services     - サービス表示
├── show_materials    - 資料表示
├── show_case_studies - 事例表示
├── show_news         - ニュース表示
├── show_posts        - 記事表示
└── show_faqs         - FAQ表示

public_*_tbl          - 公開コンテンツ（複数テーブル）
├── public_services_tbl
├── public_materials_tbl
├── public_case_studies_tbl
├── public_news_tbl
├── public_posts_tbl
└── public_faqs_tbl
```

#### 💻 **使用パターン**
```typescript
// 統合型: CMS設定 + 表示フラグ
interface SiteSettingsDTO extends CmsSiteSettingsRow, OrganizationSiteVisibilityFlags {}

// 管理画面: cms_site_settings テーブル直接操作
// 公開画面: public_*_tbl テーブル参照（show_* フラグで表示制御）
```

---

### 3. Org-Groups システム

#### 📊 **テーブル構造**
```
organization_groups    - グループ定義
├── owner_organization_id  - オーナー組織ID
├── name                   - グループ名
└── description           - 説明

org_group_members     - グループメンバーシップ
├── group_id          - グループID
├── organization_id   - 参加組織ID
└── role              - 役割 (admin | member)

org_group_invites     - 招待管理
├── group_id          - グループID
├── code              - 招待コード
├── expires_at        - 有効期限
├── max_uses          - 最大使用回数
└── used_count        - 使用回数

org_group_join_requests - 参加リクエスト
├── group_id          - グループID
├── organization_id   - 申請組織ID
├── status            - ステータス (pending | approved | rejected)
└── invite_code       - 使用した招待コード
```

#### 🔄 **典型的なユースケース**
1. **グループ作成**: オーナー組織が `organization_groups` に新規グループ作成 → 自動的に `org_group_members` にadminとして追加
2. **招待による参加**: グループ管理者が `org_group_invites` で招待コード発行 → 参加希望組織が招待コードで参加
3. **申請による参加**: 参加希望組織が `org_group_join_requests` で申請 → グループ管理者が承認/拒否

---

## 🧭 **開発ガイドライン**

### ✅ **推奨パターン**
```typescript
// 機能チェック（新規コード）
const canUseAI = await canUseFeatureFromOrgAsync(organization, 'ai_reports');

// クォータチェック（新規コード） 
const isLimited = await isFeatureQuotaLimitReached(orgId, 'materials');

// 使用状況取得（新規コード）
const quota = await fetchOrgQuotaUsage(orgId, 'embeds');
```

### ⚠️ **移行予定（使用注意）**
```typescript
// レガシー: 静的制限チェック → RPC ベースに移行予定
import { PLAN_LIMITS } from '@/config/plans';
import { checkMonthlyQuestionUsage } from '@/lib/billing/interview-credits';
```

### 🔍 **型定義の場所**
```typescript
// Supabase 整合型
import type { ... } from '@/types/features';           // Feature/Quota
import type { ... } from '@/types/cms-supabase';      // CMS
import type { ... } from '@/types/org-groups-supabase'; // Org-Groups

// レガシー互換型（段階的廃止予定）
import type { ... } from '@/config/plans';            // PLAN_LIMITS
```

---

## 🚧 **現在進行中の移行**

### Phase 7 完了項目
- ✅ 新しい型定義の作成と既存コードへのTODOマーカー追加
- ✅ TypeScript エラーの修正（型キャストとTODOコメント）
- ✅ レガシー関数の使用状況確認とマイグレーション計画

### 今後の作業
- 🔄 Supabase クライアント型定義の完全化
- 🔄 レガシー関数から RPC 関数への段階的置き換え
- 🔄 フロントエンド コンポーネントでの新 API 利用

---

## 📝 **注意事項**

- **SQL の実行は禁止**: このドキュメントはアプリ側のアーキテクチャのみを扱います
- **型安全性**: `as any` によるキャストは一時的な措置です。Supabase クライアント型定義完了後に削除予定
- **TODO マーカー**: `[SUPABASE_*_MIGRATION]` で検索することで移行対象箇所を特定できます

---

*最終更新: Phase 8 完了時点*