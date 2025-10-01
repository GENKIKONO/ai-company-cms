# MCP Supabase 接続テストコマンド

## 📋 前提条件

1. `.env.local` に `SUPABASE_DB_URL_RO` が正しく設定されていること
2. Claude Code で .mcp.json が認識されていること
3. MCP パネルで `supabase-postgres` と `supabase-rest` が表示されていること

## 🧪 基本接続テスト

### 1. シンプル接続確認
```sql
SELECT 1 as connection_test;
```

### 2. データベース情報確認  
```sql
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;
```

### 3. 現在時刻確認
```sql
SELECT NOW() as current_time;
```

## 📊 スキーマ探索

### 1. 利用可能なテーブル一覧
```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. 主要テーブルの構造確認
```sql
-- Organizations テーブルの構造
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 3. テーブル行数確認
```sql
SELECT 
    'organizations' as table_name,
    COUNT(*) as row_count
FROM organizations
UNION ALL
SELECT 
    'services' as table_name,
    COUNT(*) as row_count  
FROM services
UNION ALL
SELECT 
    'case_studies' as table_name,
    COUNT(*) as row_count
FROM case_studies
ORDER BY table_name;
```

## 🔍 データ内容確認

### 1. Organizations サンプルデータ
```sql
SELECT 
    id,
    name,
    slug,
    status,
    is_published,
    created_at
FROM organizations 
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Services サンプルデータ
```sql
SELECT 
    s.id,
    s.name as service_name,
    o.name as organization_name,
    s.created_at
FROM services s
JOIN organizations o ON s.organization_id = o.id
ORDER BY s.created_at DESC
LIMIT 5;
```

### 3. 最近の活動確認
```sql
SELECT 
    'organization' as type,
    name,
    created_at
FROM organizations
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'service' as type,
    name,
    created_at
FROM services
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## 🚫 書き込み禁止確認

以下のコマンドは **実行してはいけません**（MCPサーバーが適切に制限することを確認）：

```sql
-- これらは実行しないでください！
-- INSERT INTO organizations (name) VALUES ('test');
-- UPDATE organizations SET name = 'test' WHERE id = '...';
-- DELETE FROM organizations WHERE id = '...';
-- DROP TABLE organizations;
```

## 🔧 トラブルシューティング

### 接続エラーの場合
```sql
-- 接続権限確認
SELECT 
    current_user,
    session_user,
    pg_backend_pid() as process_id;

-- データベース接続設定確認
SHOW all;
```

### パフォーマンステスト
```sql
-- 簡単なパフォーマンステスト
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM organizations;
```

## 📈 有用な分析クエリ

### 1. 企業ステータス分布
```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM organizations
GROUP BY status
ORDER BY count DESC;
```

### 2. 月別企業登録数
```sql
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_organizations
FROM organizations
WHERE created_at > NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### 3. 公開済み企業とサービス数
```sql
SELECT 
    COUNT(DISTINCT o.id) as published_organizations,
    COUNT(DISTINCT s.id) as total_services
FROM organizations o
LEFT JOIN services s ON o.id = s.organization_id
WHERE o.is_published = true;
```

これらのクエリを使用して、MCP 接続が正常に動作していることを確認してください。