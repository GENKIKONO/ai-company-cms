# 障害対応チェックリスト

## 🚨 障害レベル判定

### P0 (Critical) - 即座対応
- [ ] **全システム停止** - サービス完全利用不可
- [ ] **データ損失** - ユーザーデータの破損・消失
- [ ] **セキュリティ侵害** - 不正アクセス・情報漏洩
- [ ] **認証系障害** - 全ユーザーログイン不可

**対応時間**: 15分以内  
**通知**: 全関係者に即座連絡  

### P1 (High) - 1時間以内
- [ ] **主要機能停止** - 組織作成・編集不可
- [ ] **大量エラー** - エラー率>50%継続
- [ ] **データベース障害** - 接続不可・応答なし
- [ ] **認証一部障害** - 特定ユーザーログイン不可

**対応時間**: 1時間以内  
**通知**: 技術チーム・管理者  

### P2 (Medium) - 1営業日以内
- [ ] **一部機能停止** - 非クリティカル機能影響
- [ ] **パフォーマンス低下** - 応答時間>5秒継続
- [ ] **UI表示問題** - レイアウト崩れ・文字化け
- [ ] **監視アラート** - 閾値超過継続

**対応時間**: 1営業日以内  
**通知**: 担当チーム  

### P3 (Low) - 1週間以内
- [ ] **軽微なUI問題** - 非クリティカルな表示問題
- [ ] **ログ警告** - 軽微な警告継続
- [ ] **ドキュメント不整合** - 説明文・ヘルプの誤り

**対応時間**: 1週間以内  
**通知**: 週次レポート  

## ⏰ 初期対応 (最初の15分)

### 1. 障害検知・確認
- [ ] **検知方法記録**
  - [ ] 監視アラート
  - [ ] ユーザー報告  
  - [ ] 定期チェック
  - [ ] その他: ________________

- [ ] **影響範囲確認**
```bash
# システム全体確認
curl -f https://aiohub.jp/api/health

# 主要API確認
curl -f https://aiohub.jp/api/my/organization
curl -f https://aiohub.jp/api/auth/session

# データベース確認
psql -c "SELECT version();"
```

### 2. 初期診断
- [ ] **症状記録**
  - エラーメッセージ: ________________
  - 発生時刻: ________________
  - 影響ユーザー数: ________________
  - 再現手順: ________________

- [ ] **緊急度判定**
  - [ ] P0: 全関係者に即座連絡
  - [ ] P1: 技術チーム・管理者に連絡
  - [ ] P2: 担当チームに通知
  - [ ] P3: 記録のみ

### 3. 関係者通知
- [ ] **連絡実施**
  - 通知時刻: ________________
  - 通知方法: ________________
  - 通知先: ________________

```bash
# 緊急通知テンプレート
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 INCIDENT DETECTED",
    "attachments": [{
      "color": "danger",
      "fields": [
        {"title": "Level", "value": "P1", "short": true},
        {"title": "Time", "value": "'$(date)'", "short": true},
        {"title": "Summary", "value": "API responding with 500 errors"}
      ]
    }]
  }'
```

## 🔍 詳細調査 (15-60分)

### 1. ログ分析
- [ ] **アプリケーションログ**
```bash
# 最新エラーログ
grep "ERROR" /var/log/app.log | tail -50

# 障害時間帯のログ
grep "$(date +%Y-%m-%d)" /var/log/app.log | grep "ERROR\|CRITICAL"

# パフォーマンス警告
grep "PERFORMANCE" /var/log/app.log | tail -20
```

- [ ] **システムログ**
```bash
# システムリソース確認
top
free -h
df -h

# プロセス確認
ps aux | grep node
systemctl status app
```

- [ ] **データベースログ**
```sql
-- 接続数確認
SELECT count(*) FROM pg_stat_activity;

-- スロークエリ確認
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- エラーログ確認
SELECT * FROM pg_stat_database;
```

### 2. 外部サービス確認
- [ ] **Vercel ステータス**
  - ダッシュボード確認: ________________
  - デプロイ状況: ________________

- [ ] **Supabase ステータス**
  - 接続状況: ________________
  - パフォーマンス: ________________

- [ ] **外部API ステータス**
  - GitHub: ________________
  - その他: ________________

### 3. 根本原因分析
- [ ] **原因特定**
  - [ ] コード変更関連
  - [ ] インフラ問題
  - [ ] 外部サービス障害
  - [ ] データ問題
  - [ ] 設定変更関連
  - [ ] その他: ________________

- [ ] **影響範囲詳細**
  - 機能影響: ________________
  - ユーザー影響: ________________
  - データ影響: ________________

## 🛠️ 復旧作業

### 1. 一時的対処 (Workaround)
- [ ] **緊急回避策実施**
```bash
# 例: 問題のある機能を無効化
# メンテナンスページ表示
echo "maintenance" > /var/www/html/maintenance.flag

# 問題のあるAPI無効化
# nginx設定で特定エンドポイントを503に
```

- [ ] **負荷軽減**
```bash
# キャッシュクリア
redis-cli FLUSHALL

# 不要なプロセス停止
pkill -f "heavy-process"

# 接続数制限
# nginx rate limiting有効化
```

### 2. 根本修正
- [ ] **修正実装**
  - 修正内容: ________________
  - テスト実施: ________________
  - レビュー完了: ________________

