# AI Visibility Guard 運用 Runbook

## 概要

このRunbookは、AI可視性＋防御統合監視モジュールの日常運用、問題対応、設定変更の手順を説明します。

## 1. 日常監視

### 1.1 管理ダッシュボードの確認

**アクセス方法:**
```
https://aiohub.jp/admin/ai-visibility
```

**確認項目:**
- P0（緊急）問題: 0件であることを確認
- P1（重要）問題: 5件以下であることを確認
- P2（軽微）問題: 許容範囲内であることを確認
- 平均レスポンス時間: 3秒以下であることを確認

### 1.2 Slack通知の監視

**チャンネル:** `#ai-visibility-alerts`

**通知タイミング:**
- **即座通知**: P0問題発生時（5分以内）
- **日次サマリー**: 毎日4:00 JST

### 1.3 定期チェックの確認

**Vercel Cron実行:**
- **スケジュール**: 毎日3:00 JST（18:00 UTC）
- **確認方法**: Vercelダッシュボードでcron実行ログを確認

## 2. 問題対応手順

### 2.1 P0（緊急）問題

**症状:** AIクローラーが403/404/500エラー

**初動対応（5分以内）:**
1. **robots.txt確認**
   ```bash
   curl https://aiohub.jp/robots.txt
   ```
   - GPTBot/CCBotが `/o/` にアクセス可能か確認

2. **サーバー状態確認**
   ```bash
   curl -I https://aiohub.jp/o/luxucare
   ```
   - ステータスコード200を確認

3. **Middleware ブロック条件確認**
   - Vercelログで異常なブロックがないか確認

**エスカレーション:**
- 5分で解決しない場合 → 技術責任者に連絡
- サービス全体に影響の場合 → インシデント対応手順に従う

### 2.2 P1（重要）問題

**症状:** JSON-LD欠落、canonical URL不正

**対応手順（30分以内）:**
1. **該当ページの構造化データ確認**
   ```bash
   curl -s https://aiohub.jp/o/luxucare | grep -A 20 "application/ld+json"
   ```

2. **メタタグ設定確認**
   - canonical URLが正しく設定されているか
   - robots metaが適切か

3. **サイトマップ更新**
   ```bash
   curl -s https://aiohub.jp/sitemap.xml | grep luxucare
   ```

**修正後の確認:**
- 手動でAI可視性チェックを実行
- 結果がP1からOKに変わることを確認

### 2.3 P2（軽微）問題

**症状:** title/description不適切、レスポンス遅延

**対応優先度:** 低（次回メンテナンス時）

**対応方針:**
- SEO最適化の一環として対応
- パフォーマンス改善の検討
- 週次レビューで対応計画を立案

## 3. よくある誤検知とその対応

### 3.1 「response time > 3000ms」の誤検知

**原因:** 一時的なネットワーク遅延
**対応:** 
1. 手動で再チェック実行
2. 連続して発生する場合のみ調査

### 3.2 「JSON-LD signature mismatch」の誤検知

**原因:** 署名キー変更直後
**対応:**
1. `AI_VISIBILITY_SECRET` 環境変数を確認
2. 署名の再生成が必要な場合は開発者に連絡

### 3.3 「robots.txt: Disallow /o/」の誤検知

**原因:** キャッシュの問題
**対応:**
1. robots.txtの内容を直接確認
2. CDNキャッシュのクリア

## 4. 設定変更手順

### 4.1 User-Agent追加

**手順:**
1. `/middleware.ts` の `detectBotType` 関数を更新
2. `/src/app/robots.ts` の該当配列に追加
3. デプロイ

**例: 新しいAIクローラー「ExampleBot」を追加**
```typescript
// middleware.ts
if (userAgent.includes('ExampleBot')) {
  return 'ai_crawler';
}

// robots.ts
const aiCrawlers = ['GPTBot', 'CCBot', 'ExampleBot'];
```

### 4.2 レート制限しきい値変更

**設定ファイル:** `/lib/ai-visibility/content-protection.ts`

**変更例:**
```typescript
const RATE_LIMITS = {
  ai_crawler: { requests: 15, window: 60 }, // 10→15に変更
  // ...
};
```

