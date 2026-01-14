# テーブル存在確認リクエスト

以下のテーブルがDBに存在するか確認してください。存在しない場合は、
類似名のテーブルまたはビューがあるか調べて報告してください。

## 確認対象テーブル

| テーブル名 | コード上の役割 | 参照ファイル |
|-----------|---------------|-------------|
| `ai_monthly_reports` | 月次AIレポート本体保存 | `src/lib/reports/monthly-report-service.ts` |
| `monthly_report_jobs` | レポート生成ジョブキュー | `src/lib/reports/client.ts` |
| `settings` | サイト全体設定（KV形式） | `src/lib/settings.ts` |
| `storage_access_logs` | ストレージアクセスログ | `src/app/dashboard/manage/storage-logs/page.tsx` |
| `organization_ai_usage` | 組織別AI使用量 | `src/app/dashboard/manage/ai-usage/page.tsx` |
| `embeddings` | ベクトル埋め込みデータ | `src/lib/embedding-client.ts` |
| `embedding_jobs` | 埋め込み生成ジョブキュー | `src/app/dashboard/manage/jobs/page.tsx` |

## 確認事項

1. 各テーブルが存在するか
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'ai_monthly_reports',
     'monthly_report_jobs',
     'settings',
     'storage_access_logs',
     'organization_ai_usage',
     'embeddings',
     'embedding_jobs'
   );
   ```

2. 存在しない場合、代替となるテーブル/ビューはあるか

3. 存在する場合、RLSが有効になっているか
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN (...);
   ```

## 期待する回答形式

| テーブル名 | 存在 | RLS | 代替/備考 |
|-----------|------|-----|----------|
| ai_monthly_reports | ✅/❌ | ✅/❌ | |
| monthly_report_jobs | ✅/❌ | ✅/❌ | |
| settings | ✅/❌ | ✅/❌ | |
| storage_access_logs | ✅/❌ | ✅/❌ | |
| organization_ai_usage | ✅/❌ | ✅/❌ | |
| embeddings | ✅/❌ | ✅/❌ | |
| embedding_jobs | ✅/❌ | ✅/❌ | |

## 追加確認（型定義の存在確認）

上記テーブルはコード側の `src/types/supabase.ts` に型定義が存在することを確認済み。
DBに存在しない場合は、マイグレーション漏れの可能性があります。
