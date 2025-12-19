# AIOHub 現状分析書
# 現在のClaude認識による実装状況の詳細分析

## 📋 この分析の目的

このドキュメントは、現在のClaude Code（GPT-4）による AIOHub プロジェクトの認識状況を正確に記録し、実際の実装状況との乖離を発見するために作成されています。

---

# Phase 1: 現状確認・影響範囲分析

## 1.1 既存実装の現状把握

### A. 既存テーブル・機能の利用状況

**認識している主要テーブル:**
```
✓ organizations: 
  - 組織情報管理、created_by による所有者管理
  - slug によるURL識別、is_published による公開制御
  - 現在のRLS: 所有者またはis_published=trueで閲覧可能

✓ services: 
  - サービス情報管理、organization_id による組織紐付け
  - slug, is_published による公開制御
  - 現在のRLS: 組織メンバーまたはis_published=trueで閲覧可能

✓ faqs: 
  - FAQ管理、v_faqs_published ビューで公開データ取得
  - slug による個別ページ、多言語対応（lang カラム）
  - 現在のRLS: 公開データのみ閲覧可能

✓ profiles: 
  - ユーザープロフィール管理
  - Supabase auth.users との紐付け
  - saved_searches, favorites, preferences 等のJSONB管理

✓ user_preferences:
  - ユーザー個別設定（theme, language, notifications等）
  - JSONB構造での柔軟な設定管理
```

**認識している既存APIエンドポイント:**
```
✓ /api/me - 現在のユーザー情報取得
✓ /api/my/case-studies - ケーススタディ管理
✓ /api/my/faqs/[id] - FAQ個別管理
✓ /api/my/faqs - FAQ一覧管理
✓ /api/my/interview-questions - 面接質問管理
✓ /api/my/materials/[id]/download - 資料ダウンロード
✓ /api/my/materials/[id] - 資料個別管理
✓ /api/my/materials - 資料一覧管理
✓ /api/my/org-docs/chat - 組織文書チャット
✓ /api/my/org-docs/files - 組織文書ファイル管理
✓ /api/my/posts/[id] - 投稿個別管理
✓ /api/my/posts - 投稿一覧管理
✓ /api/my/qa/categories - QAカテゴリ管理
✓ /api/my/reports/monthly/[period]/pdf - 月次レポートPDF
✓ /api/my/reports/monthly/[period] - 月次レポート個別
✓ /api/my/reports/monthly - 月次レポート一覧
✓ /api/my/reports - レポート一覧
✓ /api/my/services/[id] - サービス個別管理
✓ /api/my/services - サービス一覧管理
✓ /api/analytics/ai/bot-logs - AIボットログ分析
✓ /api/analytics/ai/summary - AI分析サマリー
✓ /api/analytics/ai/visibility - AI可視化分析
✓ /api/materials/stats - 資料統計
✓ /api/admin/* - 管理者系API（複数）
```

**認識している画面・コンポーネント:**
```
✓ /dashboard - メインダッシュボード
✓ /dashboard/admin/* - 管理者画面
✓ /dashboard/ai-reports/* - AIレポート画面
✓ /dashboard/billing/* - 請求・決済画面
✓ /dashboard/case-studies - ケーススタディ管理
✓ /dashboard/embed/* - 埋め込み機能
✓ /dashboard/faqs - FAQ管理
✓ /dashboard/interview/* - 面接機能
✓ /dashboard/materials/* - 資料管理
✓ /dashboard/org-ai-chat/* - 組織AIチャット
✓ /dashboard/posts - 投稿管理
✓ /dashboard/questions - 質問管理
✓ /dashboard/reports - レポート管理
✓ /dashboard/services-info - サービス情報
✓ /dashboard/services/* - サービス管理
✓ /dashboard/test-interview - テスト面接
✓ /dashboard/company/* - 企業情報管理（新規？）
✓ /faqs/[slug] - FAQ詳細ページ（実装済み）
```

### B. データ移行・互換性の方針

**現在の認識状況:**
```
✓ 既存データの移行方法: 
  - .single() → .maybeSingle() による破壊的変更なし移行
  - error-mapping.ts による統一エラーハンドリング導入済み
  - 既存RLSポリシーは維持、新規機能での拡張方式

✓ 既存機能への影響:
  - ダッシュボードレイアウト安定化実装済み
  - エラー境界による画面崩壊防止実装済み
  - 既存のSupabase認証・権限システムとの互換性確保

✓ 段階的移行の実施:
  - Phase1: エラーハンドリング統一（実装済み）
  - Phase2: SEO最適化（FAQ実装済み）
  - Phase3: 残り機能の段階的適用
```

### C. 環境・設定の変更

