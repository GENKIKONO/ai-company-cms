# スキーマ差分レポート: 月次レポート基盤

**作成日**: 2024-12-22
**対象ドメイン**: 月次レポート基盤
**調査方法**: コード走査 + Supabase生成型（src/types/supabase.ts）の照合

---

## 概要（要約）

1. **`cron/monthly-report/route.ts`** が存在しないカラム（`year`, `month`, `format`, `data_summary`）を参照しており、実行時エラーが発生する可能性が高い
2. **`ai_monthly_reports`** と **`monthly_reports`** の2テーブルが並存しており、コードによって使用テーブルが異なる
3. プロンプト前提の `month_bucket` は `ai_monthly_reports` には存在せず、`report_regeneration_logs` にのみ存在
4. ユニーク制約の想定が一部コードと実スキーマで不一致
5. インデックスは主要クエリパターンをカバー済み（先日追加分含む）

---

## 差分一覧

### 🔴 重大

| # | 対象 | コード期待 | 実スキーマ | 影響 | 修正案 |
|---|------|-----------|-----------|------|--------|
| 1 | `monthly_reports.year` | 存在する（L66,83） | **存在しない** | クエリ失敗 | `period_start` で検索に変更 |
| 2 | `monthly_reports.month` | 存在する（L67,84） | **存在しない** | クエリ失敗 | `period_start` で検索に変更 |
| 3 | `monthly_reports.format` | 存在する（L86） | **存在しない** | INSERT失敗 | カラム削除またはスキーマ追加 |
| 4 | `monthly_reports.data_summary` | 存在する（L87-95） | **`metrics`** | INSERT失敗 | `metrics` に変更 |
| 5 | テーブル二重管理 | 一部: `monthly_reports` | 一部: `ai_monthly_reports` | データ分散 | `ai_monthly_reports` に統一 |

**該当ファイル**: `src/app/api/cron/monthly-report/route.ts`

### 🟡 中

| # | 対象 | コード期待 | 実スキーマ | 影響 | 修正案 |
|---|------|-----------|-----------|------|--------|
| 6 | `ai_monthly_reports.month_bucket` | プロンプト前提では存在 | **存在しない** | 照合不可 | 不要（period_start/end で代替） |
| 7 | `monthly_report_sections.report_id` FK | `monthly_reports.id` | `ai_monthly_reports_compat` ビュー | 参照不整合リスク | ビュー維持または移行 |
| 8 | `ai_monthly_reports` ユニーク制約 | `(org_id, month_bucket, plan_id, level)` | **`(org_id, period_start)` 推定** | upsert競合 | 制約確認・統一 |
| 9 | `monthly_report_jobs.status` | 文字列想定 | 文字列（CHECK/enum なし） | 不正値挿入可能 | CHECK制約追加 |

### 🟢 軽微

| # | 対象 | コード期待 | 実スキーマ | 影響 | 修正案 |
|---|------|-----------|-----------|------|--------|
| 10 | `report_regeneration_logs.month_bucket` | DATE型推奨 | `string \| null` | 型不一致 | DATE型に正規化推奨 |
| 11 | テーブル/カラムコメント | 存在想定 | 未確認 | ドキュメント不足 | COMMENT追加推奨 |

---

## 代表クエリ健全性チェック

### クエリ1: 組織×月の既存レポート確認

```sql
-- コード期待（cron/monthly-report）
SELECT id, status FROM monthly_reports
WHERE organization_id = $1 AND year = $2 AND month = $3;
```

- **想定INDEX**: `(organization_id, year, month)`
- **指摘**: `year`, `month` カラムが存在しないため**実行不可**
- **提案**: `period_start` を使用し、`idx_monthly_reports_org_period` を活用

```sql
-- 修正版
SELECT id, status FROM monthly_reports
WHERE organization_id = $1 AND period_start = $2;
```

### クエリ2: ai_monthly_reports 一覧取得

```sql
-- コード期待（monthly-report-service.ts）
SELECT * FROM ai_monthly_reports
WHERE organization_id = $1
ORDER BY period_start DESC;
```

- **想定INDEX**: `idx_ai_monthly_reports_org_period (organization_id, period_start DESC)`
- **指摘**: **正常動作** - インデックスあり
- **提案**: なし

### クエリ3: monthly_report_jobs ステータス順

```sql
SELECT * FROM monthly_report_jobs
WHERE status = 'queued'
ORDER BY scheduled_at;
```

- **想定INDEX**: `(status, scheduled_at)`
- **指摘**: インデックス存在要確認
- **提案**: なければ追加

---

## アクションプラン（実行順）

1. **[緊急]** `src/app/api/cron/monthly-report/route.ts` を修正
   - `year`/`month` → `period_start`/`period_end` に変更
   - `data_summary` → `metrics` に変更
   - `format` 列を削除（または使用しない）

2. **[緊急]** cron/monthly-report を `ai_monthly_reports` テーブルに統一
   - 現在 `monthly_reports` を使用しているが、サービス層は `ai_monthly_reports`

3. **[重要]** `monthly_reports` テーブルの廃止または互換ビュー化を検討
   - 現在両テーブルが混在しているため

4. **[重要]** `monthly_report_jobs.status` に CHECK 制約追加
   ```sql
   ALTER TABLE monthly_report_jobs
   ADD CONSTRAINT chk_job_status
   CHECK (status IN ('queued', 'running', 'succeeded', 'failed'));
   ```

5. **[中]** `monthly_report_jobs` のインデックス確認・追加
   ```sql
   CREATE INDEX IF NOT EXISTS idx_mrj_status_scheduled
   ON monthly_report_jobs(status, scheduled_at);
   ```

6. **[中]** `report_regeneration_logs.month_bucket` を DATE 型に正規化
   ```sql
   ALTER TABLE report_regeneration_logs
   ALTER COLUMN month_bucket TYPE DATE USING month_bucket::DATE;
   ```

7. **[低]** テーブル・カラムへのCOMMENT追加

8. **[確認]** `ai_monthly_reports` のユニーク制約の確認
   ```sql
   SELECT indexname, indexdef FROM pg_indexes
   WHERE tablename = 'ai_monthly_reports' AND indexdef LIKE '%UNIQUE%';
   ```

---

## 参考DDL（修正版 cron 対応）

```sql
-- monthly_reports に不足カラムを追加する場合（非推奨）
-- ALTER TABLE monthly_reports ADD COLUMN year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM period_start)::INTEGER) STORED;
-- ALTER TABLE monthly_reports ADD COLUMN month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM period_start)::INTEGER) STORED;

-- 推奨: コード側で period_start を使用するよう修正
-- 例: period_start = '2024-12-01' で検索
```

---

## 確認質問（曖昧な点）

1. `monthly_reports` と `ai_monthly_reports` の役割分担は意図的か？
   - 前者: レガシー/ジョブ用
   - 後者: AI分析結果用

2. `monthly_report_sections.report_id` の FK 参照先 `ai_monthly_reports_compat` ビューの定義は？

3. `ai_monthly_reports` のユニーク制約は `(organization_id, period_start)` で正しいか？

4. cron ジョブは現在本番で動作しているか？（カラム不一致でエラーの可能性）

---

## 結論

**即時対応必須**: `cron/monthly-report/route.ts` が存在しないカラムを参照しており、実行時エラーが発生する。`ai_monthly_reports` への統一と `period_start`/`period_end` 形式への移行を推奨。
