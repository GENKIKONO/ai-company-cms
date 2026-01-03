# 🛡️ AIOHub Phase 5 成果物 - 安全な検証手順書

> **重要**: この手順書は実際の検証を段階的・安全に実施するためのガイドです  
> **原則**: 破壊的変更は実施せず、観測・検証のみを行います

---

## 📋 **検証可能な成果物一覧**

| 成果物 | ファイル | 安全性 | 検証方法 |
|--------|---------|--------|----------|
| ✅ **APIスモークテスト（修正版）** | `api-smoke-test-critical-verified.js` | 🟢 安全 | dry-run実行 |
| ❌ **useEffect修正パッチ** | `fix-useeffect-warnings.js` | 🔴 危険 | **適用禁止** |
| ✅ **CIワークフロー** | `mandatory-pr-main-only.yml` | 🟡 注意 | テストブランチ |
| ✅ **機能棚卸しドキュメント** | `feature-inventory.md/json` | 🟢 安全 | 確認のみ |

---

## 🚀 **Phase 1: 即座に安全実行可能**

### **1-1. APIスモークテスト検証**
```bash
# 🟢 安全: 読み取りのみ、データ変更なし
node scripts/api-smoke-test-critical-verified.js

# 期待結果:
# - 認証失敗で多くのAPIがスキップされる（正常）
# - 公開API（埋め込みWidget等）のレスポンス確認
# - エラーの場合は404/401/403が正常（破壊的テストではない）
```

**注意事項**:
- ✅ **未解析**: 認証API・テストユーザー情報の確認必要
- ✅ **未解析**: 認証ヘッダー形式の確認必要  
- ✅ 動的パラメータは安全なテスト値に設定済み

### **1-2. 機能棚卸しドキュメント確認**
```bash
# 🟢 完全に安全: 読み取りのみ
cat docs/feature-inventory.md | head -50
cat docs/feature-inventory.json | jq .project
```

### **1-3. 不要ファイル削除（安全確認済み）**
```bash
# 🟢 安全: バックアップファイルのみ削除
find src -name "*.bak*" -ls    # まず確認
find src -name "*.bak*" -delete # 実際の削除
```

---

## ⚠️ **Phase 2: 注意深い検証が必要**

### **2-1. CIワークフローのテスト**

#### **準備: テスト用ブランチ作成**
```bash
# 🟡 注意: 本番影響なし、テスト専用
git checkout -b test/ci-verification
git add .github/workflows/mandatory-pr-main-only.yml
git commit -m "test: CI workflow verification"
git push origin test/ci-verification
```

#### **段階テスト**
```bash
# Step 1: develop向けPRでワークフロー競合確認
# GitHub上でtest/ci-verification → develop のPR作成
# enhanced-ci.yml のみが実行されることを確認

# Step 2: main向けテスト（要注意）
# GitHub上でtest/ci-verification → main のPR作成
# mandatory-pr-main-only.yml が実行されることを確認
```

**検証ポイント**:
- [ ] 複数ワークフローの並行実行なし
- [ ] npm scriptsエラーなし
- [ ] Playwright設定エラーなし  
- [ ] 環境変数・認証エラーの適切な処理

### **2-2. 既存ESLint警告の確認（修正は実施しない）**
```bash
# 🟢 安全: 確認のみ、修正はしない
npm run lint 2>&1 | grep -E "(Warning|Error)" | wc -l
npm run lint 2>&1 | grep "react-hooks/exhaustive-deps" | head -5

# 🔴 危険: 実行禁止
# node scripts/fix-useeffect-warnings.js --apply
```

---

## 🚨 **Phase 3: 実行禁止・要検討事項**

### **❌ 実行してはいけない操作**

#### **3-1. useEffect修正パッチ適用**
```bash
# 🔴 絶対禁止: 既存機能を破壊する
# node scripts/fix-useeffect-warnings.js --apply
```

**理由**: 
- AIVisibilityCard.tsx で関数重複定義エラー
- 既存のビジネスロジックが消失
- 機能が完全に動作しなくなる

#### **3-2. 本番環境での大規模テスト**
```bash
# 🔴 禁止: 本番データに影響する可能性
# TEST_BASE_URL=https://production.aiohub.jp node scripts/api-smoke-test-critical-verified.js
```

### **🟡 要検討: 追加調査が必要な項目**

#### **3-3. 認証情報・テストユーザーの特定**
**未解析事項**:
- 実際の認証API仕様 (`/api/auth/session` の形式)
- テストユーザーのクレデンシャル
- 認証ヘッダーの形式 (Bearer, Cookie, 独自形式)
- 管理者権限の取得方法

**推奨アクション**:
1. 開発チームに認証仕様確認
2. テスト用アカウント情報の取得  
3. API仕様書・認証ドキュメントの確認

#### **3-4. 動的パラメータの実際の値**
**未解析事項**:
- 組織ID（organization_id）の取得方法
- ユーザーID（user_id）の安全なテスト値
- 組織スラッグ（slug）の有効な値

**推奨アクション**:
1. データベースから安全なテスト値を特定
2. 開発環境での有効なパラメータ確認
3. テスト専用の組織・ユーザー作成

