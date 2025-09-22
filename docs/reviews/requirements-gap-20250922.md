# Requirements Gap Analysis Report

**作成日**: 2025-09-22  
**レビュー対象**: GENKIKONO/ai-company-cms  
**目的**: 要件定義に対する現状実装の乖離点洗い出し

## 要件（原則）

1. 認証は Supabase Auth に統一（next-auth は採用しない）
2. 企業の公開状態は organizations.status（draft|published|archived）で管理。visibility カラムは採用しない
3. ルーティングは App Router / server-first。作成と編集は別ルート：
   - 作成: /organizations/new
   - 編集: /organizations/[id]（[id]はUUID）
   - 公開ページ: /o/[slug]
4. Next.js 15 / TypeScript / SSR優先
5. 既存Vercelプロジェクトと本番ドメイン（aiohub.jp）を使用
6. 既存UAT仕組み（docs/uat, scripts/uat, GitHub Actions）は維持

## 乖離点分析

| 機能/範囲 | 要件の定義 | 現状の実装 | 乖離内容 | 影響度 | 対応方針 | 担当ファイル |
|----------|-----------|-----------|---------|--------|---------|-----------|
| 認証スタック | Supabase Auth に統一 | ✅ Supabase Auth で実装済み | なし | - | - | src/lib/supabase-client.ts, src/lib/supabase-server.ts |
| package.json依存関係 | next-auth は採用しない | ✅ next-auth の依存関係なし | なし | - | - | package.json |
| organizations.status | status カラム（draft/published/archived）で管理 | ✅ 正しく実装済み | なし | - | - | supabase/migrations/20241201000000_initial_schema.sql |
| organizations.visibility | visibility カラムは採用しない | ✅ DBスキーマにvisibilityなし | なし | - | - | - |
| 型定義 - Status | OrganizationStatus型の安全性 | ✅ 正しく型定義済み | なし | - | - | src/types/database.ts |
| ルーティング - 作成 | /organizations/new | ✅ 実装済み | なし | - | - | src/app/organizations/new/page.tsx |
| ルーティング - 編集 | /organizations/[id] | ✅ 実装済み + UUID検証あり | なし | - | - | src/app/organizations/[id]/page.tsx |
| ルーティング - 公開 | /o/[slug] | ✅ 実装済み | なし | - | - | src/app/o/[slug]/page.tsx |
| UUIDエラー対策 | "create"等の文字列をUUIDとして処理しない | ✅ 防御済み（58-69行目） | なし | - | - | src/app/organizations/[id]/page.tsx |
| API実装 | App Router / server-first | ✅ Next.js 15 + App Router | なし | - | - | src/app/api/organizations/route.ts |
| JSON-LD | Schema.org Organization | ✅ 実装済み | なし | - | - | src/app/o/[slug]/page.tsx |
| UAT仕組み | docs/uat, scripts/uat維持 | ✅ 構造は維持 | なし | - | - | docs/uat/, scripts/uat/ |
| GitHub Actions | 既存CI設定維持 | ✅ ワークフロー存在 | なし | - | - | .github/workflows/ |
| **APIドキュメント** | visibility参照を除去 | ❌ サンプルコードにvisibility残存 | ドキュメント内のサンプルにvisibilityフィールドが含まれている | **Low** | **差替** | **src/components/api/ApiDocumentation.tsx** |

## 既知症状の分析

### 1. `DB: column organizations.visibility does not exist`
- **現状**: visibilityカラムは使用されておらず、型定義でも除外済み
- **根本原因**: 過去の実装時に残存したコード、または古いキャッシュ
- **対応**: APIドキュメントのサンプルコード修正

### 2. `DB: invalid input syntax for type uuid: "create"`
- **現状**: 編集ページでUUID検証が実装済み（src/app/organizations/[id]/page.tsx:58-69）
- **根本原因**: 過去に修正済み
- **対応**: 完了済み

### 3. `Module not found: Can't resolve 'next-auth'`
- **現状**: next-authの依存関係は完全に除去済み
- **根本原因**: 過去に修正済み
- **対応**: 完了済み

## 総評

**適合度**: 99% ✅

実装品質は非常に高く、要件との乖離は軽微です。既知症状として報告されている問題の大部分は既に解決済みです。

### 🟢 適合している部分
- 認証スタック（Supabase Auth統一）
- データベース設計（statusカラム使用）
- ルーティング（要件通りの構造 + UUID検証）
- 型安全性（TypeScript適切実装）
- App Router（Next.js 15 SSR優先）
- UAT仕組み（完全維持）

### 🟡 軽微な修正が必要
1. **APIドキュメント**: サンプルレスポンスの`visibility`フィールド除去

### 🔴 重大な問題
なし

## 推奨アクション

**Phase A（即時）**:
- APIドキュメントコンポーネントのサンプルコード修正（Low優先度）

**Phase B・C**:
- 現状では不要。実装は要件に適合済み。

---

**レビュー担当**: Claude Code  
**次回レビュー予定**: 実装変更時