**認識している環境変数（.env.example より）:**
```
✓ CRITICAL必須:
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - NEXT_PUBLIC_APP_URL

✓ HIGH PRIORITY:
  - ADMIN_EMAIL, ADMIN_OPS_PASSWORD, JWT_SECRET
  - RESEND_API_KEY, RESEND_FROM_EMAIL
  - OPENAI_API_KEY, NEXT_PUBLIC_SENTRY_DSN
  - SLACK_WEBHOOK_URL, STRIPE_SECRET_KEY

✓ MEDIUM PRIORITY:
  - SUPABASE_DB_URL_RO (MCP用)
  - USE_SUPABASE_EMAIL, OPENAI_MODEL設定
  - Stripe価格プラン設定（9つのプライスID）
  - GSC設定、テスト設定

✓ LOW PRIORITY:
  - セキュリティ設定、機能フラグ設定
  - Basic認証設定、E2E テスト設定
  - RLS回帰テスト設定
```

## 1.2 技術負債・制約の明確化

### A. 現在のコードベースの制約

**認識している問題・制約:**
```
✓ 既存のバグ・不完全な実装:
  - ダッシュボードでの Supabase エラー時のレイアウト崩壊（修正済み）
  - .single() による例外でのページクラッシュ（修正済み）

✓ パフォーマンス問題の懸念:
  - 大量データ時のクエリパフォーマンス未検証
  - リアルタイム機能の同時接続数制限未確認
  - 画像・ファイル管理の容量制限未確認

✓ セキュリティ上の懸念:
  - SERVICE_ROLE_KEY の適切な使用範囲（現在はFAQページで使用）
  - RLS ポリシーの全パターンテスト未完了
  - CSRFトークン設定が LOW PRIORITY 扱い
```

### B. 運用上の制約

**認識している制約:**
```
✓ デプロイ・リリース制約:
  - Vercel環境での動作確認
  - NODE_ENV=production での動作検証必要
  - E2E テストの実行環境複数セットアップ済み

✓ 外部システム連携制約:
  - Supabase との密結合
  - Stripe 決済システム依存
  - OpenAI API 依存（面接機能等）
  - Resend メール送信依存
```

---

# Phase 2: DB設計の完全定義

## 2.1 スキーマ定義（現在の認識）

### 認識しているテーブル構造

**organizations テーブル（推定）:**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

**services テーブル（推定）:**
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**faqs テーブル（実装確認済み）:**
```sql
-- v_faqs_published ビューから推定される構造
CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  base_path TEXT,
  organization_id TEXT,
  base_locale TEXT,
  is_published BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE,
  lang TEXT NOT NULL,
  question TEXT NOT NULL,
  answer_html TEXT,
  answer_plain TEXT,
  published_at TIMESTAMP WITH TIME ZONE
);
```

### 認識しているRLSポリシー

**現在実装済みの認識:**
```sql
-- src/lib/error-mapping.ts の handleMaybeSingleResult から推定
-- organizations: 所有者または公開データ閲覧可能
-- services: 組織メンバーまたは公開データ閲覧可能  
-- faqs: v_faqs_published ビューによる公開データのみ閲覧

-- 具体的なポリシー実装は未確認
```

### 認識しているビュー・関数

**確認済み:**
```sql
-- v_faqs_published ビュー存在確認済み
CREATE OR REPLACE VIEW v_faqs_published AS
SELECT * FROM faqs WHERE is_published = true;
-- (詳細カラム構造は faqs/[slug]/page.tsx から推定)
```

## 2.2 データモデル関係性（現在の推定）

### テーブル関係の認識

**推定される関係性:**
```
auth.users (1) ←→ (N) organizations
  - FK: organizations.created_by → auth.users.id
  - ビジネスルール: ユーザーが組織を作成・所有

organizations (1) ←→ (N) services  
  - FK: services.organization_id → organizations.id
  - ビジネスルール: 組織が複数サービス提供

organizations (1) ←→ (N) faqs
  - FK: faqs.organization_id → organizations.id (nullable)
  - ビジネスルール: 組織固有または全体共通FAQ

auth.users (1) ←→ (1) profiles
  - FK: profiles.id → auth.users.id
  - ビジネスルール: ユーザー拡張情報

auth.users (1) ←→ (1) user_preferences
  - FK: user_preferences.user_id → auth.users.id  
  - ビジネスルール: ユーザー個別設定
```

---

# Phase 3: UI/UX要件の詳細化

## 3.1 画面・機能要件（認識状況）

### 実装済み画面の認識

