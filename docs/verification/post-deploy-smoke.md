# デプロイ後スモークテスト手順書

## 🎯 概要

本番デプロイ後の動作確認をブラウザとDevToolsで実施する手順書です。
Header・Cookie・Status・Network・Console の観点から商用レベルの品質を検証します。

**想定実行時間**: 15-20分  
**推奨ブラウザ**: Chrome/Edge（DevTools機能が豊富）

---

## 事前準備

### ブラウザ設定
1. シークレットモード（プライベートブラウジング）を開く
2. DevToolsを開く（F12 または Ctrl+Shift+I）
3. 以下のタブを準備:
   - **Console**: JavaScriptエラー確認用
   - **Network**: HTTP通信確認用
   - **Application**: Cookie・LocalStorage確認用

### テスト用データ
- テスト用メールアドレス: `smoke-test@example.com`
- テスト用パスワード: `SecureTest123!`

---

## Test 1: サイト基本動作確認

### 1.1 初期アクセス
**操作**: https://aiohub.jp にアクセス

**DevTools → Network 確認項目**
- [ ] Status: 200 OK
- [ ] Response Time: < 3秒
- [ ] Content-Type: text/html
- [ ] Cache-Control: ヘッダー存在

**DevTools → Console 確認項目**
- [ ] JavaScript エラーなし（赤色メッセージなし）
- [ ] 404エラーなし（リソース読み込み失敗なし）
- [ ] セキュリティ警告なし

**ブラウザ表示確認**
- [ ] ページが正常に表示される
- [ ] ナビゲーションメニューが表示される
- [ ] HTTPSの鍵アイコンが緑色

### 1.2 認証ページアクセス
**操作**: `/auth/signup` に遷移

**DevTools → Network 確認項目**
- [ ] Status: 200 OK  
- [ ] リダイレクトなし（直接表示）
- [ ] CSS/JSリソースが全て200で読み込み成功

**ブラウザ表示確認**
- [ ] サインアップフォームが表示される
- [ ] 入力フィールドが正常に動作
- [ ] 「既にアカウントをお持ちの方」リンク存在

---

## Test 2: 認証フロー確認

### 2.1 新規ユーザー登録
**操作**: サインアップフォームに入力・送信

**DevTools → Network 確認項目**
- [ ] POST /auth/v1/signup → Status: 200
- [ ] Response Body に user データ含有
- [ ] Set-Cookie ヘッダー存在 (`sb-*-auth-token`)

**DevTools → Application → Cookies 確認項目**
```
Domain: aiohub.jp
Name: sb-chyicolujwhkycpkxbej-auth-token
Value: [JWT形式の長い文字列]
HttpOnly: ✓
Secure: ✓
SameSite: Lax
```

**ブラウザ表示確認**
- [ ] 確認メール送信メッセージ表示
- [ ] エラーメッセージなし

### 2.2 確認メール検証
**操作**: メールボックスでConfirmationURL取得・アクセス

**DevTools → Network 確認項目（/auth/confirm アクセス時）**
- [ ] GET /auth/confirm?token=... → Status: 200
- [ ] POST /auth/v1/verify → Status: 200  
- [ ] 最終的に Dashboard にリダイレクト（302）

**DevTools → Application → Cookies 確認項目**
- [ ] 認証Cookie の値が更新されている
- [ ] expires_at が適切な未来日時

**ブラウザ表示確認**
- [ ] ダッシュボード画面が表示される
- [ ] ユーザー情報（メールアドレス）が表示される

### 2.3 セッション永続性テスト
**操作**: ページをリロード（F5）

**DevTools → Network 確認項目**
- [ ] GET / → Status: 200
- [ ] Cookie が自動送信されている（Request Headers）
- [ ] 追加の認証API呼び出しなし（効率的）

**DevTools → Console 確認項目**
- [ ] 認証エラーなし
- [ ] セッション切れ警告なし

**ブラウザ表示確認**
- [ ] ログイン状態が保持されている
- [ ] ダッシュボードが即座に表示される

---

## Test 3: エラーハンドリング確認

### 3.1 重複登録エラー
**操作**: 同じメールアドレスで再度サインアップ

**DevTools → Network 確認項目**
- [ ] POST /auth/v1/signup → Status: 422 (Unprocessable Entity)
- [ ] Response Body に適切なエラーメッセージ

**ブラウザ表示確認**
- [ ] 「既に登録済みです」日本語エラーメッセージ
- [ ] ログインページへのリンク表示

### 3.2 無効なトークンエラー
**操作**: 無効な確認リンクにアクセス（token=invalid）

**DevTools → Network 確認項目**
- [ ] GET /auth/confirm?token=invalid → Status: 400
- [ ] エラーページにリダイレクト

