# Single-Org Mode MVP商用利用版 要件定義書

## 1. プロジェクト概要

LuxuCare株式会社のSingle-Org Mode企業CMSの商用MVP版要件定義書。
1ユーザー=1企業の構造で、企業情報管理から公開サイト展開までを完全実装する。

## 2. 基本アーキテクチャ

### 2.1 Single-Org Mode原則
- 1ユーザー = 1企業（organizations）
- RLSによる自動権限制御
- `/api/my/*` パターンでの統一API
- `is_published` boolean フィールドによる公開制御

### 2.2 技術スタック
- Next.js 15.5+ App Router
- Supabase（PostgreSQL + RLS）
- TypeScript with strict mode
- Tailwind CSS
- Sentry監視
- Stripe決済（オプショナル）

## 3. 構造化公開表示要件（必須）

### 3.1 公開URL構造
```
/{slug}                    - 企業トップページ
/{slug}/services           - サービス一覧
/{slug}/services/[id]      - サービス詳細
/{slug}/case-studies       - 事例一覧  
/{slug}/case-studies/[id]  - 事例詳細
/{slug}/faq                - FAQ一覧
/{slug}/posts              - 記事一覧
/{slug}/posts/[id]         - 記事詳細
```

### 3.2 JSON-LD構造化データ要件

#### 3.2.1 企業トップ（/{slug}）
- **スキーマ**: schema.org/Organization
- **必須フィールド**: name, url, @id
- **オプション**: description, logo, email, telephone, address, foundingDate
- **未入力フィールド**: JSON-LDに含めない（null/"" は出力禁止）
- **サニタイズ**: 全文字列フィールドでXSS対策実施

#### 3.2.2 サービス（/{slug}/services/*）
- **スキーマ**: schema.org/Service
- **必須フィールド**: name, provider（Organization参照）
- **オプション**: description, category, offers（価格情報）

#### 3.2.3 事例（/{slug}/case-studies/*）
- **スキーマ**: schema.org/CreativeWork（Article拡張）
- **必須フィールド**: headline, author（Organization参照）
- **オプション**: description（problem活用）, keywords（tags活用）

#### 3.2.4 FAQ（/{slug}/faq）
- **スキーマ**: schema.org/FAQPage + Question/Answer
- **必須フィールド**: mainEntity配列
- **構造**: Question（name） + Answer（text）のペア

#### 3.2.5 記事（/{slug}/posts/*）
- **スキーマ**: schema.org/Article（BlogPosting互換）
- **必須フィールド**: headline, datePublished, author, publisher
- **オプション**: articleBody, dateModified, image

### 3.3 SSR出力要件
- 全ページで `<script type="application/ld+json">` をServer Component内で生成
- generateMetadata()でOGタグ・title・description設定
- `is_published=false` 時は `noindex` meta追加

### 3.4 公開制御要件
- **公開条件**: `is_published=true` のコンテンツのみ表示
- **下書き**: `is_published=false` のコンテンツは公開ページに非表示
- **404対応**: 企業・コンテンツが見つからない場合の適切なnotFound()

## 4. データベース設計

### 4.1 RLS（Row Level Security）
- organizations: `created_by = auth.uid()`
- posts: `organization_id IN (SELECT id FROM organizations WHERE created_by = auth.uid())`
- services: 同上
- case_studies: 同上  
- faqs: 同上

### 4.2 公開用SELECT
```sql
-- 企業情報（公開のみ）
SELECT * FROM organizations WHERE slug = $1 AND is_published = true;

-- 関連コンテンツ（公開のみ）
SELECT * FROM posts WHERE organization_id = $1 AND is_published = true 
ORDER BY published_at DESC NULLS LAST;
```

## 5. API設計

### 5.1 認証API（/api/my/*）
- `GET /api/my/organization` - 自組織取得
- `PUT /api/my/organization` - 自組織更新
- `POST /api/my/organization` - 自組織作成（初回のみ）
- `DELETE /api/my/organization` - 自組織削除

### 5.2 公開API（/api/public/*）
- `GET /api/public/organizations/[slug]` - 公開企業情報+コンテンツ
- `GET /api/public/o/[slug]/posts/[postId]` - 公開記事詳細

### 5.3 診断API（開発・本番可視化用）
```
GET /api/public/[slug]/jsonld?type=organization|service|case-studies|faq|posts|post&id=...
```
- 実際のページで出力するJSON-LDをそのまま返却
- デバッグ・検証用途
- 200/404適切なステータス

### 5.4 サイトマップAPI
```
GET /api/public/sitemap
```
- 最低限のサイトマップJSON
- 将来XML化対応

## 6. UI/UX要件

### 6.1 CMSダッシュボード強化
- 各コンテンツタブに「公開ページを見る」リンク追加
- `href=/{slug}/services` など適切なURL生成
- `is_published` トグルボタン（実装済み）

### 6.2 レスポンシブ対応
- モバイルファースト設計
- Tailwind CSSによる統一デザイン
- アクセシビリティ対応（ARIA属性）

### 6.3 パフォーマンス
- SSR最適化
- 画像最適化（next/image推奨）
- 不要なN+1クエリ排除

## 7. セキュリティ要件

### 7.1 XSS対策
- JSON-LD出力前の文字列エスケープ
- Markdown→HTML変換時のDOMPurify等使用
- CSP（Content Security Policy）設定

### 7.2 認証・認可
- Supabase Auth + RLS
- APIトークンの適切な管理
- 公開APIでの機密情報漏洩防止

## 8. 受け入れ条件

### 8.1 自動テスト
- JSON-LDビルダー単体テスト
  - フィールド未入力時の省略確認
  - URL正規化テスト
  - エスケープ処理テスト
- 公開SELECT `is_published=true` 限定テスト

### 8.2 手動テスト（企業例：ラグジュケア株式会社）
1. **企業作成**: CMSで「ラグジュケア株式会社」作成（slug: luxucare）
2. **コンテンツ登録**: サービス・事例・FAQ・記事を数件登録し「公開」設定
3. **公開ページ確認**: `/luxucare` および下層URL正常表示
4. **JSON-LD確認**: ブラウザ開発者ツールで構造化データ検証
5. **診断API確認**: `/api/public/luxucare/jsonld?type=organization` レスポンス確認
6. **下書き非表示確認**: `is_published=false` コンテンツが公開ページに非表示

### 8.3 SEO検証
- Google Rich Results Test合格
- schema.org validator合格
- OGタグ・metaタグ適切設定

## 9. 運用・監視

### 9.1 エラー監視
- Sentry統合済み
- 診断API経由でのヘルスチェック
- ログ集約・分析

### 9.2 パフォーマンス監視
- Core Web Vitals測定
- API応答時間監視
- データベースクエリ最適化

## 10. 制約・前提条件

### 10.1 技術制約
- Next.js App Router限定
- Supabase RLS前提
- TypeScript strict mode
- ビルドエラーゼロ（lint・型チェック含む）

### 10.2 運用制約  
- 既存UI/フォームは破壊的変更禁止
- 既存診断API・Sentry設定維持
- Single-Org Mode原則厳守

## 11. 優先度・フェーズ

### Phase 1（最優先）
- 不足ページ実装（サービス・事例・FAQ・記事一覧）
- is_published制御完全対応
- JSON-LD完全実装

### Phase 2（次優先）
- 診断API実装
- CMSリンク導線追加
- パフォーマンス最適化

### Phase 3（将来）
- サイトマップXML化
- 高度なSEO機能
- アナリティクス統合

---

**最終更新**: 2025年1月
**承認者**: システム設計者
**実装期限**: MVP完成まで