# ADR-002: DashboardはServer Gate + Client Shellで当面運用

## ステータス
採用済み (2024-12-25)

## コンテキスト

DashboardPageShell は `'use client'` ディレクティブを持つクライアントコンポーネントである（約470行）。

### 問題点
1. **認証チェックがクライアント寄り**: クライアントでのauth判定はセキュリティ上の懸念
2. **DB正の原則違反リスク**: クライアント側で権限判定ロジックを持つと、DBを迂回する可能性
3. **DashboardPageShellの責務過多**: 認証・権限・UI・エラー処理を全て担う

### 却下した選択肢
- **DashboardPageShell の全面 Server Component 化**: 20+ ページに影響、工数大

## 決定

**Server Gate パターンを導入し、DashboardPageShell は UI/体験層として残す。**

### 具体的な変更

1. **Server Gate** (`/dashboard/layout.tsx`):
   - Gate 1: ユーザーセッション存在チェック
   - Gate 2: アカウントステータスチェック（deleted 以外）
   - Gate 3: 組織メンバーシップチェック（少なくとも1つの org に所属）
   - site_admin は Gate 3 を免除

2. **DashboardPageShell** (Client):
   - 認証・権限の「最終判定」はしない（Server Gate で完了済み）
   - UI 表示、エラー表示、ローディング表示を担当
   - 監査ログは Core 経由 (`auditLogWriteClient`)

3. **責務の分離**:
   ```
   Server Gate (layout.tsx)
   └─ 認証・権限の最終判定（失敗時はリダイレクト）

   DashboardPageShell (client)
   └─ UI/UX 層（ローディング、エラー表示、組織コンテキスト提供）
   ```

## 結果

### 良い点
- 認証・権限判定がサーバーで完結（セキュリティ向上）
- DashboardPageShell の変更範囲を最小化
- 段階的なリファクタリングが可能

### 悪い点
- layout と Shell で一部重複するロジック（表示用）
- 完全な Server Component 化に比べるとパフォーマンス最適化の余地あり

### 将来の検討事項
- ページ単位での Server Component 化
- DashboardPageShell の更なる責務縮小

## 関連ファイル
- `src/app/dashboard/layout.tsx`
- `src/components/dashboard/DashboardPageShell.tsx`
- `src/lib/server/organizations.ts` (`getUserOrganizations`)
