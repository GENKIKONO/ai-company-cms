# GitHub PR自動コメントサンプル

GitHub Actions UAT Preflight Checksワークフローが生成するPRコメントの実際のフォーマットサンプルです。

## 🟢 成功パターン（全チェック通過）

```markdown
## 🧪 UAT Preflight 検証結果

### 📋 事前チェック結果
| チェック項目 | 結果 | 詳細 |
|-------------|------|------|
| ✅ 環境変数チェック | **PASS** | 本番環境設定の検証 |
| ✅ DNS/SSL検証 | **PASS** | aiohub.jp ドメインと証明書 |
| ✅ API疎通確認 | **PASS** | 全エンドポイントの疎通確認 |

### 🎯 リリース判定

🟢 **事前チェック完了 - クリティカルテスト待ち**

📋 **次のステップ**:
1. プルリクエストをマージ
2. 手動クリティカルテスト実行: `npm run uat:critical`
3. 全4項目成功後、リリース判定更新

⚠️ **注意**: クリティカルテスト 4/4 成功まではリリース延期

## 📊 自動生成レポート

✅ UAT結果レポートが自動生成されました
- **レポートパス**: `docs/uat/logs/20241222/uat-report.md`
- **アーティファクト**: [uat-preflight-logs](../actions) からダウンロード可能
- **ローカル生成**: `npm run uat:report` で最新レポート作成

---

### 🔧 実行コマンド参考
- **事前チェック**: `npm run uat:preflight`
- **レポート生成**: `npm run uat:report`
- **クリティカルテスト**: `npm run uat:critical`

### 📚 関連ドキュメント
- [📋 実行ガイド](../docs/uat/runner.md)
- [🔴 クリティカルテスト](../docs/uat/checklists/critical.md)
- [🎯 UAT最終版手順書](../docs/uat/uat_final.md)

---
*🤖 このコメントはGitHub Actionsにより自動生成されました*
```

## 🔴 失敗パターン（DNS検証失敗）

```markdown
## 🧪 UAT Preflight 検証結果

### 📋 事前チェック結果
| チェック項目 | 結果 | 詳細 |
|-------------|------|------|
| ✅ 環境変数チェック | **PASS** | 本番環境設定の検証 |
| ❌ DNS/SSL検証 | **FAIL** | aiohub.jp ドメインと証明書 |
| ✅ API疎通確認 | **PASS** | 全エンドポイントの疎通確認 |

### 🎯 リリース判定

🔴 **リリース延期 - 事前チェック失敗**

📋 **必要な対応**:
1. 検証ログ確認: Artifacts `uat-preflight-logs` をダウンロード
2. 問題修正 (環境変数/DNS/API設定)
3. 再度プッシュしてCI再実行
4. 全て解決後、クリティカルテストに進行

## 📊 レポート生成状況

✅ UAT結果レポートが自動生成されました
- **レポートパス**: `docs/uat/logs/20241222/uat-report.md`
- **アーティファクト**: [uat-preflight-logs](../actions) からダウンロード可能
- **ローカル生成**: `npm run uat:report` で最新レポート作成

---

### 🔧 実行コマンド参考
- **事前チェック**: `npm run uat:preflight`
- **レポート生成**: `npm run uat:report`
- **クリティカルテスト**: `npm run uat:critical`

### 📚 関連ドキュメント
- [📋 実行ガイド](../docs/uat/runner.md)
- [🔴 クリティカルテスト](../docs/uat/checklists/critical.md)
- [🎯 UAT最終版手順書](../docs/uat/uat_final.md)

---
*🤖 このコメントはGitHub Actionsにより自動生成されました*
```

## 🟢 本番リリース可能パターン（全テスト完了）

