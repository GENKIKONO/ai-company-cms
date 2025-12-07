# P4-5: 差分更新バッチ & 冪等性統一化 実装完了報告

## 📋 実装サマリー

**実装期間**: P4-5フェーズ  
**目的**: 差分更新ロジック・冪等性（idempotency）・リトライ/再実行の標準化をシステム全体で統一  
**ステータス**: ✅ 完了  

## 🏗️ 実装構成

### 1. 共通ユーティリティ (_shared) 配置

以下のユーティリティを `supabase/functions/_shared/` に配置:

| ファイル | 役割 | 主要機能 |
|---------|------|----------|
| **idempotency-p45.ts** | 冪等性キー管理 | buildTranslateKey, buildEmbeddingKey, register/complete/fail |
| **diffs.ts** | 差分判定ロジック | content_hash, updated_at, version による差分判定 |
| **jobs-p45.ts** | job_runs_v2 連携 | startJob, succeedJob, failJob, updateProgress |
| **batch.ts** | バッチ処理・リトライ | withRetry, inBatches, 部分失敗対応 |
| **db-p45.ts** | データベースアクセス | 軽量DB操作（@supabase/supabase-js 非依存） |

### 2. Edge Functions 実装

#### translation-runner (`supabase/functions/translation-runner/`)
- **エンドポイント**: `/translation-runner/enqueue`, `/translation-runner/drain`
- **冪等性**: `org:{orgId}:translate:{table}:{id}:{field}:{sourceLang}->{targetLang}:{contentHash}`
- **差分戦略**: content_hash（SHA-256）
- **OpenAI統合**: GPT-4による翻訳実行

#### embedding-runner (`supabase/functions/embedding-runner/`)
- **エンドポイント**: `/embedding-runner/enqueue`, `/embedding-runner/drain`
- **冪等性**: `org:{orgId}:embed:{table}:{id}:{field}:{lang}:{contentHash}`
- **差分戦略**: content_hash（SHA-256）  
- **OpenAI統合**: text-embedding-3-small使用

### 3. 既存API統合

#### 修正項目
- `src/lib/translation-client.ts`: URL修正（translate-runner → translation-runner）
- 認証方式統一: ANON_KEY → SERVICE_ROLE_KEY

## 📊 技術仕様

### 冪等性キー生成ルール

**ベースパターン**:
```
org:{orgId}:{operation}:{sourceTable}:{sourceId}:{sourceField}:{langOrDash}:{contentHash}
```

**具体例**:
- 翻訳: `org:123:translate:posts:456:title:ja->en:abc123...`
- Embedding: `org:123:embed:faqs:789:content:ja:def456...`

### 差分判定戦略

| 方式 | 用途 | 実装場所 |
|------|------|----------|
| **content_hash** | テキスト翻訳・Embedding | P4-3, P4-4, P4-5 |
| **updated_at** | メタデータ同期 | フォールバック |
| **version** | 競合制御 | 将来拡張 |

### job_runs_v2 メタデータ標準

```javascript
{
  job_type: 'translation_batch' | 'embedding_batch',
  diff_strategy: 'content_hash',
  items_total: 100,
  items_processed: 95,
  items_skipped: 3,
  items_failed: 2,
  tables: ['posts', 'faqs'],
  langs: ['en', 'zh'],
  source_fields: ['title', 'description'],
  idempotency_scope: 'translation-runner'
}
```

## 🔒 セキュリティ対応

### Service Role Key制限
- Edge Function内部でのみ使用
- Next.js/ブラウザ側には露出なし
- idempotency_keys テーブルアクセス権限のみ

### UNIQUE制約対応
- `idempotency_keys(function_name, key)` UNIQUE制約
- 衝突時は正常な冪等性スキップとして処理
- `23505`エラー（重複違反）のハンドリング

## 📈 運用・監視

### 観測可能性
- **job_runs_v2**: 実行履歴・duration・success率
- **idempotency_keys**: 重複実行防止・TTL管理
- **contract_violations**: payload不正・差分エラー

### アラート対象
- 連続失敗・急増時の `job_runs_v2.status='failed'`
- `idempotency_keys` の異常な重複（スキップ率異常）
- OpenAI API配額制限・レート制限

## ✅ 完了検証項目

### Edge Functions
- [x] translation-runner: /enqueue, /drain エンドポイント
- [x] embedding-runner: /enqueue, /drain エンドポイント
- [x] HTTPインターフェース変更なし（後方互換性保持）
- [x] _shared ユーティリティ統合
- [x] 冪等性キー統一ルール実装

### データベース統合
- [x] idempotency_keys UNIQUE制約追加（Supabaseアシスタント実施済み）
- [x] translation_jobs/embedding_jobs インデックス最適化済み
- [x] job_runs_v2 メタデータ標準対応

### 既存API統合
- [x] translation-client.ts: Edge Function URL修正
- [x] embedding-client.ts: 統合確認
- [x] Service Role Key認証統一

## 🔄 将来拡張対応

### P4-5で構築した基盤の再利用
- Webhook処理（CMS更新→翻訳/Embedding自動実行）
- AI Job チェーン（翻訳→Embedding→要約の順次実行）
- 外部システムトリガー対応

### 差分判定結果キャッシュ
複数AI処理での使い回しアーキテクチャの土台完成

## 🚨 注意事項・制限

1. **Edge Functions デプロイ**: `_shared` 単体デプロイ不可。各Edge Function内で import使用
2. **UNIQUE衝突**: 正常な冪等性機能として設計済み、エラーではない
3. **OpenAI API**: レート制限・コスト管理が運用上重要

## 📞 次のアクション

1. **Supabase Edge Functions デプロイ**: `supabase functions deploy translation-runner`, `embedding-runner`
2. **運用監視設定**: job_runs_v2 の失敗率・処理時間監視
3. **P4-6実装準備**: 統一されたバッチ基盤の活用

---

**P4-5実装担当**: Claude Code  
**Supabase基盤**: Supabaseアシスタント（DDL・インデックス・制約）  
**実装日**: 2024-12-03  
**品質レビュー**: ✅ メタ標準・冪等性キー規約準拠確認済み  