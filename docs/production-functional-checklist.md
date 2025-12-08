# 🎯 AIOHub Production Functional Testing Checklist

**Phase 9: Post-Deployment Human Verification**  
**対象:** Vercel 本番デプロイ後の機能確認

---

## 🔥 **CRITICAL** - 必須確認項目

### 1. 基本アクセス確認
- [ ] **トップページ**: https://aiohub.jp/ が正常表示
- [ ] **組織ページ**: https://aiohub.jp/o/luxucare が正常表示  
- [ ] **料金ページ**: https://aiohub.jp/pricing が正常表示
- [ ] **About**: https://aiohub.jp/about が正常表示

### 2. 認証フロー確認
- [ ] **ログイン**: https://aiohub.jp/auth/signin からサインイン可能
- [ ] **新規登録**: https://aiohub.jp/auth/signup から新規登録可能
- [ ] **パスワードリセット**: パスワードリセット機能動作
- [ ] **認証後リダイレクト**: ログイン後ダッシュボードに遷移

### 3. ダッシュボード機能
- [ ] **ダッシュボード**: https://aiohub.jp/dashboard アクセス可能
- [ ] **組織設定**: 組織情報編集機能動作
- [ ] **サービス管理**: サービス作成・編集・削除動作
- [ ] **FAQ管理**: FAQ作成・編集・削除動作

### 4. AI Interview 機能
- [ ] **インタビューページ**: https://aiohub.jp/dashboard/interview アクセス可能
- [ ] **AI面接開始**: 面接セッション開始可能
- [ ] **質問応答**: AI質問への回答送信動作  
- [ ] **面接終了**: セッション正常終了・結果保存確認

### 5. Admin Console
- [ ] **管理コンソール**: https://aiohub.jp/management-console アクセス可能
- [ ] **組織一覧**: 組織リスト表示
- [ ] **ユーザー詳細**: 個別ユーザー情報表示
- [ ] **統計情報**: 各種統計データ表示

### 6. API Health Check
- [ ] **Health API**: https://aiohub.jp/api/health ステータス200
- [ ] **診断API**: https://aiohub.jp/api/diag/comprehensive 動作確認
- [ ] **AI Visibility**: https://aiohub.jp/api/admin/ai-visibility/latest アクセス可能

---

## 🟡 **HIGH PRIORITY** - 重要確認項目

### 7. 埋め込み機能
- [ ] **埋め込みページ**: https://aiohub.jp/embed/[id] 表示確認
- [ ] **埋め込みスタイル**: CSS適用確認
- [ ] **レスポンシブ**: モバイル表示確認

### 8. SEO・メタデータ
- [ ] **robots.txt**: https://aiohub.jp/robots.txt 正常表示
- [ ] **sitemap.xml**: https://aiohub.jp/sitemap.xml 正常表示
- [ ] **JSON-LD**: 構造化データ埋め込み確認
- [ ] **OGP**: SNSシェア時メタデータ表示確認

### 9. 機能・quota制限  
- [ ] **Quota表示**: 各機能のquota使用量表示
- [ ] **Plan管理**: プラン変更・アップグレード動作
- [ ] **Billing**: Stripe決済フロー動作確認
- [ ] **Feature Flags**: 機能ON/OFF制御動作

### 10. Notification・Alert
- [ ] **メール送信**: Resend経由メール送信動作
- [ ] **Slack通知**: 重要アラートSlack送信
- [ ] **エラー通知**: Sentry error capture 動作  

---

## 🟢 **MEDIUM PRIORITY** - 推奨確認項目

### 11. パフォーマンス
- [ ] **ページ読み込み**: 3秒以内読み込み完了
- [ ] **API応答**: API響応1秒以内
- [ ] **画像最適化**: Next.js Image最適化動作
- [ ] **Lighthouse Score**: Performance 90+

### 12. セキュリティ
- [ ] **HTTPS**: 全ページHTTPS強制
- [ ] **CSP**: Content Security Policy適用
- [ ] **CSRF**: CSRF保護動作
- [ ] **Admin保護**: 管理機能適切なアクセス制御

### 13. モバイル対応
- [ ] **レスポンシブ**: スマホ・タブレット表示確認
- [ ] **タッチ操作**: モバイル操作性確認
- [ ] **PWA**: PWA機能動作（該当する場合）

### 14. データ管理
- [ ] **データ作成**: 新規データ作成動作
- [ ] **データ更新**: 既存データ更新動作
- [ ] **データ削除**: データ削除・復元動作
- [ ] **データ Export**: CSV・JSONエクスポート動作

---

## ⚠️ **EDGE CASES** - エッジケース確認

### 15. エラーハンドリング  
- [ ] **404エラー**: 存在しないページアクセス時の404表示
- [ ] **500エラー**: サーバーエラー時の適切なエラーページ
- [ ] **API制限**: Rate limiting動作確認
- [ ] **認証失効**: トークン期限切れ時の適切なリダイレクト

### 16. Cron Job・Background Tasks
- [ ] **日次処理**: `/api/cron/daily` スケジュール実行確認
- [ ] **月次レポート**: `/api/cron/monthly-report` 動作確認
- [ ] **バックグラウンド処理**: 重い処理の非同期実行確認

---

## 🛠️ **TECHNICAL VALIDATION**

### 17. User Agents・Bot対応
- [ ] **Googlebot**: robots.txt ルール適用確認
- [ ] **GPTBot**: AI Bot適切なアクセス制御
- [ ] **CCBot**: Common Crawl Bot 制御確認

### 18. Database・RLS
- [ ] **RLS Policy**: Row Level Security適切な動作
- [ ] **Organization Isolation**: 組織間データ分離確認
- [ ] **Admin Access**: 管理者権限での全データアクセス

---

## 📋 **VERIFICATION TOOLS**

### Automated Testing Commands
```bash
# 基本スモークテスト
npm run smoke:test

# 本番環境validation
npm run validate:production

# health check
npm run health:production

# E2E critical tests
npm run test:e2e:critical
```

### Manual Verification URLs
```
公開ページ:
- https://aiohub.jp/
- https://aiohub.jp/o/luxucare
- https://aiohub.jp/pricing
- https://aiohub.jp/about

認証ページ:
- https://aiohub.jp/auth/signin
- https://aiohub.jp/auth/signup

ダッシュボード:
- https://aiohub.jp/dashboard
- https://aiohub.jp/dashboard/interview
- https://aiohub.jp/management-console

API:
- https://aiohub.jp/api/health
- https://aiohub.jp/robots.txt
- https://aiohub.jp/sitemap.xml
```

---

## ✅ **COMPLETION CRITERIA**

**本番稼働OK基準:**
- ✅ **CRITICAL** 項目: 100% 完了必須
- ⚠️ **HIGH PRIORITY** 項目: 90% 以上完了推奨
- 📝 **MEDIUM PRIORITY** 項目: 80% 以上完了推奨

**確認者:** _______________  
**確認日時:** _______________  
**Total Score:** _____/50 items  
**Deployment Status:** [ ] 承認 [ ] 修正必要