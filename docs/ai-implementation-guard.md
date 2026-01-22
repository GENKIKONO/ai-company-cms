# AI実装ガード プロンプト

> **目的**: AIが直書き・端折りをせず、既存のアーキテクチャとデザインシステムに忠実に実装するためのガイド
> **デザインシステム**: iCloud Dense v3.0（iCloudの美しさ × Stripeの密度）

---

## 0. Claude Code 運用ルール（最重要）

このセクションはClaude Codeで開発する際の必須運用ルールです。

### 0-0. 変更開始の停止条件（Gate）【必読・必守】

**以下の条件を満たすまで、コード修正に入ってはならない：**

1. **推測禁止**
   - 根拠（ファイル/ログ/SQL結果）なしの断定は禁止
   - 不明な点は「不明」と明記し、ユーザーに確認を求める
   - 「〜だろう」「〜はず」での修正開始は禁止

2. **棚卸し表なしの部分修正禁止**
   - 原因経路が複数あり得る問題（認証/CSP/DB/Cookie等）では、以下の棚卸し表を出すまで修正に入らない：
     | 項目 | 確認内容 |
     |------|----------|
     | 影響API | どのAPIが問題か |
     | 呼び出し元 | クライアント/サーバー/どのコンポーネントか |
     | オリジン | 同一オリジンか、絶対URLか |
     | Cookie同期 | applyCookiesを使っているか |
     | CSP | connect-srcにブロックされていないか |

3. **検証なしCommit/Deploy禁止**
   - 以下の検証コマンド結果を貼るまでcommit/deployしない：
   ```bash
   npm run typecheck
   npm run build
   npm run check:api-auth
   npm run check:origin-safety
   ```

4. **成功条件（Gate）未定義なら開始禁止**
   - 作業開始前に成功条件を明文化する（例）：
     - 「Dashboard→Posts遷移で401ゼロ」
     - 「Console にCSP blocked ゼロ」
     - 「NetworkタブでAPIリクエストが出ている」
   - 成功条件がなければユーザーに確認を求める

### 0-1. Verifyできる形で依頼する（最優先）

**作業完了条件を必ず明示する：**

```bash
# 最低限の検証コマンド（全タスク共通）
npm run typecheck        # 型エラー確認
npm run build            # ビルド成功確認
npm run check:api-auth   # API認証パターン違反検出
npm run check:origin-safety  # オリジン安全性チェック
```

**UI/認証関連の確認観点（必須チェック）：**
- DevTools Network で 401 が出ないこと
- DevTools Network で `/api/` のリクエストが**実際に出ている**こと
  - **リクエストが出ていない** → CSP blocked または絶対URL使用を疑う
- DevTools Application → Cookies で Set-Cookie が設定されること
- DevTools Console に `blocked connect-src` が**0件**であること
  - 1件でもあれば API リクエストがブロックされている
- 内部APIは同一オリジンの相対パス（`/api/...`）で叩いていること
  - NG: `fetch('https://aiohub.jp/api/...')` ← CSPでブロックされる
  - OK: `fetch('/api/...')` または `serverFetch()` を使用

**「直して終わり」ではなく「検証コマンド実行 → 結果報告」を必須とする。**

### 0-2. Explore → Plan → Implement → Commit の分離

| フェーズ | 内容 | 判断基準 |
|---------|------|----------|
| **Explore** | コードベース調査、既存パターン確認 | 常に最初に行う |
| **Plan** | 変更方針の策定、影響範囲の特定 | 差分が1文で言えない場合は必須 |
| **Implement** | 実装、修正 | Plan完了後に実行 |
| **Commit** | コミット、デプロイ | 検証完了後に実行 |

**即実装OKの判断基準：**
- 差分が1文で説明できる（例：「typo修正」「import追加」）
- 既存パターンの単純な複製
- 1ファイル・10行以下の変更

**Plan必須の判断基準：**
- 複数ファイルにまたがる変更
- 新しいパターンの導入
- 認証・セキュリティ関連の変更
- DB/マイグレーション関連の変更