```markdown
## 🧪 UAT Preflight 検証結果

### 📋 事前チェック結果
| チェック項目 | 結果 | 詳細 |
|-------------|------|------|
| ✅ 環境変数チェック | **PASS** | 本番環境設定の検証 |
| ✅ DNS/SSL検証 | **PASS** | aiohub.jp ドメインと証明書 |
| ✅ API疎通確認 | **PASS** | 全エンドポイントの疎通確認 |

### 🎯 リリース判定

🟢 **本番リリース可能**

📋 **次のステップ**:
1. プルリクエストをマージ
2. 手動クリティカルテスト実行: `npm run uat:critical`
3. クリティカル 4/4 成功後、本番リリース実行

📖 **手順詳細**: [critical.md](../docs/uat/checklists/critical.md)

## 📊 自動生成レポート

✅ UAT結果レポートが自動生成されました
- **レポートパス**: `docs/uat/logs/20241222/uat-report.md`
- **アーティファクト**: [uat-preflight-logs](../actions) からダウンロード可能
- **ローカル生成**: `npm run uat:report` で最新レポート作成

---

### 🔧 実行コマンド参考
- **事前チェック**: `npm run uat:preflight`
- **レポート生成**: `npm run uat:report`
- **クリティカルテスト**: `npm run uat:critical`

### 📚 関連ドキュメント
- [📋 実行ガイド](../docs/uat/runner.md)
- [🔴 クリティカルテスト](../docs/uat/checklists/critical.md)
- [🎯 UAT最終版手順書](../docs/uat/uat_final.md)

---
*🤖 このコメントはGitHub Actionsにより自動生成されました*
```

## 📄 レポート生成失敗パターン

```markdown
## 🧪 UAT Preflight 検証結果

### 📋 事前チェック結果
| チェック項目 | 結果 | 詳細 |
|-------------|------|------|
| ✅ 環境変数チェック | **PASS** | 本番環境設定の検証 |
| ✅ DNS/SSL検証 | **PASS** | aiohub.jp ドメインと証明書 |
| ✅ API疎通確認 | **PASS** | 全エンドポイントの疎通確認 |

### 🎯 リリース判定

🟢 **事前チェック完了 - クリティカルテスト待ち**

📋 **次のステップ**:
1. プルリクエストをマージ
2. 手動クリティカルテスト実行: `npm run uat:critical`
3. 全4項目成功後、リリース判定更新

⚠️ **注意**: クリティカルテスト 4/4 成功まではリリース延期

## 📊 レポート生成状況

❌ レポート自動生成に問題が発生
- **手動生成**: `npm run uat:report` で作成してください
- **テンプレート**: `docs/uat/templates/report.md`

---

### 🔧 実行コマンド参考
- **事前チェック**: `npm run uat:preflight`
- **レポート生成**: `npm run uat:report`
- **クリティカルテスト**: `npm run uat:critical`

### 📚 関連ドキュメント
- [📋 実行ガイド](../docs/uat/runner.md)
- [🔴 クリティカルテスト](../docs/uat/checklists/critical.md)
- [🎯 UAT最終版手順書](../docs/uat/uat_final.md)

---
*🤖 このコメントはGitHub Actionsにより自動生成されました*
```

## 🔧 コメント生成の技術詳細

### 生成ロジック

GitHub Actions workflow (`.github/workflows/uat-preflight.yml`) の `Enhanced PR Comment with Release Decision` ステップが以下の条件に基づいてコメント内容を決定：

1. **事前チェック結果**: ENV_CHECK + DNS_CHECK + ENDPOINT_CHECK の成功/失敗
2. **リリース判定**: 事前チェック全通過 + クリティカルテスト4/4成功の組み合わせ
3. **レポート生成状況**: `npm run uat:report` の実行結果

### 判定パターン

| 事前チェック | クリティカル | リリース判定 | 次のアクション |
|-------------|-------------|-------------|---------------|
| PASS (3/3) | 未実行 | 🟡 クリティカルテスト待ち | マージ→手動テスト |
| PASS (3/3) | PASS (4/4) | 🟢 本番リリース可能 | リリース実行 |
| FAIL (2/3以下) | - | 🔴 リリース延期 | 問題修正→再実行 |

### カスタマイズポイント

- **リリース基準**: クリティカルテスト4項目すべて成功が必須
- **アーティファクト**: 30日間保持のログファイル
- **セキュリティ**: 機微情報の自動マスキング機能
- **通知先**: PRコメント + Slack連携（オプション）