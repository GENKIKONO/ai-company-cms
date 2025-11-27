# 改訂版: Supabase Operations Architecture（AIOHub バックエンド総合設計書）— 保存版

本書は AIOHub のバックエンド（Supabase → PostgreSQL, Auth, RLS, Edge Functions, Storage）を、将来 1億ユーザー規模でも安定運用できるようにするための完全設計書です。前版の要約に対し、運用で効く数値基準・自動化・監査/計測・Realtime/RLS の実戦指針を強化しています。

## 1. High-Level Architecture（全体像）

### 中核

- PostgreSQL（マルチテナント/組織モデル）
- Supabase Auth（SSRv2, JWT）
- 全テーブル RLS有効、service_role は Edge Functions/バッチのみ
- PostgREST + Edge Functions（集計/非同期/外部連携/Webhook/バッチ）
- Realtime は broadcast + private channel、postgres_changes は採用しない
- Storage は prefix-based RLS（bucket 固定 + 第1セグメントに境界）

### 1億ユーザー対応の柱

- パーティション（時系列・org・地域）
- インデックス（RLS列 / JOIN列 / status列、部分インデックス活用）
- Edge Functions で非同期化（waitUntil で応答と分離）
- Materialized View（REFRESH CONCURRENTLY）+ サマリーテーブル
- Edge Cache/CDN、公開データ（Public Truth）を別テーブルで提供

### 国際化（I18n/L10n）

- 全時刻 UTC 固定、UI でタイムゾーン変換
- profiles/organizations に locale, timezone, currency（CHECK で妥当性）
- translations テーブルを基本、JSONB はマイクロコピー用途に限定
- ICU collation は最小範囲のみ

### Public Truth モデル

- public_* テーブル/ビューを公開専用に整形
- 非同期バッチで反映、CDN キャッシュ前提で安定配信

---

## 2. Schema Principles（スキーマ原則）

### 厳密な制約

- 主要カラムは NOT NULL/CHECK/FK 必須
- FK の ON DELETE/UPDATE は明示（CASCADE/RESTRICT/SET NULL）
- enum/domain を活用し UI と値域を一致

### Data Contract（型生成 → UI 直結）

- スキーマ変更 → supabase gen types → UI 型同期
- UI の選択肢は enum/domain から自動生成
- PR で型差分を必須レビュー

### 多言語モデル

- base + translations（UNIQUE(base_id, locale), fields_jsonb）
- JSONB は検索対象外・軽量マイクロコピーに限定、GIN 多用は避ける

### パーティション/シャーディング指針

- 時系列（logs/events/metrics）: 週次 or 月次
- org_id 分割（巨大テナント/規制要件）
- シャーディングは最終手段（数十億行超で検討）

### 履歴/バージョン管理

- entity_versions（append-only）+ view で現行を定義
- 監査は専用 append-only テーブル、BRIN + パーティション

---

## 3. Security & RLS（推奨セキュリティモデル）

### Auth/セッション

- SSRv2 でサーバ検証、最小権限JWTをクライアントへ
- Edge Functions で service_role を使用（エンドユーザー経路で使用禁止）

### RLS 絶対原則

- すべて ENABLE、操作別にポリシー分離（SELECT/INSERT/UPDATE/DELETE）
- TO 句を必須（PUBLIC 避ける）
- RLS 条件列（user_id, org_id など）に必ずインデックス
- auth.uid() は SELECT ラッパーで使用（プラン安定化）

### 組織権限モデル（安全パターン）

- user_organizations(user_id, organization_id, role, UNIQUE)
- USING/WITH CHECK は EXISTS サブクエリで判定
- 複雑判定は SECURITY DEFINER 関数でカプセル化し REVOKE EXECUTE

### 公開ページ

- public_* を anon SELECT 許可、書込み禁止
- Edge Cache/CDN キャッシュで高耐性

### セッション・拡張運用

- 短命アクセストークン、定期ローテーション
- 監査ログ/権限違反ログを別パーティションで長期保存

---

## 4. Migration Lifecycle（マイグレーション運用）

### 原則

- Migration-driven（Dashboard を直接編集しない）
- すべて SQL を PR レビュー、CI で適用検証

### 手順

1. DDL（列追加は後方互換、INDEX は CONCURRENTLY）
2. RLS ポリシー
3. トリガー/関数（SECURITY DEFINER は REVOKE 徹底）
4. バックフィル（冪等、進捗ログ、段階ロールアウト）
5. 検証（行数/制約/インデックス/EXPLAIN 基準）
6. 切替（フィーチャーフラグ）
7. 遅延撤去（two-phase, 2リリース跨ぎ）

### Nightly Schema Diff

- 本番/ステージングのスキーマ差分を自動検出・通知
- 手作業変更の混入を監視

### 型生成同期

- supabase gen types typescript --local を自動実行
- UI 型差分を PR に表示

### バージョニング

- migrations に migration_version/applied_at を残す
- リリースタグと hash を結合

---

## 5. Scalability / Performance（大規模対応）

### インデックス戦略

- RLS 列・JOIN 列・高選択性列に B-Tree
- status など条件固定には部分インデックス
- 時系列巨大テーブルは BRIN + 必要箇所のみ補助 B-Tree
- Trigram/GIN は最小限（更新コスト高）

### パーティション自動化

- 週次/月次パーティションを cron（Supabase Scheduler）で作成/切替
- 古いパーティションは READ ONLY、VACUUM/ANALYZE の影響を局所化

### Edge Functions の非同期化

- 重い集計はバッチで MV/summary に書出し
- 外部 API/Webhook/バックフィルは waitUntil で応答分離
- 冪等処理（重複キー、再試行戦略）を標準化

