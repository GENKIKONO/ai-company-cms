# サイドナビ再編 仕様変更書

> **実施日:** 2025-01-13
> **変更種別:** ナビゲーション構造変更（破壊的変更なし）
> **影響範囲:** Dashboard領域のサイドナビ/モバイルナビ

---

## 1. 変更概要

サイドナビ/導線を新IA「Home / Overview / My Page / AI Studio / Insights / Settings」に再編。
既存のURLパス・Shell境界・権限チェックは維持し、ナビのラベル/グルーピングのみ変更。

---

## 2. 変更方針

| 項目 | 内容 |
|------|------|
| 方針 | **A: 入口変更のみ** |
| 遷移先パス | 変更なし（全て既存パス） |
| Shell境界 | 変更なし（/dashboard配下で完結） |
| 権限チェック | 変更なし（DashboardPageShell維持） |
| 互換対応 | 不要（URL変更なし） |

---

## 3. 新IA構成

### グループ化ナビゲーション

| カテゴリ | 項目 | パス | アイコン |
|----------|------|------|----------|
| **Home** | ダッシュボード | /dashboard | HomeIcon |
| **Overview** | アクティビティ | /dashboard/activity | ClockIcon |
| **My Page** | 記事管理 | /dashboard/posts | DocumentTextIcon |
| | サービス管理 | /dashboard/services | BriefcaseIcon |
| | 事例管理 | /dashboard/case-studies | UserGroupIcon |
| | FAQ管理 | /dashboard/faqs | QuestionMarkCircleIcon |
| | 営業資料 | /dashboard/materials | FolderIcon |
| **AI Studio** | 企業専用AIチャット | /dashboard/org-ai-chat | DocumentPlusIcon |
| | AIインタビュー | /dashboard/interview | ChatBubbleBottomCenterTextIcon |
| **Insights** | Q&A統計 | /dashboard/qna-stats | ChartBarIcon |
| | 分析レポート | /dashboard/analytics/ai-seo-report | ChartBarIcon |
| | AIレポート | /dashboard/ai-reports | DocumentChartBarIcon |
| | AI引用 | /dashboard/ai-citations | LinkIcon |
| **Settings** | 埋め込み設定 | /dashboard/embed | CodeBracketIcon |
| | 請求管理 | /dashboard/billing | CreditCardIcon |
| | 設定 | /dashboard/settings | Cog6ToothIcon |
| | ヘルプ | /dashboard/help | ChatBubbleLeftRightIcon |
| | アカウント | /account | UserCircleIcon |

### 条件付き表示

| カテゴリ | 項目 | パス | 表示条件 |
|----------|------|------|----------|
| **Admin** | 管理 | /dashboard/manage | `canSeeAdminNav=true`（org manager） |

---

## 4. 変更ファイル

### 新規作成

| ファイル | 説明 |
|---------|------|
| `src/lib/nav.ts` | ナビゲーション定義の単一ソース |

### 更新

| ファイル | 変更内容 |
|---------|---------|
| `src/components/dashboard/DashboardSidebar.tsx` | nav.ts参照に変更、グループ化UI実装 |
| `src/components/navigation/UnifiedMobileNav.tsx` | nav.ts参照に変更、グループ化UI実装、CSS変数統一 |

---

## 5. 削除された機能

| 機能 | 旧実装 | 削除理由 |
|------|--------|----------|
| 組織設定リンク | `/organizations/${organization.id}` | Shell境界違反（Dashboard→Public）の是正 |
| 組織有無によるナビ分岐 | `getNavigation(organization)` | 不要になったため |
| useOrganization hook使用 | DashboardSidebar.tsx内 | 上記に伴い不要 |

---

## 6. 技術的改善

### ナビ定義の単一ソース化

**旧:** ナビ定義が2箇所に重複
- `DashboardSidebar.tsx` の `getNavigation()` 関数
- `UnifiedMobileNav.tsx` の `dashboardNavigation` 定数

**新:** `src/lib/nav.ts` に一元化
- Desktop/Mobile で同じ定義を参照
- 項目追加・変更が1箇所で完結

### デザインルール準拠

UnifiedMobileNav.tsx のTailwind直書き色をCSS変数に統一:

| 旧（直書き） | 新（CSS変数） |
|-------------|---------------|
| `text-gray-700` | `text-[var(--color-text-secondary)]` |
| `text-gray-400` | `text-[var(--color-icon-muted)]` |
| `text-gray-500` | `text-[var(--color-text-tertiary)]` |
| `hover:bg-gray-50/60` | `hover:bg-[var(--aio-surface)]` |
| `hover:bg-gray-100/60` | `hover:bg-[var(--table-row-hover)]` |
| `border-gray-200/60` | `border-[var(--dashboard-card-border)]` |

---

## 7. 検証結果

| 検証 | 結果 |
|------|------|
| `npm run typecheck` | 成功 |
| `npm run build` | 成功（134ページ生成） |

---

## 8. 手動確認チェックリスト

以下の導線を手動で確認してください:

- [ ] /dashboard（Home）へ遷移
- [ ] /dashboard/activity（Overview）へ遷移
- [ ] /dashboard/posts（My Page）へ遷移
- [ ] /dashboard/services へ遷移
- [ ] /dashboard/case-studies へ遷移
- [ ] /dashboard/faqs へ遷移
- [ ] /dashboard/materials へ遷移
- [ ] /dashboard/org-ai-chat（AI Studio）へ遷移
- [ ] /dashboard/interview へ遷移
- [ ] /dashboard/qna-stats（Insights）へ遷移
- [ ] /dashboard/analytics/ai-seo-report へ遷移
- [ ] /dashboard/ai-reports へ遷移
- [ ] /dashboard/ai-citations へ遷移
- [ ] /dashboard/embed（Settings）へ遷移
- [ ] /dashboard/billing へ遷移
- [ ] /dashboard/settings へ遷移
- [ ] /dashboard/help へ遷移
- [ ] /account へ遷移
- [ ] モバイル表示でグループ化ナビが正常に動作
- [ ] org manager権限で「管理」リンクが表示される

---

## 9. 未対応事項・リスク

| 項目 | 説明 | 対応案 |
|------|------|--------|
| 組織設定への導線 | 削除した「組織設定」リンクの代替導線なし | Settings内に「組織プロフィール編集」ページを新設するか検討 |

---

## 10. ロールバック手順

問題発生時は以下のコミットを revert:

```bash
git revert <commit-hash>
```

影響ファイル:
- `src/lib/nav.ts` （削除）
- `src/components/dashboard/DashboardSidebar.tsx` （旧版に戻す）
- `src/components/navigation/UnifiedMobileNav.tsx` （旧版に戻す）

---

## 11. 関連ドキュメント

- [コアアーキテクチャ要件定義](../core-architecture.md)
- [AI実装ガード](../ai-implementation-guard.md)
- [デザインシステム v3.0](../../DESIGN_SYSTEM.md)