### 0-3. 具体的コンテキストの渡し方

```
# 優先順位（上から優先）
1. @ でファイル参照: @src/middleware.ts を見て
2. エラーログを貼る: 以下のエラーが出ている [ログ貼付]
3. スクショを貼る: [画像添付]
4. "どこを見れば答えがあるか" を最初に指定
```

**NGパターン：**
- 「認証がおかしい」（→ 具体的なエラーログを貼る）
- 「直して」（→ 何をどう直すか、完了条件を明示）

### 0-4. セッション/コンテキスト管理（必須運用）

| 状況 | コマンド | 説明 |
|------|----------|------|
| 無関係な作業に入る前 | `/clear` | コンテキストをクリア |
| Context low が出たら | `/compact` | コンテキストを圧縮（失敗したら `/rewind` or `--resume`） |
| ダメだった変更を戻す | `/rewind` | チェックポイントに戻る（二回Escでも可） |
| セッション再開 | `claude --continue` / `claude --resume` | 前回のセッションを継続 |
| セッション名変更 | `/rename` | 識別しやすい名前に変更 |

**巨大タスクの分割ルール：**
- マイグレーションは1テーブル/1VIEW単位で分割
- 調査だけをサブエージェントに投げる（本体のコンテキストを汚さない）
- 100行超の変更は分割を検討

### 0-5. サブエージェント活用（調査と実装の分離）

```
# 調査をサブエージェントに委譲する例
「この問題の原因を調査して」→ サブエージェントで調査
「調査結果を元に修正して」→ 本体で実装

# 別セッションでレビュー
「このPRをレビューして」→ 新しいセッションで客観的にレビュー
```

**方針**: 調査は本体のコンテキストを汚しやすいので、サブエージェントに分離する。

### 0-6. 権限/危険操作のガード

**禁止：**
- `--dangerously-skip-permissions` フラグの使用
- `git push --force` to main/master
- `DROP TABLE` / `TRUNCATE` の直接実行

**推奨：**
- 外部操作は CLI 優先（例: `gh pr create`）
- DB操作は Supabase SQL Editor で確認後に実行
- 破壊的変更はPRレビュー必須

---

## 1. 最優先参照ファイル（実装前に必ず読む）

| ファイル | 内容 | 参照タイミング |
|---------|------|---------------|
| `CLAUDE.md` | プロジェクト全体の指示 | 全タスク開始時 |
| `DESIGN_SYSTEM.md` | UI/デザイン規約（iCloud Dense v3.0） | UI変更時 |
| `docs/core-architecture.md` | 4領域アーキテクチャ | ページ/API作成時 |
| `src/styles/app-design-tokens.css` | CSS変数一覧 | スタイル指定時 |

---

## 2. 領域別 参照ファイル

### 統一コンポーネント（全領域共通）

| ファイル | 用途 |
|---------|------|
| `src/components/ui/button.tsx` | **統一Buttonコンポーネント（メイン）** |
| `src/components/ui/HIGButton.tsx` | 後方互換エイリアス |
| `src/components/dashboard/ui/DashboardButton.tsx` | 後方互換エイリアス |

### Dashboard領域 (`/dashboard/**`)

| ファイル | 用途 |
|---------|------|
| `src/components/dashboard/ui/DashboardCard.tsx` | カード実装パターン |
| `src/components/dashboard/ui/DashboardBadge.tsx` | バッジ実装パターン |
| `src/components/dashboard/ui/DashboardAlert.tsx` | アラート実装パターン |
| `src/components/dashboard/ui/DashboardInput.tsx` | 入力フォーム実装パターン |
| `src/components/dashboard/ui/index.tsx` | エクスポート一覧 |
| `src/config/data-sources.ts` | データソース設定 |

### Public領域 (`/`, `/pricing`, `/o/[slug]` 等)

