# 🔒 本番環境 Basic認証 確認手順

## 🎯 確認目的

AIO Hub本番デプロイ後、管理画面のみBasic認証で保護され、公開ページは制限なくアクセスできることを確認する。

## 📋 確認手順

### 1. 公開ページの確認（Basic認証なし）

以下のページは誰でもアクセス可能である必要があります：

```
✅ https://your-domain.com/
   → トップページが正常表示される
   → pricing値段: ¥2,980 / ¥8,000 / ¥15,000 が表示される

✅ https://your-domain.com/pricing  
   → pricing料金表が正常表示される
   → Basic認証ダイアログは出ない

✅ https://your-domain.com/hearing-service
   → hearing-serviceページが正常表示される
   → 青背景CTA、余白レイアウトが保持されている
   → Basic認証ダイアログは出ない

✅ https://your-domain.com/api/public/stats
   → JSON形式のレスポンス返却（Basic認証なし）
```

### 2. 管理画面の確認（Basic認証あり）

以下のパスはBasic認証が必要です：

```
🔒 https://your-domain.com/dashboard
   → ブラウザのBasic認証ダイアログが表示される
   → キャンセルすると401 Unauthorized
   → 正しいID/PASSで通すと管理画面表示

🔒 https://your-domain.com/admin
   → Basic認証ダイアログが表示される

🔒 https://your-domain.com/api/admin/stats  
   → Basic認証ダイアログまたは401 Unauthorized
```

## 🔧 環境変数設定

Vercel/本番環境で設定する環境変数：

```bash
# Basic認証を有効化
DASHBOARD_BASIC_USER=admin
DASHBOARD_BASIC_PASS=your_secure_password_here

# Basic認証を無効化する場合（インフラ側認証使用時）
DISABLE_APP_BASIC_AUTH=false  # デフォルト：有効
# DISABLE_APP_BASIC_AUTH=true  # 無効化（Vercel/Cloudflareでかける場合）
```

## 🚨 トラブルシューティング

### ケース1: 公開ページ（/, /pricing, /hearing-service）でBasic認証が求められる

**原因**: 保護対象パスの設定ミス  
**解決方法**: 
1. middleware.tsの`PUBLIC_PATHS_BASIC_AUTH`を確認
2. 該当パスが含まれているか確認
3. デプロイ・再起動

### ケース2: 管理画面でBasic認証が求められない

**チェック項目**:
1. 環境変数設定確認
   ```bash
   DASHBOARD_BASIC_USER=admin
   DASHBOARD_BASIC_PASS=your_password
   DISABLE_APP_BASIC_AUTH=false
   ```
2. Vercelの環境変数がProductionに適用されているか確認
3. デプロイ・再起動

### ケース3: Basic認証で認証エラー

**チェック項目**:
1. パスワードに特殊文字が含まれていないか
2. 環境変数の値に余計な空白やクォート記号がないか
3. ブラウザのパスワード自動保存機能の確認

### ケース4: 緊急時の認証無効化

本番で問題が発生した場合の緊急対応：

```bash
# Vercel Dashboard > Project > Settings > Environment Variables
DISABLE_APP_BASIC_AUTH=true
```

設定後、再デプロイで即座にBasic認証が無効化されます。

## 📱 ブラウザ別確認

各ブラウザでBasic認証ダイアログの見た目が異なります：

- **Chrome**: 「サインイン」ダイアログ
- **Firefox**: 「認証が必要」ダイアログ
- **Safari**: 「username and password」ダイアログ
- **Edge**: 「サインイン」ダイアログ

いずれの場合も：
- ユーザー名: `admin` (DASHBOARD_BASIC_USERの値)
- パスワード: 設定した`DASHBOARD_BASIC_PASS`の値

## ✅ 確認完了チェックリスト

- [ ] `/` トップページ → Basic認証なし、正常表示
- [ ] `/pricing` → Basic認証なし、料金 ¥2,980/¥8,000/¥15,000 表示
- [ ] `/hearing-service` → Basic認証なし、青背景CTA・レイアウト保持
- [ ] `/api/public/stats` → Basic認証なし、JSON応答
- [ ] `/dashboard` → Basic認証あり、正しいID/PASSで通る
- [ ] `/admin` → Basic認証あり
- [ ] `/api/admin/*` → Basic認証あり
- [ ] 緊急無効化テスト → `DISABLE_APP_BASIC_AUTH=true`で無効化確認

**✅ 全項目クリア = AIO Hub本番環境認証設定完了**