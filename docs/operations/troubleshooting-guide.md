# トラブルシューティングガイド

## 緊急度別対応フロー

### 🚨 P0 (Critical) - 即座対応
- **症状**: 全システム停止、データ損失、セキュリティ侵害
- **対応時間**: 15分以内
- **通知**: 即座に関係者全員に連絡

### 🔥 P1 (High) - 1時間以内
- **症状**: 主要機能停止、認証エラー、大量エラー発生
- **対応時間**: 1時間以内
- **通知**: 技術チームに即座連絡

### ⚠️ P2 (Medium) - 1営業日以内
- **症状**: 一部機能停止、パフォーマンス低下
- **対応時間**: 1営業日以内
- **通知**: 次回ミーティングで報告

### 📝 P3 (Low) - 1週間以内
- **症状**: 軽微なUI問題、非クリティカルな警告
- **対応時間**: 1週間以内
- **通知**: 週次レポートに記載

## よくある問題と解決法

### 1. 組織作成エラー (DATABASE_ERROR)

#### 症状
```
Error: DATABASE_ERROR
Status: 500
Message: "Invalid input syntax for type date"
```

#### 原因分析
1. **フロントエンド検証不足**
   - 空文字列がnullに変換されていない
   - 日付フィールドの形式が不正

2. **バックエンド検証不備**
   - Zodスキーマでのnull/undefined処理
   - PostgreSQL制約との不整合

#### 解決手順
```bash
# 1. ログ確認
curl -X GET "https://aiohub.jp/api/diag/logs?category=organization&limit=10"

# 2. スキーマ検証テスト
npm run test:schema -- --grep "organization"

# 3. データベース制約確認
psql -c "SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'organizations'::regclass;"

# 4. 修正適用
git add src/lib/schemas/organization.ts
git commit -m "fix: handle null values in organization schema"
git push origin main
```

#### 予防策
- **Zodスキーマ改善**: `.nullable().transform()` の適切な使用
- **フロントエンド検証強化**: 送信前の値正規化
- **テストケース追加**: null/undefined/空文字列のテスト

### 2. 認証エラー (401 Unauthorized)

#### 症状
```
Error: 401 Unauthorized
Message: "Session not found" または "Insufficient permissions"
```

#### 原因分析
1. **セッション期限切れ**
   - JWTトークンの有効期限切れ
   - リフレッシュトークンの問題

2. **RLSポリシー違反**
   - ユーザー権限不足
   - 組織オーナーシップ問題

#### 解決手順
```bash
# 1. セッション状態確認
curl -X GET "https://aiohub.jp/api/auth/session" \
  -H "Cookie: sb-access-token=<token>"

# 2. RLSポリシー確認
psql -c "SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';"

# 3. ユーザー権限確認
psql -c "SELECT id, email, user_metadata FROM auth.users WHERE id = '<user_id>';"

# 4. 強制ログアウト・再ログイン
# ユーザーに再認証を要求
```

#### 予防策
- **セッション管理改善**: 自動リフレッシュ機能
- **権限チェック強化**: フロントエンドでの事前チェック
- **監視強化**: 認証エラー率の監視

### 3. パフォーマンス低下

#### 症状
```
API応答時間: >2秒
ページ読み込み時間: >3秒
メモリ使用量: >100MB
```

#### 原因分析
1. **データベースクエリ**
   - N+1クエリ問題
   - インデックス不足
   - 大量データのJOIN

2. **フロントエンド問題**
   - バンドルサイズ肥大化
   - 不要なレンダリング
   - メモリリーク

#### 解決手順
```bash
# 1. パフォーマンス分析
npm run test:performance

# 2. データベース分析
psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 3. バンドル分析
npm run build:analyze

# 4. メモリ分析
# Chrome DevTools Memory tab でプロファイリング
```