| ファイル | 用途 |
|---------|------|
| `src/components/layout/AioSection.tsx` | セクション |

### DB/API

| ファイル | 用途 |
|---------|------|
| `src/types/supabase.ts` | Supabase自動生成型 |
| `src/types/database.types.ts` | DB型定義 |
| `src/types/legacy/database.ts` | レガシー型（互換用） |
| `src/config/data-sources.ts` | テーブル/ビュー/カラム設定 |
| `src/lib/db/public-view-contracts.ts` | **公開VIEW契約（カラム定義）** |
| `supabase/migrations/` | **DBマイグレーション（VIEW作成含む）** |
| `src/lib/supabase/api-auth.ts` | **API認証ヘルパー（必読）** |

---

## 3. 禁止事項チェックリスト

実装前に以下を自己確認すること：

### スタイル
- [ ] **色の直書き禁止**
  - NG: `text-red-600`, `bg-blue-500`, `hover:bg-gray-100`
  - OK: `text-[var(--aio-danger)]`, `bg-[var(--aio-primary)]`, `hover:bg-[var(--aio-muted)]`

### コンポーネント
- [ ] **統一Buttonを使用**
  - 全ページで `Button` from `@/components/ui/button` を使用
  - HIGButton/DashboardButtonは後方互換エイリアス（内部は統一Button）

- [ ] **既存コンポーネント確認**
  - 新規作成前に `src/components/dashboard/ui/` の既存コンポーネントを確認
  - `DashboardCard`, `DashboardBadge` 等が使えないか検討

### DB/型
- [ ] **型の確認**
  - `supabase.ts` の自動生成型とカラム名が一致しているか
  - ビューとテーブルでカラム名が異なる場合あり（例: `name` vs `title`）

- [ ] **セキュアビュー使用**
  - Dashboard GET操作は `v_dashboard_*_secure` ビュー経由
  - 書き込みは `writeTable` 設定のベーステーブルへ

### DB VIEW/マイグレーション（重要）
- [ ] **VIEW参照コードを書いたらマイグレーションも作成**
  - `public-view-contracts.ts` のカラム定義だけでは不十分
  - `supabase/migrations/` にVIEW作成SQLが必須

- [ ] **カラム追加時は両方更新**
  - TypeScript側（`public-view-contracts.ts`）
  - DB側（マイグレーションSQL）

- [ ] **VIEWが実際に存在するか確認**
  - Supabase SQL Editorで `SELECT * FROM v_xxx_public LIMIT 1` を実行
  - エラーが出たらVIEW未作成の可能性

### APIセキュリティ（重要）

- [ ] **`SUPABASE_SERVICE_ROLE_KEY` の直接使用は原則禁止**
  - 例外：バッチ処理、Admin専用API（理由とレビュー必須）
  - 通常のAPIでは RLS + authenticated クライアントを使用

- [ ] **orgId をクエリパラメータから受けるだけで権限検証しない禁止**
  - 必ずサーバー側で `organization_members` テーブルを照会して所属確認
  - 例: `supabase.from('organization_members').select().eq('user_id', user.id).eq('organization_id', orgId)`

- [ ] **認証必須APIは `createApiAuthClient` を使用**
  - `@/lib/supabase/api-auth` からインポート
  - 全レスポンスを `applyCookies()` でラップ
  - `ApiAuthException` を catch して `error.toResponse()` を返す

- [ ] **認証任意APIは `createApiAuthClientOptional` を使用**
  - 公開APIでもユーザー情報が欲しい場合に使用

- [ ] **内部APIは絶対URLで叩かない**
  - NG: `fetch('https://aiohub.jp/api/...')`
  - OK: `fetch('/api/...')` または `serverFetch()` を使用
  - 理由: CSPブロック、Cookie不一致の原因になる

---

## 4. 実装手順

```
1. 参照   → 該当ファイルをReadツールで読む
2. 確認   → 既存の類似実装パターンを探す
3. 質問   → 不明点は実装前にユーザーに確認
4. 実装   → 参照した内容に忠実に実装
5. 検証   → 以下のコマンドを実行して結果を報告
6. 報告   → 検証結果をユーザーに報告
```

