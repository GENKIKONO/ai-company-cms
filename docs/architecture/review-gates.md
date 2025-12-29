# レビューゲート（Review Gates）ガイド

> **正本:** このドキュメントはPRレビューの運用ルールを定義します。
> **用途:** レビュアー/PR作成者の判断基準として参照してください。

---

## 1. この文書の目的

### 「CIは通ったが設計が壊れた」を防ぐ

CIガードレール（`npm run check:architecture`）は多くの違反を自動検出しますが、
**すべての設計判断を機械的にチェックすることはできません**。

このドキュメントは、以下を明確にします：

- **どこが変わると誰がレビューすべきか**（CODEOWNERS）
- **PRテンプレートで何を宣言すべきか**
- **CIがPASSでも人間の判断が必要なケース**

---

## 2. CODEOWNERS の趣旨

### ファイル: `.github/CODEOWNERS`

特定のファイル/ディレクトリに変更があると、自動的に該当オーナーにレビューが要求されます。

| パス | オーナー | 理由 |
|------|----------|------|
| `scripts/check-architecture.sh` | @ARCH_OWNER | ガードレール変更は設計影響大 |
| `docs/architecture/boundaries.md` | @ARCH_OWNER | 境界定義の変更 |
| `src/lib/core/**` | @CORE_OWNER | Core実装は全体に波及 |
| `src/lib/featureGate.ts` | @ARCH_OWNER | 機能判定ロジックの正本 |
| `docs/auth/**` | @SECURITY_OWNER | 認証ルールの変更 |
| `.github/**` | @REPO_OWNER | CI/リポジトリ設定 |

### オーナー未確定の場合

現在、オーナー名はプレースホルダ（`@ARCH_OWNER` 等）です。
実際のGitHubユーザー名/チーム名に置き換えてください。

---

## 3. PRテンプレートの必須項目

### ファイル: `.github/pull_request_template.md`

すべてのPRで以下を確認・宣言する必要があります：

### 3.1 変更の種類

- UIのみ / API/Route / Core / Auth / Feature/Plan/Quota / Docs / CI/Guardrail

### 3.2 Boundaries適合チェック（必須）

| チェック項目 | 参照先 |
|-------------|--------|
| boundaries.md を読み該当境界を確認 | [boundaries.md](./boundaries.md) |
| UIで実行可否を止めていない | boundaries.md §4 |
| Auth直叩きが増えていない | Check X |
| feature_flags直読み等が増えていない | Check 10-12 |
| org-features新規参照なし | Check 8 |

### 3.3 影響範囲

- 対象Shell（Info / Dashboard / Account / Admin）
- 破壊的変更の有無

### 3.4 品質チェック

- `npm run typecheck`
- `npm run check:architecture`
- 主要導線の動作確認（該当時）

---

## 4. 例外を増やすときの手順

> **重要:** Phase 18 で Check 14（例外増加禁止）が導入されました。
> 例外を増やすと CI が FAIL し、BASELINE更新が必須となります。

### Auth直叩き例外の追加

1. まず Core wrapper で対応できないか検討
2. どうしても必要な場合：
   - `docs/auth/auth-direct-calls-allowlist.md` を更新
   - **reason/remove_when/review_by を必須記載**
   - Check 14 が FAIL → `scripts/check-architecture.sh` の `AUTH_ALLOWLIST_BASELINE` を更新
   - PRレビューで承認を得る

### プラン名分岐の例外追加

1. まず `featureGate` で対応できないか検討
2. どうしても必要な場合：
   - `docs/architecture/exceptions-allowlist.md` を更新（単一ソース）
   - **reason/remove_when/review_by を必須記載**
   - Check 14 が FAIL → `scripts/check-architecture.sh` の `PLAN_BRANCH_ALLOWLIST_BASELINE` を更新
   - PRレビューで承認を得る

### 共通ルール

- 例外は **削減の方向** で管理
- 例外追加時は **3ドキュメント同時更新** が必要：
  1. 該当する allowlist/whitelist
  2. `docs/architecture/boundaries.md`（必要に応じて）
  3. このドキュメント（必要に応じて）

### review_by のフォーマット

例外エントリの `review_by` は以下のフォーマットで記載してください：

```
review_by: "YYYY-MM-DD"
```

| 項目 | 説明 |
|------|------|
| 形式 | `YYYY-MM-DD`（ISO 8601 日付形式） |
| 例 | `"2025-06-30"`, `"2025-12-31"` |
| CI検出 | Check 14 で期限切れをWARN表示 |

**注意:**
- フォーマット不正の場合もWARN表示されます
- 期限切れはFAILではなくWARNのみ（即座に止めない）
- 期限が過ぎたら、例外を延長するか撤去するかをレビューしてください

---

## 5. CIがPASSでも設計レビューが必要なケース

以下のケースは、CIが通っても **人間による設計判断** が必要です：

### 5.1 新しいShellパターンの導入

- 既存4領域（Info/Dashboard/Account/Admin）以外のパターン
- 既存Shellの責務変更

### 5.2 新しい正本（Single Source of Truth）の追加

- 新しい設定ファイルや定義ファイルの追加
- 既存正本の責務変更

### 5.3 認証フローの変更

- ログイン/ログアウトのフロー変更
- セッション管理の変更
- 新しい認証方式の追加

### 5.4 課金/プラン関連の変更

- 新しいプランの追加
- 既存プランの機能変更
- 課金フローの変更

### 5.5 例外・ホワイトリストの追加

- どんな例外でも、追加時は設計レビュー必須
- 「なぜ正規パターンで対応できないか」の説明が必要

### 5.6 ガードレール自体の変更

- `scripts/check-architecture.sh` への変更
- LIMITの変更（増減どちらも）
- 新しいCheckの追加

---

## 6. レビュー判断フローチャート

```
PRが作成された
    ↓
CODEOWNERSに該当する変更がある？
    ├─ Yes → 該当オーナーのレビュー必須
    └─ No  → 通常レビュー
    ↓
Boundaries適合チェックが全て ✓ ？
    ├─ No  → 違反箇所を修正してから再レビュー
    └─ Yes → 次へ
    ↓
npm run check:architecture PASS？
    ├─ No  → 違反を修正
    └─ Yes → 次へ
    ↓
§5 のケースに該当する？
    ├─ Yes → 設計レビュー必須（オーナー判断）
    └─ No  → マージ可能
```

---

## 関連ドキュメント

- [設計境界（Boundaries）ガイド](./boundaries.md)
- [Auth Wrapper 使用ガイド](../auth/auth-wrapper-usage.md)
- [Auth直叩き許容リスト](../auth/auth-direct-calls-allowlist.md)
- [コアアーキテクチャ要件定義](../core-architecture.md)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-28 | Phase 17 で新規作成 |
| 2024-12-29 | Phase 19 で手動testページ撤去方針を追加 |