#### 最適化手順
```javascript
// 1. クエリ最適化
const organizations = await supabase
  .from('organizations')
  .select(`
    id, name, slug,
    profiles:organization_profiles(id, role)
  `)
  .limit(20);

// 2. コンポーネント最適化
const OptimizedComponent = React.memo(({ data }) => {
  const memoizedValue = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  return <div>{memoizedValue}</div>;
});

// 3. 仮想化実装
import { VirtualList } from '@/lib/design-system/components/ui/VirtualList';
```

### 4. ビルド・デプロイエラー

#### 症状
```
Error: Build failed
TypeScript compilation errors
Vercel deployment timeout
```

#### 原因分析
1. **TypeScript エラー**
   - 型定義の不整合
   - 未使用import
   - 厳密性チェック違反

2. **ビルド設定問題**
   - 環境変数不足
   - 依存関係の問題
   - メモリ不足

#### 解決手順
```bash
# 1. ローカルビルド確認
npm run build

# 2. 型チェック
npm run typecheck

# 3. Lint確認
npm run lint

# 4. 依存関係確認
npm audit
npm ci

# 5. 環境変数確認
npm run verify:env
```

#### 修正例
```typescript
// Before: Type error
const handleSubmit = (data: any) => {
  // any type usage
};

// After: Proper typing
interface FormData {
  name: string;
  description?: string;
}
const handleSubmit = (data: FormData) => {
  // Properly typed
};
```

### 5. データベース接続エラー

#### 症状
```
Error: Connection timeout
Error: Too many connections
Error: SSL connection error
```

#### 原因分析
1. **接続数上限**
   - 同時接続数の制限
   - プールサイズ不足

2. **ネットワーク問題**
   - SSL設定問題
   - ファイアウォール設定

#### 解決手順
```bash
# 1. 接続数確認
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 2. 接続設定確認
psql -c "SHOW max_connections;"

# 3. Supabase設定確認
# Supabase Dashboard > Settings > Database

# 4. 接続プール設定
# pgBouncer設定確認
```

#### 設定最適化
```javascript
// Connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});
```

## 監視とアラート

### 1. リアルタイム監視

#### 主要メトリクス
```bash
# システムヘルス確認
curl -f https://aiohub.jp/api/health

# パフォーマンス確認
curl -s https://aiohub.jp/api/monitoring/metrics | jq .

# エラー率確認
curl -s https://aiohub.jp/api/monitoring/errors | jq .
```

#### 監視ダッシュボード
- **URL**: `/ops/monitoring`
- **更新間隔**: 30秒
- **保存期間**: 30日

### 2. ログ分析

#### ログレベル
```javascript
// アプリケーションログ
logger.info('User action', { userId, action });
logger.warn('Performance warning', { metric, threshold });
logger.error('Error occurred', { error, context });

// 監査ログ
auditLogger.log('ADMIN_ACTION', { 
  adminId, action, target, timestamp 
});
```

#### ログ検索
```bash
# エラーログ検索
grep "ERROR" /var/log/app.log | grep "$(date +%Y-%m-%d)"

# パフォーマンス警告
grep "PERFORMANCE_WARNING" /var/log/app.log | tail -20

# セキュリティイベント
grep "SECURITY" /var/log/app.log | tail -10
```

### 3. アラート設定

#### 即座通知 (P0, P1)
- **応答時間**: >2秒が5分継続
- **エラー率**: >5%が1分継続
- **システム停止**: ヘルスチェック失敗

#### 定期通知 (P2, P3)
- **日次レポート**: パフォーマンストレンド
- **週次レポート**: セキュリティサマリー
- **月次レポート**: 運用統計

## 復旧手順

### 1. 緊急復旧

#### システム全停止時
```bash
# 1. 状況確認
curl -f https://aiohub.jp/api/health

# 2. Vercel状態確認
npx vercel ls

# 3. データベース確認
psql -c "SELECT version();"

# 4. ロールバック実行
git revert HEAD
git push origin main

# 5. 復旧確認
npm run health:production
```