**FAQ関連（実装済み）:**
```
✓ /faqs/[slug] - FAQ詳細ページ
  - Server Component実装
  - JSON-LD構造化データ埋め込み
  - 多言語対応（hreflang, canonical）
  - Meta情報・OpenGraph対応
  - Supabase SERVICE_ROLE_KEY使用

✓ /faqs/[slug]/head.tsx - SEO関連ヘッダー
  - 多言語alternateリンク生成
  - canonical URL設定
```

**ダッシュボード関連（エラーハンドリング改善済み）:**
```
✓ /dashboard/billing/page.tsx
  - 組織アクセス制御実装
  - エラー時の適切なリダイレクト

✓ 全般的なエラーハンドリング
  - DashboardErrorBoundary による画面崩壊防止
  - error-mapping.ts による統一エラー処理
```

### データフローの認識

**FAQ表示フロー（実装済み）:**
```
1. /faqs/[slug] アクセス
2. Supabase v_faqs_published からデータ取得
3. 多言語データの優先順位処理（ja優先）
4. JSON-LD構造化データ生成
5. Meta情報生成（title, description, OpenGraph）
6. Server Side Rendering
```

**認証・組織アクセスフロー（実装済み）:**
```
1. Supabase Auth による認証確認
2. 組織アクセス権限チェック
3. エラー時は handleMaybeSingleResult によるエラーマッピング
4. 適切なエラー表示またはリダイレクト
```

## 3.2 多言語対応の詳細仕様（認識状況）

### 実装済み多言語機能

**FAQ多言語対応:**
```
✓ 対応言語: lang カラムによる管理（ja, en等）
✓ デフォルト言語: ja優先、なければ先頭データ使用
✓ URL構造: /faqs/slug （言語別URLは hreflang で関連付け）
✓ 翻訳データ優先順位: ja > その他の言語順
✓ Meta情報: 各言語の alternate リンク自動生成
```

## 3.3 認証・認可の詳細仕様（認識状況）

### 現在実装済みの権限制御

**エラーマッピングベースの権限制御:**
```
✓ 401 Unauthorized: 認証が必要なアクセス
✓ 403 Forbidden: 権限不足（RLS拒否等）
✓ 404 Not Found: リソース未存在またはアクセス権限なし
✓ 409 Conflict: データ重複等の制約違反
✓ 422 Unprocessable Entity: バリデーションエラー
✓ 500 Internal Server Error: システムエラー

統一メッセージ:
- データベース接続エラー
- 権限がありません
- 見つかりません
- すでに存在します
- 入力値に問題があります
- システムエラーが発生しました
```

---

# Phase 4: 実装方針の確定

## 4.1 技術的詳細仕様（現在の実装状況）

### Next.js App Router実装状況

**実装済みServer Components:**
```
✓ /faqs/[slug]/page.tsx - FAQ詳細ページ
  - generateMetadata による Meta情報生成
  - Supabase直接アクセス（SERVICE_ROLE_KEY）
  - JSON-LD構造化データ生成

✓ /faqs/[slug]/head.tsx - SEO関連ヘッダー  
  - 多言語リンク生成
  - canonical設定
```

**エラーハンドリングパターン:**
```
✓ error-mapping.ts による統一処理
  - PostgrestError → StandardError 変換
  - handleMaybeSingleResult による null安全処理
  - ensureMembership による権限チェック
  - fetchOrganizationResource による組織リソース取得
```

### データフェッチ戦略（現在の認識）

**実装済みパターン:**
```
✓ Server Component + 直接Supabase アクセス:
  - FAQ詳細ページ
  - SERVICE_ROLE_KEY使用でRLS迂回

✓ Client Component + API Routes:
  - ダッシュボード系機能
  - 認証が必要な操作

✓ Error Boundary:
  - DashboardErrorBoundary
  - レイアウト保持したエラー表示
```

## 4.2 エラーハンドリング・ログ設計（実装状況）

### 実装済みエラー対応

**Supabaseエラーマッピング（実装済み）:**
```typescript
// src/lib/error-mapping.ts
✓ PostgreSQL エラーコードマッピング:
  - 23505 unique_violation → 409 Conflict
  - 23503 foreign_key_violation → 422 Unprocessable Entity
  - 23502 not_null_violation → 422 Unprocessable Entity
  - 23514 check_violation → 422 Unprocessable Entity

✓ 一般的なエラーパターン:
  - PGRST116 (row not found) → 404 Not Found
  - authentication required → 401 Unauthorized
  - row-level security → 403 Forbidden

✓ 統一レスポンス形式:
interface StandardError {
  status: number;
  code: string; 
  message: string;
  details?: string;
}
```

---

# Phase 5: 最終チェック・実装開始前確認

## 5.1 実装準備チェックリスト（現在の状況）

### 完了済み事項

