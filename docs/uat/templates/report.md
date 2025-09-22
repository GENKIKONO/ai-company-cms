# 📊 UAT実行レポート

## 📋 実行情報
- **実行日時**: {{EXECUTION_DATE}}
- **実行者**: {{EXECUTOR}}
- **環境**: {{ENVIRONMENT}}
- **Git コミット**: {{GIT_COMMIT}}
- **ブランチ**: {{GIT_BRANCH}}

---

## 🎯 リリース判定

{{RELEASE_DECISION}}

{{RELEASE_DETAILS}}

---

## 📊 テスト結果詳細

### 🚨 事前チェック結果
{{PREFLIGHT_RESULTS}}

### 🔴 クリティカルテスト結果（必須）
{{CRITICAL_RESULTS}}

### 🟡 重要テスト結果
{{IMPORTANT_RESULTS}}

### 🟢 推奨テスト結果
{{RECOMMENDED_RESULTS}}

---

## 📊 総合結果サマリー

- **全体成功率**: {{OVERALL_SUCCESS_RATE}}

---

## 📝 次のアクション

{{NEXT_ACTIONS}}

---

## 🔗 関連リンク

- [UAT手順書](../uat_final.md)
- [クリティカルチェックリスト](../checklists/critical.md)
- [重要テストチェックリスト](../checklists/important.md)
- [推奨テストチェックリスト](../checklists/recommended.md)

---

## 📄 レポート詳細

- **生成時刻**: {{EXECUTION_DATE}}
- **自動生成**: このレポートは `npm run uat:report` により自動生成されました
- **機微情報保護**: 認証情報・個人情報はマスキング済み

---

> 🔒 **セキュリティ注意**: このレポートには本番環境のテスト結果が含まれています。機微情報が含まれていないことを確認の上、必要最小限の範囲でのみ共有してください。