# Production Smoke Tests for AIO Hub

## 🎯 目的 Purpose

本番環境（https://aiohub.jp）の可用性・SEO健全性・基本機能を自動監視するための軽量テストシステムです。

### 監視対象
- ✅ 公開ページの可用性（200応答）
- ✅ SEO meta tags（canonical、JSON-LD構造化データ）
- ✅ 静的アセット（CSS、favicon等）
- ✅ robots.txt / sitemap.xml
- ✅ 認証フロー（一時アカウント使用）
- ✅ セキュリティリダイレクト

### 安全性原則
- ❌ **書き込み操作禁止** - 読み取り専用テスト
- ❌ **本番データ変更禁止** - 監視目的のみ
- ❌ **Stripe等決済機能除外** - 課金影響回避
- ✅ **一時アカウント使用** - テスト後自動削除

---

## 🚀 実行タイミング Execution Triggers

### 自動実行
- **mainブランチへのpush**: 新機能デプロイ時の自動確認
- **手動実行**: GitHub Actions画面から `workflow_dispatch`

### 将来的な拡張
- **Vercel Deployment Webhook**: 本番デプロイ完了時の自動実行
- **定期実行**: cron schedule（例：毎日午前9時）

---

## 📊 確認項目リスト Test Coverage

### 1. 公開ページ可用性
- **対象ページ**:
  - `/` - トップページ
  - `/aio` - AIoサービス紹介
  - `/pricing` - 料金プラン
  - `/hearing-service` - ヒアリングサービス
  - `/o/luxucare` - 代表企業ページ

- **確認内容**:
  - HTTP 200応答
  - ページコンテンツ存在（100文字以上）
  - エラーメッセージ非表示

### 2. SEO Meta Tags
- **canonical URL**: 各ページに絶対URL形式で存在
- **基本メタ情報**: title、description、Open Graph
- **文字数検証**: description 50文字以上

### 3. 構造化データ (JSON-LD)
- **Organization schema**: トップページに企業情報
- **FAQ schema**: FAQ存在ページで適切なマークアップ
- **schema.org準拠**: @context、@type正しく設定

### 4. 静的アセット
- **favicon.ico**: 存在確認
- **CSS bundles**: メインスタイルシート読み込み確認
- **画像アセット**: 主要ロゴ・アイコン類

### 5. SEO基本ファイル
- **robots.txt**: 
  - User-agent指定あり
  - Sitemap指定あり
- **sitemap.xml**:
  - XML形式正常
  - urlset要素存在

### 6. 認証フロー
- **ログインページ**: フォーム表示・動作確認
- **認証成功**: ダッシュボードアクセス可能
- **ログアウト**: セッション正常終了
- **アカウント管理**: 一時アカウント自動削除

### 7. セキュリティ
- **ダッシュボード保護**: 未認証でのアクセス制限
- **管理画面保護**: admin routesの適切な認証
- **リダイレクト**: 認証が必要なページの適切な誘導

---

## 🔧 ローカル実行方法 Local Execution

### 事前準備
```bash
# 環境変数設定
cp .env.prod.test .env.local

# 必要な環境変数
export SUPABASE_URL="https://your-prod-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 実行コマンド
```bash
# テストユーザー作成
npx ts-node scripts/create-prod-test-user.ts

# スモークテスト実行
npx playwright test tests/e2e/prod-smoke.spec.ts

# テストユーザー削除
npx ts-node scripts/cleanup-prod-test-user.ts
```

### レポート確認
```bash
# HTMLレポート表示
npx playwright show-report

# Trace Viewer（詳細分析）
npx playwright show-trace test-results/trace.zip
```

---

## 🔐 GitHub Secrets設定 Secrets Configuration

### 必須Secrets
GitHub Repository → Settings → Secrets and variables → Actions

```bash
SUPABASE_URL_PROD
# 本番SupabaseプロジェクトのURL
# 例: https://your-project.supabase.co

