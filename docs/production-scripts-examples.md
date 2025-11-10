# 🚀 本番確認スクリプト 実行例

## 📋 scripts/verify-production-readiness.js 実行例

### ✅ 正常ケース（全項目クリア）

```bash
$ node scripts/verify-production-readiness.js
```

**出力例:**

```
🚀 AIO Hub - 本番デプロイ前検証開始

🔍 環境変数読み込み
ℹ [INFO] 環境変数ファイル読み込み: .env.production

🔍 Basic認証設定確認
✅ [SUCCESS] Basic認証設定確認済み (ユーザー: admin)

🔍 必須ページファイル確認
✅ [SUCCESS] トップページ: src/app/page.tsx
✅ [SUCCESS] 料金ページ: src/app/pricing/page.tsx
✅ [SUCCESS] hearing-serviceページ: src/app/hearing-service/page.tsx
✅ [SUCCESS] 料金テーブルコンポーネント: src/components/pricing/PricingTable.tsx

🔍 料金設定確認
✅ [SUCCESS] 料金確認済み: ¥2,980
✅ [SUCCESS] 料金確認済み: ¥8,000
✅ [SUCCESS] 料金確認済み: ¥15,000

🔍 middleware.ts保護パス設定確認
✅ [SUCCESS] ダッシュボード保護: /^\/dashboard/
✅ [SUCCESS] 管理者ページ保護: /^\/admin/
✅ [SUCCESS] 管理者API保護: /^\/api\/admin/
✅ [SUCCESS] トップページ公開: '/'
✅ [SUCCESS] 料金ページ公開: '/pricing'
✅ [SUCCESS] hearing-serviceページ公開: '/hearing-service'
✅ [SUCCESS] Basic認証関数が実装されています

🔍 ビルドヘルス確認
ℹ [INFO] TypeScript型チェック実行中...
✅ [SUCCESS] TypeScript型チェック: OK
ℹ [INFO] ESLint実行中...
✅ [SUCCESS] ESLint: OK

📋 検証結果サマリー
✅ [SUCCESS] ✅ 本番デプロイ前検証完了 - 全項目クリア
✅ [SUCCESS] デプロイ実行可能です

💡 NextAuth/Supabase Auth移行時のヒント:
  - checkBasicAuthConfig → checkNextAuthConfig に置き換え
  - BASIC_AUTH_PROTECTED_PATHS → AUTH_PROTECTED_PATHS として再利用
  - PUBLIC_PATHS_BASIC_AUTH → PUBLIC_PATHS として継続利用
```

### ❌ エラーケース（設定不備）

```bash
$ node scripts/verify-production-readiness.js
```

**出力例:**

```
🚀 AIO Hub - 本番デプロイ前検証開始

🔍 環境変数読み込み
ℹ [INFO] 環境変数ファイル読み込み: .env.production

🔍 Basic認証設定確認
❌ [ERROR] Basic認証設定が不完全です:
❌ [ERROR]   - DASHBOARD_BASIC_PASS が未設定
❌ [ERROR] 本番環境では管理画面が無防備になります

🔍 必須ページファイル確認
✅ [SUCCESS] トップページ: src/app/page.tsx
❌ [ERROR] 必須ページが見つかりません: src/app/pricing/page.tsx (料金ページ)

📋 検証結果サマリー
❌ [ERROR] ❌ 検証失敗 - 2件のエラー

🚫 デプロイ前に以下の問題を解決してください:
  1. Basic認証設定が不完全です:
  2.   - DASHBOARD_BASIC_PASS が未設定
```

## 🌐 scripts/check-live-status.js 実行例

### ✅ 正常ケース（本番環境確認OK）

```bash
$ node scripts/check-live-status.js https://your-domain.com
```

**出力例:**

```
🌐 AIO Hub - 本番ライブ状況確認開始

ℹ [INFO] 確認対象URL: https://your-domain.com

🔍 公開ページアクセス確認
ℹ [INFO] 確認中: https://your-domain.com/
✅ [SUCCESS] トップページ: 200 OK - 必須コンテンツ確認済み
ℹ [INFO] 確認中: https://your-domain.com/pricing
✅ [SUCCESS] 料金ページ: 200 OK - 必須コンテンツ確認済み
ℹ [INFO] 確認中: https://your-domain.com/hearing-service
✅ [SUCCESS] hearing-serviceページ: 200 OK - 必須コンテンツ確認済み

🔍 保護ページアクセス確認
ℹ [INFO] 確認中: https://your-domain.com/dashboard
✅ [SUCCESS] ダッシュボード: 401 Unauthorized - 適切に保護されています
✅ [SUCCESS] ダッシュボード: Basic認証ダイアログが設定されています
ℹ [INFO] 確認中: https://your-domain.com/admin
✅ [SUCCESS] 管理者ページ: 401 Unauthorized - 適切に保護されています
ℹ [INFO] 確認中: https://your-domain.com/api/admin/test
✅ [SUCCESS] 管理者API: 401 Unauthorized - 適切に保護されています

🔍 Basic認証動作確認
ℹ [INFO] 認証テスト: https://your-domain.com/dashboard
✅ [SUCCESS] Basic認証: 正しい資格情報で認証成功

📋 ライブ確認結果サマリー
✅ [SUCCESS] ✅ Production ready - 本番環境正常動作確認完了
✅ [SUCCESS] AIO Hub は本番公開可能な状態です

🔧 CI/CD統合用出力:
STATUS=success
ERRORS=0
WARNINGS=0
```

