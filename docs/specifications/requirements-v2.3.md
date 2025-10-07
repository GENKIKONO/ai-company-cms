# LuxuCare CMS 要件定義書 v2.3

## 改訂履歴
- v1.0: 初版作成（基本機能要件）
- v2.0: JSON-LD構造化データ要件追加
- v2.1: AIO最適化要件・データ品質要件追加（2025年10月）
- **v2.3: Section 4.3「システム堅牢性および一貫性要件」を追加（2025-10-07）**

---

## 1. プロジェクト概要

LuxuCare CMS は、企業向けビジネスマッチングプラットフォームとして、サービス・導入事例・FAQ の統合管理機能を提供する Next.js 15 + Supabase ベースのCMSです。

### 1.1 目的
- 企業のサービス情報を効率的に管理・公開
- SEO最適化による集客力強化
- AI検索エンジン対応によるリーチ拡大

---

## 2. 機能要件

### 2.1 コア機能
- 企業プロフィール管理
- サービス情報管理
- 導入事例作成・管理
- FAQ管理
- ブログ記事投稿

### 2.2 認証・権限管理
- Supabase Auth による認証
- Row Level Security (RLS) による多企業対応
- ロールベースアクセス制御

---

## 3. 技術要件

### 3.1 技術スタック
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **型安全性**: TypeScript

### 3.2 アーキテクチャ
- Server Components を活用したサーバーサイド処理
- Client Components は最小限に限定
- API Routes による外部連携

---

## 4. SEO・メタデータ要件

### 4.1 構造化データ
- Schema.org準拠のJSON-LD実装
- Organization, Service, Article, FAQPage の @type 対応
- Google Rich Results 対応

### 4.2 サイトマップ・robots.txt
- 動的サイトマップ生成
- robots.txt による適切なクローラー制御

### 4.3 システム堅牢性および一貫性要件

本サービス（LuxuCare CMS / AIO Hub Platform）は、商用運用に耐え、  
特定ユーザー環境依存・個別挙動を排除した設計を採用する。  
全ユーザー・全テナントが同一のルール・構造下で確実に動作することを保証するため、  
以下の10項目を非機能的必須要件とする。

#### 壊れない・誰でも同じに動くための10チェック

**1. RLS（Row Level Security）適用統一**  
- すべての主要テーブルでRLSを有効化。  
- 匿名（anon）は`status='published'`のみ閲覧可能。  
- 認証ユーザーは`created_by = auth.uid()`で自分の行のみ操作可。  

**2. VIEW実行権限の統一**  
- 全VIEWに`security_invoker = on`を設定し、呼び出しユーザーの権限で評価。

**3. 環境変数にユーザー固有値を使用しない**  
- 固定UUIDや管理者IDを環境変数に含めない。  
- 権限は「ロール（role）」または「状態（status）」で制御。

**4. API仕様をOpenAPIで固定し、スキーマ変更を自動反映**  
- スキーマ差分→マイグレーション→型更新→E2Eテストの自動連携を保証。  
- 未定義カラム参照時はビルドエラーで検知。

**5. キャッシュ境界を明示**  
- 公開API：`public, s-maxage=300`  
- 認証API：`private, no-store` + Vary: Authorization

**6. 書き込み操作はトランザクションおよび冪等化**  
- `insert/update`はすべて`begin...commit`または`upsert`構造で実行。  
- 二重送信を防ぐため`Idempotency-Key`を採用。

**7. マイグレーションは冪等＋CI経由のみ適用**  
- `if not exists`句で安全性を担保。  
- 手動実行は禁止、本番反映はCI/CDによる`supabase db push`のみ。  
- **RLSポリシーはすべて冪等実行可能**であること。  
- 既存ポリシー再作成時にエラーが発生しない構造とする。  
- データ整合性エラー発生時は自動修正ログを出力すること（例：`logs/db-auto-fix-*.md`）。

**8. 権限制御テストの自動化**  
- anon/authenticated/adminの3種でアクセス制御テストを実施。  
- 自身のUIDに依存する動作がないことをCIで保証。

**9. 監査・エラーログの一元管理**  
- Sentryで500・RLS違反を即通知。  
- Supabase監査ログを日次確認。

**10. 第三者再現性の保証**  
- 新規ユーザーで「登録→投稿→公開→閲覧」までのE2Eテストを自動化。  
- 本番と同一構成での成功をもって出荷基準とする。

---

## 5. データベース設計

### 5.1 主要テーブル
- organizations（企業情報）
- services（サービス情報）
- posts（記事）
- case_studies（導入事例）
- faqs（FAQ）

### 5.2 RLS ポリシー
- 企業別データ分離
- ステータス管理（draft, published, archived）

---

## 6. UI/UX要件

### 6.1 レスポンシブデザイン
- モバイルファースト設計
- タブレット・デスクトップ対応

### 6.2 アクセシビリティ
- WCAG 2.1 AA準拠
- セマンティックHTML使用

---

## 7. 非機能要件

### 7.1 パフォーマンス
- ページ読み込み速度: 2秒以内
- Core Web Vitals 最適化

### 7.2 セキュリティ
- HTTPS必須
- CSP設定
- XSS・CSRF対策

