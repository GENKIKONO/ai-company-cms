# AIO Hub - AI可視性＋防御統合監視モジュール 要件定義追加

## 1. 背景・目的

### 1.1 背景
AIO Hubは「AIが正しく理解・引用できる構造を提供する」ことを目的とするプラットフォームです。この目的を実現するため、AIクローラーによる適切なアクセスを確保し、同時に不正なスクレイピングや攻撃的アクセスを防御する必要があります。

### 1.2 モジュール目的
AI可視性＋防御統合監視モジュール（AI Visibility Guard System）は、以下の3つの主要目的を達成します：

1. **AI可視性の確保**: AI・検索エンジンに確実に読み取られる状態の維持
2. **不正アクセス防御**: 不正コピー・高頻度攻撃アクセスの防止
3. **品質保証**: 毎日自動監視・通知による継続的品質保証

## 2. 機能要件

### 2.1 クロール許可管理（Crawler Permission Management）

#### 2.1.1 許可レベル定義
| User Agent | アクセス範囲 | 理由 |
|------------|-------------|------|
| **GPTBot, CCBot, PerplexityBot** | `/o/` 配下のみ | AI学習用に企業情報のみ許可 |
| **Googlebot, Bingbot** | 全体許可 | 検索エンジン最適化のため |
| **その他のBot** | robots.txt でブロック | 不正スクレイピング防止 |

#### 2.1.2 恒久的ブロックパス
以下のパスは全てのクローラーに対して恒久的にDisallow設定：
```
/dashboard          # ユーザーダッシュボード
/api/auth          # 認証API
/billing           # 決済情報
/checkout          # チェックアウト
/preview           # プレビュー機能
/webhooks          # Webhook受信
/admin             # 管理画面
/management-console # 管理コンソール
```

#### 2.1.3 動的robots.txt生成
- Supabase `ai_visibility_config` テーブルから設定を読み込み
- 環境変数による柔軟な調整機能
- リアルタイム設定反映（数分以内）

### 2.2 不正アクセス・スクレイピング対策（Anti-Scraping Defense）

#### 2.2.1 レート制限（Rate Limiting）
| Bot Type | 制限 | 窓 | 説明 |
|----------|------|-----|------|
| **search_engine** | 20 req | 60s | 検索エンジンは比較的寛容 |
| **ai_crawler** | 10 req | 60s | AI学習用は適度に制限 |
| **scraper** | 2 req | 60s | 不明Botは厳しく制限 |
| **suspicious** | 1 req | 60s | 疑わしいUAは最大制限 |
| **browser** | 30 req | 60s | 一般ユーザーは寛容 |

#### 2.2.2 自動ブロック機能
- **トリガー条件**: 60秒間に3回以上のレート制限違反
- **ブロック期間**: 初回1時間、再違反で段階的延長（2h→4h→24h）
- **実装方式**: Vercel Edge Middleware による リアルタイム制御
- **解除方法**: 管理画面から手動解除、または期限自動解除

#### 2.2.3 異常アクセス検知
- 不明User-Agent・空User-Agent に対する403返却
- ブロックリスト一致時の即座拒否
- Cloudflare連携による異常トラフィック遮断

### 2.3 コンテンツ保護（Content Protection）

#### 2.3.1 JSON-LD署名機能
- **署名方式**: HMAC-SHA256 による デジタル署名
- **実装**: `_aiohub.signature` フィールドを全JSON-LDに自動追加
- **用途**: 無断コピー・改変検知

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LuxuCare株式会社",
  "_aiohub": {
    "signature": "sha256:abc123...",
    "timestamp": "2025-01-17T10:00:00Z",
    "origin": "aiohub.jp"
  }
}
```

#### 2.3.2 出典タグ自動挿入
- HTMLに `data-origin="aiohub.jp"` を自動挿入
- コンテンツの正当性証明
- 不正コピーサイトとの差別化

#### 2.3.3 コピー検知機能
- **検知条件**: Refererなし + 高頻度アクセス の組み合わせ
- **対応**: 警告ログ生成 + Slack通知
- **エスカレーション**: 継続的違反時の自動ブロック

### 2.4 AI可視性監視（AI Visibility Monitoring）

#### 2.4.1 監視対象User-Agent
- Googlebot, Bingbot （検索エンジン）
- GPTBot, CCBot, PerplexityBot （AIクローラー）
- Mozilla/5.0 （一般ブラウザ代表）

#### 2.4.2 チェック項目・基準
| 項目 | P0（緊急） | P1（重要） | P2（軽微） |
|------|------------|------------|------------|
| **HTTP Status** | 403/404/500 | 301/302 | 200以外 |
| **robots.txt** | 設定エラー | 非推奨設定 | 最適化余地 |
| **meta robots** | noindex誤設定 | 設定不整合 | 設定欠落 |
| **canonical URL** | 存在しない | 不正値 | 相対パス |
| **sitemap.xml** | 404エラー | 構文エラー | 更新遅延 |
| **JSON-LD** | 構文エラー | 必須項目欠落 | 推奨項目欠落 |
| **TTFB** | >3000ms | >1500ms | >1000ms |

#### 2.4.3 監視スケジュール
- **定期実行**: Vercel Cron により毎日3:00 JST
- **手動実行**: `/api/admin/ai-visibility/run` (POST)
- **テスト実行**: `/api/admin/ai-visibility/run` (GET, dryRun=true)

### 2.5 ログ・通知システム（Logging & Notification）

#### 2.5.1 データベース記録
監視結果を Supabase `ai_visibility_logs` テーブルに保存：
```sql
- url: 監視対象URL
- user_agent: テストしたUser-Agent
- status_code: HTTPステータス
- response_time_ms: レスポンス時間
- severity_level: 問題レベル (P0/P1/P2/OK)
- issues: 検出された問題のリスト
- jsonld_signature: コンテンツの署名
- timestamp: 実行時刻
```

#### 2.5.2 Slack通知
**P0問題発生時の即時アラート:**
```
🚨 AI Visibility Alert - Critical Issues Detected

