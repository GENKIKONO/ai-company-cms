# 管理UI実装レポート

**作成日**: 2024-12-23
**目的**: DB棚卸結果に基づき、コード側から接続されていなかったテーブルに対する管理UIを作成

---

## A. 実装サマリー

### 作成した管理ダッシュボード一覧

| # | ページパス | 接続テーブル | 機能概要 |
|---|-----------|-------------|----------|
| 1 | `/dashboard/admin/ai-usage` | organization_ai_usage | 組織別AI使用量ダッシュボード |
| 2 | `/dashboard/admin/jobs` | translation_jobs, embedding_jobs | 翻訳・埋め込みジョブ監視 |
| 3 | `/dashboard/admin/audit` | service_role_audit, ops_audit | 監査ログビューア |
| 4 | `/dashboard/admin/security` | intrusion_detection_alerts, ip_reports, ip_blocklist | セキュリティダッシュボード |
| 5 | `/dashboard/admin/storage-logs` | storage_access_logs | ストレージアクセスログ |
| 6 | `/dashboard/admin/ai-visibility` | ai_visibility_scores, ai_visibility_config, ai_bot_logs | AI可視性ダッシュボード |

### TypeCheck結果

```
✅ 全ページコンパイル成功（エラーなし）
```

---

## B. 各ページの詳細

### B-1. AI使用量ダッシュボード

**ファイル**: `src/app/dashboard/admin/ai-usage/page.tsx`

**接続テーブル**:
- `organization_ai_usage`

**表示項目**:
- 組織名（organizations テーブルとのJOIN）
- インタビュー数
- メッセージ数
- 引用数
- トークン数
- 更新日時

**フィルター機能**:
- なし（将来的に組織選択フィルター追加可能）

---

### B-2. ジョブ監視ダッシュボード

**ファイル**: `src/app/dashboard/admin/jobs/page.tsx`

**接続テーブル**:
- `translation_jobs` - 翻訳ジョブ
- `embedding_jobs` - 埋め込みジョブ

**表示項目（翻訳ジョブ）**:
- ID
- ソーステーブル
- 対象言語
- 状態（pending/processing/completed/failed）
- 作成日時
- 完了日時

**表示項目（埋め込みジョブ）**:
- ID
- ソーステーブル
- 優先度
- 状態
- 作成日時
- 完了日時

**タブ構成**:
- 翻訳ジョブ
- 埋め込みジョブ

---

### B-3. 監査ログビューア

**ファイル**: `src/app/dashboard/admin/audit/page.tsx`

**接続テーブル**:
- `service_role_audit` - Service Roleを使用したDB操作の監査
- `ops_audit` - 運用操作の監査

**表示項目（Service Role監査）**:
- 日時
- ジョブ名
- リクエストID
- 予定/実行行数
- エラーコード

**表示項目（運用操作監査）**:
- 日時
- アクション
- 対象タイプ
- 対象ID
- 実行者ID

**タブ構成**:
- Service Role操作
- 運用操作

---

### B-4. セキュリティダッシュボード

**ファイル**: `src/app/dashboard/admin/security/page.tsx`

**接続テーブル**:
- `intrusion_detection_alerts` - 侵入検知アラート
- `ip_reports` - IP通報
- `ip_blocklist` - IPブロックリスト

**表示項目（侵入検知アラート）**:
- 検知日時
- 重大度（critical/high/medium/low）
- 送信元IP
- 説明
- 状態（open/investigating/resolved）

**表示項目（IP通報）**:
- 通報日時
- IP
- 理由
- 状態

**表示項目（ブロックリスト）**:
- ブロック日時
- IP
- 理由
- 有効期限
- 状態（有効/無効）

**タブ構成**:
- 侵入検知アラート
- IP通報
- ブロックリスト

---

### B-5. ストレージアクセスログ

**ファイル**: `src/app/dashboard/admin/storage-logs/page.tsx`

**接続テーブル**:
- `storage_access_logs`

**表示項目**:
- 日時
- バケットID
- オブジェクトパス
- アクション（read/write/delete/list）
- ステータスコード
- IPアドレス

**フィルター機能**:
- バケット選択（assets/org-docs/avatars）
- アクション選択（read/write/delete/list）

---

### B-6. AI可視性ダッシュボード

**ファイル**: `src/app/dashboard/admin/ai-visibility/page.tsx`

**接続テーブル**:
- `ai_visibility_scores` - AI可視性スコア
- `ai_visibility_config` - AI可視性設定
- `ai_bot_logs` - AIボットログ

**表示項目（可視性スコア）**:
- 計測日時
- 組織名
- ソースキー
- 可視性タイプ
- スコア（0-100%）

**表示項目（設定）**:
- 組織ID
- 有効/無効
- チェック間隔（時間）
- 通知閾値
- 更新日時

**表示項目（ボットログ）**:
- 日時
- ボット名
- リクエストパス
- ステータスコード

**タブ構成**:
- 可視性スコア
- 設定
- ボットログ

---

## C. Supabaseへの確認プロンプト

