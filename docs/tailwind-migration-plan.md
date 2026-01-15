# Tailwind CSS変数移行計画

## 概要

`(public)` 配下のTailwind色直書きをCSS変数に移行するPR計画。
現状ベースライン: **1,210件** → 段階的に削減

---

## Phase 1: TOP5ファイル移行（合計407件、約35%削減）

### PR #1: organizations/[id]/page.tsx（109件）
**対象**: `src/app/(public)/organizations/[id]/page.tsx`
**作業内容**:
- `text-gray-*` → `text-secondary` / `text-tertiary`
- `bg-gray-*` → `bg-card` / `bg-subtle`
- `border-gray-*` → `border-default` / `border-subtle`
- `text-blue-*` → `text-accent`
- `bg-blue-*` → `bg-accent`

**テスト**: 組織詳細ページの表示確認（デスクトップ・モバイル）

---

### PR #2: o/[slug]/page.tsx（87件）
**対象**: `src/app/(public)/o/[slug]/page.tsx`
**作業内容**: PR #1と同様のマッピング適用
**テスト**: スラッグベース組織ページの表示確認

---

### PR #3: organizations/new/page.tsx（80件）
**対象**: `src/app/(public)/organizations/new/page.tsx`
**作業内容**: PR #1と同様のマッピング適用
**テスト**: 組織新規作成フォームの動作確認

---

### PR #4: search/page.tsx（67件）
**対象**: `src/app/(public)/search/page.tsx`
**作業内容**: PR #1と同様のマッピング適用
**テスト**: 検索ページの表示・フィルター動作確認

---

### PR #5: I18nHomePage.tsx（64件）
**対象**: `src/app/(public)/I18nHomePage.tsx`
**作業内容**: PR #1と同様のマッピング適用
**テスト**: ホームページの多言語表示確認

---

## 色マッピング参照表

| Tailwind直書き | CSS変数クラス | 用途 |
|---------------|--------------|------|
| `text-gray-900` | `text-primary` | 見出し・本文 |
| `text-gray-700` | `text-secondary` | サブテキスト |
| `text-gray-500` | `text-tertiary` | 補助テキスト |
| `text-gray-400` | `text-muted` | プレースホルダー |
| `bg-gray-50` | `bg-subtle` | 背景（薄い） |
| `bg-gray-100` | `bg-card` | カード背景 |
| `bg-white` | `bg-surface` | 表面背景 |
| `border-gray-200` | `border-default` | 標準ボーダー |
| `border-gray-300` | `border-subtle` | 薄いボーダー |
| `text-blue-600` | `text-accent` | アクセント色 |
| `bg-blue-600` | `bg-accent` | アクセント背景 |
| `text-red-600` | `text-destructive` | エラー・警告 |
| `text-green-600` | `text-success` | 成功表示 |

詳細: `docs/ai-implementation-guard.md` 参照

---

## 実行順序

1. **PR #1** を作成・マージ → ベースライン更新（1,210 → 1,101）
2. **PR #2** を作成・マージ → ベースライン更新（1,101 → 1,014）
3. **PR #3** を作成・マージ → ベースライン更新（1,014 → 934）
4. **PR #4** を作成・マージ → ベースライン更新（934 → 867）
5. **PR #5** を作成・マージ → ベースライン更新（867 → 803）

各PRマージ後、`scripts/check-tailwind-colors.sh` の `PUBLIC_BASELINE` を更新。

---

## Phase 2以降: 残りファイル

| 順位 | ファイル | 件数 |
|-----|---------|------|
| 6 | organizations/[id]/services/new/page.tsx | 50件 |
| 7 | organizations/page.tsx | 47件 |
| 8 | organizations/[id]/services/[serviceId]/page.tsx | 45件 |
| 9 | partners/dashboard/page.tsx | 44件 |
| 10 | organizations/[id]/faqs/[faqId]/page.tsx | 43件 |

---

## 注意事項

- 各PRは**機能変更なし**（純粋なリファクタリング）
- ダークモード対応はCSS変数側で自動適用
- 移行後は`npm run check:tailwind`で件数確認
- ベースライン更新は各PRマージ直後に実施

---

**作成日**: 2026-01-15
**ステータス**: 計画策定完了（実装待ち）