#### データベース障害時
```bash
# 1. Supabase状態確認
# Dashboard で確認

# 2. バックアップからの復旧
# Supabase Dashboard > Database > Backups

# 3. 整合性確認
psql -c "SELECT count(*) FROM organizations;"
psql -c "SELECT count(*) FROM profiles;"
```

### 2. データ復旧

#### 部分的データ損失
```sql
-- 1. 影響範囲確認
SELECT count(*) FROM organizations WHERE created_at > '2025-09-28';

-- 2. バックアップから復旧
-- Supabase Point-in-time recovery

-- 3. 整合性チェック
SELECT o.id, o.name, p.user_id 
FROM organizations o 
LEFT JOIN organization_profiles p ON o.id = p.organization_id 
WHERE p.user_id IS NULL;
```

#### 設定復旧
```bash
# 1. 環境変数復旧
npm run verify:env

# 2. RLS設定復旧
psql -f supabase/migrations/latest_rls.sql

# 3. 権限設定復旧
psql -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;"
```

## 予防保守

### 1. 定期チェック

#### 日次チェック
```bash
#!/bin/bash
# daily-check.sh

echo "=== Daily Health Check $(date) ==="

# システムヘルス
curl -f https://aiohub.jp/api/health || echo "ALERT: Health check failed"

# パフォーマンス
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' https://aiohub.jp)
if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
  echo "ALERT: Response time slow: ${RESPONSE_TIME}s"
fi

# エラー率
ERROR_COUNT=$(curl -s https://aiohub.jp/api/monitoring/errors | jq '.count')
if [ "$ERROR_COUNT" -gt 10 ]; then
  echo "ALERT: High error count: $ERROR_COUNT"
fi

echo "=== Check completed ==="
```

#### 週次チェック
```bash
#!/bin/bash
# weekly-check.sh

echo "=== Weekly Maintenance $(date) ==="

# セキュリティ更新
npm audit --audit-level=high

# パフォーマンステスト
npm run test:performance

# データベース統計更新
psql -c "ANALYZE;"

# 容量確認
du -sh /var/log/
df -h

echo "=== Maintenance completed ==="
```

### 2. 予防策実装

#### 自動復旧スクリプト
```bash
#!/bin/bash
# auto-recovery.sh

# ヘルスチェック失敗時の自動復旧
if ! curl -f https://aiohub.jp/api/health; then
  echo "Health check failed, attempting recovery..."
  
  # 1. プロセス再起動
  systemctl restart app
  
  # 2. キャッシュクリア
  redis-cli FLUSHALL
  
  # 3. 再度確認
  sleep 30
  if curl -f https://aiohub.jp/api/health; then
    echo "Recovery successful"
  else
    echo "Recovery failed, escalating..."
    # エスカレーション処理
  fi
fi
```

#### 監視強化
```javascript
// application monitoring
setInterval(async () => {
  try {
    const metrics = await performanceMonitor.getMetrics();
    if (metrics.errorRate > 0.05) {
      await alertSystem.send('HIGH_ERROR_RATE', metrics);
    }
    if (metrics.responseTime > 2000) {
      await alertSystem.send('SLOW_RESPONSE', metrics);
    }
  } catch (error) {
    logger.error('Monitoring check failed', error);
  }
}, 30000); // 30秒ごと
```

## 連絡先・エスカレーション

### 緊急時連絡先
- **Level 1 Support**: support@luxucare.co.jp
- **Level 2 Technical**: tech@luxucare.co.jp  
- **Level 3 Critical**: critical@luxucare.co.jp
- **管理者携帯**: 090-XXXX-XXXX (24時間対応)

### 外部ベンダー
- **Vercel**: [サポートページ](https://vercel.com/support)
- **Supabase**: [ダッシュボード内サポート](https://app.supabase.com)
- **GitHub**: [Status Page](https://www.githubstatus.com/)

---
最終更新: 2025年9月28日