P0 Critical: 3    P1 Important: 2
P2 Minor: 1       Healthy: 12

Critical URLs affected:
• https://aiohub.jp/o/luxucare
• https://aiohub.jp/robots.txt

Common Issues:
• Access forbidden - check robots.txt (3)
• Missing JSON-LD structured data (2)

[View Dashboard]
```

**日次サマリーレポート（毎日4:00 JST）:**
```
[AI Visibility Daily Report]
期間: 2025-01-17
総チェック数: 48
P0: 0件 | P1: 2件 | P2: 5件 | OK: 41件

改善提案:
• JSON-LD sameAs項目追加推奨 (3URL)
• canonical URL https化 (2URL)
```

### 2.6 自動防御機能（Automated Defense）

#### 2.6.1 攻撃的アクセス自動検知
- **検知パターン**:
  - 短時間での大量リクエスト（>20req/10s）
  - 連続403エラー（>5回/60s）
  - 怪しいUser-Agent（空・無効・既知攻撃パターン）
- **対応**: `blocked_ips` テーブルへの自動登録
- **効果**: 次回以降のアクセスに対する403返却

#### 2.6.2 管理機能
- **ブロック解除**: `/admin/ai-visibility` からワンクリック解除
- **手動ブロック**: IPアドレス・CIDR範囲での手動ブロック
- **ログ確認**: ブロック履歴・理由の詳細表示

### 2.7 実行制御・管理（Execution Control）

#### 2.7.1 API エンドポイント
- **GET** `/api/admin/ai-visibility/latest` - 最新チェック結果取得
- **POST** `/api/admin/ai-visibility/run` - 本番チェック実行
- **GET** `/api/admin/ai-visibility/run` - ドライラン実行
- **GET** `/api/cron/ai-visibility` - Vercel Cron専用エンドポイント

#### 2.7.2 認証・セキュリティ
- **管理API**: Bearer Token認証（`ADMIN_API_TOKEN`）
- **Cron API**: Vercel署名検証（`CRON_SECRET`）
- **管理画面**: 管理者メールドメイン認証

### 2.8 管理画面UI（Management Dashboard）

#### 2.8.1 ダッシュボード機能
- **管理者タブ**: 「AI可視性レポート」新設
- **リアルタイム表示**: 最新24時間の監視状況
- **過去7日間トレンド**: スパークライン・傾向分析
- **問題別分析**: 頻出問題のランキング表示
- **URL別ステータス**: ページごとの健全性一覧

#### 2.8.2 操作機能
- **手動チェック実行**: ワンクリックでの即座監視
- **ドライラン実行**: 本番影響なしのテスト実行
- **結果エクスポート**: JSON形式でのデータダウンロード
- **設定変更**: robots.txt・レート制限の動的調整

## 3. 非機能要件

### 3.1 性能要件（Performance Requirements）
- **応答遅延**: Edge Middleware実行による追加遅延は50ms以内
- **スループット**: 1000req/s でのレート制限判定処理
- **監視実行時間**: 全URLチェック完了まで30秒以内
- **データベース応答**: Supabase クエリ応答時間200ms以内
- **実測TTFB**: 本番環境で1.6-4.5秒（GPTBot最速、Mozilla最遅）

### 3.2 拡張性要件（Scalability Requirements）
- **User-Agentリスト**: 環境変数による動的追加・削除
- **レート制限閾値**: 設定ファイルによる調整可能
- **Slack通知先**: 複数チャンネル対応
- **監視URL**: データベース設定による柔軟な追加

### 3.3 保守性要件（Maintainability Requirements）
- **設定分離**: 全ての閾値・設定を環境変数またはデータベースで管理
- **ログ標準化**: 構造化ログによる自動分析対応
- **監視ロジック**: Playwright等外部ツールと独立動作
- **型安全性**: TypeScript strict mode + Supabase Schema準拠

### 3.4 可用性要件（Availability Requirements）
- **Edge実行**: Vercel Edge Runtime による高可用性
- **フェイルセーフ**: 監視システム障害時も本体サービス継続
- **データ冗長性**: Supabase による自動バックアップ
- **通知冗長性**: Slack障害時のメール通知切り替え

## 4. セキュリティ要件

### 4.1 アクセス制御（Access Control）
- **robots.txt**: 機密ページの確実な非公開設定
- **X-Robots-Tag**: APIレスポンスへの noindex 自動付与
- **認証保護**: 管理系パス（/dashboard, /api/auth 等）の常時保護
- **権限分離**: 監視機能と管理機能の権限分離

### 4.2 データ保護（Data Protection）
- **署名キー管理**: `AI_VISIBILITY_SECRET` 環境変数での安全な管理
- **JSON-LD署名**: HMAC-SHA256 による改変検知
- **ログ保持期間**: 個人情報を含むログの30日間自動削除
- **IP匿名化**: GDPR対応のためのIP部分マスキング

### 4.3 通信セキュリティ（Communication Security）
- **HTTPS強制**: 全ての監視通信のTLS暗号化
- **Webhook署名**: Slack通知の改変防止
- **API認証**: Bearer Tokenによる不正アクセス防止
- **Cron認証**: Vercel署名検証による成りすまし防止

## 5. 運用・監査要件

### 5.1 監視・アラート（Monitoring & Alerting）
- **定期監視**: Vercel Cron による毎日自動実行
- **即座通知**: P0問題発生時の5分以内Slack通知
- **エスカレーション**: P0問題継続時の管理者直接連絡
- **ヘルスチェック**: 監視システム自体の生存確認

### 5.2 運用手順（Operational Procedures）
- **保守ドキュメント**: `/docs/ai-visibility-guard.md` への詳細手順記載
- **設定変更手順**: 閾値調整・UA追加の標準化された手順
- **障害対応**: P0/P1/P2 レベル別の対応手順
- **手動復旧**: 緊急時のシステム無効化・IP解除手順

### 5.3 監査・コンプライアンス（Audit & Compliance）
- **実行環境**: 本番環境のみでの監視実行、テスト環境はドライラン専用
- **ログ監査**: 全ての設定変更・手動実行の記録保持
- **アクセス監査**: 管理画面アクセス・API使用状況の追跡
- **問題追跡**: GitHub Issues連携による問題管理（P0/P1対象）

### 5.4 災害復旧（Disaster Recovery）
- **設定バックアップ**: Supabase設定の定期バックアップ
- **システム復旧**: 障害時の段階的復旧手順
- **データ復旧**: ログデータの復旧・整合性確認
- **通知復旧**: Slack障害時の代替通知手段

## 6. 技術仕様

### 6.1 実装技術スタック
- **Edge Runtime**: Vercel Edge Middleware
- **データベース**: Supabase PostgreSQL with RLS
- **スケジューラ**: Vercel Cron Jobs
- **通知**: Slack Webhook API
- **型安全性**: TypeScript 5.0+ strict mode
- **署名**: Node.js crypto module (HMAC-SHA256)

### 6.2 環境変数要件
```bash
# 必須設定
AI_VISIBILITY_GUARD_ENABLED=true
AI_VISIBILITY_SECRET=your-content-signing-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
CRON_SECRET=your-cron-secret-key
ADMIN_API_TOKEN=your-admin-api-token
AI_VISIBILITY_SECRET=your-content-signing-secret