**必須検証コマンド（省略禁止）：**

```bash
npm run typecheck        # 型エラー確認
npm run build            # ビルド成功確認
npm run check:api-auth   # API認証パターン違反検出（API変更時）
npm run check:origin-safety  # オリジン安全性チェック（fetch変更時）
```

**検証結果の報告フォーマット：**

```markdown
## 検証結果
- typecheck: ✅ 通過 / ❌ エラー（詳細）
- build: ✅ 通過 / ❌ エラー（詳細）
- check:api-auth: ✅ 0件 / ⚠️ N件（該当箇所）
```

---

## 5. Tailwind直書き → CSS変数 マッピング表

### テキスト色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `text-gray-900` | `text-[var(--color-text-primary)]` |
| `text-gray-700`, `text-gray-600` | `text-[var(--color-text-secondary)]` |
| `text-gray-500` | `text-[var(--color-text-tertiary)]` |
| `text-gray-400` (アイコン) | `text-[var(--color-icon-muted)]` |
| `text-red-600`, `text-red-800` | `text-[var(--aio-danger)]` |
| `text-green-600`, `text-green-800` | `text-[var(--aio-success)]` |
| `text-yellow-600`, `text-yellow-800` | `text-[var(--aio-warning)]` |
| `text-blue-600`, `text-blue-800` | `text-[var(--aio-info)]` |
| `text-orange-600`, `text-orange-800` | `text-[var(--aio-pending)]` |
| `text-purple-600` | `text-[var(--aio-purple)]` |
| `text-indigo-600` | `text-[var(--aio-indigo)]` |

### 背景色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `bg-gray-50`, `bg-gray-100` | `bg-[var(--aio-surface)]` |
| `bg-gray-200` (スケルトン等) | `bg-[var(--dashboard-card-border)]` |
| `bg-white` | `bg-[var(--dashboard-card-bg)]` |
| `bg-red-50`, `bg-red-100` | `bg-[var(--aio-danger-muted)]` |
| `bg-green-50`, `bg-green-100` | `bg-[var(--aio-success-muted)]` |
| `bg-yellow-50`, `bg-yellow-100` | `bg-[var(--aio-warning-muted)]` |
| `bg-blue-50`, `bg-blue-100` | `bg-[var(--aio-info-muted)]` |
| `bg-orange-50`, `bg-orange-100` | `bg-[var(--aio-pending-muted)]` |
| `bg-purple-50`, `bg-purple-100` | `bg-[var(--aio-purple-muted)]` |
| `bg-indigo-50`, `bg-indigo-100` | `bg-[var(--aio-indigo-muted)]` |

### ボーダー色

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `border-gray-200` | `border-[var(--dashboard-card-border)]` |
| `border-gray-300` | `border-[var(--input-border)]` |
| `border-red-200` | `border-[var(--status-error)]` |
| `border-green-200` | `border-[var(--status-success)]` |
| `border-yellow-200` | `border-[var(--status-warning)]` |
| `border-orange-200` | `border-[var(--aio-pending-border)]` |

### ホバー状態

| Tailwind直書き | CSS変数 |
|---------------|---------|
| `hover:bg-gray-50` | `hover:bg-[var(--aio-surface)]` |
| `hover:bg-gray-100` | `hover:bg-[var(--table-row-hover)]` |
| `hover:text-gray-700` | `hover:text-[var(--color-text-secondary)]` |

---

## 6. 使用可能なCSS変数（完全版）

### Core Brand
```css
--aio-primary          /* メインカラー（Apple Blue #007AFF） */
--aio-primary-hover    /* ホバー状態 */
--aio-surface          /* 背景面（Apple Gray #F5F5F7） */
--aio-muted            /* 軽いグレー */
```

