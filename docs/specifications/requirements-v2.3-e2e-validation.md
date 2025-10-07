# 📋 要件定義書 v2.3 - E2E検証自動化

**更新日**: 2025/10/7  
**対象**: LuxuCare CMS - AIO本番検証  
**追加要件**: REQ-AIO-09, REQ-AIO-10  
**背景**: 本番DBマイグレーション未実行による全AIOエンドポイント停止

---

## 🚨 **REQ-AIO-09: 本番DBスキーマ検証自動化**

### **要件ID**: REQ-AIO-09  
### **要件名**: 本番前DBスキーマ検証自動化  
### **優先度**: **Critical**  
### **カテゴリ**: デプロイ品質保証

#### **📋 要件内容**

##### **1. 本番前スキーマ検証**
- **すべてのデプロイ前**に、本番DBスキーマとコード期待値の一致を自動検証
- **マイグレーション未実行**を検出した場合、デプロイを停止
- **スキーマ差分レポート**を自動生成

##### **2. 検証対象カラム**
```sql
-- 必須カラム存在チェック
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN 'OK'
    ELSE 'MISSING'
  END as services_category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'sort_order') THEN 'OK'
    ELSE 'MISSING'
  END as faqs_sort_order,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_studies' AND column_name = 'result') THEN 'OK'
    ELSE 'MISSING'
  END as case_studies_result,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'organization_id') THEN 'OK'
    ELSE 'MISSING'
  END as posts_organization_id;
```

#### **🎯 受入条件**

1. **CI/CDパイプライン統合**
   ```bash
   # GitHub Actions / Vercel Build Hook
   npm run check:prod-schema
   # → 全カラム'OK'の場合のみ deployment 許可
   ```

2. **エラー時の自動停止**
   ```bash
   # 検証失敗時
   echo "❌ Production schema validation failed"
   echo "Missing columns detected. Run migrations first."
   exit 1
   ```

3. **Slack通知連携**
   ```bash
   # スキーマ差分検出時
   curl -X POST $SLACK_WEBHOOK -d '{
     "text": "🚨 Production deployment blocked: Missing DB columns"
   }'
   ```

---

## 🔍 **REQ-AIO-10: E2E適合率計算**

### **要件ID**: REQ-AIO-10  
### **要件名**: E2E適合率計算  
### **優先度**: **High**  
### **カテゴリ**: 品質監視・実行時検証

#### **📋 要件内容**

##### **1. 実行時API呼び出しによる検証**
- **ファイル存在確認**ではなく、**実際のHTTP応答**による適合率計算
- **本番エンドポイント**に対する実際のリクエスト実行
- **200応答 + 構文検証**による真の稼働確認

##### **2. E2E検証項目**
```bash
# REQ-AIO-04: RSS/Atomフィード
curl -f -s https://aiohub.jp/feed.xml | xmllint --noout -
# → 200応答 + XML構文OK = PASS

# REQ-AIO-06: 公開API動作
curl -f -s https://aiohub.jp/api/public/services | jq .services
# → 200応答 + JSON解析OK = PASS

# REQ-AIO-05: 拡張サイトマップ  
curl -f -s https://aiohub.jp/sitemap-images.xml | xmllint --noout -
curl -f -s https://aiohub.jp/sitemap-news.xml | xmllint --noout -
# → 両方とも200応答 + XML構文OK = PASS
```

##### **3. 適合率計算ロジック**
```typescript
interface E2EResult {
  requirement: string;
  endpoint: string;
  status: number;
  isValid: boolean;
  errorMessage?: string;
}

function calculateE2ECompliance(results: E2EResult[]): number {
  const passCount = results.filter(r => r.status === 200 && r.isValid).length;
  return Math.round((passCount / results.length) * 100);
}
```

#### **🎯 受入条件**

1. **E2E検証スクリプト**
   ```bash
   npm run aio:e2e --env=production
   # → 実際のHTTP呼び出しによる適合率計算
   ```

2. **本番監視ダッシュボード**
   ```bash
   # 5分間隔での自動E2E検証
   cron: "*/5 * * * *"
   command: npm run aio:e2e-monitor
   ```

3. **アラート条件**
   ```bash
   # 適合率 < 100% が30分継続
   if [ $compliance_rate -lt 100 ]; then
     echo "🚨 AIO compliance degraded: $compliance_rate%"
     # Slack notification + PagerDuty alert
   fi
   ```

---

## 🔧 **CI/CD統合要件**

### **GitHub Actions ワークフロー例**

```yaml
name: AIO Production Validation
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Check Production Schema
        run: npm run check:prod-schema
        
      - name: Block deployment if schema invalid
        if: failure()
        run: |
          echo "❌ Schema validation failed"
          exit 1
          
  e2e-compliance:
    needs: schema-validation
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E AIO Compliance Check
        run: npm run aio:e2e --env=production
        
      - name: Report compliance rate
        run: |
          RATE=$(cat logs/e2e-compliance.json | jq .rate)
          echo "📊 AIO Compliance Rate: $RATE%"
```

---

## 📊 **実装チェックリスト**

### **Phase 1: 緊急修復（即時）**
- [ ] 本番DBマイグレーション手動実行
- [ ] AIOエンドポイント500エラー解消確認
- [ ] RSS/公開API正常動作確認

### **Phase 2: 自動化実装（1週間）**
- [ ] `npm run check:prod-schema` スクリプト実装
- [ ] `npm run aio:e2e` E2E検証スクリプト実装
- [ ] CI/CDパイプライン統合

### **Phase 3: 監視・アラート（2週間）**
- [ ] 本番監視ダッシュボード構築
- [ ] Slack/PagerDuty連携
- [ ] 月次適合率レポート自動化

---

**作成者**: 本番修復担当エンジニア  
**緊急度**: **CRITICAL** - 即座実装要  
**次回レビュー**: DBマイグレーション完了後24時間以内