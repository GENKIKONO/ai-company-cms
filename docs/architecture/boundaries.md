# 設計境界（Boundaries）ガイド

> **正本:** このドキュメントは「どこで何を決めるか」の単一ソースです。
> **用途:** 実装・レビュー時の判断基準として参照してください。

---

## 1. この文書の目的

### レビュー基準としての活用

このドキュメントは以下の混乱を防ぐために存在します：

- **UIでの実行可否判定**（プラン名分岐/機能直読みでの不正ブロック）
- **Auth取得方法の逸脱**（直叩き）
- **Feature/Plan/Quota の責務衝突**
- **Dashboard/Account/Admin の境界混線**

**迷ったらここを見る。** 各境界には正本と禁止パターンが明記されています。

---

## 2. 領域境界（Shell）

### 4領域の定義

| 領域 | パス | Shell | 主体 | 権限モデル |
|------|------|-------|------|-----------|
| **Info** | `/`, `/pricing`, `/terms` | InfoPageShell | なし | 認証不要 |
| **Dashboard** | `/dashboard/**` | DashboardPageShell | org | `org_role` |
| **Account** | `/account/**` | UserShell | user | `auth.uid` |
| **Admin** | `/admin/**` | AdminPageShell | site | `site_admin` |

### NG: やってはいけない混在

| 違反パターン | 理由 | CI検出 |
|-------------|------|--------|
| Account で DashboardPageShell を使う | Account は user 主体、Dashboard は org 主体 | Check 13 |
| Dashboard で UserShell を使う | 主体が異なる | - |
| Admin で Dashboard/Account Shell を使う | 権限モデルが異なる | - |

**原則:** 各領域は専用の Shell を使用し、混在させない。

---

## 3. Auth 境界

### 正本

| 種別 | 正本ファイル |
|------|-------------|
| 使い方ガイド | [docs/auth/auth-wrapper-usage.md](../auth/auth-wrapper-usage.md) |
| Server wrapper | `src/lib/core/auth-state.ts` |
| Client wrapper | `src/lib/core/auth-state.client.ts` |
| 例外リスト | [docs/auth/auth-direct-calls-allowlist.md](../auth/auth-direct-calls-allowlist.md) |

### 禁止と代替

| 禁止（NG） | 代替（OK） | CI検出 |
|-----------|-----------|--------|
| `supabase.auth.getUser()` | `getUserWithClient(supabase)` | Check X |
| `supabase.auth.getSession()` | `getSessionWithClient(supabase)` | Check X |
| `supabase.auth.onAuthStateChange()` | `onAuthChangeClient(callback)` | Check X |

### 層別の使い分け

| 層 | 使用する wrapper |
|----|-----------------|
| API Route | `getUserWithClient`, `requireUserWithClient` |
| Server Component | `getUserServerOptional`, `requireUserServer` |
| Client Component | `getCurrentUserClient`, `getSessionClient` |
| user_metadata 必要時 | `getUserFullWithClient` |
| JWT 検証 | `getUserFromTokenWithClient` |

**例外:** [allowlist](../auth/auth-direct-calls-allowlist.md) に記載されたファイルのみ直叩き許可（診断/テスト/middleware）

---

## 4. Feature / Plan / Quota 境界（重要）

### 責務の分離

| 概念 | 正本 | 責務 |
|------|------|------|
| **Feature判定** | `src/lib/featureGate.ts` | 機能の有効/無効を判定 |
| **Plan定義** | `src/config/plans.ts` | プラン構成の定義 |
| **実行可否** | `canExecute` (DB/RPC) | サーバーで最終強制 |
| **PLAN_LIMITS** | `src/config/plans.ts` | UI表示の目安（比較表用） |

### 絶対ルール: UIはヒント、実行はサーバで強制

```
【正しいフロー】
UI（featureGate参照）→ ヒント表示（「この機能はProプラン以上」）
    ↓
ユーザー操作
    ↓
サーバー（canExecute）→ 最終判定 → 実行 or 拒否
    ↓
監査ログ記録
```

### 禁止: UIでPLAN_LIMITSを理由に実行を止める

```typescript
// ❌ NG: UIで実行をブロック
if (PLAN_LIMITS[plan].services < desiredCount) {
  return; // 実行させない ← 禁止
}

// ✅ OK: UIはヒントのみ、実行はサーバに委ねる
const canProceed = await canExecute({ action: 'create_service', orgId });
if (!canProceed) {
  // サーバーが拒否したら表示
}
```

**理由:** UIはバイパス可能。セキュリティ/課金制御は必ずサーバーで強制する。

---

## 5. UI側の禁止パターン（CIガードと対応付け）

| 禁止パターン | CI Check | 代替手段（OK） |
|-------------|----------|---------------|
| プラン名分岐 `plan === 'pro'` | Check 10 | `getFeatureEnabled(features, 'key')` |
| `feature_flags` 直読み | Check 11 | `getEffectiveFeatures()` 経由 |
| `FeatureLocked` ローカル定義 | Check 12 | `@/components/feature/FeatureLocked` |
| `org-features` 直接import | Check 8 | `@/lib/featureGate` 経由 |
| Auth 直叩き | Check X | Core wrapper 経由 |

