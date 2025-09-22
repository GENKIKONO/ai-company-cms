# 🟢 推奨テスト チェックリスト（1ヶ月以内）

**所要時間**: 約115分  
**実行タイミング**: 本番リリース後1ヶ月以内  
**実行者**: ________________  
**実行日時**: ________________

---

## 📋 テスト1: パフォーマンス監視（30分）

### Core Web Vitals測定
```bash
# Lighthouse実行
npx lighthouse-ci https://aiohub.jp --output=json --output-path=./lighthouse-home.json
npx lighthouse-ci https://aiohub.jp/organizations --output=json --output-path=./lighthouse-orgs.json
npx lighthouse-ci https://aiohub.jp/search --output=json --output-path=./lighthouse-search.json
```

### 目標値と測定結果
| ページ | LCP目標 | FID目標 | CLS目標 | 測定LCP | 測定FID | 測定CLS | 判定 |
|--------|---------|---------|---------|---------|---------|---------|------|
| トップ | <2.5s | <100ms | <0.1 | ___s | ___ms | ___ | [ ] |
| 企業一覧 | <2.5s | <100ms | <0.1 | ___s | ___ms | ___ | [ ] |
| 検索 | <2.5s | <100ms | <0.1 | ___s | ___ms | ___ | [ ] |
| 企業詳細 | <2.5s | <100ms | <0.1 | ___s | ___ms | ___ | [ ] |

### パフォーマンス確認項目
- [ ] 画像最適化: WebP/AVIF形式使用、適切な圧縮
- [ ] バンドルサイズ: 1MB以下、コード分割適用
- [ ] キャッシュ: 静的アセットの適切なキャッシュ設定
- [ ] CDN: Vercel Edge Network 利用確認
- [ ] レスポンスヘッダー: 圧縮・キャッシュヘッダー設定

### データベースパフォーマンス
```sql
-- Supabase Dashboard > Settings > Database で確認
-- パフォーマンス指標確認
SELECT 
  now() as check_time,
  (SELECT count(*) FROM users) as user_count,
  (SELECT count(*) FROM organizations) as org_count,
  (SELECT count(*) FROM services) as service_count;

-- スロークエリ確認
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE mean_time > 100 -- 100ms以上のクエリ
ORDER BY mean_time DESC 
LIMIT 10;
```

- [ ] CPU使用率: <70% (推奨)
- [ ] メモリ使用率: <80% (推奨)
- [ ] 接続数: <60% (推奨)
- [ ] スロークエリ: 100ms以上のクエリなし

---

## 📋 テスト2: SEO構造化データ検証（20分）

### Google Search Console設定
- [ ] プロパティ追加: https://aiohub.jp 追加済み
- [ ] 所有権確認: DNS/HTMLファイル/タグ管理等で確認完了
- [ ] サイトマップ送信: /sitemap.xml 送信・受理確認
- [ ] インデックス登録: 主要ページのインデックス状況確認

### Rich Results Test実行
```bash
# Google Rich Results Test で確認
# https://search.google.com/test/rich-results

# 確認対象URL
- https://aiohub.jp/ (WebSite schema)
- https://aiohub.jp/organizations (CollectionPage schema)  
- https://aiohub.jp/o/[sample-org] (Organization + Service + FAQ schema)
```

### JSON-LD検証
```javascript
// ブラウザ開発者ツールで実行
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, index) => {
  try {
    const data = JSON.parse(script.textContent);
    console.log(`✅ Schema ${index + 1}:`, data);
  } catch (e) {
    console.error(`❌ Schema ${index + 1} parsing error:`, e);
  }
});
```

### 構造化データ確認項目
- [ ] Organization schema: 企業情報が正確に出力
- [ ] Service schema: サービス情報が適切に構造化
- [ ] FAQ schema: Q&Aが検索結果に表示可能
- [ ] CaseStudy schema: 導入事例が構造化
- [ ] WebSite schema: サイト全体の情報設定
- [ ] BreadcrumbList: パンくずリストの構造化

### SEO基本要素
- [ ] タイトルタグ: 各ページ固有、60文字以内
- [ ] メタディスクリプション: 各ページ固有、160文字以内
- [ ] OGP設定: og:title, og:description, og:image 適切設定
- [ ] robots.txt: 適切なクローラー制御
- [ ] sitemap.xml: 全ページ含む最新のサイトマップ

---

## 📋 テスト3: エラーハンドリング確認（25分）

### ネットワークエラーシミュレーション
```bash
# Chrome DevTools > Network タブで以下をテスト
# 1. Offline モード設定
# 2. Slow 3G モード設定  
# 3. Fast 3G モード設定
```

- [ ] オフライン時: 適切なオフライン表示・エラーメッセージ
- [ ] 低速回線時: ローディング表示・プログレスバー
- [ ] API遅延時: タイムアウト処理・リトライ機能
- [ ] 画像読み込み失敗: フォールバック画像表示

### フォームバリデーション
```javascript
// 異常なデータ入力テストケース
const testCases = [
  {field: "email", value: "invalid-email", expect: "メール形式エラー"},
  {field: "email", value: "a".repeat(255) + "@test.com", expect: "文字数制限エラー"},
  {field: "telephone", value: "abc-def-ghij", expect: "数字のみエラー"},
  {field: "telephone", value: "090", expect: "桁数不足エラー"},
  {field: "url", value: "not-a-url", expect: "URL形式エラー"},
  {field: "url", value: "ftp://example.com", expect: "プロトコルエラー"},
  {field: "description", value: "a".repeat(5001), expect: "文字数制限エラー"},
  {field: "name", value: "", expect: "必須項目エラー"},
  {field: "name", value: "<script>alert(1)</script>", expect: "XSS防止"}
];
```

