# ARCHITECTURE_INDEX.md - Claude Code 必読インデックス

> **このファイルは Claude Code が任意の変更を行う前に必ず参照すべきマスターインデックスです。**
> 各変更シナリオに対して「何を確認すべきか」「どのファイルを見るべきか」を定義しています。

---

## 1. クイックルックアップ - 変更内容別チェックリスト

### 1.1 ファイル変更時の自動チェック

| 変更対象 | 必須確認ドキュメント | 実行すべきコマンド |
|----------|----------------------|-------------------|
| `src/app/dashboard/**` | §2.1 Dashboard領域, §3.1 認証 | `npm run check:architecture` |
| `src/app/admin/**` | §2.2 Admin領域, §3.2 site_admin | `npm run check:architecture` |
| `src/app/api/**` | §3.3 API認証, §4.2 RLS | `npm run typecheck` |
| `src/components/dashboard/**` | §5.1 UIコンポーネント | `npm run check:tailwind` |
| `src/components/ui/**` | DESIGN_SYSTEM.md | `npm run check:tailwind` |
| `src/lib/featureGate.ts` | §4.1 機能ゲート | `npm run typecheck` |
| `src/lib/org-features/**` | §4.1 機能ゲート（読み取り専用） | `npm run check:architecture` |
| `src/types/**` | §6.1 型定義 | `npm run typecheck` |
| `supabase/migrations/**` | §4.2 RLS, §6.2 マイグレーション | `npm run types:check` |
| `*.test.ts`, `*.spec.ts` | §7.1 テスト規約 | `npm run test` |

### 1.2 機能追加時のチェック

| 追加機能 | 必須確認 | 禁止事項 |
|----------|----------|----------|
| 新規ページ | §2 PageShell選択 | 領域間違い（Dashboard→Admin等） |
| 新規コンポーネント | DESIGN_SYSTEM.md | 独自ボタン作成、Tailwind直書き |
| 新規API | §3.3 API認証パターン | 認証なしエンドポイント |
| 新規機能フラグ | §4.1 機能ゲート | ハードコード、直接DB参照 |
| 新規テーブル | §4.2 RLS | RLSなしテーブル |

---

## 2. PageShell アーキテクチャ（4領域）

**正規文書**: `docs/core-architecture.md` §5

```
┌─────────────────────────────────────────────────────────────────┐
│  Info領域          │  Dashboard領域      │  Admin領域           │
│  (/*, /pricing)    │  (/dashboard/**)    │  (/admin/**)         │
├────────────────────┼─────────────────────┼──────────────────────┤
│  InfoPageShell     │  DashboardPageShell │  AdminPageShell      │
│  認証: なし        │  認証: org_role     │  認証: site_admin    │
│  RLS: 公開データ   │  RLS: 組織スコープ  │  RLS: 管理者のみ     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Dashboard領域 - 必須ルール

**ファイル**: `src/components/dashboard/DashboardPageShell.tsx`

```typescript
// 必須パターン
<DashboardPageShell
  title="ページタイトル"
  requiredRole="viewer" | "editor" | "admin"  // 必須
  featureFlag="機能キー"                       // オプション
>
  <YourContent />
</DashboardPageShell>
```

**禁止**:
- `DashboardPageShell` 外での認証チェック
- `supabase.auth.getUser()` の直接呼び出し（Shell経由必須）
- `organizationId` の props からの受け取り（Context経由必須）

### 2.2 Admin領域 - 必須ルール

**ファイル**: `src/components/admin/AdminPageShell.tsx`

```typescript
// 必須パターン
<AdminPageShell title="管理タイトル">
  <YourAdminContent />
</AdminPageShell>
```

**禁止**:
- Dashboard系コンポーネントの使用
- `org_role` ベースの認証（site_admin必須）

### 2.3 Info領域 - 必須ルール

**禁止**:
- 認証が必要なデータの表示
- `is_published = false` のデータ取得

---

## 3. 認証アーキテクチャ

**正規文書**: `docs/core-architecture.md` §6

### 3.1 Dashboard認証フロー

```
ユーザーアクセス
    ↓
DashboardPageShell.fetchData()
    ↓
/api/dashboard/init (認証+組織+権限一括取得)
    ↓
Context に展開 (organizationId, userRole, etc.)
    ↓
子コンポーネントは useDashboardPageContext() で取得
```

**検証コマンド**: `npm run check:architecture` (チェック#5)

### 3.2 Admin認証フロー

```
ユーザーアクセス
    ↓
AdminPageShell (site_admin検証)
    ↓