---

## 📊 **検証結果の評価基準**

### **✅ 成功基準**

#### **APIスモークテスト**
- **認証なし**: 公開API（埋め込みWidget等）が200 or 404応答
- **認証あり**: 認証済みAPIが200 or 403応答
- **エラー**: 500系エラーがないこと
- **パフォーマンス**: 平均応答時間 < 2秒

#### **CIワークフロー**
- **競合なし**: 複数ワークフローの同時実行がない
- **正常完了**: TypeScript, ESLint, Build が成功
- **適切な失敗**: E2E, API Smokeテストが適切な理由で失敗
- **通知機能**: 失敗時のコメント・通知が動作

### **🔴 失敗・問題の対処**

#### **APIスモークテストの問題**
| 問題 | 原因 | 対処法 |
|------|------|--------|
| 全API 500エラー | アプリケーション起動失敗 | `npm run dev` で基本動作確認 |
| 認証エラー | 認証情報不正 | 認証仕様の再確認、テストユーザー情報取得 |
| タイムアウト | サーバー応答遅延 | ローカル環境での実行、負荷状況確認 |

#### **CIワークフローの問題**
| 問題 | 原因 | 対処法 |
|------|------|--------|
| Workflow が実行されない | トリガー条件不適切 | ブランチ名、PR対象の確認 |
| npm script エラー | package.json の不整合 | 不足スクリプトの追加・修正 |
| 並行実行競合 | concurrency 設定不備 | ワークフロー名・グループ設定の調整 |

---

## 🎯 **段階的検証スケジュール**

### **Week 1: 基礎検証**
- [ ] Day 1-2: APIスモークテスト実行・結果分析
- [ ] Day 3-4: 不要ファイル削除・クリーンアップ
- [ ] Day 5: 結果まとめ・次週計画

### **Week 2: CI統合テスト**  
- [ ] Day 1-2: テストブランチでのワークフロー検証
- [ ] Day 3-4: 既存ワークフローとの競合確認
- [ ] Day 5: 統合案の最終調整

### **Week 3: 詳細調査・改善**
- [ ] Day 1-3: 認証情報・動的パラメータの特定
- [ ] Day 4-5: APIスモークテストの認証対応版作成

---

## 🔧 **トラブルシューティング**

### **よくある問題と解決法**

#### **1. npm スクリプトエラー**
```bash
# エラー: "script not found"
# 解決: package.json に不足スクリプト追加
npm run smoke:api:critical   # エラーの場合
npm run test:e2e:critical   # エラーの場合

# 対処: スクリプトが存在するか確認
npm run                     # 利用可能スクリプト一覧
```

#### **2. Playwright実行エラー**  
```bash
# エラー: "Playwright browsers not installed"
# 解決: ブラウザ再インストール
npx playwright install --with-deps chromium

# エラー: "Cannot start server"
# 解決: ポート確認・アプリケーション起動確認
netstat -tulpn | grep :3000
npm run dev                 # 別ターミナルで起動
```

#### **3. 認証関連エラー**
```bash
# エラー: "Authentication failed"
# 調査: 認証API仕様確認
curl -X POST http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 未解析: 実際のエンドポイント・形式確認必要
```

---

## 📚 **参考情報・関連ドキュメント**

### **生成ファイル一覧**
- `scripts/api-smoke-test-critical-verified.js` - 修正版APIテスト
- `scripts/useeffect-risk-analysis.md` - useEffect修正リスク分析
- `scripts/ci-workflow-conflicts-analysis.md` - CIワークフロー競合分析
- `.github/workflows/mandatory-pr-main-only.yml` - main専用ワークフロー
- `docs/feature-inventory.md` - 機能棚卸しドキュメント
- `docs/feature-inventory.json` - 機能データ（JSON）

### **開発チーム確認事項**
1. **認証仕様**: API認証方式・テストユーザー情報
2. **テスト環境**: 安全にテスト可能な環境・データ
3. **CI設定**: GitHub Secrets・環境変数の設定
4. **権限**: 管理者機能テストの実施権限
5. **データベース**: テスト用の安全なパラメータ値

---

## ⚡ **クイック実行コマンド集**

### **即座実行可能（安全）**
```bash
# APIテスト実行
node scripts/api-smoke-test-critical-verified.js

# 機能一覧確認  
head -100 docs/feature-inventory.md

# バックアップファイル削除
find src -name "*.bak*" -delete

# ESLint警告確認（修正はしない）
npm run lint | grep "Warning" | wc -l
```

### **要注意実行（段階的テスト）**
```bash
# CIワークフローテスト（テストブランチで）
git checkout -b test/verification
git add .github/workflows/mandatory-pr-main-only.yml
git commit -m "test: workflow verification"
git push origin test/verification
# GitHub上でPR作成・動作確認
```

### **実行禁止**
```bash
# ❌ 絶対実行しない
# node scripts/fix-useeffect-warnings.js --apply
```

---

**📝 最終確認**: この手順書に従うことで、Phase 5で生成した成果物を**破壊的変更なし**で安全に検証できます。問題発生時は即座に停止し、開発チームと相談してください。