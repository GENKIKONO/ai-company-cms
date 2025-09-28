# 本番運用ランブック

## 概要
LuxuCare CMSシステムの本番運用に関する包括的なガイドライン

## 緊急対応フロー

### 1. システム障害対応
```
[障害検知] → [初期対応] → [原因調査] → [復旧作業] → [事後対応]
     ↓           ↓         ↓         ↓         ↓
  監視アラート   一次切り分け  ログ分析   修正適用   レポート作成
```

### 2. 緊急連絡先
- **システム管理者**: admin@luxucare.co.jp
- **開発チーム**: dev-team@luxucare.co.jp
- **緊急時**: 24時間対応 090-XXXX-XXXX

### 3. 障害レベル定義
- **P0 (Critical)**: 全システム停止、データ損失リスク
- **P1 (High)**: 主要機能停止、多数ユーザー影響
- **P2 (Medium)**: 一部機能停止、限定的影響
- **P3 (Low)**: 軽微な問題、ユーザー影響なし

## 監視・アラート

### 1. 監視対象
```yaml
System Health:
  - CPU使用率 (>80% で警告)
  - メモリ使用率 (>85% で警告)
  - ディスク使用率 (>90% で警告)
  - ネットワーク遅延 (>500ms で警告)

Application Metrics:
  - API応答時間 (>2秒で警告)
  - エラー率 (>5% で警告)
  - 同時接続数 (>1000で警告)
  - データベース接続数 (>80% で警告)

Business Metrics:
  - ユーザー登録数
  - 組織作成数
  - ページビュー数
  - コンバージョン率
```

### 2. アラート設定
- **即座通知**: P0, P1レベル障害
- **1時間集約**: P2レベル問題
- **日次レポート**: P3レベル問題、パフォーマンス傾向

### 3. ダッシュボードURL
- **メイン監視**: `/ops/monitoring`
- **詳細分析**: `/ops/analytics`
- **システム状態**: `/api/health`

## デプロイ手順

### 1. 通常デプロイ
```bash
# 1. 事前チェック
npm run verify:prod-ready

# 2. テスト実行
npm run test:production

# 3. ビルド確認
npm run build

# 4. デプロイ実行 (Vercel)
git push origin main

# 5. 事後確認
npm run health:production
```

### 2. 緊急デプロイ
```bash
# 1. ホットフィックス作成
git checkout -b hotfix/urgent-fix

# 2. 修正実装
# [コード修正]

# 3. 最小限テスト
npm run test:critical

# 4. 即座デプロイ
git push origin hotfix/urgent-fix
# → GitHub Actions で自動デプロイ

# 5. 動作確認
curl -f https://aiohub.jp/api/health
```

### 3. ロールバック手順
```bash
# 1. 前回の正常バージョン確認
git log --oneline -10

# 2. ロールバック実行
git revert <commit-hash>
git push origin main

# 3. 確認
npm run health:production
```

## データベース運用

### 1. バックアップ
- **自動バックアップ**: 毎日3:00 AM (JST)
- **保存期間**: 30日間
- **場所**: Supabase自動バックアップ

### 2. マイグレーション
```bash
# 1. マイグレーション作成
supabase migration new migration_name

# 2. 本番適用前テスト
supabase db reset
npm run test:integration

# 3. 本番適用
supabase db push
```

### 3. データベース監視
```sql
-- 接続数確認
SELECT count(*) FROM pg_stat_activity;

-- スロークエリ確認
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- テーブルサイズ確認
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## セキュリティ

### 1. 定期セキュリティチェック
```bash
# 脆弱性スキャン
npm audit --audit-level=high

# 依存関係チェック
npm run security:check

# コードスキャン
npm run lint:security
```

### 2. アクセス管理
- **管理者アクセス**: 最小権限の原則
- **API認証**: JWTトークン + RLS
- **ログ監査**: 全管理者操作をログ記録

### 3. セキュリティインシデント対応
1. **検知**: 監視システムまたは手動報告
2. **封じ込め**: 影響範囲の特定と拡大防止
3. **根絶**: 脆弱性の修正
4. **回復**: システムの正常化
5. **教訓**: 再発防止策の実装

## パフォーマンス最適化

### 1. フロントエンド最適化
```javascript
// 画像最適化
import { LazyImage } from '@/lib/design-system/components/ui/LazyImage';

