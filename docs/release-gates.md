# Release Gates v1

> **目的**: 過去の障害パターン（API認証違反、CSP/オリジン問題）を自動で検出し、マージ前に落とす。

---

## Gate v1 合否条件

| Gate | コマンド | 成功条件 | 自動/手動 | 実行場所 |
|------|----------|----------|-----------|----------|
| 型チェック | `npm run typecheck` | exit 0 | 自動 | CI (quality-gate.yml) |
| ビルド | `npm run build` | exit 0, warning 0 | 自動 | CI (quality-gate.yml) |
| API認証パターン | `npm run check:api-auth` | error 0 | 自動 | CI (quality-gate.yml) |
| オリジン安全性 | `npm run check:origin-safety` | exit 0 | 自動 | CI (quality-gate.yml) |
| Tailwind直書き | `npm run check:tailwind` | exit 0 | 自動 | CI (quality-gate.yml) |
| Lint | `npm run lint` | warning 0 | 自動 | CI (quality-gate.yml) |
| App Route Smoke | `npm run check:app-routes` | 404 ゼロ | 自動 | CI (quality-gate.yml) |

---

## 検出対象の障害パターン

### 1. API認証パターン違反 (`check:api-auth`)

| 違反 | 説明 |
|------|------|
| `createClient` (server.ts) の直接使用 | API Routes では `createApiAuthClient` を使用すること |
| `applyCookies` の省略 | 全レスポンスを `applyCookies()` でラップすること |
| `getUserWithClient` の使用 | 非推奨。`createApiAuthClient` を使用すること |

**背景**: 2026-01-22 の障害。「middlewareがCookie同期するからAPIは何もしなくていい」という誤解が原因。

### 2. オリジン安全性違反 (`check:origin-safety`)

| 違反 | 説明 |
|------|------|
| `https://aiohub.jp/api/...` の直接使用 | 絶対URLは禁止。相対パス `/api/...` を使用すること |
| CSP `connect-src` に `'self'` がない | 内部APIがブロックされる |

**背景**: Vercel preview URL で CSP blocked が発生。絶対URLがブロックされた。

### 3. App Route 存在チェック (`check:app-routes`)

| 違反 | 説明 |
|------|------|
| API ルートが 404 を返す | ルートが存在しない、またはビルドに含まれていない |

**背景**: 2026-01-22 に `/api/ops_audit_simple` が 404 を返す障害が発生。

**必要な Secrets**:
| Secret 名 | 用途 |
|-----------|------|
| `SMOKE_TEST_URL` | テスト対象の URL（例: `https://aiohub.jp`） |

> **注意**: `SMOKE_TEST_URL` が未設定の場合、このチェックはスキップされる（fail しない）。

---

## CI 実行フロー

```
PR作成/更新
    ↓
quality-gate.yml 実行
    ↓
┌─────────────────────────────────┐
│ 1. npm ci                       │
│ 2. npm run check:tailwind       │
│ 3. npm run typecheck            │
│ 4. npm run lint                 │
│ 5. npm run check:api-auth       │  ← 新規追加
│ 6. npm run check:origin-safety  │  ← 新規追加
│ 7. npm run build                │
└─────────────────────────────────┘
    ↓
全て pass → マージ可能
1つでも fail → マージ不可
```

---

## Vercel Deploy との関係

| 項目 | 状態 |
|------|------|
| GitHub Actions (quality-gate.yml) | PR マージをブロック |
| Vercel Preview Deploy | **ブロックしない**（PRが作成されると自動デプロイ） |
| Vercel Production Deploy | main マージ後に自動デプロイ |

**注意**: CI が失敗しても Vercel preview はデプロイされる。本番へのマージは CI がブロックする。

---

## Gate v2: Required Status Checks 有効化手順

> **目的**: CI が失敗したら PR をマージできなくする（手動マージ防止）

### 設定場所

1. GitHub リポジトリ → **Settings** → **Branches**
2. **Branch protection rules** → **Add rule** または **Edit**（main ブランチ）
3. **Branch name pattern**: `main`

### 設定項目

| 設定 | 値 | 説明 |
|------|-----|------|
| Require a pull request before merging | ✅ ON | PR 必須 |
| Require status checks to pass before merging | ✅ ON | CI 必須 |
| Status checks that are required | `🚦 Quality Gate` | workflow の job 名を選択 |
| Require branches to be up to date before merging | 任意 | main との同期を強制 |

### 必須チェック名

```
🚦 Quality Gate
```

> **注意**: workflow の `name:` ではなく、`jobs:` 配下の job 名（`quality-gate`）が表示される場合もある。Actions の実行結果で確認すること。

### 有効化後の運用

| シナリオ | 対応 |
|----------|------|
| 通常の PR | CI pass 後にマージ可能 |
| Hotfix（緊急） | Admin でルールを一時無効化、または別ブランチで対応 |
| CI が壊れた場合 | Admin で強制マージ可能（要記録） |

### Gate v2 有効化チェックリスト

- [ ] Branch protection rule を main に設定
- [ ] `🚦 Quality Gate` を Required に追加
- [ ] テスト PR で CI 失敗時にマージボタンがグレーアウトすることを確認

---

## ローカルでの事前確認

```bash
# Gate v1 の全チェックをローカルで実行
npm run typecheck && \
npm run build && \
npm run check:api-auth && \
npm run check:origin-safety
```

---

## 関連ドキュメント

- [AI実装ガード](ai-implementation-guard.md) - 実装時の禁止事項
- [ARCHITECTURE_INDEX.md](../ARCHITECTURE_INDEX.md) - アーキテクチャ整合性

---

## Gate v1 検証履歴

- 2026-01-22: Gate v1 有効化（commit 16c6d38d）
- 2026-01-22: 実動確認PR作成（このPRで検証）