### テキスト・アイコン
```css
--color-text-primary   /* 本文テキスト */
--color-text-secondary /* 補足テキスト */
--color-text-tertiary  /* 薄いテキスト */
--color-icon           /* 通常アイコン */
--color-icon-muted     /* 薄いアイコン */
```

### ステータス色（明るい - インジケーター用）
```css
--status-success       /* 成功（緑） */
--status-success-bg    /* 成功背景 */
--status-warning       /* 警告（黄） */
--status-warning-bg    /* 警告背景 */
--status-error         /* エラー（赤） */
--status-error-bg      /* エラー背景 */
--status-info          /* 情報（青） */
--status-info-bg       /* 情報背景 */
--status-pending       /* 保留（橙） */
--status-pending-bg    /* 保留背景 */
```

### セマンティック色（暗い - テキスト/バッジ用）
```css
--aio-success          /* 成功テキスト（緑） */
--aio-success-muted    /* 成功背景 */
--aio-warning          /* 警告テキスト（黄） */
--aio-warning-muted    /* 警告背景 */
--aio-danger           /* 危険テキスト（赤） */
--aio-danger-muted     /* 危険背景 */
--aio-info             /* 情報テキスト（青） */
--aio-info-muted       /* 情報背景 */
--aio-pending          /* 保留テキスト（橙） */
--aio-pending-muted    /* 保留背景 */
--aio-purple           /* AI/トレンド（紫） */
--aio-purple-muted     /* 紫背景 */
--aio-indigo           /* チャット/選択（藍） */
--aio-indigo-muted     /* 藍背景 */
```

### ボタン（iCloud Dense）
```css
--btn-primary-bg       /* プライマリボタン背景 */
--btn-primary-hover    /* プライマリボタンホバー */
--btn-secondary-bg     /* セカンダリボタン背景 */
--btn-secondary-border /* セカンダリボタンボーダー */
--btn-danger-bg        /* 危険ボタン背景 */
--btn-danger-hover     /* 危険ボタンホバー */
--btn-shadow           /* ボタンシャドウ */
--btn-shadow-hover     /* ボタンホバーシャドウ */
--btn-height-sm        /* 32px */
--btn-height-md        /* 36px */
--btn-height-lg        /* 40px */
--btn-height-xl        /* 44px */
```

### Dashboard
```css
--dashboard-bg         /* ダッシュボード背景（Apple Gray） */
--dashboard-card-bg    /* カード背景 */
--dashboard-card-border/* カードボーダー（繊細） */
--dashboard-card-shadow/* カードシャドウ（iCloud品質） */
```

### インプット
```css
--input-border         /* 入力ボーダー */
--input-border-hover   /* 入力ホバー */
--input-bg             /* 入力背景 */
```

### スペーシング（iCloud Dense - コンパクト8ptグリッド）
```css
--space-xs             /* 4px */
--space-sm             /* 8px */
--space-md             /* 12px（密度向上） */
--space-lg             /* 16px（密度向上） */
--space-xl             /* 24px（密度向上） */
--space-2xl            /* 32px（密度向上） */
```

---

## 7. 統一Buttonの使用方法

### 基本使用

```tsx
import { Button } from '@/components/ui/button';

// variant: primary | secondary | tertiary | danger | ghost | outline | link
// size: sm | md | lg | xl | icon
<Button variant="primary" size="md">保存</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="danger">削除</Button>
```

### 追加機能

```tsx
// ローディング状態
<Button variant="primary" loading={isSubmitting}>送信中...</Button>

// アイコン付き
<Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>新規作成</Button>
<Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>次へ</Button>

// アイコンのみ
import { IconButton } from '@/components/ui/button';
<IconButton icon={<Edit className="w-4 h-4" />} aria-label="編集" />

// ボタングループ
import { ButtonGroup } from '@/components/ui/button';
<ButtonGroup>
  <Button variant="secondary">戻る</Button>
  <Button variant="primary">次へ</Button>
</ButtonGroup>

// リンクボタン
import { LinkButton } from '@/components/ui/button';
<LinkButton href="/dashboard" variant="tertiary">ダッシュボードへ</LinkButton>
```