**変更後:** デプロイして即座に反映

### 4.3 Slack通知先変更

**環境変数更新:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/新しいURL
```

**Vercel環境変数更新手順:**
1. Vercelダッシュボード → Settings → Environment Variables
2. `SLACK_WEBHOOK_URL` を更新
3. 再デプロイ

## 5. 手動復旧手順

### 5.1 ブロックされたIP解除

**Supabase管理画面から:**
```sql
UPDATE blocked_ips 
SET is_active = false, 
    unblocked_at = NOW(), 
    unblocked_by = 'admin'
WHERE ip_address = '対象IPアドレス';
```

**管理画面から:**
1. `/admin/ai-visibility` にアクセス
2. 「Blocked IPs」セクションで対象IPを検索
3. 「Unblock」ボタンをクリック

### 5.2 緊急時の全Bot許可

**注意:** 緊急時のみ使用

```sql
UPDATE ai_visibility_config 
SET config_value = '{"emergency_mode": true}'
WHERE config_key = 'allowed_crawlers';
```

**復旧後:** 必ず元の設定に戻す

### 5.3 システム一時無効化

**環境変数で無効化:**
```bash
AI_VISIBILITY_GUARD_ENABLED=false
```

**影響範囲:**
- レート制限が無効化
- 監視が停止
- robots.txtは静的版にフォールバック

## 6. ログ確認方法

### 6.1 Vercel関数ログ

```bash
# Vercel CLI使用
vercel logs --follow

# 特定の関数のログ
vercel logs api/cron/ai-visibility
```

### 6.2 開発環境ログ

```bash
# 開発サーバーログ
tail -f .next/server.log

# AI可視性関連ログのみ
tail -f .next/server.log | grep "AI Visibility"
```

### 6.3 Supabaseログ

**管理画面:** https://supabase.com/dashboard/project/[PROJECT]/logs

**確認項目:**
- API呼び出し頻度
- エラー率
- レスポンス時間

## 7. 定期メンテナンス

### 7.1 月次レビュー

**実施内容:**
1. **統計レポート作成**
   - P0/P1/P2問題の傾向分析
   - User-Agent別アクセス統計
   - レスポンス時間の推移

2. **設定見直し**
   - レート制限しきい値の適正性
   - 新しいBot User-Agentの検討
   - ブロックリストの更新

3. **パフォーマンス確認**
   - 平均レスポンス時間の推移
   - データベースクエリ性能
   - 誤検知率の確認

### 7.2 四半期レビュー

**実施内容:**
1. **セキュリティ監査**
   - 環境変数の見直し
   - アクセス権限の確認
   - 署名キーのローテーション検討

2. **機能改善検討**
   - 新しいAIクローラーへの対応
   - 監視項目の追加検討
   - アラート条件の最適化

## 8. 連絡先・エスカレーション

### 8.1 連絡先

- **緊急時**: Slack #ai-visibility-alerts
- **一般問い合わせ**: GitHub Issues
- **設定変更**: 技術責任者メール

### 8.2 エスカレーション基準

**即座エスカレーション:**
- P0問題が5分で解決しない
- システム全体への影響
- セキュリティインシデントの疑い

**1時間以内エスカレーション:**
- P1問題が30分で解決しない
- 複数のP1問題が同時発生
- 誤検知が頻発

## 9. よく使うコマンド集

```bash
# 手動AI可視性チェック実行
curl -X POST https://aiohub.jp/api/admin/ai-visibility/run \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# ドライラン実行
curl https://aiohub.jp/api/admin/ai-visibility/run

# robots.txt確認
curl https://aiohub.jp/robots.txt

# sitemap.xml確認
curl https://aiohub.jp/sitemap.xml

# 特定URLのJSON-LD確認
curl -s https://aiohub.jp/o/luxucare | \
  grep -A 30 "application/ld+json" | head -35

# 最新監視結果確認
curl https://aiohub.jp/api/admin/ai-visibility/latest \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

**文書更新日**: 2025年1月17日  
**次回見直し**: 2025年4月17日  
**バージョン**: 1.0.0