**ブラウザ表示確認**
- [ ] 適切な日本語エラーメッセージ
- [ ] 再送信リンクまたはサポート情報

---

## Test 4: パフォーマンス確認

### 4.1 ページ読み込み速度
**DevTools → Network → Disable cache チェックON**

**測定項目**
- [ ] HTML読み込み: < 1秒
- [ ] 全リソース読み込み完了: < 3秒
- [ ] First Contentful Paint (FCP): < 2秒
- [ ] Largest Contentful Paint (LCP): < 2.5秒

### 4.2 JavaScript パフォーマンス
**DevTools → Performance → Record で測定**

**確認項目**
- [ ] メインスレッドブロッキング: < 50ms
- [ ] React Hydration: < 1秒
- [ ] インタラクション応答時間: < 100ms

### 4.3 ネットワーク効率性
**DevTools → Network 確認項目**
- [ ] 重複リクエストなし
- [ ] 適切なCache-Control設定
- [ ] 不要な大容量リソース読み込みなし
- [ ] HTTP/2 使用確認

---

## Test 5: セキュリティ確認

### 5.1 HTTPS設定
**DevTools → Security タブ**
- [ ] Connection: Secure (HTTPS)
- [ ] Certificate: Valid (有効)
- [ ] 混合コンテンツ警告なし

### 5.2 Cookie セキュリティ
**DevTools → Application → Cookies**

認証Cookie (`sb-*-auth-token`) の設定確認:
```
✓ HttpOnly: true (XSS対策)
✓ Secure: true (HTTPS必須)
✓ SameSite: Lax (CSRF対策)
✓ Domain: aiohub.jp (適切なスコープ)
```

### 5.3 Content Security Policy
**DevTools → Network → Response Headers**
- [ ] CSP ヘッダー存在
- [ ] unsafe-inline の未使用
- [ ] 適切なディレクティブ設定

---

## Test 6: データベース統合確認

### 6.1 プロフィール自動作成確認
**事前準備**: Supabase SQL Editor で確認

```sql
-- 新規登録ユーザーのプロフィール確認
SELECT 
    u.email,
    u.email_confirmed_at,
    au.role,
    au.created_at,
    au.updated_at
FROM auth.users u
JOIN app_users au ON u.id = au.id
WHERE u.email = 'smoke-test@example.com'
ORDER BY au.created_at DESC;
```

**期待結果**:
- [ ] 1件のレコードが存在
- [ ] role = 'org_owner'
- [ ] email が正しく設定
- [ ] created_at がサインアップ時刻と一致

### 6.2 RLSポリシー動作確認
```sql
-- 一般ユーザー権限での確認（anon keyで実行想定）
SELECT COUNT(*) FROM app_users; 
```

**期待結果**:
- [ ] 自分のプロフィールのみ取得（件数制限確認）
- [ ] 権限エラーが適切に発生

---

## 判定基準

### ✅ PASS判定条件
- [ ] Test 1-3 の全項目で異常なし
- [ ] Test 4 のパフォーマンス基準をクリア
- [ ] Test 5 のセキュリティ基準をクリア
- [ ] Test 6 のデータベース統合で期待結果

### ❌ FAIL時の対処
**優先度 High（即対処）**
- JavaScript エラー
- 認証フロー失敗
- セキュリティ設定不備

**優先度 Medium（改善対象）**
- パフォーマンス基準未達
- エラーメッセージ不適切

**優先度 Low（監視対象）**
- 軽微なUI表示問題

---

## 継続監視項目

### 日常チェック項目
- [ ] 認証成功率 > 95%
- [ ] ページ読み込み時間 < 3秒平均
- [ ] JavaScript エラー数 < 10件/日
- [ ] セッション切れ報告 < 1件/日

### 週次チェック項目
- [ ] セキュリティヘッダー設定確認
- [ ] SSL証明書有効期限確認
- [ ] データベースパフォーマンス確認
- [ ] ログ監視とエラー傾向分析

---

## 📊 テスト結果レポート

**実行日時**: ___________  
**実行者**: ___________  
**ブラウザ**: Chrome/Edge Version: _____

### 結果サマリー
- [ ] Test 1: サイト基本動作 ✅/❌
- [ ] Test 2: 認証フロー ✅/❌  
- [ ] Test 3: エラーハンドリング ✅/❌
- [ ] Test 4: パフォーマンス ✅/❌
- [ ] Test 5: セキュリティ ✅/❌
- [ ] Test 6: データベース統合 ✅/❌

### 検出した問題
1. ________________
2. ________________
3. ________________

### 総合判定
- [ ] **PASS**: 本番稼働可能
- [ ] **CONDITIONAL PASS**: 軽微な改善後稼働可能  
- [ ] **FAIL**: 要修正

---

**🎯 このスモークテストの完全クリアにより、商用レベルの品質が保証されます** ✅