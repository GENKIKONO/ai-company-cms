#!/usr/bin/env node

/**
 * 手動確認項目ガイド
 * 管理者ログインでの実際の動作確認手順
 */

console.log(`
🔍 営業資料統計機能 手動確認ガイド
=======================================

## 🎯 確認対象

このガイドでは、自動テストでカバーできない以下の項目を手動で確認します：

### 1. 🔐 管理者ログイン後のAPI動作確認

**手順:**
1. ブラウザで http://localhost:3000/admin-login にアクセス
2. 管理者アカウントでログイン
3. ブラウザの開発者ツールを開く
4. Network タブで以下のリクエストを確認:

**A. /api/admin/material-stats**
\`\`\`bash
# 期待されるレスポンス構造:
{
  "totals": { "views": 6, "downloads": 3 },
  "daily": [
    { "date": "2025-10-25", "views": 6, "downloads": 3 }
  ],
  "byMaterial": [
    {
      "materialId": "01234567-89ab-cdef-0123-456789abcdef",
      "title": "Test Material for Stats",
      "views": 6,
      "downloads": 3,
      "lastActivityAt": "2025-10-25T23:42:43.487354+00:00"
    }
  ],
  "topMaterials": [
    {
      "materialId": "01234567-89ab-cdef-0123-456789abcdef",
      "title": "Test Material for Stats",
      "score": 12,
      "views": 6,
      "downloads": 3
    }
  ],
  "userAgents": {
    "Chrome": 5,
    "Safari": 1,
    "Firefox": 1,
    "Edge": 1,
    "Other": 1
  },
  "period": { "from": "2025-09-26", "to": "2025-10-26" }
}
\`\`\`

**✅ 確認ポイント:**
- [ ] レスポンスに \`ip_address\` フィールドが含まれていない
- [ ] \`user_agent\` の生データが含まれていない（正規化済み）
- [ ] 全ての数値が正しく集計されている

### 2. 📥 CSV エクスポート機能確認

**手順:**
1. http://localhost:3000/admin/material-stats にアクセス
2. 「日別統計をCSVでエクスポート」ボタンをクリック
3. 「資料別統計をCSVでエクスポート」ボタンをクリック

**✅ 確認ポイント:**
- [ ] ダウンロードが開始される
- [ ] ファイル名が適切（営業資料統計_日別統計_2025-10-26_...csv など）
- [ ] ファイルがUTF-8で保存されている
- [ ] Excelで開いて日本語が文字化けしない

**BOM確認方法:**
\`\`\`bash
# ダウンロードしたCSVファイルの先頭バイトを確認
hexdump -C downloaded_file.csv | head -1
# 期待値: 00000000  ef bb bf という BOM が先頭にある
\`\`\`

### 3. 🎛️ 管理画面UI操作確認

**手順:**
1. http://localhost:3000/admin/material-stats にアクセス
2. 期間プリセットボタンを順番にクリック:
   - 「過去7日間」
   - 「過去30日間」  
   - 「過去90日間」
3. カスタム日付範囲を設定して確認

**✅ 確認ポイント:**
- [ ] KPI数値が期間変更に応じて更新される
- [ ] 日別推移グラフが期間に応じて変化する
- [ ] 資料別テーブルのデータが更新される
- [ ] 人気資料ランキングが再計算される
- [ ] ローディング状態が適切に表示される

### 4. 📊 数値整合性確認

**A. API totals と画面表示の一致**
- [ ] APIレスポンスの \`totals.views\` = 画面の「総閲覧数」
- [ ] APIレスポンスの \`totals.downloads\` = 画面の「総ダウンロード数」
- [ ] APIレスポンスの \`byMaterial.length\` = 画面の「対象資料数」

**B. CSV データと API の整合性**
\`\`\`bash
# CSVの行数確認（ヘッダー除く）
wc -l downloaded_file.csv
# API の daily 配列長と一致することを確認
\`\`\`

### 5. 🔒 プライバシー保護の最終確認

**手順:**
1. 非管理者アカウントでログイン（または非ログイン状態）
2. 以下のページを確認:

**A. ダッシュボード（投稿者視点）**
\`\`\`
http://localhost:3000/dashboard
\`\`\`
- [ ] 営業資料の閲覧数・ダウンロード数が表示されていない
- [ ] 統計関連のメニューが存在しない

**B. 営業資料詳細ページ**
\`\`\`
http://localhost:3000/dashboard/materials/01234567-89ab-cdef-0123-456789abcdef
\`\`\`
- [ ] 統計数値が表示されていない
- [ ] ダウンロードボタンは機能するが、統計は見えない

**C. 公開ページ検索**
\`\`\`bash
# ページソースで統計関連キーワード検索
curl -s http://localhost:3000/ | grep -i "閲覧\\|ダウンロード\\|download\\|view.*count\\|stats\\|analytics"
# 期待値: 何も出力されない（統計情報の露出なし）
\`\`\`

### 6. 🧪 エラーハンドリング確認

**A. ネットワークエラー**
1. 開発者ツールで Network を Offline に設定
2. 統計画面で更新ボタンをクリック
- [ ] エラーメッセージが適切に表示される
- [ ] アプリがクラッシュしない

**B. 認証エラー**
1. 管理者セッションをクリア
2. /admin/material-stats に直接アクセス
- [ ] 適切に認証画面にリダイレクト

### 7. 📱 レスポンシブ対応確認

**手順:**
1. ブラウザを狭いサイズに変更（モバイル幅）
2. 管理画面の要素が適切に表示されることを確認

**✅ 確認ポイント:**
- [ ] テーブルが横スクロール対応
- [ ] グラフが縮小表示される
- [ ] ボタンがタップしやすいサイズ
- [ ] 文字が読みやすい

## 📋 確認結果記録用チェックリスト

### API動作 (5項目)
- [ ] 管理者API レスポンス形式正常
- [ ] 匿名化処理済み（IP/UA除外）
- [ ] 非管理者アクセス拒否
- [ ] CSV export 認証制御
- [ ] 統計ログ正常動作

### UI/UX (7項目)
- [ ] 期間フィルター動作
- [ ] KPI数値表示
- [ ] グラフ描画・更新
- [ ] CSVエクスポート機能
- [ ] レスポンシブ対応
- [ ] エラーハンドリング
- [ ] ローディング状態

### プライバシー (4項目)
- [ ] 投稿者画面に統計非表示
- [ ] 公開ページに統計非表示
- [ ] API レスポンス匿名化
- [ ] 認証制御適切

### データ整合性 (3項目)
- [ ] API ↔ 画面数値一致
- [ ] CSV ↔ API データ一致
- [ ] 期間フィルター反映

## 🎯 最終判定基準

**✅ 本番デプロイ可能条件:**
- API動作: 5/5 項目クリア
- UI/UX: 6/7 項目以上クリア  
- プライバシー: 4/4 項目クリア
- データ整合性: 3/3 項目クリア

**⚠️ 修正必要条件:**
- プライバシー関連で1項目でも失敗
- API動作で2項目以上失敗

---
手動確認完了後、このチェックリストを用いて最終レポートを作成してください。
`);

// 実際の API 確認用スクリプト
console.log(`
🔧 API確認用コマンド
==================

# 1. 非管理者アクセステスト
curl -i http://localhost:3000/api/admin/material-stats

# 2. 統計ログテスト
curl -X POST http://localhost:3000/api/materials/stats \\
  -H "Content-Type: application/json" \\
  -d '{"material_id":"01234567-89ab-cdef-0123-456789abcdef","action":"view","user_agent":"Manual-Test/1.0"}'

# 3. CSV export テスト
curl -i http://localhost:3000/api/admin/material-stats/export?type=daily

# 4. 公開ページ統計露出チェック
curl -s http://localhost:3000/ | grep -i "閲覧\\|ダウンロード\\|download\\|view.*count\\|stats"
curl -s http://localhost:3000/pricing | grep -i "閲覧\\|ダウンロード\\|download\\|view.*count\\|stats"

echo "✅ 手動確認ガイド生成完了"
echo "上記の手順に従って管理者ログイン後の動作確認を実施してください"
`);