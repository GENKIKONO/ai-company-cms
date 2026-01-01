# Schema Diff Report: migrations vs 実DB

作成日: 2024-12-31
更新日: 2024-12-31（Verified/Needs more export 分類更新）

データソース:
- 期待値: supabase/migrations/*.sql (84ファイル)
- 現物: Supabase Production Database
  - tables.csv (100行)
  - columns.csv (100行・不完全)
  - constraints.csv (636行)
  - indexes.csv (100行)
  - ordinal検証: Supabase Assistant分析 (2024-12-31)

---

## サマリー

| 区分 | 件数 | 備考 |
|------|------|------|
| Missing in migrations | 60+ | 実DBにあるがmigrationsにない |
| Missing in DB | 5 | migrationsにあるが実DBにない |
| Definition mismatch | 調査中 | 同名だが定義不一致 |
| **migration作成済** | 22 | テーブル + 3 ENUM型 + 2 拡張機能 |
| Tier D (対象外) | 20+ | _*_v2, public_*_tbl, *_legacy等 |

---

## 1. Missing in migrations（実DBにあるがmigrationsにない）

### 1.1 Verified: migration作成完了（15テーブル）

**分類基準**: ordinal_position が 1..N で連番 かつ USER-DEFINED 型なし
**source**: Public Tables Column Metadata.csv + query(35).csv (2024-12-31)
**migration**: 20241231000001_schema_diff_reconciliation.sql

| # | テーブル名 | ordinal範囲 | 列数 | 状況 |
|---|-----------|-------------|------|------|
| 1 | ai_citations_items | 1-9 | 9 | migration作成済 |
| 2 | ai_citations_responses | 1-12 | 12 | migration作成済 |
| 3 | ai_interview_axes | 1-10 | 10 | migration作成済 |
| 4 | ai_usage_events | 1-6 | 6 | migration作成済 |
| 5 | billing_checkout_link_activations | 1-9 | 9 | migration作成済 |
| 6 | billing_checkout_links | 1-13 | 13 | migration作成済 |
| 7 | chatbot_interactions | 1-11 | 11 | migration作成済 |
| 8 | chatbots | 1-11 | 11 | migration作成済 |
| 9 | customers | 1-6 | 6 | migration作成済 |
| 10 | embedding_jobs | 1-22 | 22 | migration作成済 |
| 11 | features | 1-7 | 7 | migration作成済 |
| 12 | organization_members | 1-9 | 9 | migration作成済 |
| 13 | plans | 1-7 | 7 | migration作成済 |
| 14 | profiles | 1-10 | 10 | migration作成済 |
| 15 | stripe_customers | 1-4 | 4 | migration作成済 |

### 1.2 ordinal欠番テーブル: migration作成完了（3テーブル）

**source**: query(38).csv pg_attribute (2024-12-31)
**migration**: 20241231000001_schema_diff_reconciliation.sql

| # | テーブル名 | 列数 | 欠番位置 | 備考 |
|---|-----------|------|----------|------|
| 20 | ai_content_units | 12 | ordinal 2 | 削除済み列 |
| 21 | subscriptions | 9 | ordinal 2 | Stripe連携 |
| 22 | user_subscriptions | 11 | ordinal 7 | btree_gist拡張使用 |

### 1.3 USER-DEFINED型テーブル: migration作成完了（4テーブル + 3 ENUM）

**source**: query(36).csv, query(37).csv (2024-12-31)
**migration**: 20241231000001_schema_diff_reconciliation.sql

| # | テーブル名 | ordinal範囲 | 列数 | USER-DEFINED型 |
|---|-----------|-------------|------|----------------|
| 16 | ai_interview_questions | 1-10 | 10 | interview_content_type |
| 17 | ai_interview_sessions | 1-14 | 14 | interview_content_type, interview_session_status |
| 18 | ai_monthly_reports | 1-14 | 14 | report_status |
| 19 | embeddings | 1-14 | 14 | vector (pgvector) |

**ENUM型定義**:
- `interview_content_type`: service, product, post, news, faq, case_study
- `interview_session_status`: draft, in_progress, completed
- `report_status`: pending, generating, completed, failed

### 1.4 未検証: ordinal未確認テーブル

**source**: requirements (ordinal検証対象外)

#### AI系

| テーブル名 | source | 備考 |
|-----------|--------|------|
| ai_interview_messages | requirements | メッセージ履歴 |
| ai_interview_question_logs | requirements | 質問ログ |
| ai_visibility_scores | requirements | スコア |
| ai_visibility_config | requirements | 設定 |
| ai_generated_drafts | requirements | 生成下書き |
| ai_answers | requirements | AI回答 |
| ai_queries | requirements | AIクエリ |
| ai_retrievals | requirements | 検索結果 |
| ai_chunks | requirements | チャンク |
| ai_sections | requirements | セクション |
| ai_sources | requirements | ソース |
| ai_conversations | requirements | 会話 |
| ai_messages | requirements | メッセージ |
| ai_feedback | requirements | フィードバック |
| ai_exports | requirements | エクスポート |
| ai_disclosure_documents | requirements | 開示文書 |
| ai_hreflang | requirements | hreflang |
| ai_jsonld_versions | requirements | JSON-LD |
| ai_manifest_settings | requirements | マニフェスト |
| ai_site_url_rules | requirements | URLルール |
| ai_sites | requirements | サイト |

#### その他

| テーブル名 | source | 備考 |
|-----------|--------|------|
| products | requirements | 商品マスタ |
| supported_languages | requirements | 翻訳FK参照元 |
| alerts | requirements | アラート |
| alert_rules | requirements | ルール |
| alert_events | requirements | イベント |
| alert_thresholds | requirements | 閾値 |
| alert_sources | requirements | ソース |
| alert_source_allowlist | requirements | 許可リスト |

#### パーティション親テーブル

| テーブル名 | source | 備考 |
|-----------|--------|------|
| activities | requirements | 月次パーティション（columns表に含まれず除外） |
| ai_bot_logs | requirements | 月次パーティション |
| rate_limit_logs | requirements | 月次パーティション |
| rate_limit_requests | requirements | 月次パーティション |
| security_incidents | requirements | 月次パーティション |

#### 翻訳テーブル

| テーブル名 | source | 備考 |
|-----------|--------|------|
| service_translations | requirements | PK (service_id, lang) |
| post_translations | requirements | PK (post_id, lang) |
| faq_translations | requirements | PK (faq_id, lang) |
| case_study_translations | requirements | PK (case_study_id, lang) |
| news_translations | requirements | PK (news_id, lang) |
| product_translations | requirements | PK (product_id, lang) |

### 1.5 Tier D: 特別扱い（今回対象外）

| テーブル名 | source | 分類 | 理由 |
|-----------|--------|------|------|
| _activities_recent_30d_v2 | columns.csv | _*_v2 | ビュー候補 |
| _ai_bot_logs_recent_30d_v2 | columns.csv | _*_v2 | ビュー候補 |
| _analytics_events_recent_30d_v2 | columns.csv | _*_v2 | ビュー候補 |
| _content_metrics_recent_v2 | columns.csv | _*_v2 | ビュー候補 |
| _org_content_counts_v2 | columns.csv | _*_v2 | ビュー候補 |
| _org_content_metrics_v2 | columns.csv | _*_v2 | ビュー候補 |
| _user_activity_snap_v2 | columns.csv | _*_v2 | ビュー候補 |
| _user_content_created_counts_v2 | columns.csv | _*_v2 | ビュー候補 |
| _user_content_reach_v2 | columns.csv | _*_v2 | ビュー候補 |
| _user_publish_funnel_v2 | columns.csv | _*_v2 | ビュー候補 |
| _user_violation_enforcement_snap_v2 | columns.csv | _*_v2 | ビュー候補 |
| _auth_audit | columns.csv | _* | 派生テーブル |
| _bf_projects_orgid_backup | columns.csv | _backup | バックアップ |
| _translation_fk_hints | columns.csv | _* | ヒント |
| public_*_tbl (7テーブル) | requirements | public_*_tbl | 用途要調査 |
| monthly_reports_legacy | requirements | *_legacy | 移行中 |
| audit_logs_legacy_backup_* | requirements | *_backup | バックアップ |
| *_YYYYMM (パーティション子) | requirements | partition | 親テーブルで十分 |

---

## 2. Missing in DB（migrationsにあるが実DBにない）

| テーブル名 | source | migration | 備考 |
|-----------|--------|-----------|------|
| email_logs | migrations | 0001_init.sql | 未使用または別名 |
| payment_history | migrations | 0001_init.sql | 未使用または別名 |
| embed_configurations | migrations | 20251008_embed_usage.sql | 未使用 |
| embed_usage | migrations | 20251008_embed_usage.sql | 未使用 |
| embed_usage_daily | migrations | 20251008_embed_usage.sql | 未使用 |
| embed_usage_monthly | migrations | 20251008_embed_usage.sql | 未使用 |
| audit_log | migrations | 複数 | audit_logsに統合？ |
| audit_log_retention | migrations | 20250927_add_audit_logging.sql | 未使用 |
| partnerships | migrations | 001_initial_schema.sql | 未使用または別名 |
| organization_groups | migrations | 20241112_create_organization_groups.sql | 未確認 |

※ Supabase managed オブジェクト（auth.*, storage.*）は除外

---

## 3. Definition mismatch（同名だが定義不一致）

### 調査中項目

| テーブル名 | 項目 | source | 備考 |
|-----------|------|--------|------|
| audit_logs | PK構成 | requirements | (id, created_at) - パーティション対応 |
| analytics_events | PK構成 | requirements | (created_at, id) - パーティション対応 |

---

## 4. 拡張機能（Extensions）

| 拡張機能 | source | migrations | 実DB | 対応 |
|---------|--------|-----------|------|------|
| btree_gist | requirements | 未定義 | 使用中 | 保留（user_subscriptions列未確定） |
| uuid-ossp | migrations | 定義済み | 使用中 | OK |
| pgcrypto | migrations | 定義済み | 使用中 | OK |

---

## 5. USER-DEFINED 型（追加調査必要）

| 型名 | source | 使用テーブル | 状況 |
|------|--------|-------------|------|
| interview_session_status | requirements | ai_interview_sessions.status | ENUM定義未取得 |
| report_status | requirements | ai_monthly_reports.status | ENUM定義未取得 |
| content_type (名称不明) | requirements | ai_interview_sessions, ai_interview_questions | 型名未確認 |
| vector (推定) | requirements | embeddings.embedding | 拡張型未確認 |

---

## 6. 次のアクション

### フェーズ1: columnsエクスポート

1. **Verified 15テーブル** - docs/db/db-requirements-spec.txt の 12.5 SQL 実行
   - ai_citations_items, ai_citations_responses, ai_interview_axes, ai_usage_events
   - billing_checkout_link_activations, billing_checkout_links
   - chatbot_interactions, chatbots, customers, embedding_jobs
   - features, organization_members, plans, profiles, stripe_customers

2. **ordinal欠番 3テーブル** - docs/db/db-requirements-spec.txt の 12.4 SQL 実行
   - ai_content_units, subscriptions, user_subscriptions

### フェーズ2: 型定義エクスポート

3. **USER-DEFINED 型** - docs/db/db-requirements-spec.txt の 12.1, 12.2, 12.3 SQL 実行
   - ai_interview_questions, ai_interview_sessions, ai_monthly_reports, embeddings

### フェーズ3: migration作成

4. columnsエクスポート完了後、CREATE TABLE IF NOT EXISTS で migration 追加

### 別フェーズ

- Tier D テーブルの用途調査
- Missing in DB の整理（DROP or 追加）
- Definition mismatch の詳細調査

---

## 付録: 根拠データの説明

| source | 説明 |
|--------|------|
| requirements | docs/db/db-requirements-spec.txt に記載の事実 |
| columns.csv | information_schema.columns のエクスポート（100行・不完全） |
| constraints.csv | pg_constraint のエクスポート（636行） |
| indexes.csv | pg_indexes のエクスポート（100行） |
| migrations | supabase/migrations/*.sql の定義 |
| Supabase Assistant ordinal検証 | 2024-12-31 実施のordinal連番確認結果 |