---

## 8. 実装完了時の報告フォーマット

```markdown
## 実装報告
- 参照したファイル: [ファイル名一覧]
- 使用したCSS変数: [変数名一覧]
- 使用した既存コンポーネント: [コンポーネント名]
- 直書き確認: なし / あり（理由: ）

## 検証結果
- typecheck: ✅ / ❌
- build: ✅ / ❌
- check:api-auth: ✅ / ⚠️ N件
```

---

## 9. よくある間違いと正解

### ボタン実装

```tsx
// NG: Tailwind直書き
<button className="text-red-600 hover:bg-red-50">削除</button>

// NG: 独自ボタン作成
<MyCustomButton>削除</MyCustomButton>

// OK: 統一Button使用
import { Button } from '@/components/ui/button';
<Button variant="danger">削除</Button>

// OK: 後方互換エイリアス（既存コードはそのまま動作）
import { DashboardButton } from '@/components/dashboard/ui/DashboardButton';
<DashboardButton variant="danger">削除</DashboardButton>
```

### カード実装

```tsx
// NG: 独自スタイル
<div className="bg-white border border-gray-200 rounded-lg shadow">

// OK: CSS変数 + 既存コンポーネント
import { DashboardCard } from '@/components/dashboard/ui';
<DashboardCard title="タイトル">コンテンツ</DashboardCard>

// または
<div className="bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-lg shadow-[var(--dashboard-card-shadow)]">
```

### API認証実装

```tsx
// NG: createClient (server.ts) を直接使用
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// NG: orgIdをクエリから受けて検証しない
const orgId = searchParams.get('orgId');
const { data } = await supabase.from('posts').select().eq('organization_id', orgId);

// OK: createApiAuthClient を使用
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // orgIdの検証
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!membership) {
      return applyCookies(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    // ... 処理 ...

    return applyCookies(NextResponse.json({ data }));
  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    throw error;
  }
}
```

---

## 10. Dashboard認証アーキテクチャ

### 認証の責務分担

| レイヤー | ファイル | 責務 |
|---------|----------|------|
| Middleware | `src/middleware.ts` | **主認証ゲート** - 未認証ユーザーをログインへリダイレクト |
| Layout | `src/app/dashboard/layout.tsx` | **UIシェル提供のみ** - 認証チェックは行わない |
| Page Shell | `DashboardPageShell` | **ページレベル認証** - 組織・権限チェック |

### 10-1. API認証はmiddlewareに依存しない（必須ルール）

> **背景**: 2026-01-22に発生した障害の教訓。「middlewareがCookie同期するからAPIは何もしなくていい」という誤解が原因で、セッション切れ時にAPIが401を返す事故が発生。

**明文化されたルール：**

| 対象 | 責務 | ファイル |
|------|------|----------|
| ページ遷移の認証リダイレクト | **middleware** が担う | `src/middleware.ts` |
| API Routesの認証・Cookie同期 | **API自身** が担う | `src/lib/supabase/api-auth.ts` |

**禁止事項（過去に事故を起こした）：**
- ❌ 「middlewareが処理済みだからAPIはrefresh不要」と考えること
- ❌ APIで `createClient`（server.ts）を直接使うこと
- ❌ APIで認証チェック後に `applyCookies` を省略すること

**必須事項：**
- ✅ 認証必須APIは `createApiAuthClient(request)` を使用
- ✅ すべてのレスポンスを `applyCookies()` でラップ
- ✅ 例外は `ApiAuthException` で catch して `error.toResponse()` を返す

```tsx
// 正しいAPI認証パターン
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);
    // ... 処理 ...
    return applyCookies(NextResponse.json({ data }));
  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    throw error;
  }
}
```

**理由**: MiddlewareはAPIパス（`/api/*`）を `NextResponse.next()` でスキップする設計。APIはmiddlewareの認証処理に依存してはならない。

