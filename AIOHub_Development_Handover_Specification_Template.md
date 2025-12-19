# AIOHub 開発引き継ぎ仕様書テンプレート
# 手戻りゼロを目指すハイクオリティ実装のための完全チェックリスト

## 📋 このドキュメントの目的

このテンプレートは、DB設計完了後にフロントエンド・API実装を依頼する際、以下を達成するために作成されています：

- **手戻り率を5%以下に抑制**
- **実装品質の統一**
- **既存コードとの整合性確保**
- **運用時の問題の事前回避**

## 🔍 段階的引き継ぎ方式

### Phase 1: 現状確認・影響範囲分析
### Phase 2: DB設計の完全定義
### Phase 3: UI/UX要件の詳細化
### Phase 4: 実装方針の確定
### Phase 5: 最終チェック・実装開始

---

# Phase 1: 現状確認・影響範囲分析

## 1.1 既存実装の現状把握

### 必須確認事項

**A. 既存テーブル・機能の利用状況**
```
□ 現在のテーブル一覧とその用途
  - organizations: [利用状況・変更予定]
  - services: [利用状況・変更予定]
  - faqs: [利用状況・変更予定]
  - profiles: [利用状況・変更予定]
  - その他: [全テーブルの列挙]

□ 既存RLSポリシーの継続利用・変更・削除方針
□ 既存APIエンドポイントの継続利用・変更・削除方針
□ 既存画面・コンポーネントの継続利用・変更・削除方針
```

**B. データ移行・互換性の方針**
```
□ 既存データの移行方法
  - 新スキーマへの移行SQL提供の有無
  - 移行時のダウンタイム許容度
  - ロールバック方法

□ 既存機能への影響
  - 破綻する機能・ページの一覧
  - 継続動作が必要な機能の優先度
  - 段階的移行の可否
```

**C. 環境・設定の変更**
```
□ 新しい環境変数の追加
□ Supabase設定の変更（RLS、関数等）
□ Next.js設定の変更（middleware、API routes等）
□ 外部サービス連携の変更（Stripe、OpenAI等）
```

## 1.2 技術負債・制約の明確化

### 既知の問題・制約事項

**A. 現在のコードベースの制約**
```
□ 既存のバグ・不完全な実装で影響を受ける部分
□ パフォーマンス問題があるコンポーネント・クエリ
□ セキュリティ上の懸念がある実装
□ 技術的負債として認識している部分
```

**B. 運用上の制約**
```
□ デプロイ・リリース時の制約
□ ユーザー影響を最小化するための制約
□ 外部システムとの連携制約
□ パフォーマンス要件（レスポンス時間、同時接続数等）
```

---

# Phase 2: DB設計の完全定義

## 2.1 スキーマ定義（DDL完全版）

### 必須提供物

**A. 全テーブル定義**
```sql
-- 各テーブルについて以下の情報を完全に記載

-- 例: organizations テーブル
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- [全カラムの完全定義]
  CONSTRAINT chk_organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 必須記載事項:
-- ✓ 全カラムのデータ型
-- ✓ NOT NULL制約
-- ✓ DEFAULT値
-- ✓ CHECK制約
-- ✓ UNIQUE制約
-- ✓ 外部キー制約
-- ✓ コメント（COMMENT ON）
```

**B. インデックス定義**
```sql
-- パフォーマンス要件に基づく全インデックス
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_services_org_published ON services(organization_id, is_published) WHERE is_published = true;

-- 必須記載事項:
-- ✓ 複合インデックスの列順序
-- ✓ 部分インデックス（WHERE句）
-- ✓ ユニークインデックス
-- ✓ 関数ベースインデックス
-- ✓ GIN/GiSTインデックス
```

**C. RLSポリシー定義**
```sql
-- 全テーブルのRLSポリシーを完全定義
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    -- 詳細な条件を記載
    (is_published = true) OR 
    (auth.uid() = created_by)
  );

-- 必須記載事項:
-- ✓ SELECT, INSERT, UPDATE, DELETE全操作のポリシー
-- ✓ public（未認証）アクセスポリシー
-- ✓ 認証ユーザーアクセスポリシー
-- ✓ 管理者・所有者権限のポリシー
-- ✓ 複雑な条件の詳細説明
```

**D. ビュー・関数定義**
```sql
-- 全ビューの定義
CREATE OR REPLACE VIEW v_services_published AS
SELECT 
  s.*,
  o.name as organization_name
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE s.is_published = true AND o.is_published = true;

-- RPC関数の定義
CREATE OR REPLACE FUNCTION get_user_organizations(user_id UUID)
RETURNS TABLE(id UUID, name TEXT, role TEXT) AS $$
BEGIN
  -- 関数の完全実装
END;
$$ LANGUAGE plpgsql;

-- 必須記載事項:
-- ✓ 全ビューの定義とその目的
-- ✓ 全RPC関数の実装とシグネチャ
-- ✓ 関数の引数・戻り値の型
-- ✓ エラーハンドリング
-- ✓ パフォーマンス考慮事項
```