// コード分割
const AdminPanel = lazy(() => import('./AdminPanel'));

// キャッシュ戦略
const staleWhileRevalidate = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshWhenOffline: false,
  refreshWhenHidden: false,
  refreshInterval: 300000, // 5分
};
```

### 2. バックエンド最適化
```sql
-- インデックス確認
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- クエリプラン分析
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM organizations WHERE slug = 'example';
```

### 3. CDN・キャッシュ戦略
- **静的アセット**: Vercel Edge Network (永続キャッシュ)
- **API レスポンス**: 短期キャッシュ (5分)
- **画像**: Next.js Image Optimization + CDN

## トラブルシューティング

### 1. よくある問題と解決法

#### 1.1 組織作成エラー
```
症状: 500エラー、DATABASE_ERROR
原因: 無効な日付形式、Zod検証エラー
解決: 
1. ログ確認: /var/log/app.log
2. Zodスキーマ検証
3. データベース制約確認
```

#### 1.2 認証エラー
```
症状: 401 Unauthorized
原因: JWT期限切れ、RLS違反
解決:
1. セッション確認: /api/auth/session
2. RLSポリシー確認
3. ユーザー権限検証
```

#### 1.3 パフォーマンス低下
```
症状: 応答時間>2秒
原因: データベースクエリ、メモリリーク
解決:
1. /ops/monitoring でメトリクス確認
2. スロークエリ分析
3. メモリプロファイリング
```

### 2. ログ分析
```bash
# エラーログ検索
grep "ERROR" /var/log/app.log | tail -50

# パフォーマンス分析
grep "SLOW_QUERY" /var/log/app.log | tail -20

# ユーザー行動分析
grep "USER_ACTION" /var/log/app.log | grep "$(date +%Y-%m-%d)"
```

### 3. デバッグコマンド
```bash
# システム状態確認
npm run health:detailed

# データベース接続確認
npm run verify:supabase

# 環境変数確認
npm run verify:env

# 外部API確認
curl -f https://aiohub.jp/api/health
```

## 定期メンテナンス

### 1. 日次タスク
- [ ] システム状態確認
- [ ] エラーログレビュー
- [ ] パフォーマンスメトリクス確認
- [ ] バックアップ状態確認

### 2. 週次タスク
- [ ] セキュリティアップデート確認
- [ ] データベース統計更新
- [ ] 容量使用状況確認
- [ ] ユーザーフィードバック確認

### 3. 月次タスク
- [ ] パフォーマンステスト実行
- [ ] セキュリティ監査
- [ ] データベース最適化
- [ ] 運用レポート作成

## 連絡・エスカレーション

### 1. 報告フロー
```
Level 1: 運用チーム (初期対応)
    ↓ (15分以内に解決しない場合)
Level 2: 開発チーム (技術対応)
    ↓ (1時間以内に解決しない場合)
Level 3: システム管理者 (意思決定)
    ↓ (重大な問題の場合)
Level 4: 経営陣 (ビジネス判断)
```

### 2. 外部ベンダー連絡先
- **Vercel**: サポートチケット経由
- **Supabase**: ダッシュボード内サポート
- **CDN**: 各種プロバイダー窓口

### 3. ドキュメント更新
- 障害対応記録: `/docs/incidents/`
- 変更管理: `/docs/changes/`
- 設定変更: git commit message

---

## 付録

### A. チェックリスト
- [本番リリースチェックリスト](./checklists/production-release.md)
- [障害対応チェックリスト](./checklists/incident-response.md)
- [セキュリティチェックリスト](./checklists/security-audit.md)

### B. 参考資料
- [システム構成図](./diagrams/system-architecture.md)
- [API仕様書](../api/specifications.md)
- [データベーススキーマ](../database/schema.md)

---
最終更新: 2025年9月28日