API: requireSiteAdmin() ミドルウェア
```

**禁止**: `isSiteAdmin()` の重複実装（1箇所のみ許可）

### 3.3 API認証パターン

| API種別 | 認証関数 | ファイル |
|---------|----------|----------|
| Dashboard API | `withOrgAuth()` | `src/lib/api/dashboard-auth.ts` |
| Admin API | `requireSiteAdmin()` | `src/lib/api/admin-auth.ts` |
| Public API | RLSのみ | - |

---

## 4. 機能ゲート（Feature Gate）

**正規文書**: `docs/core-architecture.md` §8, `docs/plans-architecture.md`

### 4.1 機能ゲート構造

```
┌─────────────────────────────────────────────────────────────┐
│ plan_features (プラン→機能マッピング)                       │
│     ↓                                                       │
│ feature_overrides (組織別上書き - 管理者機能)              │
│     ↓                                                       │
│ getEffectiveFeatures() → 実効機能一覧                       │
│     ↓                                                       │
│ DashboardPageShell featureFlag → FeatureGateUI             │
└─────────────────────────────────────────────────────────────┘
```

**禁止**:
- `if (plan === 'starter')` のようなプラン名分岐（検出: チェック#10）
- `feature_flags` テーブルの直接参照（検出: チェック#11）
- `src/lib/org-features/**` の直接import（検出: チェック#8）

**許可ファイル** (plan分岐が許可されるもの):
- `src/config/plans.ts`
- `src/app/management-console/**`
- `src/lib/featureGate.ts`
- `src/lib/feature-metadata.ts`

### 4.2 RLSポリシー

**正規文書**: `docs/core-architecture.md` §7

| データ種別 | RLSパターン |
|------------|-------------|
| 組織データ | `organization_id = get_user_org_id()` |
| 公開データ | `is_published = true` |
| 管理者データ | `is_site_admin(auth.uid())` |

**検証コマンド**: `npm run check:architecture` (チェック#6)

---

## 5. UIコンポーネント

**正規文書**: `DESIGN_SYSTEM.md`

### 5.1 コンポーネント階層

```
src/components/
├── ui/                    # 基本UI（Button, Input等）
│   └── button.tsx         # 唯一の統一ボタン
├── dashboard/             # Dashboard専用
│   ├── DashboardPageShell.tsx
│   ├── DashboardCard.tsx
│   ├── FeatureGateUI.tsx  # 機能制限UI
│   └── ui/                # Dashboard用UIパーツ
├── admin/                 # Admin専用
└── public/                # 公開ページ用
```

### 5.2 スタイリングルール

**必須**:
- CSS変数経由: `var(--aio-primary)`, `var(--color-text-primary)`
- 既存コンポーネント使用

**禁止**:
- Tailwind色直書き: `bg-blue-500` ❌
- インラインスタイル: `style={{ color: 'red' }}` ❌

**検証コマンド**: `npm run check:tailwind`

---

## 6. 型定義とマイグレーション

### 6.1 型安全性（Strict Mode）

**コアモジュール厳格チェック**: `tsconfig.strict.json`

以下のファイルは TypeScript strict mode で検証されます：
- `src/lib/featureGate.ts` - 機能ゲート
- `src/lib/feature-metadata.ts` - 機能メタデータ
- `src/lib/core/**/*.ts` - コア認証・状態管理
- `src/lib/api/dashboard-auth.ts` - Dashboard API認証
- `src/lib/api/admin-auth.ts` - Admin API認証
- `src/lib/org-features/**/*.ts` - 組織機能管理
- `src/types/feature-metadata.ts` - 型定義

**検証コマンド**: `npm run typecheck:strict`

**CI統合**: `check:integrity` に含まれる

### 6.2 型定義ルール

| ファイル | 用途 | 更新方法 |
|----------|------|----------|
| `src/types/supabase.ts` | DB型（public） | `npm run types:gen` |
| `src/types/supabase-admin.ts` | DB型（admin） | `npm run types:gen:admin` |
| `src/types/domain/**` | ドメイン型 | 手動 |
| `src/types/legacy/**` | 後方互換型 | 手動（新規使用禁止） |

**型ドリフト検証**: `npm run types:check`

### 6.3 マイグレーションルール

**禁止フィールド**:
- `org_id` → `organization_id` を使用
- 検証: `npm run validate:forbidden`

**RLS必須**: 全publicテーブルにRLSポリシー必須

---

## 7. テストとCI

### 7.1 テスト規約

| テスト種別 | 設定ファイル | コマンド |
|------------|--------------|----------|
| Unit | `jest.config.js` | `npm run test:unit` |
| Integration | `jest.integration.config.js` | `npm run test:integration` |
| E2E | `playwright.config.ts` | `npm run test:e2e` |

### 7.2 CI必須チェック

```yaml
# quality-gate.yml で実行
- npm run typecheck
- npm run lint
- npm run build
- npm run check:architecture
```

---

## 8. コアモジュール契約

### 8.1 featureGate.ts

**ファイル**: `src/lib/featureGate.ts`

**入力**:
- `organizationId: string`
- `featureKey: string`

**出力**:
- `{ available: boolean, quota?: QuotaInfo }`

**不変条件**:
- `feature_overrides` は `plan_features` より優先
- `unlimited: true` の場合、使用量チェックなし

### 8.2 auth-state.ts

**ファイル**: `src/lib/auth-state.ts`

**責務**:
- 認証状態の一元管理
- セッション復元

**禁止**:
- 他ファイルでの `supabase.auth.getSession()` 直接呼び出し

### 8.3 DashboardPageShell

**ファイル**: `src/components/dashboard/DashboardPageShell.tsx`

**Props**:
```typescript
interface DashboardPageShellProps {
  title: string;
  requiredRole?: 'viewer' | 'editor' | 'admin';
  featureFlag?: string;
  children: ReactNode;
}
```

**提供Context**:
```typescript
interface DashboardPageContext {
  organizationId: string;
  organization: Organization;
  userRole: OrgRole;
  currentPlan: PlanType;
}
```

---

## 9. 検証コマンド一覧

### 9.1 開発中に実行

```bash
# 型チェック（通常）
npm run typecheck

# 型チェック（コアモジュール厳格）
npm run typecheck:strict

# アーキテクチャ違反検出
npm run check:architecture

# Tailwind色直書き検出
npm run check:tailwind

# 全チェック一括（推奨）
npm run check:integrity

# 全チェック一括（高速版）
npm run check:integrity:quick
```

### 9.2 コミット前に実行

```bash
# lint + routes + crash-vectors
npm run lint

# 型ドリフト検証（マイグレーション変更時）
npm run types:check
```

### 9.3 PR前に実行

```bash
# 全検証
npm run check:integrity
npm run test
npm run build
```

---

## 10. 違反検出と対応

### 10.1 check:architecture の13チェック

| # | 違反内容 | 対応 |
|---|----------|------|
| 1 | `@/lib/auth` 直接import | Core経由に変更 |
| 2 | `isSiteAdmin` 重複 | 単一ソースに統合 |
| 3 | 監査ログAPI直接呼び出し | Core経由に変更 |
| 4 | `orgId?: string\|null` | Subject型使用 |
| 5 | DashboardPageShell認証チェック | Shell経由必須 |
| 6 | 禁止DBオブジェクト使用 | 削除 |
| 7 | Legacy ErrorBoundary import | 新ErrorBoundary使用 |
| 8 | org-features直接import | featureGate経由 |
| 9 | ページ内プランハードコード | config/plans.ts使用 |
| 10 | プラン名分岐 | featureFlag使用 |
| 11 | feature_flags直接アクセス | featureGate経由 |
| 12 | FeatureLocked重複 | 統一コンポーネント使用 |
| 13 | /accountでDashboardPageShell | UserShell使用 |

### 10.2 よくある間違いと修正

```typescript
// ❌ 間違い: 直接認証チェック
const { data: { user } } = await supabase.auth.getUser();

// ✅ 正解: Shell経由
const { user } = useDashboardPageContext();
```

```typescript
// ❌ 間違い: プラン名分岐
if (plan === 'pro') { ... }

// ✅ 正解: 機能フラグ
<DashboardPageShell featureFlag="ai_reports">
```

```typescript
// ❌ 間違い: Tailwind直書き
<button className="bg-blue-500">

// ✅ 正解: CSS変数
<Button variant="primary">
```

---

## 11. 更新履歴

| 日付 | 変更内容 | 担当 |
|------|----------|------|
| 2025-01-18 | 初版作成 | Claude Code |

---

## 12. 関連ドキュメント

| ドキュメント | 用途 | パス |
|--------------|------|------|
| コアアーキテクチャ | 詳細設計 | `docs/core-architecture.md` |
| AI実装ガード | UI実装チェック | `docs/ai-implementation-guard.md` |
| デザインシステム | UI/UX仕様 | `DESIGN_SYSTEM.md` |
| プランアーキテクチャ | 課金・機能 | `docs/plans-architecture.md` |