- [ ] 必須項目チェック: 未入力時の適切なエラー表示
- [ ] 文字数制限: 上限超過時のエラー表示
- [ ] 形式チェック: メール・URL・電話番号の形式検証
- [ ] XSS防止: 悪意あるスクリプトの無害化
- [ ] CSRF防止: 適切なトークン検証

### エラーページ確認
- [ ] 404ページ: 存在しないURLへのアクセス時
- [ ] 500ページ: サーバーエラー時（意図的エラー発生）
- [ ] 403ページ: 権限不足時
- [ ] メンテナンスページ: システムメンテナンス時

---

## 📋 テスト4: 運用監視設定（40分）

### Vercel Analytics確認
```bash
# Vercel Dashboard > Project > Analytics で確認
```
- [ ] Real User Monitoring: 有効化・データ収集確認
- [ ] ページビュー追跡: 主要ページのアクセス数確認
- [ ] パフォーマンス監視: Core Web Vitals 自動計測
- [ ] 地域別分析: ユーザーアクセス地域の分布
- [ ] デバイス別分析: モバイル・デスクトップ比率
- [ ] 異常検知アラート: パフォーマンス劣化時の通知設定

### Supabase監視設定
```bash
# Supabase Dashboard > Settings で確認
```
- [ ] 使用量監視: CPU・メモリ・ストレージ使用量
- [ ] 使用量アラート: 80%到達時の通知設定
- [ ] バックアップ設定: Point-in-Time Recovery 有効
- [ ] ログ設定: 適切なログレベル・保持期間
- [ ] API制限: レート制限・同時接続数設定
- [ ] セキュリティログ: 不正アクセス試行の記録

### Stripe監視設定
```bash
# Stripe Dashboard > Developers > Webhooks で確認
```
- [ ] Webhook配信成功率: >95% 維持
- [ ] 失敗時再試行: 適切な再試行設定
- [ ] 異常取引監視: 高額・頻繁な取引のアラート
- [ ] 決済失敗監視: 失敗率・理由の分析
- [ ] 不正利用防止: Radar 設定・ルール確認
- [ ] レポート設定: 定期的な売上・取引レポート

### Resend監視設定
```bash
# Resend Dashboard > Analytics で確認
```
- [ ] 配信成功率: >98% 維持確認
- [ ] バウンス率: <2% 維持確認
- [ ] 苦情率: <0.1% 維持確認
- [ ] ドメイン評価: >80点 維持確認
- [ ] 送信制限: 適切な送信レート設定
- [ ] ブラックリスト: 問題ドメインの管理

### ログ監視・アラート設定
```bash
# 監視すべき指標
```
- [ ] エラー率: 5%以下維持
- [ ] レスポンス時間: 95%ile < 2秒
- [ ] 可用性: 99.9%以上
- [ ] セキュリティ: 不正アクセス検知
- [ ] ビジネス指標: 新規登録・課金率等

---

## ✅ 推奨テスト完了判定

### 必須項目チェック
- [ ] 🟢 パフォーマンス監視: 30分のテスト完了
- [ ] 🟢 SEO構造化データ: 20分のテスト完了
- [ ] 🟢 エラーハンドリング: 25分のテスト完了
- [ ] 🟢 運用監視設定: 40分のテスト完了

### 品質基準
- パフォーマンス: Core Web Vitals 目標値クリア
- SEO: 構造化データエラーなし
- エラーハンドリング: 想定ケース全て適切処理
- 監視設定: 本番運用に必要な監視・アラート設定完了

### 改善提案エリア
- [ ] パフォーマンス: さらなる最適化余地
- [ ] SEO: 追加の構造化データ対応
- [ ] UX: エラー時のユーザー体験向上
- [ ] 運用: 監視精度・アラート精度向上

### 最終判定
**[ ] ✅ 全推奨テスト完了 → 長期的な品質確保**  
**[ ] ⚠️ 一部課題あり → 改善計画策定**  
**[ ] 📋 継続監視 → 定期的な品質チェック体制確立**

---

## 📈 継続的品質改善

### 月次確認事項
- [ ] パフォーマンス指標: 月次での劣化チェック
- [ ] SEO順位: 主要キーワードの検索順位
- [ ] ユーザー満足度: フィードバック・レビュー分析
- [ ] セキュリティ: 脆弱性診断・ペネトレーションテスト
- [ ] バックアップ: 復旧テスト実施

### 四半期確認事項
- [ ] 競合分析: 他社サービスとの比較
- [ ] 技術負債: コード品質・ライブラリ更新
- [ ] 容量計画: 成長に応じたインフラ拡張計画
- [ ] ビジネス指標: KPI達成状況・改善余地
- [ ] セキュリティ監査: 外部監査・認証取得検討

### 年次確認事項
- [ ] フルスケールUAT: 全機能の包括的テスト
- [ ] ディザスタリカバリ: 障害復旧シナリオ実践
- [ ] コンプライアンス: 法規制・業界標準への準拠
- [ ] 技術方針見直し: アーキテクチャ・技術スタック評価
- [ ] 品質プロセス改善: テスト手法・ツール見直し

---

**🎯 推奨テスト完了により、AIO Hub の品質基準が確立されました。継続的な監視と改善により、長期的な品質維持を図ってください。**