## 2.2 データモデル関係性

### ER図・関係性定義

**A. テーブル関係の完全定義**
```
organizations (1) ←→ (N) services
  - FK: services.organization_id → organizations.id
  - CASCADE: DELETE CASCADE / UPDATE CASCADE
  - ビジネスルール: 組織削除時はサービスも削除

services (1) ←→ (N) service_translations
  - FK: service_translations.service_id → services.id
  - CASCADE: DELETE CASCADE / UPDATE NO ACTION
  - ビジネスルール: サービス削除時は翻訳も削除、サービス更新時は翻訳保持

-- 全関係について同様に詳細記載
```

**B. 複雑なビジネスルール**
```
□ ユーザー・組織関係のルール
  - 1ユーザーは複数組織に所属可能か？
  - 組織内でのロール管理はどうするか？
  - 組織のオーナー変更は可能か？

□ 公開・非公開の制御ルール
  - サービスが公開されるための条件
  - 組織が非公開になったときの影響
  - 段階的公開（下書き→レビュー→公開）の有無

□ データ整合性ルール
  - 翻訳データの必須言語
  - デフォルト言語の扱い
  - 画像・ファイルの管理方法
```

## 2.3 サンプルデータ

### 実際のデータサンプル

**A. 全テーブルのサンプルデータ（最低3-5件）**
```sql
-- 実際の本番想定データを提供
INSERT INTO organizations (id, name, slug, description, is_published, created_at, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'AIO株式会社', 'aio-corp', 'AIソリューション企業', true, '2024-01-15 10:00:00+09', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440002', '株式会社テックイノベ', 'tech-innove', 'テクノロジー企業', false, '2024-02-01 14:30:00+09', '550e8400-e29b-41d4-a716-446655440011'),
-- [実際のデータパターンを網羅]

-- 必須項目:
-- ✓ 実際の日本語データ
-- ✓ 関連データの整合性確保
-- ✓ 公開・非公開データの両方
-- ✓ 異常値・エッジケースのデータ
-- ✓ null値のパターン
```

**B. JSON構造のサンプル**
```sql
-- JSONBカラムの実際の構造
INSERT INTO user_preferences (user_id, preferences) VALUES
('user-id-1', '{
  "theme": "dark",
  "language": "ja",
  "notifications": {
    "email": true,
    "browser": false,
    "frequency": "weekly"
  },
  "dashboard": {
    "widgets": ["stats", "recent_activity", "charts"],
    "layout": "grid"
  }
}');

-- 必須項目:
-- ✓ 実際のJSON構造の例
-- ✓ ネストしたオブジェクトの構造
-- ✓ 配列データの構造
-- ✓ null値の扱い
```

---

# Phase 3: UI/UX要件の詳細化

## 3.1 画面・機能要件

### 全画面の詳細仕様

**A. 画面一覧と機能**
```
□ ダッシュボード (/dashboard)
  - 表示データ: [具体的なデータ項目]
  - アクション: [可能な操作]
  - 権限制御: [表示・操作の権限]
  - レイアウト: [既存変更/新規作成]

□ 組織管理 (/dashboard/organizations)
  - 表示データ: [具体的なデータ項目]
  - フォーム項目: [入力必須・任意の区別]
  - バリデーション: [クライアント・サーバーの分担]
  - エラーハンドリング: [具体的なエラーパターン]

-- 全画面について同様に詳細記載
```

**B. データフローの詳細**
```
例: サービス作成フロー
1. /dashboard/services/new アクセス
2. 組織選択（ユーザーが複数組織に所属する場合）
3. 基本情報入力（name, slug, description）
4. 多言語情報入力（translations）
5. 画像アップロード（service_images）
6. プレビュー表示
7. 保存（下書き/公開の選択）

各ステップでの:
- 必要なデータ取得クエリ
- バリデーションルール
- エラーハンドリング
- 権限チェック
```

## 3.2 多言語対応の詳細仕様

### 国際化要件

**A. 言語切り替え動作**
```
□ 対応言語: [ja, en, その他]
□ デフォルト言語の決定ルール
  - ユーザー設定 > ブラウザ設定 > 組織設定 > システムデフォルト
□ URL構造: 
  - /ja/services/slug (日本語)
  - /en/services/slug (英語)
  - /services/slug (デフォルト言語)
□ 翻訳データの優先順位
  - 指定言語の翻訳 > デフォルト言語 > 英語 > エラー
```