### ⚠️ Basic認証無効化ケース

```bash
$ DISABLE_APP_BASIC_AUTH=true node scripts/check-live-status.js
```

**出力例:**

```
🌐 AIO Hub - 本番ライブ状況確認開始

ℹ [INFO] 確認対象URL: http://localhost:3000

🔍 公開ページアクセス確認
✅ [SUCCESS] トップページ: 200 OK - 必須コンテンツ確認済み
✅ [SUCCESS] 料金ページ: 200 OK - 必須コンテンツ確認済み
✅ [SUCCESS] hearing-serviceページ: 200 OK - 必須コンテンツ確認済み

🔍 保護ページアクセス確認
⚠️ [WARNING] Basic認証が無効化されています (DISABLE_APP_BASIC_AUTH=true)
⚠️ [WARNING] インフラ側認証の確認を手動で実施してください

🔍 Basic認証動作確認
ℹ [INFO] Basic認証が無効化されているため、動作確認をスキップします

📋 ライブ確認結果サマリー
✅ [SUCCESS] ✅ Production ready - 本番環境正常動作確認完了
✅ [SUCCESS] AIO Hub は本番公開可能な状態です
ℹ [INFO] 警告: 2件（動作に影響なし）
```

## 🛠️ 開発環境での実行

### ローカル開発サーバーでのテスト

```bash
# 開発サーバー起動（別ターミナル）
npm run dev

# デプロイ前検証実行
node scripts/verify-production-readiness.js

# ライブ確認実行（ローカル）
node scripts/check-live-status.js http://localhost:3000
```

### 本番ビルド環境でのテスト

```bash
# 本番ビルド作成
npm run build

# 本番サーバー起動（別ターミナル）
npm run start

# 検証実行
node scripts/verify-production-readiness.js
node scripts/check-live-status.js http://localhost:3000
```

## 🔧 GitHub Actions統合時の出力

### CI/CDパイプライン内での実行

```yaml
- name: 🔧 本番デプロイ前検証
  run: |
    echo "::group::Production Readiness Check"
    node scripts/verify-production-readiness.js
    echo "::endgroup::"
```

**GitHub Actions出力:**

```
🔧 本番デプロイ前検証
::group::Production Readiness Check
🚀 AIO Hub - 本番デプロイ前検証開始
...
✅ [SUCCESS] ✅ 本番デプロイ前検証完了 - 全項目クリア
::endgroup::
```

## 🚨 エラー処理とリトライ

### 一時的なネットワークエラー

```bash
$ node scripts/check-live-status.js https://your-domain.com
```

```
🔍 保護ページアクセス確認
❌ [ERROR] ダッシュボード: リクエストエラー - Request timeout
⚠️ [WARNING] ダッシュボードへのアクセス確認をスキップしました

📋 ライブ確認結果サマリー
✅ [SUCCESS] ✅ Production ready - 本番環境正常動作確認完了
ℹ [INFO] 警告: 1件（動作に影響なし）
```

### パスワード設定エラー

```bash
$ DASHBOARD_BASIC_PASS=change_me node scripts/verify-production-readiness.js
```

```
🔍 Basic認証設定確認
❌ [ERROR] DASHBOARD_BASIC_PASS にデフォルト値が設定されています。必ず変更してください

📋 検証結果サマリー
❌ [ERROR] ❌ 検証失敗 - 1件のエラー

🚫 デプロイ前に以下の問題を解決してください:
  1. DASHBOARD_BASIC_PASS にデフォルト値が設定されています。必ず変更してください
```

## 📊 実行時間とパフォーマンス

- **verify-production-readiness.js**: 通常3-5秒
- **check-live-status.js**: 通常5-10秒（ネットワーク状況による）
- **CI/CD統合時**: 追加で30-60秒程度

**タイムアウト設定:**
- HTTPリクエスト: 10秒
- TypeScriptチェック: 制限なし（通常30-60秒）
- ESLint: 制限なし（通常10-30秒）