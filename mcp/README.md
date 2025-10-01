# MCP (Model Context Protocol) Supabase 接続設定

このプロジェクトでは、Claude Code から Supabase PostgreSQL データベースに安全に接続できるよう MCP サーバーを設定しています。

## 🔧 セットアップ手順

### 1. 必要な環境変数を設定

`.env.local` に以下の環境変数を追加してください：

```bash
# Supabase MCP 接続用（READ-ONLY）
SUPABASE_DB_URL_RO=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 2. Supabase からの接続文字列取得

1. Supabase Dashboard にログイン
2. プロジェクトを選択
3. **Settings** > **Database** に移動
4. **Connection String** セクションで **Direct connection** を選択
5. パスワードを入力してコピー
6. `.env.local` の `SUPABASE_DB_URL_RO` に設定

## 📋 環境変数一覧

### 既存（アプリ用）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 匿名アクセス用キー  
- `SUPABASE_SERVICE_ROLE_KEY` - サービスロール用キー
- `SUPABASE_COOKIE_DOMAIN` - Cookie ドメイン設定

### 新規追加（MCP用）
- `SUPABASE_DB_URL_RO` - PostgreSQL 直接接続（READ-ONLY）

## 🚀 Claude Code での使用方法

### 1. MCP パネルから接続確認

Claude Code の MCP パネルで以下のサーバーが表示されることを確認：

- **supabase-postgres** - 公式 PostgreSQL MCP サーバー
- **supabase-rest** - 高機能 PostgreSQL MCP サーバー

### 2. 基本的な確認コマンド

```sql
-- 接続テスト
SELECT 1;

-- テーブル一覧
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

-- 組織テーブルの確認
SELECT COUNT(*) FROM organizations;
```

### 3. 利用可能な操作

#### ✅ 許可されている操作
- `SELECT` クエリ（データ参照）
- `SHOW` コマンド（設定確認）
- `EXPLAIN` 文（実行計画確認）
- スキーマ情報の参照

#### ❌ 禁止されている操作
- `INSERT`, `UPDATE`, `DELETE`（データ変更）
- `CREATE`, `DROP`, `ALTER`（スキーマ変更）
- `GRANT`, `REVOKE`（権限変更）
- トランザクション制御

## ⚠️ 重要な注意事項

### セキュリティ
- **本番データベースへの書き込みは絶対に行わないでください**
- 接続文字列は `.env.local` にのみ保存し、Git に含めないでください
- 必要に応じて読み取り専用ユーザーの作成を検討してください

### パフォーマンス
- 大量データの SELECT は避けてください（`LIMIT` を使用）
- 長時間実行される可能性のあるクエリには注意してください
- インデックスが効いているカラムでの検索を推奨します

### トラブルシューティング
- 接続できない場合は、Supabase の IP 制限設定を確認してください
- タイムアウトエラーが発生する場合は、クエリを簡素化してください
- 環境変数が正しく設定されていることを確認してください

## 🔗 参考リンク

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code MCP Integration](https://docs.anthropic.com/claude/docs/mcp-guide)

## 📞 サポート

MCP 接続に関する問題は、以下を確認してください：

1. 環境変数の設定
2. Supabase プロジェクトのステータス
3. Claude Code の MCP パネルでの接続状況
4. ネットワーク接続状況