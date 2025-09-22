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

## 参考資料

- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Playwright Testing Types](https://playwright.dev/docs/test-typescript)
- [Next.js TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript)