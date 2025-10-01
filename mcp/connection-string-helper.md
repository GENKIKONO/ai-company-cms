# Supabase 接続文字列生成ヘルパー

## 現在のプロジェクト設定

Based on your `.env.local`:
- **Supabase URL**: `https://chyicolujwhkycpkxbej.supabase.co`
- **Project Reference**: `chyicolujwhkycpkxbej`

## 必要な接続文字列形式

Your PostgreSQL connection string should be:

```
SUPABASE_DB_URL_RO=postgresql://postgres:[YOUR_DATABASE_PASSWORD]@db.chyicolujwhkycpkxbej.supabase.co:5432/postgres
```

## 🔧 設定手順

### 1. Supabase Dashboard で接続文字列を取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト `chyicolujwhkycpkxbej` を選択
3. **Settings** > **Database** に移動
4. **Connection String** セクションを確認
5. **Direct connection** を選択
6. データベースパスワードを入力
7. 完全な接続文字列をコピー

### 2. .env.local に追加

`.env.local` ファイルに以下を追加：

```bash
# Supabase MCP 接続（READ-ONLY）
SUPABASE_DB_URL_RO=postgresql://postgres:[YOUR_PASSWORD]@db.chyicolujwhkycpkxbej.supabase.co:5432/postgres
```

**⚠️ 重要**: `[YOUR_PASSWORD]` を実際のデータベースパスワードに置き換えてください。

### 3. 接続テスト

Claude Code の MCP パネルで接続をテストできます：

```sql
-- 基本接続テスト
SELECT 1 as test;

-- データベース情報確認
SELECT current_database(), current_user, version();

-- 利用可能なテーブル確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 🔒 セキュリティの推奨事項

### 読み取り専用ユーザーの作成（オプション）

より安全性を高めるために、読み取り専用ユーザーを作成することを推奨します：

```sql
-- 読み取り専用ユーザーの作成
CREATE USER mcp_readonly WITH PASSWORD 'secure_password_here';

-- public スキーマの読み取り権限を付与
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mcp_readonly;

-- 今後作成されるテーブルにも権限を付与
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;
```

作成後の接続文字列：
```
SUPABASE_DB_URL_RO=postgresql://mcp_readonly:secure_password_here@db.chyicolujwhkycpkxbej.supabase.co:5432/postgres
```

## 📋 現在のプロジェクト構造

推定されるテーブル構造：
- `organizations` - 企業情報
- `services` - サービス情報  
- `case_studies` - 導入事例
- `faqs` - よくある質問
- `partners` - パートナー企業
- `users` - ユーザー情報

これらのテーブルに対して、安全に読み取り操作を実行できます。