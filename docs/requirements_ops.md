# 要件定義（運用要件）

## 運用管理体制

### 管理者権限・アクセス

#### 管理者認証
- **アクセス方法**: `/ops` 専用画面
- **認証**: `ADMIN_EMAIL` + `ADMIN_OPS_PASSWORD` 
- **セッション**: 4時間有効、自動ログアウト
- **IP制限**: 将来的に特定IPからのみアクセス許可

#### 権限範囲
- **全データアクセス**: すべての組織・ユーザーデータの参照・編集
- **システム診断**: `/ops/verify`, `/ops/probe` での健全性確認
- **緊急対応**: データ修正・ユーザー権限変更・緊急メンテナンス
- **設定変更**: 環境変数・機能フラグの調整指示

### 診断・監視システム

#### 統合ヘルスチェック（/ops/verify）

**必須チェック項目（ALL GREEN条件）:**

1. **データベース接続**
   - Supabase接続確認
   - RLSポリシー動作確認
   - レスポンス時間 < 500ms

2. **認証システム**
   - Supabase Auth接続
   - セッション生成・検証
   - 権限チェック機能

3. **両モード動作確認**
   - セルフサーブフロー: 企業作成→更新→公開
   - 代理店フロー: 複数組織管理→権限チェック
   - 管理者フロー: 全データアクセス

4. **API整合性**
   - `/api/my/organization` (セルフサーブ専用)
   - `/api/organizations` (代理店専用)
   - エラーレスポンス統一確認

5. **Stripe連携（設定時）**
   - checkout セッション作成
   - webhook 受信確認
   - customer portal アクセス

6. **公開ページ**
   - JSON-LD構文検証
   - OGP設定確認
   - レスポンス速度確認

#### 詳細診断（/ops/probe）

**詳細監視項目:**

```typescript
interface ProbeResult {
  database: {
    connection_time: number;        // ms
    active_connections: number;
    rls_policies_count: number;
    latest_migration: string;
  };
  authentication: {
    response_time: number;
    active_sessions: number;
    failed_attempts_24h: number;
  };
  api_performance: {
    avg_response_time: number;      // P95 over 24h
    error_rate: number;             // %
    throughput: number;             // req/min
  };
  external_services: {
    stripe_status: 'connected' | 'degraded' | 'failed';
    resend_status: 'connected' | 'degraded' | 'failed';
    vercel_status: 'connected' | 'degraded' | 'failed';
  };
  content_validation: {
    published_organizations: number;
    json_ld_errors: number;
    broken_links: number;
  };
}
```

### SLO（Service Level Objectives）

#### 可用性目標
| 項目 | SLO | 測定期間 | 対応レベル |
|------|-----|----------|------------|
| サービス稼働率 | 99.5% | 月次 | 緊急対応 |
| API成功率 | 99.9% | 週次 | 24時間以内 |
| ページ表示 | 95% < 3秒 | 日次 | 48時間以内 |
| JSON-LD検証 | 100% | リアルタイム | 即座 |

#### パフォーマンス目標
| 項目 | 目標値 | 許容値 | アラート閾値 |
|------|--------|--------|-------------|
| API応答時間 | P95 < 1秒 | P95 < 2秒 | P95 > 3秒 |
| DB接続時間 | < 100ms | < 200ms | > 500ms |
| ページLCP | < 2.5秒 | < 4秒 | > 6秒 |
| 同時接続数 | 100ユーザー | 200ユーザー | > 300ユーザー |

### エラーハンドリング・アラート

#### エラー分類・対応

**レベル1: 緊急（即座対応）**
- 全サービス停止
- データベース接続不可
- 認証システム停止
- 重大なセキュリティインシデント

**レベル2: 高（4時間以内）**
- API成功率 < 95%
- Stripe決済機能停止
- JSON-LD検証エラー > 10件
- パフォーマンス大幅劣化

**レベル3: 中（24時間以内）**
- 個別機能の不具合
- パフォーマンス軽度劣化
- 非クリティカルな外部連携エラー

**レベル4: 低（72時間以内）**
- UXの軽微な問題
- 非必須機能の不具合
- ドキュメント・表示の修正

#### 通知・エスカレーション

```typescript
interface AlertConfig {
  slack_webhook: string;          // 即座通知
  email_notifications: string[]; // レベル1-2
  dashboard_alerts: boolean;      // 全レベル
  
  escalation_rules: {
    level_1: '即座',
    level_2: '30分後未対応時',
    level_3: '2時間後未対応時',
    level_4: '24時間後未対応時'
  };
}
```

### バックアップ・災害復旧

#### データバックアップ
- **自動バックアップ**: Supabase PITR（Point-in-Time Recovery）
- **復旧目標**: RPO 1時間、RTO 4時間
- **テスト**: 月次でリストア動作確認
- **データ保持**: 30日間のバックアップ履歴

#### 災害復旧手順
1. **問題特定**: `/ops/verify` での緊急診断
2. **影響範囲確認**: 全機能・一部機能・特定ユーザー
3. **通信**: ユーザー向け障害情報の公開
4. **復旧作業**: データベース復旧・サービス再起動
5. **動作確認**: `/ops/verify` でALL GREEN確認
6. **事後報告**: 原因分析・改善策の文書化

### セキュリティ・アクセス制御

#### アクセスログ
- **管理者操作**: 全操作の詳細ログ保存
- **API呼び出し**: 認証・権限チェック結果
- **データ変更**: 組織・ユーザーデータの変更履歴
- **ログ保持**: 90日間、重要操作は1年間

#### セキュリティ監視
```typescript
interface SecurityMonitoring {
  suspicious_activities: {
    failed_login_attempts: number;     // 24時間で10回以上
    mass_data_access: boolean;         // 短時間での大量アクセス
    unusual_api_patterns: boolean;     // 通常と異なるAPI利用
  };
  
  vulnerability_scan: {
    last_scan: string;                 // 月次実施
    critical_issues: number;
    remediation_status: string;
  };
  
  compliance_check: {
    rls_policy_coverage: number;       // %
    encryption_status: boolean;
    audit_trail_completeness: number;  // %
  };
}
```

### 定期メンテナンス

#### 日次確認項目
- `/ops/verify` でALL GREEN確認
- エラー率・レスポンス時間監視
- Slack通知の確認・対応
- バックアップ完了確認

#### 週次確認項目
- パフォーマンス傾向分析
- セキュリティログレビュー
- 外部サービス（Stripe/Resend）状態確認
- ユーザーフィードバック確認

#### 月次確認項目
- SLO達成率レビュー
- セキュリティスキャン実施
- データベース最適化
- ドキュメント・運用手順更新

### 緊急時連絡先・手順

#### 緊急連絡体制
```
レベル1緊急事態:
1. Slack #emergency チャンネル即座通知
2. 管理者メール送信
3. 必要に応じて電話連絡

対応手順:
1. /ops/verify で現状確認
2. 影響範囲の特定
3. ユーザー向け告知検討
4. 復旧作業開始
5. 進捗報告（30分毎）
```

#### 運用ドキュメント
- **緊急対応マニュアル**: `/docs/operations/emergency-response.md`
- **トラブルシューティング**: `/docs/operations/troubleshooting-guide.md`
- **定期メンテナンス**: `/docs/operations/maintenance-schedule.md`
- **セキュリティ手順**: `/docs/operations/security-procedures.md`

---

**運用責任**: この運用要件に従って24/7の安定稼働を実現すること。要件未達はサービス品質の重大な問題として扱います。