# 管理UI テストガイド

## 概要

管理ダッシュボード（`/dashboard/admin/*`）のE2Eテストおよびローカル動作確認手順です。

## テスト対象ページ

| パス | 機能 | テーブル依存 |
|------|------|-------------|
| `/dashboard/admin` | 管理ツール一覧 | なし |
| `/dashboard/admin/jobs` | ジョブ監視 | translation_jobs, embedding_jobs |
| `/dashboard/admin/ai-usage` | AI使用量 | organization_ai_usage |
| `/dashboard/admin/storage-logs` | ストレージログ | storage_access_logs |
| `/dashboard/admin/audit` | 監査ログ | service_role_audit, ops_audit |
| `/dashboard/admin/security` | セキュリティ | intrusion_detection_alerts, ip_blocklist, ip_reports |
| `/dashboard/admin/ai-visibility` | AI可視性 | ai_visibility_scores, ai_visibility_config, ai_bot_logs |

## ローカルセットアップ

### 1. 環境変数確認

```bash
# .env.localに以下が設定されていることを確認
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. 依存関係インストール

```bash
npm ci
npx playwright install chromium
```

### 3. devサーバー起動

```bash
PORT=3099 npm run dev
```

## E2Eテスト実行

### 管理ページ専用テスト

```bash
npm run test:e2e:admin-dashboard
```

### 全E2Eテスト（CIで実行）

```bash
npm run test:e2e
```

## テスト観点

### 基本ロード

- 各ページが500/404エラーなく読み込まれること
- 未認証時は適切にログインページへリダイレクト（307）

### エラーハンドリング

- Supabase API 500エラー時にページがクラッシュしない
- ネットワーク障害時に適切なエラー表示
- 不正なJSONレスポンス時もクラッシュしない

### 空データ処理

- 各テーブルが空でも正常に描画
- RLS権限エラー（空配列返却）でもクラッシュしない

## RLSポリシー

管理UIは`site_admins`ベースのRLSポリシーで保護されています。

- `translation_jobs_admin_read`
- `embedding_jobs_admin_read`
- `storage_access_logs_admin_read`
- `org_ai_usage_admin_read`
- `ai_visibility_config_admin_read`

## アクセス監査（プレースホルダ）

`src/lib/admin/access-audit.ts`にアクセス監査のプレースホルダを用意。

有効化: `NEXT_PUBLIC_ADMIN_AUDIT_ENABLED=true`

```typescript
import { logPageView, logFilterChange } from '@/lib/admin/access-audit';

// ページビュー記録
logPageView('/dashboard/admin/jobs');

// フィルタ変更記録
logFilterChange('/dashboard/admin/storage-logs', 'bucket', 'assets');
```

## 既知の制限

1. **認証必須**: テストは未認証状態で実行。認証済みテストは別途global-setup.tsで対応
2. **RLS検証**: 実データでのRLS動作確認はSupabase Studio/SQL Editorで実施
3. **監査ログAPI**: 現在はプレースホルダ。本番実装時はEdge Function追加予定

## 次の推奨アクション

1. `service_role_audit` / `intrusion_detection_alerts` / `ip_blocklist` のRLS方針を`site_admins`に統一
2. `ai_visibility_scores`の条件を引き締め（現在は緩い条件）
3. 監査ログAPIの本実装
