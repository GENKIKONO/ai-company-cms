# Testing Operations Guide

## Overview

このプロジェクトでは、本番コードとテストコードで異なるTypeScript設定を使用して型チェックを実行します。

## TypeScript設定ファイル

### 本番用設定: `tsconfig.build.json`
- 本番環境でビルドされるファイルのみを対象とした型チェック
- テストファイル（`*.test.ts`, `*.spec.ts`）を除外
- Next.js アプリケーションの型チェックに使用

### テスト用設定: `tsconfig.test.json`
- テストファイルのみを対象とした型チェック
- Playwright の型定義を含む
- テストコードの型安全性を確保

## NPM スクリプト

### 本番用型チェック
```bash
npm run typecheck
```
- `tsconfig.build.json` を使用
- 本番コードのみを型チェック
- CI/CDパイプラインで必須

### テスト用型チェック  
```bash
npm run typecheck:test
```
- `tsconfig.test.json` を使用
- テストファイルのみを型チェック
- テスト実行前に推奨

### 全体型チェック
```bash
npm run typecheck && npm run typecheck:test
```
- 本番コードとテストコードの両方を型チェック
- 開発時の完全な型安全性確認

## 運用ルール

### 開発時
1. **本番コード変更時**: `npm run typecheck` を実行
2. **テストコード変更時**: `npm run typecheck:test` を実行
3. **大きな変更時**: 両方のコマンドを実行

### CI/CD パイプライン
1. **ビルド前**: `npm run typecheck` を必須実行
2. **テスト前**: `npm run typecheck:test` を推奨実行
3. **デプロイ前**: 両方の型チェックが通ることを確認

### ファイル分類

#### 本番コード（tsconfig.build.json対象）
- `src/**/*.ts`
- `src/**/*.tsx`
- Next.js アプリケーションファイル

#### テストコード（tsconfig.test.json対象）
- `**/*.test.ts`
- `**/*.test.tsx`
- `**/*.spec.ts`
- `**/*.spec.tsx`
- `tests/**/*`
- `**/__tests__/**/*`

## トラブルシューティング

### 型エラーが本番コードで発生した場合
```bash
npm run typecheck
```
実行後、表示されたエラーを修正してください。

### 型エラーがテストコードで発生した場合
```bash
npm run typecheck:test
```
実行後、Playwright の型定義を確認し、テストコードを修正してください。

### 型定義の競合が発生した場合
1. `tsconfig.build.json` と `tsconfig.test.json` の `include`/`exclude` 設定を確認
2. ファイルが適切なカテゴリに分類されているかチェック
3. 必要に応じて設定ファイルを調整

## Auth Smoke Test

### 概要

認証エンドポイントの smoke テストは、本番環境での Cookie 契約（auth-token / refresh-token の発行）を検証します。

### 実行方法

```bash
# ローカル実行（認証テストはスキップ）
npm run smoke:auth

# 認証テスト込みで実行（Secrets 設定必須）
SMOKE_EMAIL=xxx SMOKE_PASSWORD=xxx npm run smoke:auth
```

### Secrets の設定

**重要**: ユーザーに認証情報を直接聞くことは禁止。以下の方法で設定してください。

#### GitHub Secrets（CI 用）

1. リポジトリの Settings → Secrets and variables → Actions
2. 以下を追加:
   - `SMOKE_EMAIL`: テスト用アカウントのメールアドレス
   - `SMOKE_PASSWORD`: テスト用アカウントのパスワード

#### Vercel Environment Variables（本番確認用）

1. Vercel ダッシュボード → Settings → Environment Variables
2. 以下を追加（Production のみ推奨）:
   - `SMOKE_EMAIL`
   - `SMOKE_PASSWORD`

#### テスト用アカウントの作成

Supabase Auth にテスト専用アカウントを作成してください：
- メール確認済みのアカウントを使用
- 本番組織へのアクセス権限は不要（ログイン検証のみ）

### CI での動作

- CI 環境（`CI=true`）では認証テストが必須
- `SMOKE_EMAIL` / `SMOKE_PASSWORD` が未設定の場合は FAIL
- GitHub Actions workflow: `.github/workflows/smoke-auth.yml`

### 診断ヘッダー

ログイン成功時、以下のヘッダーが返されます：

| ヘッダー | 説明 |
|---------|------|
| `x-auth-set-cookie-names` | Supabase SSR が setAll で設定した Cookie 名 |
| `x-auth-has-auth-token` | auth-token Cookie が存在するか |
| `x-auth-has-refresh-token` | refresh-token Cookie が存在するか |
| `x-auth-fallback-used` | フォールバック（手動 Cookie 設定）が使用されたか |

`x-auth-fallback-used: true` は Supabase SSR が auth-token を設定しなかったことを示します。

## 参考資料

- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Playwright Testing Types](https://playwright.dev/docs/test-typescript)
- [Next.js TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript)