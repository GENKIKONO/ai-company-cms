# 🔌 Supabase MCP セットアップ完了

Claude Code から Supabase PostgreSQL データベースに **read-only** で安全にアクセスできるよう、MCP (Model Context Protocol) の設定が完了しました。

## ✅ 設定完了項目

### 1. 作成されたファイル
- **`.mcp.json`** - MCP サーバー設定（2つのサーバーを登録）
- **`mcp/README.md`** - 詳細な使用方法とセキュリティガイド
- **`mcp/connection-string-helper.md`** - 接続文字列の設定方法
- **`mcp/test-commands.md`** - テスト用SQLコマンド集
- **`.env.example`** - 追加された環境変数の例

### 2. 環境変数
- 既存のSupabase設定は保持
- **`SUPABASE_DB_URL_RO`** を新規追加（要設定）

### 3. MCPサーバー登録
- **`supabase-postgres`** - 公式PostgreSQL MCPサーバー
- **`supabase-rest`** - 高機能PostgreSQL MCPサーバー

## 🚀 次の手順（ユーザーが実行）

### 1. Supabaseからデータベースパスワードを取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト `chyicolujwhkycpkxbej` を選択  
3. **Settings** > **Database** に移動
4. **Connection String** > **Direct connection** を選択
5. データベースパスワードを入力してコピー

### 2. .env.local を更新

現在の `.env.local` 22行目：
```bash
SUPABASE_DB_URL_RO="postgresql://postgres:[PASSWORD]@db.chyicolujwhkycpkxbej.supabase.co:5432/postgres"
```

`[PASSWORD]` を実際のパスワードに置き換えてください。

### 3. Claude Code での接続確認

1. Claude Code を再起動
2. MCP パネルを開く
3. `supabase-postgres` と `supabase-rest` が表示されることを確認
4. 接続テストを実行

## 🧪 基本テスト

以下のSQLコマンドで接続をテストしてください：

```sql
-- 基本接続テスト
SELECT 1 as test;

-- テーブル一覧
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

-- 組織データの確認
SELECT COUNT(*) FROM organizations;
```

## 🔒 セキュリティ機能

- **Read-Only**: データの読み取りのみ可能
- **環境変数**: 接続文字列は`.env.local`に保存、Gitには含まれない
- **公式サーバー**: 信頼できるMCPサーバーパッケージを使用

## 📋 利用可能なテーブル

推定されるプロジェクトテーブル：
- `organizations` - 企業情報
- `services` - サービス情報
- `case_studies` - 導入事例  
- `faqs` - よくある質問
- `partners` - パートナー企業
- `users` - ユーザー情報

## ⚠️ 重要な注意事項

1. **書き込み禁止**: `INSERT`, `UPDATE`, `DELETE` は実行できません
2. **本番データ**: 実際の本番データベースなので慎重に操作してください
3. **パフォーマンス**: 大量データの取得時は `LIMIT` を使用してください

## 🔧 トラブルシューティング

問題が発生した場合：

1. 環境変数 `SUPABASE_DB_URL_RO` の確認
2. Claude Code の再起動
3. `mcp/README.md` の詳細ガイドを参照
4. Supabaseプロジェクトのステータス確認

## 📚 関連ドキュメント

- `mcp/README.md` - 詳細な使用方法
- `mcp/connection-string-helper.md` - 接続設定ガイド  
- `mcp/test-commands.md` - テスト用SQLコマンド

**設定完了**: Claude Code の MCP パネルから Supabase への安全な読み取り専用アクセスをお楽しみください！