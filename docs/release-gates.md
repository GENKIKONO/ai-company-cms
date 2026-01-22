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
