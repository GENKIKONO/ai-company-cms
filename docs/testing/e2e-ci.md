# E2E Testing with GitHub Actions (Playwright)

## 概要
このプロジェクトでは、Playwright Chromiumを使用したE2Eテストを GitHub Actions で自動実行しています。
**本番環境の安全性を確保するため、テスト専用の環境・ユーザーのみを使用**しています。

## 🚀 自動実行トリガー

### 実行条件
- **Pull Request**: 全ブランチへのPR作成・更新時
- **Push to main**: mainブランチへの直接プッシュ時

### concurrency制御
- 同一ブランチでの重複実行は自動キャンセルされます
- 最新のコミットのテストのみが実行されます

## 📊 テスト実行内容

### カバレッジ
- **認証フロー**: サインアップ・ログイン・ログアウト
- **組織管理**: 組織作成・編集・住所入力・Googleマップ連携
- **ナレッジベース**: Q&A CRUD・検索・プラン制限
- **公開制御**: セクション表示/非表示切替
- **回帰防止**: ビルド検証・リダイレクトループ防止
- **SEO**: canonical URL・meta tag検証

### 実行設定
- **並列度**: workers=2（CI負荷・レート制限考慮）
- **ブラウザ**: Chromium のみ（安定性重視）
- **タイムアウト**: 全体15分、個別テスト30秒
- **リトライ**: 失敗時2回まで自動リトライ

## 📁 アーティファクトの確認方法

### 1. GitHub Actions ページアクセス
1. リポジトリの [Actions](../../actions) タブを開く
2. 該当のワークフロー実行を選択
3. **Artifacts** セクションを確認

### 2. アーティファクトの種類

#### 📊 `playwright-report-{run_id}`
- **HTML形式のテストレポート**
- ダウンロード後、`index.html` をブラウザで開く
- テスト結果・実行時間・エラー詳細が確認可能

#### 🎬 `test-results-{run_id}`
- **診断ファイル群**
- `trace.zip`: Playwright Trace Viewer用ファイル
- `video.webm`: テスト実行時の画面録画
- `screenshot.png`: 失敗時のスクリーンショット

### 3. Trace Viewer での詳細分析
```bash
# ローカルでTrace Viewerを起動
npx playwright show-trace path/to/trace.zip
```
- タイムライン形式でテスト実行過程を詳細確認
- DOM状態・ネットワーク・ログを時系列で表示

## 🔧 ローカルでの実行

### 基本実行
```bash
# ヘッドレスモード
npm run test:e2e

# UIモード（デバッグ用）
npm run test:e2e:ui

# デバッグモード
npm run test:e2e:debug

# レポート表示
npm run test:e2e:report
```

### 環境設定
```bash
# テスト用環境変数を設定
cp .env.test.local .env.local
```

## ⚠️ よくある失敗と対処法

### 1. 認証エラー
**症状**: `User organization not found` などの認証関連エラー

**原因**:
- テストユーザーの作成/削除に失敗
- RLS (Row Level Security) の権限不足
- Session state の不整合

**対処法**:
```bash
# 1. global-setup ログを確認
# 2. Supabase Auth管理画面で重複ユーザーを削除
# 3. テスト用DBの権限設定を確認
```

### 2. RLS権限エラー
**症状**: `new row violates row-level security policy` エラー

**原因**:
- Single-org modeの権限設定ミス
- `created_by` vs `owner_user_id` の不一致

**対処法**:
- RLSポリシーの `created_by` フィールド使用を確認
- テストデータのowner関係を修正

### 3. 遅延要素の待機エラー
**症状**: `TimeoutError: Waiting for selector` エラー

**原因**:
- DOM要素の読み込み遅延
- ネットワーク応答の遅延
- 不適切なセレクター

**対処法**:
```typescript
// ❌ Bad
await page.click('button');

// ✅ Good
await page.waitForSelector('button', { state: 'visible' });
await page.click('button');

// ✅ Better
await expect(page.locator('button')).toBeVisible();
await page.click('button');
```

### 4. フレーキーテスト (不安定)
**症状**: 成功/失敗が不規則に発生

**対処法**:
- `data-testid` の追加でセレクター安定化
- `waitForTimeout()` の代わりに明示的待機を使用
- ネットワーク応答待機の追加

### 5. プラン制限テストの失敗
**症状**: Free プラン制限（5件）のテストが失敗

**原因**:
- 前回テストのデータが残存
- teardown処理の不完全

**対処法**:
- global-teardown の確認
- 手動でのテストデータクリーンアップ

## 🔐 GitHub Secrets 設定

### テスト専用 Secrets（推奨）
GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

```
SUPABASE_URL_TEST=https://your-test-project.supabase.co
SUPABASE_ANON_KEY_TEST=eyJ...（テスト用anonキー）
SUPABASE_SERVICE_ROLE_KEY_TEST=eyJ...（テスト用service roleキー）
JWT_SECRET_TEST=your-test-jwt-secret
```

### 重要な安全原則
- ✅ **テスト専用Supabaseプロジェクトを使用**
- ❌ **本番Secretsは絶対に使用しない**
- ✅ **テスト用ユーザーのみでデータ操作**
- ❌ **Stripe等の課金システムには触れない**

### Secrets未設定時の動作
Secretsが未設定の場合、ワークフローは既存の `.env.test.local` の値をフォールバックとして使用します。

## 🐛 トラブルシューティング

### ワークフロー実行の確認
1. **GitHub Actions ログ**: 各ステップの詳細ログ
2. **Job Summary**: テスト結果サマリー（パス数・失敗数・実行時間）
3. **Artifacts**: HTML レポートと diagnostic ファイル

### ローカル再現
```bash
# CI環境と同じ設定でローカル実行
CI=true npm run test:e2e

# 特定のテストファイルのみ実行
npx playwright test tests/e2e/smoke-test.spec.ts

# 詳細ログ付き実行
DEBUG=pw:api npm run test:e2e
```

### よくある解決方法
1. **ブラウザ再インストール**: `npx playwright install chromium`
2. **依存関係更新**: `npm ci`
3. **キャッシュクリア**: `npm run build` 後に再実行
4. **テストデータリセット**: Supabase管理画面でテストユーザー削除

## 📈 パフォーマンス最適化

### 実行時間短縮
- workers=2 での並列実行
- Chromiumのみ使用
- 不要なテストの`test.skip()`
- 効率的なセレクター使用

### CI負荷軽減
- concurrency でのキューイング制御
- アーティファクト保持期間 7日間
- リトライ回数制限（2回まで）

## 🔄 継続的改善

### メトリクス監視
- テスト実行時間
- 成功率
- フレーキー率

### アップデート方針
- Playwright バージョンアップ
- テストケース追加
- 安定性向上

---

## 🆘 サポート

問題が解決しない場合：
1. [GitHub Issues](../../issues) で問題を報告
2. 該当するワークフロー実行ログとアーティファクトを添付
3. ローカル再現手順を含めて記載