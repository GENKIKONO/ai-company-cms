# Middleware アーキテクチャ

> 最終更新: 2025-01

## 概要

Next.js のミドルウェアを使用した認証・セキュリティの実装方針をまとめたドキュメント。

---

## 現在のアーキテクチャ

### 唯一の正規 Middleware

```
src/middleware.ts
```

**責務:**
- 未認証ユーザーの `/auth/login` へのリダイレクト
- 認証済みユーザーが認証ページにアクセスした場合の `/dashboard` へのリダイレクト
- Supabase セッションの Cookie 同期

**保護対象パス:**
- `src/lib/routes.ts` の `PROTECTED_ROUTE_PREFIXES` で一元管理
- ハードコード禁止

---

## 無効化されたファイル

### middleware.ts.disabled (ルートディレクトリ)

**無効化日:** 2025-01

**無効化理由:**
Next.js は `src/` ディレクトリを使用するプロジェクトでは、ルートの `middleware.ts` を無視し、`src/middleware.ts` を優先する。このファイルは本番環境で一度も実行されていなかった。

**含まれる機能（将来の統合検討用）:**

| 機能 | 説明 | 優先度 |
|------|------|--------|
| WAF | SQL Injection, XSS, Path Traversal 検出 | 高 |
| Enhanced Rate Limiting | DB連携のレート制限 | 中 |
| CSRF Protection | クロスサイトリクエストフォージェリ対策 | 中 |
| HTTP Basic Authentication | 管理ページの追加保護 | 低（Vercel側で対応可能） |
| Security Headers | CSP, HSTS, Permissions Policy | 高 |
| AI Crawler/Bot Access Control | AI クローラーのアクセス制御 | 中 |
| IP Blocking | 悪意あるIPの自動ブロック | 中 |

---

## TODO: セキュリティ機能の統合

### 高優先度

1. **Security Headers**
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options, X-Content-Type-Options 等
   - 現状: Vercel/next.config.js で部分的に設定済み
   - 検討: src/middleware.ts に統合するか、next.config.js の headers で設定するか

2. **WAF 機能**
   - SQL Injection パターン検出
   - XSS パターン検出
   - Path Traversal 検出
   - 検討: Edge Middleware として分離するか、API Route 側で対応するか

### 中優先度

3. **Rate Limiting**
   - 現状: DB連携の実装あり（middleware.ts.disabled 内）
   - 検討: Vercel Edge Functions または Upstash での対応

4. **Bot/Crawler Access Control**
   - AI クローラー（GPTBot, Claude 等）の識別
   - 現状: `src/lib/utils/ai-crawler.ts` に識別ロジックあり

### 低優先度

5. **HTTP Basic Authentication**
   - 検討: Vercel の Access Protection で対応可能

---

## ルート定義の Single Source of Truth

```
src/lib/routes.ts
```

**ROUTES オブジェクト:**
- 全てのルートパスを定数化
- UI コンポーネント、API、Middleware で共通使用

**PROTECTED_ROUTE_PREFIXES:**
- 認証が必要なルートプレフィックスの配列
- `src/middleware.ts` で参照

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-01 | ルート middleware.ts を無効化、src/middleware.ts を唯一の正規ファイルに |
| 2025-01 | PROTECTED_ROUTE_PREFIXES を routes.ts に追加、ハードコード除去 |