### 重要な注意点

```tsx
// NG: Layoutで認証リダイレクト（クライアントナビゲーション時に問題発生）
export default async function DashboardLayout({ children }) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login'); // ← これがNavigation時にリダイレクトループを引き起こす
  }
  return <Layout>{children}</Layout>;
}

// OK: Middlewareに認証を任せ、Layoutは表示のみ
export default async function DashboardLayout({ children }) {
  // 認証チェックはMiddlewareが担当
  // Layoutは表示用データのみ取得（失敗してもエラーにしない）
  let accountStatus = 'active';
  try {
    const user = await getUser();
    if (user) {
      accountStatus = await getAccountStatus(user.id);
    }
  } catch {
    // Silent fail - Middleware handles auth
  }
  return <Layout accountStatus={accountStatus}>{children}</Layout>;
}
```

### Dashboardページの'use client'ルール

```tsx
// NG: サーバーコンポーネントからクライアントコンポーネントに関数を渡す
// page.tsx (サーバーコンポーネント)
export default function DashboardPage() {
  return (
    <DashboardPageShell
      onError={(ctx) => <ErrorUI user={ctx.user} />} // ← 関数は渡せない
    >
      <Content />
    </DashboardPageShell>
  );
}

// OK: 'use client'を追加して関数を渡せるようにする
'use client';
export default function DashboardPage() {
  return (
    <DashboardPageShell
      onError={(ctx) => <ErrorUI user={ctx.user} />} // ← OK
    >
      <Content />
    </DashboardPageShell>
  );
}
```

### DashboardPageShellでのリダイレクト禁止

```tsx
// NG: クライアントコンポーネント内で認証失敗時にリダイレクト
// → クライアントナビゲーション時のCookie同期遅延でリダイレクトループが発生
if (!currentUser) {
  router.push('/auth/login'); // ← NG: リダイレクトループの原因
  return;
}

// OK: エラー表示にしてユーザーに再読み込みを促す
// → Middlewareが認証を担当。Shell内ではリダイレクトしない
if (!currentUser) {
  setError('認証情報の取得に失敗しました。ページを再読み込みしてください。');
  return;
}
```

**重要**: `DashboardPageShell` 内で `router.push('/auth/login')` を**絶対に使わない**。Middlewareが認証リダイレクトの唯一の責任者。

---

## 11. データベースVIEW・マイグレーション管理（重要教訓）

> **背景**: 2026-01-20に発生した本番障害の教訓。APIコードがVIEWを参照していたが、VIEW自体がDBに存在せず「column does not exist」エラーが発生。認証エラーに見えたが、根本原因はDB側のVIEW未作成だった。

### 公開VIEW契約の仕組み

```
src/lib/db/public-view-contracts.ts  ←  カラム定義（TypeScript）
        ↓
        ↓  参照
        ↓
src/app/api/public/*/route.ts        ←  APIがVIEWをクエリ
        ↓
        ↓  クエリ
        ↓
Supabase: v_organizations_public     ←  実際のVIEW（DBに存在必須）
```

### 禁止事項

- [ ] **TypeScriptの契約ファイルだけ作成してVIEWを作らない**
  - `public-view-contracts.ts` はカラム定義のみ
  - **実際のVIEWは `supabase/migrations/` で作成が必須**

- [ ] **VIEWのカラムを変更してマイグレーションを作らない**
  - コード側でカラムを追加 → DBのVIEWにもカラム追加が必要
  - 片方だけ変更すると「column does not exist」エラー

- [ ] **認証エラーだと思い込んで調査を進める**
  - 「NO_SESSION」「Database Error」は**DB側の問題の可能性**がある
  - まずVIEWの存在とカラム一致を確認

### VIEW変更時の必須手順