**B. 翻訳データ管理**
```
□ 翻訳必須項目の定義
  - サービス: name, description (必須)
  - FAQ: question, answer (必須)
  - その他: [項目ごとに必須・任意を定義]

□ 翻訳なしデータの扱い
  - 表示方法: [元言語表示/非表示/警告表示]
  - 検索対象: [含める/除外]
  - API応答: [null/空文字/元言語]
```

## 3.3 認証・認可の詳細仕様

### 権限制御の完全定義

**A. ユーザーロール・権限マトリックス**
```
| 機能/データ          | 未認証 | 認証ユーザー | 組織メンバー | 組織管理者 | システム管理者 |
|---------------------|--------|-------------|-------------|-----------|---------------|
| 公開サービス閲覧      | ○      | ○           | ○           | ○         | ○             |
| 組織サービス作成      | ×      | ×           | ○           | ○         | ○             |
| 組織設定変更         | ×      | ×           | ×           | ○         | ○             |
| ユーザー管理         | ×      | ×           | ×           | ○         | ○             |
| 全データ参照         | ×      | ×           | ×           | ×         | ○             |
-- 全機能について詳細定義
```

**B. 認証フローの詳細**
```
□ ログイン方式: [email/password, Google OAuth, その他]
□ セッション管理: [Supabase Auth使用/独自実装]
□ 権限キャッシュ: [クライアント側キャッシュの有無・期間]
□ 権限変更時の動作: [即座に反映/次回ログイン時反映]
□ 組織招待フロー: [招待URL/メール/管理者承認]
```

---

# Phase 4: 実装方針の確定

## 4.1 技術的詳細仕様

### Next.js App Router実装方針

**A. Server Components / Client Componentsの分担**
```
□ Server Components使用箇所
  - データ取得が必要なページ
  - SEOが重要なページ
  - 認証が不要なページ
  - 具体的ページ: [全ページをリストアップ]

□ Client Components使用箇所
  - インタラクティブな機能
  - リアルタイム更新が必要
  - 状態管理が必要
  - 具体的コンポーネント: [全コンポーネントをリストアップ]
```

**B. データフェッチ戦略**
```
□ Server Actions使用箇所
  - フォーム送信処理
  - データ更新処理
  - 具体的処理: [全処理をリストアップ]

□ API Routes使用箇所
  - 外部システム連携
  - 複雑なビジネスロジック
  - 具体的エンドポイント: [全エンドポイントをリストアップ]

□ 直接Supabaseアクセス箇所
  - 単純なデータ取得
  - リアルタイム機能
  - 具体的箇所: [全箇所をリストアップ]
```

**C. キャッシュ戦略**
```
□ Next.js Cache設定
  - 静的生成対象ページ
  - ISR使用ページと更新間隔
  - 動的ページのキャッシュ戦略

□ Supabase キャッシュ設定
  - リアルタイム更新対象テーブル
  - キャッシュ期間設定
  - キャッシュ無効化トリガー
```

## 4.2 エラーハンドリング・ログ設計

### 包括的エラー対応

**A. エラーパターンの完全定義**
```
□ Supabaseエラー
  - RLS拒否: 403 Forbidden → ユーザー向けメッセージ
  - データ不存在: 404 Not Found → 適切なフォールバック表示
  - 制約違反: 409 Conflict → フォーム内エラー表示
  - その他: [全エラーコードのマッピング]

□ 業務エラー
  - 権限なしアクセス → 権限申請ページへ遷移
  - データ重複: → 既存データとの差分表示
  - バリデーションエラー: → フィールド単位エラー表示
  - その他: [想定される全業務エラー]

□ システムエラー
  - ネットワークエラー → リトライ機能付きエラー表示
  - サーバーエラー → エラーレポート送信
  - タイムアウト → 処理継続・中断の選択
  - その他: [技術的エラーの対応]
```

**B. ログ・監視要件**
```
□ 取得すべきログ
  - ユーザー操作ログ: [ページ遷移、フォーム送信、エラー]
  - システムログ: [API呼び出し、DB接続、パフォーマンス]
  - セキュリティログ: [認証失敗、権限エラー、異常アクセス]

□ ログの保持期間・分析方法
□ アラート設定（エラー率、レスポンス時間等）
```

## 4.3 パフォーマンス要件

### 性能目標の明確化

**A. レスポンス時間目標**
```
□ ページロード時間
  - 初回アクセス: [X秒以内]
  - キャッシュ有り: [X秒以内]
  - 画像を含むページ: [X秒以内]

□ API応答時間
  - データ取得API: [Xms以内]
  - データ更新API: [Xms以内]
  - 検索API: [Xms以内]

□ データベースクエリ
  - 単純SELECT: [Xms以内]
  - JOIN含むクエリ: [Xms以内]
  - 全文検索: [Xms以内]
```