```bash
# ホットフィックス作成
git checkout -b hotfix/urgent-fix-$(date +%Y%m%d-%H%M)

# 修正実装
# [修正コード記述]

# 緊急テスト
npm run test:critical

# 緊急デプロイ
git add .
git commit -m "hotfix: urgent fix for P1 incident"
git push origin hotfix/urgent-fix-$(date +%Y%m%d-%H%M)
```

### 3. 復旧確認
- [ ] **機能確認**
```bash
# 基本機能テスト
curl -f https://aiohub.jp/api/health
curl -f https://aiohub.jp/api/my/organization

# パフォーマンス確認
time curl -s https://aiohub.jp > /dev/null

# ユーザーフロー確認
npm run test:smoke
```

- [ ] **監視メトリクス確認**
  - エラー率: ________________
  - 応答時間: ________________
  - スループット: ________________

## 📊 事後対応

### 1. ステータス更新
- [ ] **関係者通知**
```bash
# 復旧通知
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "✅ INCIDENT RESOLVED",
    "attachments": [{
      "color": "good",
      "fields": [
        {"title": "Resolution Time", "value": "'$(date)'", "short": true},
        {"title": "Downtime", "value": "45 minutes", "short": true}
      ]
    }]
  }'
```

### 2. データ整合性確認
- [ ] **データ検証**
```sql
-- 組織データ整合性
SELECT count(*) FROM organizations;
SELECT count(*) FROM organization_profiles;

-- 参照整合性確認
SELECT o.id, o.name, p.user_id 
FROM organizations o 
LEFT JOIN organization_profiles p ON o.id = p.organization_id 
WHERE p.user_id IS NULL;

-- 最近のデータ確認
SELECT * FROM organizations WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 3. 影響範囲確認
- [ ] **ユーザー影響調査**
  - 影響ユーザー数: ________________
  - データ損失: ________________
  - 機能停止時間: ________________

- [ ] **ビジネス影響評価**
  - 売上影響: ________________
  - 顧客満足度影響: ________________
  - ブランド影響: ________________

## 📝 インシデントレポート

### 基本情報
- **インシデントID**: INC-$(date +%Y%m%d-%H%M)
- **発生日時**: ________________
- **検知日時**: ________________
- **復旧日時**: ________________
- **総ダウンタイム**: ________________

### 障害概要
- **症状**: ________________
- **影響範囲**: ________________
- **緊急度**: P0 / P1 / P2 / P3

### 根本原因
- **直接原因**: ________________
- **根本原因**: ________________
- **寄与要因**: ________________

### 対応履歴
| 時刻 | 対応者 | 実施内容 | 結果 |
|------|--------|----------|------|
| | | | |
| | | | |
| | | | |

### 改善策
- [ ] **即座実施**
  - 内容: ________________
  - 担当: ________________
  - 期限: ________________

- [ ] **短期改善 (1週間)**
  - 内容: ________________
  - 担当: ________________
  - 期限: ________________

- [ ] **中長期改善 (1ヶ月)**
  - 内容: ________________
  - 担当: ________________
  - 期限: ________________

### 学習事項
- **プロセス改善**: ________________
- **技術改善**: ________________
- **監視改善**: ________________
- **文書改善**: ________________

## 🔄 再発防止

### 1. 技術的対策
- [ ] **監視強化**
```javascript
// 新しい監視項目追加
const monitors = [
  { metric: 'api_error_rate', threshold: 0.05, alert: 'immediate' },
  { metric: 'db_connection_count', threshold: 80, alert: 'warning' },
  { metric: 'response_time_p95', threshold: 2000, alert: 'warning' }
];
```

- [ ] **自動復旧**
```bash
# ヘルスチェック失敗時の自動復旧
#!/bin/bash
if ! curl -f https://aiohub.jp/api/health; then
  echo "Health check failed, attempting auto-recovery"
  systemctl restart app
  sleep 30
  curl -f https://aiohub.jp/api/health || escalate_alert
fi
```

### 2. プロセス改善
- [ ] **チェックリスト更新** - 今回の学習事項を反映
- [ ] **ドキュメント改善** - 手順書・トラブルシューティング更新
- [ ] **テスト強化** - 同様問題を検出するテスト追加
- [ ] **研修実施** - チーム向け障害対応研修

### 3. 継続的改善
- [ ] **定期レビュー** - 月次インシデントレビュー実施
- [ ] **メトリクス改善** - 予兆検知指標の追加
- [ ] **自動化推進** - 手動作業の自動化検討

---

## 📞 緊急連絡先

### Level 1 (初期対応)
- **運用チーム**: support@luxucare.co.jp
- **Slack**: #incident-response

### Level 2 (技術対応)
- **開発チーム**: dev@luxucare.co.jp  
- **Slack**: #dev-emergency

### Level 3 (管理者)
- **システム管理者**: admin@luxucare.co.jp
- **携帯**: 090-XXXX-XXXX (24時間)

### 外部ベンダー
- **Vercel**: [Support](https://vercel.com/support)
- **Supabase**: [Dashboard Support](https://app.supabase.com)

---
**作成日**: 2025年9月28日  
**最終更新**: 2025年9月28日  
**次回見直し**: インシデント発生時または月次レビュー時