SUPABASE_SERVICE_KEY_PROD  
# 本番Supabaseのservice_roleキー
# 注意: 一時ユーザー作成・削除にのみ使用
```

### セキュリティ考慮事項
- ✅ **production専用キー**: テスト環境と完全分離
- ✅ **最小権限**: ユーザー管理権限のみ
- ❌ **anon key使用禁止**: service_roleのみ使用
- ✅ **定期ローテーション**: キーの定期更新推奨

---

## 🎬 アーティファクト確認方法 Artifact Analysis

### GitHub Actions実行後
1. **Actions タブ** → 該当ワークフロー選択
2. **Artifacts セクション** でダウンロード

### アーティファクト種類
#### 📊 `prod-smoke-report-{run_id}`
- **HTML形式レポート**
- ブラウザで `index.html` 開く
- テスト結果・実行時間確認

#### 🎬 `prod-smoke-results-{run_id}`
- **診断ファイル群**:
  - `trace.zip` - Playwright Trace Viewer用
  - `video.webm` - テスト実行画面録画
  - `screenshot.png` - 失敗時スクリーンショット

### Trace Viewer活用
```bash
# 詳細分析
npx playwright show-trace path/to/trace.zip

# 提供情報:
# - タイムライン形式実行過程
# - DOM状態・ネットワーク・ログ
# - パフォーマンス情報
```

---

## 🚨 トラブル時の対応 Troubleshooting

### よくある失敗パターン

#### 1. 認証エラー
**症状**: ログイン失敗、ユーザー作成エラー

**原因**:
- テストユーザーの重複
- Supabase権限不足
- パスワードポリシー違反

**対処法**:
```bash
# 手動でテストユーザー確認・削除
# Supabase Dashboard → Authentication → Users
# smoke-test@aiohub.jp を検索・削除

# スクリプト再実行
npx ts-node scripts/create-prod-test-user.ts
```

#### 2. ページ応答エラー  
**症状**: 公開ページで200以外の応答

**原因**:
- 本番サーバーの一時的障害
- CDN問題
- DNS問題

**対処法**:
- 手動で該当URLアクセス確認
- ステータスページ確認
- 再実行で一時的問題か判定

#### 3. アセット読み込み失敗
**症状**: CSS・画像等の404エラー

**原因**:
- Next.js ビルドハッシュ変更
- CDN sync遅延

**対処法**:
- ブラウザで手動確認
- ハードリフレッシュ試行
- CDN purge実行

#### 4. SEO/構造化データエラー
**症状**: meta tag・JSON-LDの不足

**原因**:
- 最新コードでのSEO実装変更
- レンダリング遅延

**対処法**:
- ソースコード確認
- 手動でページ検証
- lighthouse audit実行

---

## 📈 運用・改善 Operations & Improvements

### 監視メトリクス
- **実行成功率**: 95%以上維持目標
- **平均実行時間**: 5分以内
- **失敗時復旧時間**: 24時間以内

### 定期メンテナンス
```bash
# 月次実行推奨
# 1. 本番環境手動確認
curl -I https://aiohub.jp
curl -I https://aiohub.jp/aio

# 2. テストケース更新確認
# 新機能追加時のテスト項目追加

# 3. スクリプト動作確認
npm run test:health
```

### 拡張計画
- **パフォーマンス監視**: Core Web Vitals測定
- **アクセシビリティ**: a11y基本チェック
- **モバイル対応**: レスポンシブデザイン確認
- **多言語対応**: 国際化URL確認

---

## 🆘 サポート・問い合わせ Support

### 緊急時対応
1. **本番サービス影響**: 即座に手動確認
2. **GitHub Actions失敗**: アーティファクト詳細確認
3. **連続失敗**: 本番環境側の問題可能性

### 連絡先・エスカレーション
- **開発チーム**: GitHub Issues作成
- **インフラ**: Vercel・Supabaseダッシュボード確認
- **監視**: 外部監視サービス併用推奨

---

## 📝 ログ・記録 Logging & Records

### 実行ログ保存
- **GitHub Actions logs**: 90日間保持
- **Artifacts**: 7日間保持
- **手動実行記録**: Issue/PR経由で永続化

### 監査証跡
```bash
# 本番アクセスログ
echo "$(date): Production smoke test executed" >> logs/prod-smoke.log

# テストユーザー作成・削除ログ
# scripts内で自動記録
```