```
1. src/lib/db/public-view-contracts.ts のカラム定義を更新
2. supabase/migrations/ にマイグレーションSQLを作成
   - カラム追加: ALTER TABLE ... ADD COLUMN IF NOT EXISTS
   - VIEW再作成: DROP VIEW IF EXISTS + CREATE VIEW
3. Supabase SQL Editorでマイグレーション実行
4. NOTIFY pgrst, 'reload schema' を実行
5. 本番で動作確認
```

### VIEW関連ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/lib/db/public-view-contracts.ts` | カラム定義・SELECT文生成 |
| `supabase/migrations/20260120_create_public_views.sql` | VIEW作成・カラム追加 |

### VIEWが存在するか確認するSQL

```sql
-- VIEWの存在確認
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'v_%_public';

-- VIEWのカラム確認
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'v_organizations_public';
```

### トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `column X does not exist` | VIEWにカラムがない | マイグレーションでVIEW再作成 |
| `relation v_xxx_public does not exist` | VIEWが未作成 | マイグレーションでVIEW作成 |
| `permission denied for view` | 権限未付与 | `GRANT SELECT ON ... TO anon/authenticated` |
| VIEW変更後も古いスキーマ | キャッシュ | `NOTIFY pgrst, 'reload schema'` |

---

## 12. エラー診断の優先順位

認証・データベースエラーが発生した場合の調査順序：

```
1. CSP / connect-src 問題か？（最初に確認）
   └─ Console に "blocked connect-src" が出ていないか
   └─ Network タブに リクエストが出ているか（出ていなければCSPブロック）
   └─ API呼び出し先が 同一オリジン か確認（絶対URL禁止）

2. DB/VIEW問題か？
   └─ VIEWが存在するか確認
   └─ VIEWのカラムが契約と一致するか確認
   └─ RLSポリシーが正しいか確認

3. 認証問題か？
   └─ Cookieが存在するか確認（DevTools → Application → Cookies）
   └─ auth-token と refresh-token の両方があるか
   └─ トークンが有効か（Supabase Dashboard → Authentication → Users）

4. コード問題か？
   └─ デプロイされたコードが最新か（sha確認）
   └─ APIルートのクエリが契約に準拠しているか
```

### CSP / connect-src のトラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| Console に "blocked connect-src" | CSPでAPIリクエストがブロック | `src/middleware.ts` の `connect-src` に必要なオリジンを追加 |
| Network に リクエストが出ない | 同上、または絶対URL使用 | 絶対URL → 相対パス（`/api/...`）に変更 |
| Vercel preview で認証失敗 | API呼び出し先が本番固定 | `serverFetch()` を使用（現在のオリジンを自動検出） |

**重要**:
- 「認証エラー」に見えても、**まずCSP/オリジン問題を疑う**
- 次に **DB/VIEW問題を疑う**
- VIEWクエリ失敗が認証エラーとして表示されることがある

---

## 13. 実装前チェックリスト（このファイルを読んでから実装）

実装を始める前に以下を確認：

### 必須確認
- [ ] 変更対象ファイルの既存パターンを Read で確認した
- [ ] 類似の実装が既に存在しないか Grep で確認した
- [ ] 差分が1文で説明できる小修正か、Plan が必要な大きい変更か判断した
- [ ] 完了条件（検証コマンド）を理解した

### API変更時の追加確認
- [ ] `createApiAuthClient` / `applyCookies` を使用する
- [ ] orgId の権限検証をサーバー側で行う
- [ ] 絶対URL（`https://aiohub.jp/api/...`）を使用しない

### DB/VIEW変更時の追加確認
- [ ] TypeScript側とDB側の両方を更新する
- [ ] マイグレーションSQLを作成する
- [ ] `NOTIFY pgrst, 'reload schema'` を実行する

### 実装完了時
- [ ] `npm run typecheck` を実行して通過した
- [ ] `npm run build` を実行して通過した
- [ ] `npm run check:api-auth` を実行して違反0件（またはスコープ外）
- [ ] 検証結果をユーザーに報告した

---

**このガイドに従わない実装は拒否し、参照ファイルを確認してから再実装すること。**