**B. 同時接続・スループット要件**
```
□ 同時ユーザー数: [最大X人]
□ ピーク時アクセス: [秒間Xリクエスト]
□ データ量制限: [1テーブルXX万件まで]
```

---

# Phase 5: 最終チェック・実装開始前確認

## 5.1 実装準備チェックリスト

### 必須完了事項

**A. 設計書の完全性確認**
```
□ 全テーブルのDDL記載完了
□ 全RLSポリシー記載完了
□ 全ビュー・関数記載完了
□ サンプルデータ記載完了
□ 画面要件記載完了
□ エラーパターン記載完了
□ 権限マトリックス記載完了
□ パフォーマンス要件記載完了
```

**B. 技術的前提条件確認**
```
□ 開発環境での動作確認
□ Supabase設定の動作確認
□ 外部サービス連携の動作確認
□ テストデータの投入完了
□ CI/CDパイプラインの動作確認
```

## 5.2 リスク要因の洗い出し

### 想定される問題と対策

**A. 技術的リスク**
```
□ パフォーマンス問題
  - 大量データでの動作確認
  - 複雑クエリの最適化確認
  - インデックスの有効性確認

□ セキュリティリスク
  - RLSポリシーの穴の有無
  - XSS/SQLインジェクション対策
  - 認証バイパス可能性

□ 互換性リスク
  - Next.js バージョン互換性
  - Supabase 機能変更影響
  - 外部ライブラリ依存関係
```

**B. 業務的リスク**
```
□ 要件変更リスク
  - 仕様変更が予想される部分
  - ビジネス要件の不確定要素
  - ユーザーフィードバックによる変更

□ データ移行リスク
  - 既存データの不整合
  - 移行時間の超過
  - ロールバック不可能性
```

## 5.3 成功基準の定義

### 実装完了の判定基準

**A. 機能要件達成基準**
```
□ 全画面が仕様通り動作する
□ 全API エンドポイントが正常応答する
□ 全権限制御が正しく動作する
□ 全エラーパターンが適切に処理される
□ 全多言語対応が正しく動作する
□ パフォーマンス目標を達成する
```

**B. 品質要件達成基準**
```
□ TypeScript型エラーゼロ
□ ESLintエラーゼロ
□ テストカバレッジX%以上
□ セキュリティ脆弱性ゼロ
□ アクセシビリティ基準達成
□ SEO要件達成
```

---

# 付録: 実装時の注意事項

## A. コード品質基準

```typescript
// 型定義の例
interface ServiceWithTranslations {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
  translations: ServiceTranslation[];
  // 全フィールドを明確に定義
}

// エラーハンドリングの例
try {
  const result = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (result.error) {
    throw new StandardError({
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'サービス情報の取得に失敗しました'
    });
  }
  
  if (!result.data) {
    throw new StandardError({
      status: 404,
      code: 'SERVICE_NOT_FOUND', 
      message: 'サービスが見つかりません'
    });
  }
  
  return result.data;
} catch (error) {
  // 統一エラーハンドリング
}
```

## B. テスト要件

```typescript
// 単体テスト例
describe('Service API', () => {
  it('should return service with translations', async () => {
    // テストケースの完全な記載
  });
  
  it('should handle permission denied error', async () => {
    // エラーケースの完全な記載  
  });
});

// E2Eテスト例
test('Service creation flow', async ({ page }) => {
  // ユーザーシナリオテストの完全な記載
});
```

## C. ドキュメント要件

```markdown
# API ドキュメント例
## POST /api/services

### Request
```json
{
  "name": "AIコンサルティング",
  "slug": "ai-consulting", 
  "organization_id": "org-uuid",
  "translations": [
    {
      "language": "ja",
      "description": "日本語説明"
    }
  ]
}
```

### Response
- 200: Success
- 400: Validation Error  
- 403: Permission Denied
- 409: Slug Conflict
```

---

# 引き継ぎ完了確認

## 最終チェック

実装開始前に、以下の全項目が完了していることを確認してください：

- [ ] Phase 1: 現状確認・影響範囲分析 完了
- [ ] Phase 2: DB設計の完全定義 完了  
- [ ] Phase 3: UI/UX要件の詳細化 完了
- [ ] Phase 4: 実装方針の確定 完了
- [ ] Phase 5: 最終チェック・実装開始前確認 完了
- [ ] 全サンプルデータでの動作確認 完了
- [ ] ステークホルダーレビュー 完了

**すべてのチェックが完了した時点で、手戻り率5%以下での高品質実装が可能な状態となります。**

---

*このテンプレートは実際の開発プロジェクトでの経験に基づいて作成されており、一般的な問題パターンを網羅しています。プロジェクト固有の要件に応じて適宜調整してください。*