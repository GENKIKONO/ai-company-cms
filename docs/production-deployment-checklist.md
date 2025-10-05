# 本番デプロイメント最終チェックリスト

## 🚀 本番デプロイ前の必須確認事項

### 1. 環境設定 (.env.production)
- [ ] `.env.production`ファイルが存在し、以下が設定されている
  - [ ] `NEXT_PUBLIC_SITE_URL="https://aiohub.jp"`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (本番Supabase URL)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (本番Supabase匿名キー)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (本番サービスロールキー)

### 2. Supabase設定確認
- [ ] **Auth設定 > URL Configuration**
  - [ ] Site URL: `https://aiohub.jp`
  - [ ] Redirect URLs: `https://aiohub.jp/auth/callback`
- [ ] **Database > RLS**
  - [ ] 全テーブルでRow Level Security (RLS)が有効
  - [ ] 適切なポリシーが設定済み
- [ ] **Database Migration**
  - [ ] 最新のマイグレーション適用済み: `20251005_fix_schema_inconsistency.sql`

### 3. 自動検証システム実行

#### 3.1 検証コマンド
```bash
# ローカル環境の検証
npm run verify:local

# 本番環境の検証  
npm run verify:prod

# レポート生成
npm run verify:report
```

#### 3.2 完全手動実行（デバッグ用）
```bash
# 本番環境での検証実行
./scripts/verify-deployment.sh production aiohub.jp

# ローカル環境での検証実行
./scripts/verify-deployment.sh development localhost:3001
```

**期待される結果:**
- [ ] ✅ 全ヘルスチェック通過 (ok: true)
- [ ] ✅ 環境変数すべて設定済み
- [ ] ✅ Supabase接続成功
- [ ] ✅ 認証システム正常動作
- [ ] ✅ 内部API応答正常 (401/200)
- [ ] ✅ 自動リトライによる一時的障害回復

### 4. 手動確認事項

#### 4.1 基本機能確認
- [ ] **ホームページ**: `https://aiohub.jp` が正常表示
- [ ] **認証**: サインイン・サインアップが正常動作
- [ ] **ダッシュボード**: ログイン後の画面が適切に表示
- [ ] **組織管理**: 組織作成・表示が正常動作

#### 4.2 エラーハンドリング確認
- [ ] **未認証ユーザー**: 適切にサインイン画面へリダイレクト
- [ ] **存在しない組織**: 新規作成フォームが表示
- [ ] **API エラー**: 適切なエラーメッセージ表示

### 5. パフォーマンス確認
- [ ] **ページ読み込み速度**: 3秒以内
- [ ] **API レスポンス時間**: 1秒以内
- [ ] **データベース接続**: 正常かつ高速

### 6. セキュリティ確認
- [ ] **HTTPS**: 全ページでSSL/TLS暗号化
- [ ] **認証**: 適切なセッション管理
- [ ] **RLS**: データベースアクセス制御有効
- [ ] **環境変数**: 秘匿情報が適切に保護

## 🔧 トラブルシューティング

### 健全性チェックが失敗する場合

1. **Environment Variables失敗**
   ```bash
   # .env.productionを確認
   cat .env.production
   ```

2. **Supabase Connection失敗**
   - Supabaseプロジェクト設定を確認
   - サービスロールキーが正しいか確認

3. **Internal API Connectivity失敗**
   - ビルドエラーがないか確認
   - デプロイステータスを確認

### 自動検証システムの流れ

1. **実行**: `npm run verify:local` または `npm run verify:prod`
2. **ログ出力**: `logs/verify-{env}-{domain}-{timestamp}.log` に詳細ログ保存
3. **自動リトライ**: 失敗時は最大3回、指数バックオフでリトライ
4. **結果表示**: 色付きで成功/失敗を明確表示
5. **レポート生成**: `npm run verify:report` でMarkdownレポート作成

### 検証項目詳細

| 項目 | 期待値 | 失敗時の対処 |
|------|--------|-------------|
| ルート疎通 | HTTP 200/301/302 | DNS設定、サーバー起動状況確認 |
| robots.txt | HTTP 200/404 | 静的ファイル配信設定確認 |
| sitemap.xml | HTTP 200/404 | SEO設定とファイル存在確認 |
| ヘルスチェックAPI | ok: true | 環境変数、Supabase接続確認 |
| 組織API | HTTP 401/200 | 認証システム、DB接続確認 |
| デバッグAPI | HTTP 200 | 内部ルーティング、API機能確認 |

### ログとレポートの場所

- **詳細ログ**: `logs/verify-{環境}-{ドメイン}-{タイムスタンプ}.log`
- **最新レポート**: `logs/last-verify-report.md`
- **ログ確認**: `ls -la logs/` で一覧表示

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 401 Unauthorized | Supabase設定不備 | キー・URL設定を再確認 |
| 500 Internal Error | マイグレーション未適用 | DB Migration実行 |
| リダイレクトループ | URL設定不一致 | SITE_URLとSupabase設定一致確認 |
| Health Check Timeout | レスポンス遅延 | 5-10分待って再実行 |
| Connection Failed | ネットワーク問題 | DNS、ファイアウォール確認 |
| Retry Attempts | 一時的障害 | 自動回復を待つ（正常動作） |

## 📋 デプロイ後の確認事項

### 即座に確認 (デプロイ後5分以内)
- [ ] メインページアクセス可能
- [ ] ヘルスチェックAPI正常
- [ ] 認証フロー動作確認

### 短期確認 (デプロイ後30分以内)
- [ ] 全主要機能動作確認
- [ ] エラーログ監視
- [ ] パフォーマンス指標確認

### 中期確認 (デプロイ後24時間以内)
- [ ] ユーザー利用状況監視
- [ ] システム安定性確認
- [ ] バックアップ動作確認

## 🚨 緊急時の対応

### ロールバック手順
1. 前のバージョンに即座に切り戻し
2. データベースの整合性確認
3. 影響範囲の調査と報告

### 緊急連絡先
- 開発チーム: [連絡先]
- インフラチーム: [連絡先]
- プロダクトオーナー: [連絡先]

---

**⚠️ 重要**: このチェックリストの全項目をクリアしてからのみ本番デプロイを実行してください。