# オプション設定
AI_VISIBILITY_DEBUG=false
AI_VISIBILITY_DRY_RUN=false
```

### 6.3 データベーススキーマ
主要テーブル：
- `ai_visibility_logs`: 監視結果記録
- `blocked_ips`: 自動ブロックIP管理
- `rate_limit_logs`: レート制限ログ
- `ai_visibility_config`: 動的設定管理

## 7. 品質保証

### 7.1 テスト要件
- **単体テスト**: 各機能の個別動作確認
- **統合テスト**: Edge Middleware ↔ Supabase 連携確認
- **E2Eテスト**: 監視 → 検知 → 通知 の全体フロー確認
- **負荷テスト**: レート制限機能の性能確認

### 7.2 品質メトリクス
- **可用性**: 99.9% 以上（月間ダウンタイム43分以内）
- **精度**: P0問題検知率 99.5% 以上
- **応答性**: 監視結果通知まで5分以内
- **誤検知率**: 5% 以下

## 8. 結論

本AI可視性＋防御統合監視モジュールは、AIO Hubが「AIに正しく理解される」状態を維持しながら、「不正利用から保護される」環境を実現する重要なコンポーネントです。

このモジュールにより、企業はAIエコシステムに安全かつ効果的に参加することが可能となり、AIが正確な情報を学習・引用する基盤が構築されます。

**本機能はAIを活用した安全なオープンプラットフォーム構築の要である**と位置づけ、継続的な改善・拡張を通じて、AIとビジネスの健全な共存を実現します。

---

**文書作成日**: 2025年1月17日  
**最終更新**: 2025年1月17日  
**バージョン**: 1.0.0