### 7.3 可用性
- 99.9%稼働率目標
- 障害監視・アラート機能

### 7.4 AIO最適化およびデータ品質要件

🔖 **AIO最適化およびデータ品質要件（最終確定）**

#### 1. ダミーデータ禁止（REQ-AIO-00）
- LuxuCare CMS では、あらゆるページ・API・UIコンポーネントにおいて固定値・モックデータ・サンプルデータの使用を禁止する。
- ダミーデータ検出スクリプト（scripts/check-no-mock.ts）がCI/CDに組み込まれ、検出キーワード（mock|fixture|stub|dummy|sample|static|faker 等）を発見した場合は **ビルド失敗** とする。
- 開発時も `npm run check:no-mock` により自動チェックを実施すること。

#### 2. AIO最適化機能の恒常要件（REQ-AIO-01〜07）

LuxuCare CMS は AI検索（AIO / Generative Search）対応を目的として、以下を恒常的に保持する。

| 要件ID | 機能 | 維持方針 |
|--------|------|----------|
| REQ-AIO-01 | robots.txt / sitemap.ts | 主要URLと更新日時を自動出力 |
| REQ-AIO-02 | メタデータ生成 | 各ページ generateMetadata() によるtitle/description/canonical設定 |
| REQ-AIO-03 | JSON-LD構造化データ | Organization / Service / FAQPage / CaseStudy 等を全ページで自動埋め込み |
| REQ-AIO-04 | RSS/Atomフィード | /feed.xml（全記事）と /o/[slug]/feed.xml（企業別）を5分キャッシュ付きで提供 |
| REQ-AIO-05 | 拡張サイトマップ | /sitemap-images.xml（画像）と /sitemap-news.xml（ニュース）を出力 |
| REQ-AIO-06 | OpenAPI 3.1 | /api/public/openapi.json にてAPIスキーマを公開 |
| REQ-AIO-07 | セマンティックHTML | main/nav/footer構造、alt属性、ARIA対応を維持 |

#### 3. CI/CDルール
- **prebuildフック** によるAIO自動検証を恒常運用：

```json
{
  "scripts": {
    "prebuild": "npm run check:no-mock && npm run validate:feeds"
  }
}
```

- AIO要件はリリース前に `npm run aio:test` にて必ず合格すること。
- RSS/XML/サイトマップ/OpenAPIの構文およびスキーマ検証でエラーが出た場合、デプロイ不可。

#### 4. 保守運用ルール
- 新機能追加時は **OpenAPIスキーマの更新必須**。
- 新しい記事・サービス・導入事例追加時は **サイトマップとRSSの自動更新確認**。
- 月次で `npm run aio:test` を実行し、AIO準拠率100%を維持。
- AIO適合率が95%未満になった場合は緊急修正対象とする。

---

## 8. テスト要件

### 8.1 単体テスト
- Jest による関数・コンポーネントテスト
- カバレッジ 80% 以上

### 8.2 統合テスト
- Playwright による E2E テスト
- AIO要件適合性テスト（aio-compliance.spec.ts）

### 8.3 AIO要件テスト
- RSS/XML バリデーション
- OpenAPI スキーマ検証
- 構造化データ検証

---

## 9. 運用・保守要件

### 9.1 監視
- アプリケーション監視
- データベース監視
- エラー追跡（Sentry）

### 9.2 バックアップ
- データベース日次バックアップ
- 障害時復旧手順

### 9.3 AIO継続監視
- CI/CDで `npm run aio:test` を毎ビルド時に実行
- 月次で AIO適合率 レポートをSlack/Teams通知に出力
- 適合率95%未満で「AIO維持タスク」を自動チケット化

---

## 10. デプロイ・リリース要件

### 10.1 デプロイ環境
- 開発環境: localhost
- ステージング環境: Vercel Preview
- 本番環境: Vercel Production

### 10.2 リリースフロー
- feature → develop → staging → main
- AIO要件チェック必須
- 本番デプロイ前の動作確認

---

## 11. 品質保証要件

### 11.1 コード品質
- ESLint による静的解析
- Prettier によるコード整形
- TypeScript 型チェック

### 11.2 AIO品質保証
- ダミーデータ検出: ビルド時自動チェック
- 構造化データ: Google Rich Results テスト合格
- RSS/XML: W3C バリデーター合格
- OpenAPI: スキーマ仕様準拠

---

## 12. バージョン管理・改訂予定

### 12.1 現在のバージョン
- **LuxuCare CMS システム堅牢性対応バージョン: v2.3**
- 最終更新日: 2025年10月7日

### 12.2 次回要件見直し
- **予定時期**: 2026年4月
- **見直し理由**: 生成AI検索APIの仕様変化およびシステム堅牢性要件の実効性評価
- **対象要件**: REQ-AIO-01〜07の技術仕様アップデートおよび堅牢性10チェックの改善

---

## 承認・署名

| 役割 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| プロダクトオーナー | | | |
| 技術責任者 | | | |
| 品質責任者 | | | |

---

**文書管理情報**
- 文書ID: REQ-LUXUCARE-v2.3
- 作成者: 開発チーム
- 承認者: プロダクトオーナー
- 次回レビュー: 2026年4月