**詳細:** [core-architecture.md Appendix D](../core-architecture.md#appendix-d-ciガードレール一覧)

---

## 6. 例外と撤去条件

### 例外管理の正本（Phase 18）

| 例外種別 | 正本ドキュメント |
|---------|-----------------|
| Auth 直叩き | [auth-direct-calls-allowlist.md](../auth/auth-direct-calls-allowlist.md) |
| プラン名分岐 / feature_flags | [exceptions-allowlist.md](./exceptions-allowlist.md) |

### 例外の方針

- **Auth 直叩き:** allowlist のみ許可。増やさない方針。
- **プラン名分岐:** exceptions-allowlist.md のホワイトリストのみ許可。
- **機械的検知:** Check 14 で例外増加を検知。BASELINE更新必須。

### 新規例外が必要な場合

1. まず代替手段（Core wrapper / featureGate）で対応できないか検討
2. どうしても必要な場合:
   - 該当する allowlist ドキュメントを更新（reason/remove_when/review_by 必須）
   - Check 14 が FAIL → BASELINE更新が必要
   - PR レビューで承認を得る

**原則:** 例外は削減の方向で管理。増やさない。Check 14 が機械的に担保。

---

## 8. 品質検証方針（Phase 19）

### 手動testページから E2E への移行

| 方針 | 説明 |
|------|------|
| **手動testページは原則撤去** | `src/app/test/**` は削除（E2E smoke で代替） |
| **E2E smoke が正本** | Dashboard導線の動作確認は Playwright E2E で担保 |
| **allowlistは減らす方向のみ** | 増加は禁止、Check 14 で機械的に担保 |

### E2E smoke テスト対象

| 導線 | 確認内容 |
|------|----------|
| Dashboard → Interview | インタビュー開始ボタン/見出しの存在 |
| Dashboard → Embed | 設定UI（フォーム/プレビュー枠）の存在 |
| Dashboard → Billing | プラン比較表/カードUIの存在 |

> **実行:** `npm run test:e2e`
> **詳細:** `tests/e2e/dashboard-routes-smoke.spec.ts`, `tests/e2e/billing-smoke.spec.ts`

---

## 7. Layout Boundaries（UIレイアウト分離）

### Route Groups による Layout 分離

| Route Group | Layout | UI Chrome | 例 |
|-------------|--------|-----------|-----|
| `(public)/` | `(public)/layout.tsx` | Header + Footer + MobileNav | `/`, `/pricing`, `/about` |
| `dashboard/` | `dashboard/layout.tsx` | Sidebar + DashboardShell | `/dashboard/**` |
| `admin/` | `admin/layout.tsx` | AdminShell | `/admin/**` |
| `account/` | `account/layout.tsx` | UserShell | `/account/**` |

### 実装構造

```
src/app/
├── layout.tsx              ← Providers のみ (UIなし)
├── (public)/
│   ├── layout.tsx          ← Header + Footer + MobileNav
│   ├── page.tsx            ← /
│   ├── pricing/page.tsx    ← /pricing
│   └── ...
├── dashboard/
│   ├── layout.tsx          ← Sidebar (認証 + org確認)
│   └── ...
└── admin/
    ├── layout.tsx          ← AdminShell
    └── ...
```

### NG: やってはいけないパターン

| 違反パターン | 理由 |
|-------------|------|
| Root layout で Header/Footer を描画 | 全ルートに適用されてしまう |
| CSS で Header/Footer を非表示にする | ハック・バグの温床 |
| Dashboard 内で公開 Header を import | 領域混在 |

### 原則

- **Root layout は Providers のみ**（UIProvider, ToastProvider, ErrorBoundary）
- **UI chrome は各 route group の layout で描画**
- **CSS ハックによる表示/非表示切り替えは禁止**

### モバイルドロワーナビゲーション

モバイルドロワー（ハンバーガーメニュー）の動作は **MobileDrawerLayout** コンポーネントで統一実装されています。

| 正本コンポーネント | パス |
|------------------|------|
| `MobileDrawerLayout` | `src/components/navigation/MobileDrawerLayout.tsx` |

**統一された動作:**
- open/close state 管理
- ルート遷移時の自動クローズ
- ESC キーでクローズ
- 背景スクロールロック
- オーバーレイクリックでクローズ

**使用例:**
- `DashboardLayoutContent` → 左サイドバー型（lg以上で固定サイドバー）
- `ManagementConsoleLayoutContent` → ヘッダー型（カスタムヘッダーでrender prop使用）

**禁止:** 各レイアウトで `document.body.style.overflow = 'hidden'` を個別実装しない。
MobileDrawerLayout を経由して共通動作を使用すること。

---

## 9. PRレビュー用チェックリスト

### このPRはどこに属するか？

- [ ] Info（公開ページ）
- [ ] Dashboard（org主体）
- [ ] Account（user主体）
- [ ] Admin（site_admin主体）

### 境界ルールに違反していないか？

- [ ] 正しい Shell を使用している
- [ ] Auth は Core wrapper 経由
- [ ] Feature 判定は featureGate 経由
- [ ] UIで実行可否をブロックしていない（サーバー委譲）
- [ ] プラン名での直接分岐がない
- [ ] feature_flags の直読みがない

### 新しい例外を増やしていないか？

- [ ] allowlist への追加がない（ある場合は理由を説明）
- [ ] ホワイトリストへの追加がない（ある場合は理由を説明）

---

## 関連ドキュメント

- **[レビューゲートガイド](./review-gates.md)** ← PRレビューの運用ルール
- [Auth Wrapper 使用ガイド](../auth/auth-wrapper-usage.md)
- [Auth直叩き許容リスト（Allowlist）](../auth/auth-direct-calls-allowlist.md)
- [コアアーキテクチャ要件定義](../core-architecture.md)
- [CIガードレール一覧](../core-architecture.md#appendix-d-ciガードレール一覧)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-28 | Phase 16 で新規作成 |
| 2024-12-29 | Phase 19 で品質検証方針（E2E移行）を追加 |
| 2024-12-29 | Phase 20 で最終ハードニング完了 |
| 2024-12-29 | Layout Boundaries（Route Groups による UI分離）追加 |
| 2024-12-29 | MobileDrawerLayout 共通コンポーネント追加（PR3） |
