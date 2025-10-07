# 📋 要件定義書 v2.2 追記 - データ存在保証・契約統一性

**更新日**: 2025/10/7  
**対象**: LuxuCare CMS - AIO最適化  
**追加要件**: REQ-AIO-08

---

## 🎯 **REQ-AIO-08: データ存在保証・契約統一性**

### **要件ID**: REQ-AIO-08  
### **要件名**: データ存在保証・契約統一性  
### **優先度**: **High**  
### **カテゴリ**: データ整合性・API契約

---

### **📋 要件内容**

#### **1. APIスキーマ・DB実装の完全一致**
- **全公開APIエンドポイント**は、OpenAPI 3.1スキーマ定義と実装の完全一致を保証する
- **データベーススキーマ**で定義されたカラムは、OpenAPIスキーマで正確に表現される
- **nullable/required**の指定は、実際のデータベース制約と一致する

#### **2. 統計API・ダッシュボードの型安全性**
- **統計API**は、必須4キー（`pageViews`, `avgDurationSec`, `conversionRate`, `inquiries`）を常に数値型で返却する
- **データ0件時**も必須キーを返却し、`null`/`undefined`を禁止する
- **UI側のTypeScript型定義**は、API契約と完全一致する

#### **3. RSS・サイトマップの構造保証**
- **RSS 2.0フィード**は、データ0件時も有効なXML構造を維持する
- **サイトマップ系**（images, news）は、要素0個でも構文エラーを起こさない
- **ETag・Cache-Control**は、全AIOエンドポイントで適切に設定される

---

### **🎯 受入条件**

#### **✅ 必須達成条件**

1. **OpenAPIスキーマ検証**
   ```bash
   curl -s https://aiohub.jp/api/public/openapi.json | grep '"openapi":"3.1.0"'
   # → マッチすること
   ```

2. **公開API動作確認**
   ```bash
   curl -s https://aiohub.jp/api/public/services | grep '"services":\[\]'
   curl -s https://aiohub.jp/api/public/faqs | grep '"faqs":\[\]'  
   curl -s https://aiohub.jp/api/public/case-studies | grep '"caseStudies":\[\]'
   # → 全て200応答、空配列を含む構造を返却
   ```

3. **RSS構文保証**
   ```bash
   curl -s https://aiohub.jp/feed.xml | xmllint --noout -
   # → エラーなし（構文OK）
   ```

4. **データベーススキーマ一致**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'services' AND column_name = 'category';
   -- → 1行返却（カラム存在）
   
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'faqs' AND column_name = 'sort_order';
   -- → 1行返却（カラム存在）
   
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'case_studies' AND column_name = 'result';
   -- → 1行返却（カラム存在）
   ```

5. **キャッシュ設定確認**
   ```bash
   curl -I https://aiohub.jp/feed.xml | grep "Cache-Control.*max-age=300"
   curl -I https://aiohub.jp/api/public/openapi.json | grep "Cache-Control.*max-age=3600"
   # → 両方マッチ（適切なキャッシュ設定）
   ```

---

### **🔧 CI/CD チェックルール**

#### **自動チェック項目**

1. **スキーマ差分検出**
   ```bash
   # pre-commit hook
   npm run check:schema-sync
   # → OpenAPIスキーマ vs DB実装の差分でFAIL
   ```

2. **API契約テスト**
   ```bash
   npm run test:api-contract
   # → 公開APIレスポンス形式の型検証
   ```

3. **RSS/XML構文検証**
   ```bash
   npm run test:xml-feeds
   # → 全XMLフィードの構文チェック
   ```

4. **型安全性テスト**
   ```bash
   npm run test:type-safety
   # → TypeScript strict modeでの型エラー検出
   ```

---

### **🚨 失敗時の対応**

#### **スキーマ不整合検出時**
1. **原因特定**: DB migration vs OpenAPIスキーマの差分確認
2. **修正方針決定**: スキーマを真とするか、実装を真とするか
3. **一括修正**: 契約統一のための修正PR作成
4. **再検証**: 全チェック項目の再実行

#### **エスケレーション条件**
- **AIO適合率 < 100%** が48時間以上継続
- **RSS 500エラー**が1時間以上継続  
- **公開API**の契約違反が検出される

---

### **📊 成功指標**

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| AIO適合率 | **100%** | `npm run aio:report` |
| RSS可用性 | **99.9%** | `/feed.xml`の200応答率 |
| API契約適合 | **100%** | OpenAPIスキーマ vs 実装 |
| キャッシュ効率 | **>95%** | `Cache-Control`ヘッダー設定率 |

---

### **🔄 定期監視**

- **日次**: AIO適合率チェック（自動）
- **週次**: API契約整合性確認（手動）
- **月次**: パフォーマンス・キャッシュ効率確認

---

**作成者**: 本番修復担当エンジニア  
**承認者**: プロダクトオーナー  
**レビュー**: 毎月第1営業日