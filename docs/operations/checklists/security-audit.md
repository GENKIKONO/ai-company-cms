# セキュリティ監査チェックリスト

## 🔒 認証・認可

### 1. ユーザー認証
- [ ] **パスワードポリシー**
  - [ ] 最小8文字、英数字・記号組み合わせ
  - [ ] 辞書攻撃対策 (一般的な単語禁止)
  - [ ] パスワード履歴 (過去5回分重複禁止)
  - [ ] 定期変更推奨 (90日)

- [ ] **多要素認証 (MFA)**
  - [ ] 管理者アカウント必須
  - [ ] SMS認証または認証アプリ
  - [ ] バックアップコード提供
  - [ ] 管理者以外も推奨設定

- [ ] **セッション管理**
  - [ ] セッション有効期限設定 (24時間)
  - [ ] 非アクティブタイムアウト (30分)
  - [ ] 同時ログイン制限
  - [ ] ログアウト時の完全セッション削除

```bash
# セッション設定確認
curl -s https://aiohub.jp/api/auth/session | jq '.expires_at'

# 多重ログイン確認
psql -c "SELECT user_id, count(*) FROM auth.sessions GROUP BY user_id HAVING count(*) > 1;"
```

### 2. 権限制御
- [ ] **ロールベースアクセス制御 (RBAC)**
  - [ ] admin: 全システム管理権限
  - [ ] partner: パートナー機能アクセス
  - [ ] org_owner: 組織管理権限
  - [ ] user: 一般ユーザー権限

- [ ] **Row Level Security (RLS)**
  - [ ] 全テーブルでRLS有効
  - [ ] ユーザー自身のデータのみアクセス可能
  - [ ] 組織オーナーは組織データアクセス可能
  - [ ] 管理者は必要最小限のアクセス

```sql
-- RLS設定確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- RLSポリシー確認
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. API セキュリティ
- [ ] **JWT トークン**
  - [ ] 適切な有効期限設定
  - [ ] 秘密鍵の安全な管理
  - [ ] リフレッシュトークン実装
  - [ ] トークン無効化機能

- [ ] **レート制限**
  - [ ] ログイン試行制限 (5回/分)
  - [ ] API呼び出し制限 (100回/分)
  - [ ] アカウント作成制限 (3回/時間)
  - [ ] パスワードリセット制限 (3回/時間)

```bash
# レート制限確認
curl -I https://aiohub.jp/api/auth/login | grep -i "x-ratelimit"

# 異常なアクセスパターン確認
grep "429" /var/log/nginx/access.log | tail -10
```

## 🛡️ データ保護

### 1. 機密データ管理
- [ ] **暗号化**
  - [ ] データベース暗号化 (AES-256)
  - [ ] 通信暗号化 (TLS 1.3)
  - [ ] ファイル暗号化 (適用時)
  - [ ] バックアップ暗号化

- [ ] **機密情報処理**
  - [ ] パスワードハッシュ化 (bcrypt)
  - [ ] APIキー環境変数管理
  - [ ] 機密情報ログ出力禁止
  - [ ] 個人情報マスキング

```bash
# 暗号化設定確認
psql -c "SHOW ssl;"
psql -c "SELECT name, setting FROM pg_settings WHERE name LIKE '%ssl%';"

# 機密情報ログ確認 (あってはならない)
grep -i "password\|token\|secret" /var/log/app.log | head -5
```

### 2. データベースセキュリティ
- [ ] **アクセス制御**
  - [ ] 最小権限の原則
  - [ ] 専用データベースユーザー
  - [ ] IP制限設定
  - [ ] 管理者アクセス監査

- [ ] **データ整合性**
  - [ ] バックアップ整合性確認
  - [ ] データ検証スクリプト
  - [ ] 監査ログ記録
  - [ ] 不正変更検知

```sql
-- データベースユーザー確認
SELECT usename, usesuper, usecreatedb, useconfig 
FROM pg_user;

