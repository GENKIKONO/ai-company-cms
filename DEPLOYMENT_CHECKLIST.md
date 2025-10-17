# 🚀 本番環境デプロイチェックリスト

## 1. Supabase本番環境設定

### 必須マイグレーション
- [ ] `001_initial_schema.sql` - データベーススキーマ
- [ ] `002_rls_policies.sql` - セキュリティポリシー
- [x] ~~`003_sample_data.sql` - サンプルデータ~~ (削除済み)

### 確認方法
```sql
-- テーブル作成確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- RLSポリシー確認
SELECT schemaname, tablename, policyname 
FROM pg_policies;

-- サンプルデータ確認
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM case_studies;
```

## 2. Vercel環境変数確認

### 必須環境変数
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`

### Stripe環境変数（今後追加）
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## 3. 本番テストフロー

### 3.1 認証機能テスト
1. **ユーザー登録**
   - [ ] 新規アカウント作成
   - [ ] メール認証（本番メール送信テスト）
   - [ ] ログイン/ログアウト

2. **権限管理テスト**
   - [ ] admin権限でのフル機能アクセス
   - [ ] editor権限での制限機能確認
   - [ ] viewer権限での読み取り専用確認

### 3.2 CRUD機能テスト
1. **企業管理**
   - [ ] 企業作成・編集・削除
   - [ ] 画像アップロード
   - [ ] 公開/非公開ステータス

2. **サービス管理**
   - [ ] サービス作成・編集・削除
   - [ ] カテゴリ分類
   - [ ] 企業との関連付け

3. **導入事例管理**
   - [ ] 事例作成・編集・削除
   - [ ] 匿名事例機能
   - [ ] メトリクス追加

### 3.3 検索機能テスト
- [ ] キーワード検索
- [ ] フィルタリング機能
- [ ] 検索結果表示
- [ ] 保存済み検索

### 3.4 パフォーマンステスト
- [ ] 初回ロード時間 < 3秒
- [ ] 検索応答時間 < 1秒
- [ ] モバイル表示確認
- [ ] SEOメタタグ確認

## 4. セキュリティチェック

### 4.1 データベースセキュリティ
- [ ] RLSポリシーが正常に動作
- [ ] 未認証ユーザーのアクセス制限
- [ ] 権限外データへのアクセス防止

### 4.2 API セキュリティ
- [ ] 環境変数の漏洩なし
- [ ] CORS設定確認
- [ ] レート制限設定

## 5. 監視・分析設定

### 5.1 エラー監視
- [ ] Next.js エラーログ確認
- [ ] Supabase エラーログ確認
- [ ] Vercel Analytics 有効化

### 5.2 パフォーマンス監視
- [ ] Web Vitals 測定
- [ ] データベースクエリ最適化
- [ ] 画像最適化確認

## 6. 今後のStripe連携準備

### 6.1 サブスクリプション機能
```typescript
// 実装予定機能
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxOrganizations: number;
  maxServices: number;
}
```

### 6.2 課金制限機能
- プラン別機能制限
- 使用量制限アラート
- 自動課金処理

## 7. デプロイ手順

1. **最終コミット**
```bash
git add .
git commit -m "production ready: complete CMS implementation"
git push origin main
```

2. **Vercelデプロイ確認**
```bash
# 自動デプロイまたは手動トリガー
npx vercel --prod
```

3. **本番URL動作確認**
- [ ] https://[your-domain].vercel.app にアクセス
- [ ] 全機能の動作確認

## 8. 運用開始後の監視項目

- [ ] 日次アクティブユーザー数
- [ ] 企業登録数の推移
- [ ] エラー発生率
- [ ] ページロード時間
- [ ] データベース使用量

---

✅ **本番リリース準備完了チェック**
- [ ] 全テスト項目をクリア
- [ ] セキュリティ監査完了
- [ ] パフォーマンス基準達成
- [ ] 監視設定完了