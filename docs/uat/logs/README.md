# 📊 UAT実行ログ保存ディレクトリ

このディレクトリには、UAT実行時のログファイルが日付別に保存されます。

## 🚨 【重要】ログセキュリティ要件

### ❌ ログに記録してはいけない情報
```
- 認証トークン・セッションID（****でマスキング）
- パスワード・APIキー（完全除外）
- 実顧客の個人情報（メール・氏名等）
- 決済情報（カード番号・CVV等）
- 内部システムのプライベートURL・認証情報
```

### ✅ 安全なログ記録方法
```
- ユーザーID: user_id_redacted または user_***
- メールアドレス: test-***@example.com
- 認証状態: authenticated=true/false のみ
- 決済結果: payment_status=success/failed のみ
- エラーメッセージ: スタックトレース除外
```

### 🔒 ログファイル管理
```
- ログファイルは .gitignore に必ず追加
- 共有時は機微情報を事前にマスキング
- 保存期間: 実行後30日で自動削除
- アクセス権限: プロジェクトメンバーのみ
```

## 📁 ディレクトリ構造

```
docs/uat/logs/
├── README.md           # このファイル
├── YYYYMMDD/          # 実行日別フォルダ（例：20241222/）
│   ├── preflight.log  # 事前チェック結果
│   ├── critical.log   # クリティカルテスト結果
│   ├── important.log  # 重要テスト結果
│   ├── recommended.log # 推奨テスト結果
│   └── summary.log    # 総合結果サマリー
└── latest/            # 最新実行結果へのシンボリックリンク
```

## 📋 ログファイルの形式

### preflight.log
```
2024-12-22 10:00:00 - UAT Preflight 開始
2024-12-22 10:00:05 - 環境変数チェック: PASS
2024-12-22 10:00:10 - DNS/SSL検証: PASS
2024-12-22 10:00:15 - APIエンドポイント確認: PASS
2024-12-22 10:00:20 - Preflight 完了: 3/3 項目合格
```

### critical.log
```
2024-12-22 10:30:00 - クリティカルテスト開始
2024-12-22 10:35:00 - テスト1 認証フロー: PASS
2024-12-22 10:45:00 - テスト2 企業作成・公開: PASS
2024-12-22 10:55:00 - テスト3 決済処理: PASS
2024-12-22 11:00:00 - テスト4 セキュリティ: PASS
2024-12-22 11:10:00 - クリティカルテスト完了: 4/4 項目合格 → リリース可能
```

## 🔧 ログ生成方法

### 自動生成（推奨）
```bash
# UAT実行時に自動でログを生成・保存
npm run uat:full
```

### 手動保存
```bash
# 個別実行結果を手動で保存
mkdir -p docs/uat/logs/$(date +%Y%m%d)
npm run uat:preflight > docs/uat/logs/$(date +%Y%m%d)/preflight.log 2>&1
```

## 📈 ログ解析とレポート

### 成功率の追跡
```bash
# 過去30日の成功率を計算
find docs/uat/logs/ -name "summary.log" -newermt "30 days ago" | \
  xargs grep "PASS" | wc -l
```

### 問題トレンド分析
```bash
# よく発生する問題を特定
find docs/uat/logs/ -name "*.log" -exec grep "FAIL" {} \; | \
  sort | uniq -c | sort -nr
```

## 🚨 注意事項

⚠️ **機微情報の保護**
- パスワード、APIキー、秘密鍵はログに残さない
- ユーザーの個人情報は記録しない
- 本番データへのアクセス情報は含めない

⚠️ **ログ保持期間**
- ローカルログ: 90日間保持
- CI Artifactsログ: 30日間保持
- 長期保存が必要な場合は別途アーカイブ

⚠️ **ディスク容量管理**
```bash
# 古いログの削除（90日より古い）
find docs/uat/logs/ -type d -name "202*" -mtime +90 -exec rm -rf {} \;
```

## 📖 関連ドキュメント

- [UAT実行ガイド](../runner.md)
- [結果レポートテンプレート](../templates/report.md)
- [GitHub Actions CI](../../.github/workflows/uat-preflight.yml)