-- 権限確認
SELECT grantee, privilege_type, table_name 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public';
```

### 3. ファイル・アップロード
- [ ] **ファイルアップロード制限**
  - [ ] ファイル形式制限 (.jpg, .png, .pdf のみ)
  - [ ] ファイルサイズ制限 (10MB以下)
  - [ ] ウイルススキャン
  - [ ] 実行ファイル完全禁止

- [ ] **ストレージセキュリティ**
  - [ ] アクセス権限設定
  - [ ] CDN経由での配信
  - [ ] 一時URL生成
  - [ ] 定期的な不要ファイル削除

## 🌐 インフラセキュリティ

### 1. ネットワーク
- [ ] **HTTPS強制**
  - [ ] 全通信HTTPS化
  - [ ] HTTP→HTTPSリダイレクト
  - [ ] HSTS設定
  - [ ] 証明書自動更新

- [ ] **セキュリティヘッダー**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

```bash
# セキュリティヘッダー確認
curl -I https://aiohub.jp | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"

# SSL設定確認
curl -I https://aiohub.jp | grep -i "strict-transport-security"
```

### 2. サーバー設定
- [ ] **OS・ソフトウェア更新**
  - [ ] 最新セキュリティパッチ適用
  - [ ] 不要サービス停止
  - [ ] デフォルト設定変更
  - [ ] 定期的脆弱性スキャン

- [ ] **ログ・監視**
  - [ ] アクセスログ記録
  - [ ] エラーログ監視
  - [ ] 侵入検知システム
  - [ ] 異常アクセス検知

```bash
# システム更新確認
npm audit --audit-level=high

# サービス確認
systemctl list-units --state=running

# ログ監視
tail -f /var/log/auth.log | grep "Failed"
```

## 🔍 脆弱性対策

### 1. Webアプリケーション脆弱性
- [ ] **OWASP Top 10 対策**
  - [ ] SQLインジェクション対策 (パラメータ化クエリ)
  - [ ] XSS対策 (出力エスケープ)
  - [ ] CSRF対策 (CSRFトークン)
  - [ ] セッション固定化対策

- [ ] **入力検証**
  - [ ] 全入力値の検証・サニタイズ
  - [ ] ファイルアップロード制限
  - [ ] JSONスキーマ検証
  - [ ] 最大長制限

```javascript
// 入力検証例
const organizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
});

// XSS対策
import DOMPurify from 'isomorphic-dompurify';
const sanitized = DOMPurify.sanitize(userInput);
```

### 2. 依存関係管理
- [ ] **パッケージ脆弱性**
  - [ ] npm audit定期実行
  - [ ] 依存関係最新化
  - [ ] 脆弱性アラート設定
  - [ ] ライセンス確認

```bash
# 脆弱性確認
npm audit --audit-level=moderate

# 古いパッケージ確認
npm outdated

# 依存関係確認
npm ls --depth=0
```

### 3. コード品質
- [ ] **静的解析**
  - [ ] ESLintセキュリティルール
  - [ ] TypeScript厳密設定
  - [ ] SonarQube分析
  - [ ] 定期的コードレビュー

```bash
# セキュリティLint
npx eslint . --ext .ts,.tsx -c .eslintrc.security.js

# TypeScript厳密チェック
npx tsc --strict --noEmit
```

## 📊 監査・ログ

### 1. 監査ログ
- [ ] **管理者操作記録**
  - [ ] ユーザー作成・削除
  - [ ] 権限変更
  - [ ] システム設定変更
  - [ ] データベース操作

- [ ] **セキュリティイベント**
  - [ ] ログイン失敗
  - [ ] 権限昇格試行
  - [ ] 異常なアクセスパターン
  - [ ] データアクセス記録

```sql
-- 監査ログ確認
SELECT * FROM audit_logs 
WHERE action_type IN ('LOGIN_FAILED', 'PERMISSION_DENIED', 'ADMIN_ACTION') 
ORDER BY created_at DESC 
LIMIT 50;

