# RPC状態分析・次アクション

**更新日**: 2025-12-28
**状態**: 全RPC未確認（事実不足）

---

## DB側回答サマリー

| カテゴリ | 結果 | 理由 |
|----------|------|------|
| get_effective_feature_set | 全No | メタ情報未取得 |
| check_and_consume_quota | 全No | メタ情報未取得 |
| code整合性 | 全No | 定義未確認 |
| site_admin | 全No | 定義未確認 |

**結論**: RPCの存在自体が確認できていない。推測は行わず「事実不足」として全Noで回答された。

---

## 即時実行可能な確認方法

### 方法1: アプリログでフォールバック発火確認

アプリ側で以下のログが出力されていれば、新RPCは未実装：

```
[featureGate] New RPC not found, falling back to legacy
[featureGate] New quota RPC not found, falling back to legacy
```

**確認手順**:
```bash
# 開発サーバー起動
npm run dev

# 別ターミナルでFAQ作成APIをテスト（要認証）
# ブラウザからダッシュボードでFAQ作成を試行

# ログを確認
# 上記メッセージが出ればフォールバック発火 = 新RPC未実装
```

### 方法2: Supabase DashboardでRPC存在確認

Supabase Dashboard > Database > Functions で以下を検索:
- `get_effective_feature_set`
- `check_and_consume_quota`
- `is_site_admin`

存在しなければ新RPC未実装が確定。

---

## DB側への追加依頼（DDL取得）

以下のSQLをSupabase SQL Editorで実行し、結果を共有してください：

```sql
-- 1. RPC定義の確認
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname IN (
  'get_effective_feature_set',
  'check_and_consume_quota',
  'is_site_admin',
  'get_current_plan_for_user',
  'get_feature_config'
)
AND pronamespace = 'public'::regnamespace;

-- 2. site_admins テーブル確認
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'site_admins';

-- 3. usage_counters / quota関連テーブル確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%usage%' OR table_name LIKE '%quota%' OR table_name LIKE '%counter%';
```

---

## 現状の判断

| 項目 | 現状 | 根拠 |
|------|------|------|
| 新RPC (Subject型) | **未実装の可能性高** | DB側で存在確認できず |
| 旧RPC (Legacy) | 存在する可能性あり | フォールバック先として機能している場合 |
| アプリ側コード | 動作可能 | フォールバック実装済み |

---

## 次のステップ

### アプリ側（即時対応可能）
1. [ ] `npm run dev` でログを観察し、フォールバック発火を確認
2. [ ] 発火していればこのドキュメントに記録
3. [ ] 発火していなければ新RPC実装済みと判断可能

### DB側（依頼事項）
1. [ ] 上記SQLを実行し、結果を `docs/db/rpc-ddl-snapshot.md` に記録
2. [ ] 存在しないRPCがあれば、実装予定を共有
3. [ ] 新RPC実装時のシグネチャをアプリ側と事前に合意

---

## 参照

- 依頼文: `docs/db/rpc-readmodel-check-request.md`
- FeatureGate実装: `src/lib/featureGate.ts`
- 使用例: `src/app/api/my/faqs/route.ts`