### C-1. テーブル存在確認プロンプト

```
以下のテーブルが存在し、管理UIからアクセス可能な状態であることを確認してください：

【AI使用量関連】
1. organization_ai_usage
   - organization_id (uuid)
   - interview_count (integer)
   - message_count (integer)
   - citation_count (integer)
   - token_count (integer)
   - updated_at (timestamptz)

【ジョブ関連】
2. translation_jobs
   - id (uuid)
   - source_table (text)
   - source_id (uuid)
   - target_language (text)
   - status (text)
   - created_at (timestamptz)
   - completed_at (timestamptz)
   - error_message (text)

3. embedding_jobs
   - id (uuid)
   - organization_id (uuid)
   - source_table (text)
   - source_id (uuid)
   - status (text)
   - priority (integer)
   - created_at (timestamptz)
   - completed_at (timestamptz)
   - error_message (text)

【監査関連】
4. service_role_audit
   - id (uuid)
   - job_name (text)
   - request_id (text)
   - expected_row_count (integer)
   - affected_row_count (integer)
   - error_code (text)
   - meta (jsonb)
   - created_at (timestamptz)

5. ops_audit
   - id (uuid)
   - action (text)
   - actor_id (uuid)
   - target_type (text)
   - target_id (uuid)
   - details (jsonb)
   - created_at (timestamptz)

【セキュリティ関連】
6. intrusion_detection_alerts
   - id (uuid)
   - rule_id (text)
   - source_ip (inet)
   - severity (text)
   - description (text)
   - detected_at (timestamptz)
   - resolved_at (timestamptz)
   - status (text)

7. ip_reports
   - id (uuid)
   - ip_address (inet)
   - reason (text)
   - reporter_id (uuid)
   - status (text)
   - created_at (timestamptz)

8. ip_blocklist
   - id (uuid)
   - ip_address (inet)
   - reason (text)
   - blocked_at (timestamptz)
   - expires_at (timestamptz)
   - is_active (boolean)

【ストレージ関連】
9. storage_access_logs
   - id (uuid)
   - bucket_id (text)
   - object_path (text)
   - action (text)
   - user_id (uuid)
   - ip_address (inet)
   - user_agent (text)
   - status_code (integer)
   - created_at (timestamptz)

【AI可視性関連】
10. ai_visibility_scores
    - id (uuid)
    - organization_id (uuid)
    - source_key (text)
    - score (integer)
    - visibility_type (text)
    - measured_at (timestamptz)

11. ai_visibility_config
    - id (uuid)
    - organization_id (uuid)
    - enabled (boolean)
    - check_interval_hours (integer)
    - notification_threshold (integer)
    - updated_at (timestamptz)

12. ai_bot_logs
    - id (uuid)
    - bot_name (text)
    - user_agent (text)
    - request_path (text)
    - status_code (integer)
    - created_at (timestamptz)

各テーブルについて：
1. 存在するか（Y/N）
2. カラム構成が上記と一致するか
3. RLSポリシーの状態（有効/無効/ポリシー名）
4. 管理者がSELECTできるRLSポリシーがあるか

を回答してください。
```

### C-2. RLSポリシー確認プロンプト

```
上記テーブルに対して、管理者（site_adminsテーブルに登録されたユーザー）が
SELECTできるRLSポリシーが設定されているか確認してください。

以下のパターンを確認：
1. RLSが無効化されている（管理ツール用に意図的）
2. site_admins を参照するポリシーがある
3. service_role で実行される想定

ポリシーがない場合、以下の形式でSQLを提案してください：

CREATE POLICY "admin_select_[table_name]"
ON [table_name]
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);
```

---

## D. 今後の対応

### D-1. 追加が必要な可能性のあるUI

| テーブル | 優先度 | 備考 |
|---------|--------|------|
| cache_invalidation_queue | 低 | バックグラウンドジョブ用、通常表示不要 |
| rate_limit_entries | 低 | 自動管理、問題時のみ確認 |
| webhook_logs | 中 | Webhook配信状況の確認に有用 |
| ai_feedback | 中 | AIフィードバック分析用 |

### D-2. 機能強化候補

1. **ページネーション**: 現在は最新100-200件のみ表示。大量データ対応が必要な場合は追加。
2. **エクスポート機能**: CSVエクスポートボタンの追加。
3. **リアルタイム更新**: Realtimeを使用した自動更新。
4. **アクション機能**: IPブロック解除、アラート解決などのアクション追加。

---

## E. 技術メモ

### 使用パターン

すべてのページで以下の共通パターンを採用：

```typescript
// 1. Supabaseクライアント作成
const supabase = createClient();

// 2. データ取得
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);

// 3. エラーハンドリング
if (error) throw error;
setData(data || []);
```

### UIコンポーネント

- Tailwind CSSを使用
- パンくずナビゲーション（ダッシュボード > 管理 > 各機能）
- タブ切り替え（複数テーブルを持つダッシュボード）
- バッジ表示（状態・重大度の視覚化）
- ローディング・エラー状態の統一表示

---

**レポート終了**