**設計書・実装完了:**
```
✓ FAQ SEO最適化完全実装
  - JSON-LD構造化データ
  - 多言語hreflang対応  
  - canonical URL設定
  - robots.txt生成

✓ エラーハンドリング統一実装
  - error-mapping.ts完全実装
  - 全主要ファイルの .single() → .maybeSingle() 移行
  - DashboardErrorBoundary実装

✓ 基盤設定
  - .env.example による環境変数定義
  - Next.js 15 対応（Promise based params）
  - TypeScript型安全性確保
```

### 未確認・推定事項

**データベーススキーマ:**
```
❓ 実際のテーブル構造の詳細
❓ 全RLSポリシーの具体的実装
❓ インデックスの実装状況
❓ 関数・トリガーの実装状況
❓ サンプルデータの存在
```

**API エンドポイント:**
```
❓ 各APIの詳細仕様（request/response）
❓ 権限制御の具体的実装
❓ バリデーションルールの実装
❓ エラーレスポンスの統一性
```

**画面・コンポーネント:**
```  
❓ 各ページの詳細機能
❓ フォーム実装の状況
❓ バリデーション実装の状況
❓ ローディング・エラー表示の実装
❓ レスポンシブ対応状況
```

## 5.2 認識の限界・確認が必要な事項

### 技術的詳細で不明な点

**Database関連:**
```
❓ 実際のテーブル定義とCREATE文
❓ 外部キー制約の詳細設定
❓ CHECK制約の実装状況  
❓ インデックス設計の詳細
❓ RLSポリシーの全容
❓ 関数・トリガーの実装
❓ ビュー定義の詳細
```

**認証・認可システム:**
```
❓ 具体的な権限マトリックス
❓ 組織メンバーシップの管理方法
❓ 招待・承認フローの実装
❓ セッション管理の詳細
❓ 外部認証プロバイダの設定
```

**画面・機能:**
```
❓ 各画面の具体的なUI仕様
❓ フォーム項目の詳細
❓ バリデーションルールの実装
❓ エラー表示の統一性
❓ ローディング状態の管理
❓ 検索・フィルター機能
❓ ページネーション実装
```

**パフォーマンス:**
```
❓ 実際のレスポンス時間
❓ データベースクエリの最適化状況
❓ 画像・ファイルの処理方法
❓ キャッシュ戦略の実装
❓ 同時接続数の制限
```

### ビジネス要件で不明な点

**データ管理:**
```
❓ 実際のデータ量・増加率
❓ データ保持期間・削除ポリシー
❓ バックアップ・復元の方法
❓ データエクスポート機能
```

**運用要件:**  
```
❓ 監視・アラートの設定
❓ ログ収集・分析の方法
❓ パフォーマンス監視の実装
❓ セキュリティ監査の方法
```

---

# 現在の実装品質評価

## 実装済み機能の品質

**高品質実装済み:**
```
✓ FAQ SEO最適化: JSON-LD、多言語対応、構造化データ
✓ エラーハンドリング: 統一エラーマッピング、型安全性
✓ Next.js App Router: Server Components適切使用
✓ TypeScript: 型安全性確保、Next.js 15対応
```

**改善が必要な可能性がある領域:**
```
❓ データベース設計の最適化確認
❓ 全APIエンドポイントの統一性確認  
❓ UI/UXの一貫性確認
❓ パフォーマンス最適化確認
❓ セキュリティ監査確認
❓ テストカバレッジ確認
```

---

# まとめ：認識と実装の乖離リスク

## 高リスク領域（詳細確認必須）

1. **データベーススキーマの詳細** - 推定による実装でミスの可能性
2. **権限制御の具体的実装** - RLSポリシーの全容未確認
3. **API仕様の詳細** - request/responseフォーマットの統一性
4. **UI/UX実装の現状** - 実際の画面仕様との乖離
5. **パフォーマンス特性** - 実際のボトルネック未確認

## 中リスク領域（実装時要確認）

1. **多言語対応の全容** - FAQ以外の実装状況
2. **ファイル・画像管理** - 実装方法の詳細
3. **外部サービス連携** - 実際の設定・制約
4. **テスト環境・CI/CD** - 実際の運用状況

## 低リスク領域（現状実装で対応可能）

1. **基本的なNext.js App Router実装** - 適切に実装済み
2. **Supabase基本連携** - エラーハンドリング実装済み  
3. **TypeScript型安全性** - 基本的な型付け完了
4. **SEO基盤** - FAQ実装で基本パターン確立

---

*この分析は 2024年12月16日時点でのClaude Code認識に基づいており、実際の実装状況との詳細比較が必要です。特に「❓」マークの項目については実装前の詳細確認を強く推奨します。*