-- 管理者操作確認
SELECT * FROM audit_logs 
WHERE user_role = 'admin' 
AND created_at >= NOW() - INTERVAL '24 hours';
```

### 2. ログ分析
- [ ] **異常検知**
  - [ ] 大量ログイン失敗
  - [ ] 時間外アクセス
  - [ ] 地理的異常アクセス
  - [ ] APIアクセス頻度異常

```bash
# 異常アクセス検知
grep "401\|403\|429" /var/log/nginx/access.log | \
  awk '{print $1}' | sort | uniq -c | sort -nr | head -10

# 時間外アクセス確認
grep "$(date +%Y-%m-%d)" /var/log/app.log | \
  grep -E "0[0-6]:|2[2-3]:" | head -10
```

## 🔐 インシデント対応

### 1. セキュリティインシデント分類
- [ ] **Level 1: 重大** - データ漏洩、システム侵害
- [ ] **Level 2: 高** - 権限昇格、サービス妨害
- [ ] **Level 3: 中** - 脆弱性発見、設定不備
- [ ] **Level 4: 低** - 軽微な設定問題

### 2. 対応手順
- [ ] **即座対応 (Level 1)**
  1. 影響範囲特定・システム隔離
  2. 関係者緊急招集
  3. 証拠保全
  4. 外部専門家連絡
  5. 当局報告検討

- [ ] **緊急対応 (Level 2)**
  1. 脆弱性パッチ適用
  2. アカウント無効化
  3. ログ分析強化
  4. 監視強化

```bash
# 緊急時アカウント無効化
psql -c "UPDATE auth.users SET email_confirmed_at = NULL WHERE id = '<user_id>';"

# 異常セッション削除
psql -c "DELETE FROM auth.sessions WHERE user_id = '<user_id>';"
```

### 3. 事後対応
- [ ] **根本原因分析**
- [ ] **再発防止策実装**
- [ ] **セキュリティ監査実施**
- [ ] **関係者研修実施**

## 📋 定期セキュリティタスク

### 週次タスク
- [ ] **脆弱性スキャン実行**
- [ ] **異常ログ確認**
- [ ] **アクセス権限レビュー**
- [ ] **バックアップ整合性確認**

```bash
# 週次セキュリティチェック
#!/bin/bash
echo "=== Weekly Security Check $(date) ==="

# 脆弱性チェック
npm audit --audit-level=moderate

# 異常ログ確認
grep -i "error\|fail\|deny" /var/log/app.log | tail -20

# 権限確認
psql -c "SELECT * FROM auth.users WHERE user_metadata->>'role' = 'admin';"
```

### 月次タスク
- [ ] **包括的セキュリティ監査**
- [ ] **侵入テスト実施**
- [ ] **セキュリティ設定レビュー**
- [ ] **インシデント対応訓練**

### 四半期タスク
- [ ] **セキュリティポリシー見直し**
- [ ] **外部セキュリティ監査**
- [ ] **災害復旧テスト**
- [ ] **セキュリティ研修実施**

## 📞 セキュリティ連絡先

### 内部体制
- **セキュリティ責任者**: security@luxucare.co.jp
- **システム管理者**: admin@luxucare.co.jp
- **緊急時**: 090-XXXX-XXXX (24時間)

### 外部連絡先
- **JPCERT/CC**: [incident@jpcert.or.jp](mailto:incident@jpcert.or.jp)
- **IPA**: [セキュリティ情報](https://www.ipa.go.jp/security/)
- **警察庁**: [サイバー犯罪相談窓口](https://www.npa.go.jp/cyber/)

## 📝 監査記録

### 今回監査結果
- **実施日**: ________________
- **監査者**: ________________
- **対象範囲**: ________________

### 発見事項
| 重要度 | 項目 | 内容 | 対応状況 |
|--------|------|------|----------|
| High | | | |
| Medium | | | |
| Low | | | |

### 改善計画
- **即座対応**: ________________
- **1週間以内**: ________________
- **1ヶ月以内**: ________________

---
**作成日**: 2025年9月28日  
**最終更新**: 2025年9月28日  
**次回監査予定**: 2025年10月28日