### ログローテーション

- audit/logs/metrics はパーティション＋保持期間（例: 監査1年、アクセス90日、メトリクス180日）
- Storage の世代/期限削除ルールを運用化

### Realtime

- broadcast + private channel を標準
- postgres_changes は非採用
- realtime.messages への RLS を明示（受信/送信の SELECT/INSERT 分離）
- テーマ別チャネル命名（scope:entity:id）、インデックスで検証

### RLS 高速化テクニック

- auth.uid() は SELECT ラップ
- EXISTS サブクエリ＋必須インデックス
- SECURITY DEFINER 関数で JOIN を隠蔽し安定化

### スロークエリ監視

- pg_stat_statements 有効化、P95 > 500ms を週次レビュー
- 上位Nクエリはチケット化（担当/期限付き）
- PR 時に重要クエリの EXPLAIN (ANALYZE, BUFFERS) を保存し回帰検知
- Supabase Advisors を定期確認（未使用IDX/欠損FK/全表走査警告）

---

## 6. UI と DB の未接合対策（Data Contract）

### 一方向同期

- DB → 型生成 → UI（フォーム/バリデーション/選択肢）
- UI の自由記述は domain/enum で制限

### 整合性検知

- contract_violations（table, column, payload, created_at）
- 重大違反は Edge Functions で通知
- 命名規則: pk_{table}, fk_{table}{ref}, chk{table}{field}, uq{table}_{field}

### 監査テーブル

- audit_log（append-only, actor, action, before/after, ip/ua, at）
- 月次パーティション + BRIN
- 重要操作は統一関数経由で実行（SECURITY DEFINER）

### 多言語運用

- 翻訳未完了ビュー（欠損 locale の抽出）
- フォールバック: user → org → default_locale

### 中長期の理想

- スキーマ駆動フォーム自動生成
- 翻訳フィールドのテンプレート化と検査 CI

### よくある落とし穴対策

- RLS 列にインデックス不足 → EXPLAIN で Seq Scan が出ないことを合格基準に
- JSONB 濫用 → 正規化＋検索要件の洗い出し、GIN は限定的に
- Dashboard 直編集 → Nightly Diff と権限で抑止

---

## 7. Command Center（指令室）と管理者モデル

### 管理者 UI 方針

- Edge Functions 経由で管理操作（service_role 使用）
- すべて監査ログに記録（who/what/when）
- 重要設定は専用テーブル（feature_flags, locales, seo_settings, publishing_rules）

### 実装すべき設定

- 多言語: 有効 locale, fallback, 翻訳ステータス
- タイムゾーン/日付表示: org/user デフォルト
- SEO: canonical/meta/og は public_* に反映
- 公開: draft/published/archive と非同期ビルド

### 理想の運用要素

- 監査ログの月次アーカイブ
- 利用量/課金メトリクス（API/Edge/Storage 集約）
- レート制限（IP/User/Org/WAF）と現在値の DB 反映
- アラート: スロークエリ、エラー率、RLS 失敗、ジョブ失敗

### Stripe/サブスク連動

- Webhook 署名検証、event_id UNIQUE で冪等化
- 状態遷移は CHECK 制約で有効遷移のみ許可
- 金額/通貨/税率は正規化（NUMERIC(18,6) 等）、為替差処理を別途

---

## 付録A: Realtime 標準 RLS スニペット（private-only 前提）

### 受信（SELECT）

- realtime.messages で topic LIKE 'room:%'
- USING: 該当 room_id に属するメンバーであることを EXISTS で確認
- 必須インデックス: room_members(user_id, room_id)

### 送信（INSERT）

- WITH CHECK: 同上
- チャネル命名: scope:entity:id（例: room:123:messages）

### 運用

- 本番は private-only チャネルを強制
- トリガーは realtime.broadcast_changes を使用（postgres_changes は採用しない）

---

## 付録B: 監査・計測の最小実装セット

- audit_log（append-only, 月次パーティション, BRIN）
- contract_violations（重大整合性違反の記録＋通知）
- usage_metrics（API/Edge/Storage の集約、保持期間ルール）
- rate_limits（ユーザー/組織/エンドポイントの現在値 + 窓）
- スロークエリ基準: P95 > 500ms を検知しチケット化

---

## 付録C: マイグレーション・パーティション自動化

- インデックスは CREATE INDEX CONCURRENTLY
- 大規模スキーマ変更は「並走期間→バックフィル→スイッチ→遅延撤去」
- パーティション作成/切替/READ ONLY 化を cron（Scheduler）で自動実行

---

## 付録D: 多言語と検索

- translations 正規化 + fields_jsonb
- ICU collation は必要箇所に限定、重い箇所は UI での並べ替え
- フォールバック戦略をクエリ/ビューに組み込む

---

## まとめ（運用チェックリスト 抜粋）

- **RLS**: すべて ENABLE、TO 句明示、条件列に索引、EXPLAIN 合格
- **Realtime**: broadcast + private-only、RLS ポリシーで送受信分離
- **パーティション**: 週次/月次で自動作成、古い領域は READ ONLY
- **スロークエリ**: P95>500ms を週次レビュー、トップNをチケット化
- **マイグレーション**: Dashboard 不使用、CONCURRENTLY、two-phase
- **Public Truth**: 非同期で更新、Edge/CDN キャッシュ
- **監査/違反/利用量**: append-only + ローテーション
- **Storage**: prefix RLS、署名 URL TTL、ライフサイクル削除
- **型生成**: supabase gen types を CI に組込み、UI と一方向同期

この改訂版をリポジトリの保存版ドキュメントとしてご利用ください。必要であれば、各付録の SQL/Edge Functions の具体コードも提供します。