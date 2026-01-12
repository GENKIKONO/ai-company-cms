# AIOHub システム要件定義書（Core Architecture & Governance）

> **バージョン:** 1.0 (DB正対応)
> **最終更新:** 2024年12月
> **ステータス:** 確定（実装基準として使用）

---

## 1. 目的（Purpose）

AIOHub は、複数の権限レベル・料金プラン・機能制御・UI統一・利用分析を持つ商用SaaSとして、「壊れず・拡張でき・管理可能」な構造を前提に設計・運用される。

本要件定義は以下を保証する：

1. ページ構造・権限構造・UI適用ルールの分離
2. Admin は UIを直接制御せず、Policy/Config のみ変更
3. DBを唯一の真実の源泉（SoT）とする
4. 将来の機能/課金/主体拡張に耐える

---

## 2. 全体アーキテクチャ概要（Conceptual Model）

### 2.1 レイヤー構造（上位 → 下位）

```
[ Policy / Config Layer ]   ← Adminが変更
    ├─ Plans（プラン定義）
    ├─ Features（機能定義）
    ├─ Limits / Quotas（利用上限）
    ├─ Feature Flags / Overrides（例外）
    └─ Permissions（権限定義）

[ Read Model Layer ]        ← UI/Serverが参照
    ├─ get_effective_feature_set
    ├─ get_current_plan
    └─ Usage / Analytics Summary

[ Application UI Layer ]    ← 表示/体験
    ├─ PageShell（領域別の入場ガード）
    ├─ UI Provider（共通UIルール）
    └─ Pages / Components

[ Execution Layer ]         ← 実行時強制
    ├─ API / Route Handlers
    ├─ Server Actions / Edge Functions
    └─ DB RPC（Quota/Permission強制、監査）
```

### 2.2 データフロー

```
Admin操作
    ↓
Policy/Config（DB）更新
    ↓
Read Model（RPC/View）反映
    ↓
UI表示（短期キャッシュ可）
    ↓
実行操作
    ↓
サーバ/DB再検証（強制）
    ↓
Analytics/Audit 記録
```

---

## 3. ページ領域と PageShell の定義

### 3.1 PageShell の基本方針

- PageShell は **入場チェックと最小ガードのみ**。ビジネスロジックを保持しない
- BaseShellへ統合しない（Info/Dashboard/Account/Admin で分離）

### 3.2 PageShell の種類

| Shell名 | 対象パス | 主目的 | 権限モデル |
|---------|---------|--------|-----------|
| InfoPageShell | `/`, `/pricing`, `/terms` 等 | 公開情報表示 | 認証不要 |
| DashboardPageShell | `/dashboard/**` | 組織作業領域（主体=org） | `org_role` |
| UserShell（Account） | `/account/**` | 個人管理領域（主体=user） | `auth.uid` |
| AdminPageShell | `/admin/**` | 運営管理（主体=site） | `site_admin` |
| OpsLayout | `/ops/**` | 運用管理（主体=site） | `ops_admin` |
| ManagementConsoleLayout | `/management-console/**` | 管理コンソール（主体=site） | `site_admin` |

### 3.2.1 Dashboard サブ領域

Dashboard領域内には、組織管理者向けのサブ領域が存在する：

| サブパス | 主目的 | 権限モデル |
|---------|--------|-----------|
| `/dashboard/manage/**` | 組織管理機能 | `org_role='admin'` (org manager) |

**注意:** `org_role='admin'` は組織内の管理者ユーザーであり、`site_admin`（運営者）とは異なる。

### 3.3 Shell別責務マトリクス

| 責務 | Info | Dashboard | Account | Admin | Ops | MgmtConsole |
|------|:----:|:---------:|:-------:|:-----:|:---:|:-----------:|
| 認証チェック | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| 組織コンテキスト | - | ✓ | - | - | - | - |
| 個人コンテキスト | - | - | ✓ | - | - | - |
| site_admin判定 | - | - | - | ✓ | - | ✓ |
| ops_admin判定 | - | - | - | - | ✓ | - |
| Feature Gate | - | ✓ | ✓ | ✓ | - | - |
| 監査ログ | - | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. UI Provider（共通UIルール）

### 4.1 定義

UI Provider は PageShellとは別の概念であり、アプリ全体に共通する UI・デザイン・UXルールを提供する。

### 4.2 責務

- テーマ管理（Light/Dark）
- CSS変数に基づくデザイン統一
- 共通エラー境界
- 共通ローディング表現
- UIレベルの状態管理（Toast / Modal 等）

### 4.3 実装指針

- React Provider 層として `src/lib/core/ui-provider.ts` に実装
- PageShell は UI Provider を **利用する側** であり、UIルールを定義しない
- CSS変数（`--aio-primary` 等）は既存のまま維持
- UI Provider はビジネスルールを持たない

---

## 5. 共通 Core（全Shell共通）

### 5.1 Core の役割

Shell・API・Server Action から再利用可能な **横断的ロジック** を提供する。

### 5.2 必須 Core モジュール

| モジュール | 役割 | ファイルパス |
|-----------|------|-------------|
| auth-state | 認証状態取得の統一 | `src/lib/core/auth-state.ts` |
| error-boundary | 共通エラーUI | `src/lib/core/error-boundary.ts` |
| loading-state | 共通ローディング | `src/lib/core/loading-state.ts` |
| audit-logger | 操作監査ログ | `src/lib/core/audit-logger.ts` |
| ui-provider | UI共通ルール | `src/lib/core/ui-provider.ts` |

### 5.3 実装フェーズ

```
Phase 1（即時）
├── auth-state.ts
└── error-boundary.ts

Phase 2（次スプリント）
├── loading-state.ts
└── ui-provider.ts

Phase 3（安定後）
└── audit-logger.ts（既存admin/audit.tsを共通化）
```

---

## 6. Policy / Config（DBを真実の源泉とする）

### 6.1 主体（Subject）の統一

- **標準の課金・機能判定の主体は `org`（組織）とする**
- 個人機能は例外として `user` 主体を許容
- すべてのRPCは `subject_type ('org'|'user')` と `subject_id (uuid)` を必須引数に持つ
- UIコード上の `orgId?` の曖昧性は廃止し、明示的に `subject` を渡す

### 6.2 中核テーブル

| テーブル | 説明 |
|---------|------|
| `plans` | プラン定義 |
| `features` | 機能定義 |
| `plan_features_v2` | plan×feature、有効/必須/既定設定 |
| `feature_limits_v2` | plan×feature×limit_key×period×limit_value |
| `subscriptions` | 契約（主体=org推奨、user主体は例外的に別レコード） |
| `feature_flags` | 主体別のON/OFF |
| `feature_overrides` | 主体別の設定上書き、limit上書きを含む |
| `organizations` / `organization_members` | org ロール |
| `site_admins` | 運営権限 |

### 6.3 原則

1. 機能の最終判定は常にDB/RPC。UIは表示ヒントのみ
2. 削除ではなく `disabled` / `deprecated` を用いる（履歴性を担保）
3. 変更は監査ログに記録（誰が/何を/どこで/いつ/差分）

---

## 7. RLS（Row Level Security）と権限

### 7.1 基本方針

- すべてのアプリ公開テーブルにRLSを有効化（`auth.uid` 基準）
- 主要ポリシー条件列にインデックス必須（`user_id`, `organization_id`, `is_published`, `status` など）

### 7.2 領域別ポリシー

#### Dashboard（org主体）

- `org_member` のみ SELECT
- role で UPDATE/DELETE を制御（owner/admin＞editor＞viewer）
- 公開データは anon への SELECT を許可するか、公開ビュー/複製テーブルに分離

#### Account（user主体）

- `auth.uid` = 対象 user の行のみ SELECT/UPDATE

#### Admin（site主体）

- 読み出し・変更は `site_admins` に限定
- SECURITY DEFINER RPC で越権防止

### 7.3 SECURITY DEFINER

- 複雑な所属判定・集約は SECURITY DEFINER 関数で実装し、EXECUTE 権限を厳格化
- 関数内でも対象主体のアクセス検証を明示

### 7.4 実装済みポリシー一覧（2024-12-25）

#### organizations テーブル

| ポリシー名 | 対象 | 条件 |
|-----------|------|------|
| `org_dashboard_read` | authenticated | org メンバーは SELECT 可 |
| `org_dashboard_write` | authenticated | owner/admin は UPDATE 可 |
| `org_public_read` | anon | 公開状態は SELECT 可 |

#### services / case_studies / faqs / posts テーブル

| ポリシー名 | 対象 | 条件 |
|-----------|------|------|
| `org_child_dashboard_read` | authenticated | org メンバーは SELECT 可 |
| `org_child_dashboard_write` | authenticated | owner/admin は ALL 可（WITH CHECK） |
| `org_child_public_read` | anon | 親 org が公開済みなら SELECT 可 |

※ posts のみ `published_at <= now()` 条件を追加

### 7.5 インデックス（RLS最適化用）

```sql
-- org メンバーシップ判定用
organization_members(user_id, organization_id)

-- サブスクリプション判定用
subscriptions(organization_id, status)

-- 機能判定用
features(key)
plan_features_v2(plan_id, feature_id)
feature_limits_v2(plan_id, feature_id)

-- 公開状態判定用
organizations(is_published, status)

-- 子テーブル用
services(organization_id)
case_studies(organization_id)
faqs(organization_id)
posts(organization_id)
posts(published_at)
```

---

## 8. RPC（Read Model / Execution）

### 8.1 共通引数（原則）

- `subject_type text CHECK IN ('org','user')`
- `subject_id uuid`（org_id or user_id）
- `caller_user_id` は `auth.uid()` を信頼し、引数で渡さない（偽装防止）

### 8.2 get_current_plan（統一）

| 項目 | 内容 |
|------|------|
| 入力 | `subject_type`, `subject_id` |
| 出力 | `plan_id`, `plan_key`, `plan_meta（jsonb）` |
| 仕様 | subscriptions から現在有効なプランを解決（org優先、user主体は例外運用） |
| 権限 | subjectへの正当権限（org_member or 本人 or site_admin） |

### 8.3 get_effective_feature_set（新規/要実装）

| 項目 | 内容 |
|------|------|
| 入力 | `subject_type`, `subject_id` |
| 出力 | `features[]（feature_id, key, is_enabled, effective_config, limits[]）` |
| 仕様 | `plan_features_v2` → `feature_limits_v2` → `feature_overrides` → `feature_flags` の順にマージ |
| キャッシュ | 表示用は短期キャッシュ可（例: 60s）。実行時は毎回評価 |

### 8.4 check_and_consume_quota（既存、仕様厳格化）

| 項目 | 内容 |
|------|------|
| 入力 | `subject_type`, `subject_id`, `feature_key or feature_id`, `limit_key`, `amount int`, `period ('daily'│'weekly'│'monthly'│'yearly'│'rolling'│'total')`, `idempotency_key text nullable` |
| 出力 | `{ ok bool, code text, remaining int, limit int, period text, window_end timestamptz }` |
| 仕様 | トランザクション内で現在消費量+amount<=上限を評価し、OKなら消費を原子的に反映。idempotency_keyがあれば重複消費を防止 |
| 権限 | subjectアクセス権（org_member/本人）またはsite_admin |

### 8.5 補助RPC

- `has_org_role(org_id, roles[])`
- `is_site_admin()`
- `audit_log_write(actor_user_id default auth.uid(), action, entity_type, entity_id, context jsonb, diff jsonb)`
- `analytics_event_write(event_key, properties jsonb, context jsonb)`

### 8.6 エラー規約

| コード | 意味 |
|--------|------|
| `OK` | 成功 |
| `NO_PLAN` | プランなし |
| `DISABLED` | 機能無効 |
| `EXCEEDED` | 上限超過 |
| `FORBIDDEN` | 権限なし |
| `NOT_FOUND` | 対象なし |
| `INVALID_ARG` | 引数不正 |
| `ERROR` | システムエラー |

- 監査対象の失敗も `audit_logs` に要約記録（過負荷回避のため閾値化可）

---

## 9. Feature Gate（アプリ側）

### 9.1 ライブラリ

- `src/lib/featureGate.ts`（既存）

### 9.2 API

| API | 用途 |
|-----|------|
| `getEffectiveFeatures(subject)` | 有効機能一覧取得（60sキャッシュ） |
| `canExecute(subject, feature_key, limit_key, amount)` | 実行可否判定（サーバ/Edge から `check_and_consume_quota` 呼び出し） |

### 9.3 UI方針

- 不可の場合は「理由と導線」（アップグレード/購入/切替）を表示

### 9.4 統一返却形式

```typescript
interface QuotaResult {
  ok: boolean;           // 成功/失敗
  code: QuotaResultCode; // 'OK' | 'NO_PLAN' | 'DISABLED' | 'EXCEEDED' | 'FORBIDDEN' | 'ERROR'
  remaining?: number;    // 残りクォータ
  limit?: number;        // 上限値
  period?: string | null;// 'monthly' | 'yearly' | null
  window_end?: string;   // 期間終了日時（ISO 8601）
}
```

---

## 10. Admin（運営）

### 10.1 Admin の役割

**Admin は UIの親ではない。**

Admin の責務は以下に限定される：

- Plan / Feature / Limit / Flag の編集
- ユーザー契約状態の管理
- 利用分析・監査ログの確認

### 10.2 AdminPageShell

- `site_admin` のみ入場
- UIを直接操作・制御しない
- Policy/Config の変更のみを行う

### 10.3 Admin が変更できるもの

| 対象 | 操作 | 影響 |
|------|------|------|
| Plans | CRUD | 新規プラン追加、価格変更 |
| Features | CRUD | 機能定義の追加・変更 |
| PlanFeatures | 紐付け変更 | プランの機能構成変更 |
| FeatureLimits | 上限設定 | クォータ変更 |
| Feature Flags | ON/OFF | 個別例外設定 |
| Feature Overrides | 設定上書き | 主体別設定 |
| Subscriptions | ステータス変更 | 契約管理 |

### 10.4 監査

- すべての変更は `audit_logs` に記録（before/after 要約）
- 実テーブルは非破壊（disabled/deprecated で廃止表現）

---

## 11. User（Account）領域の定義

### 11.1 UserShell の役割

- 個人設定（プロフィール、通知）
- 支払い・請求
- Add-on 購入
- APIキー管理
- データエクスポート・削除

### 11.2 境界ルール

| 領域 | 判定軸 | 例 |
|------|--------|-----|
| Dashboard | `org_id` + `org_role` | 組織のコンテンツ編集 |
| Account | `user_id` のみ | 個人設定、支払い |

### 11.3 Add-on の扱い

```
購入: Account（/account/addons）
  ↓
有効化: user_feature_flags に記録
  ↓
利用: Dashboard内で機能解放
```

---

## 12. Analytics / Audit（DB一元化）

### 12.1 Analytics Events

- INSERT-only（更新・削除しない）
- サイズ制限（8KB/イベント）
- 禁止キー検査（PII除外）
- 重要イベントはサーバ/Edge経由のみ挿入

### 12.2 Audit Log（最小要件）

| フィールド | 内容 | 必須 |
|-----------|------|:----:|
| actor_user_id | 誰が | ✓ |
| action | 何を | ✓ |
| entity_type | どこに | ✓ |
| entity_id | 対象ID | ✓ |
| occurred_at | いつ | ✓ |
| context (jsonb) | 追加情報 | - |
| diff (jsonb) | 変更差分 | - |

### 12.3 DB側要件

- 主要テーブルの更新はトリガで要約差分を自動記録（過重にならない範囲で）
- 月次パーティション等で長期保管と高速検索を両立

---

## 13. 非機能要件

### 13.1 拡張性

- Shell追加（Partner等）に対応可能
- 新しい権限モデルを追加可能
- 新しいプラン・機能を無停止で導入可能

### 13.2 保守性

- ルール変更は Admin → DB → ReadModel で反映
- コード変更なしで機能ON/OFF可能
- 設定変更は監査ログに記録

### 13.3 安全性

- 全テーブルRLS前提
- SECURITY DEFINER は最小権限
- 実行時は必ずサーバ/DB再検証

### 13.4 可観測性

- Analytics / Audit を分離
- エラーは構造化ログで記録
- request_id / session_id で追跡可能

### 13.5 性能

- RLS列インデックス義務
- RPC結果の短期キャッシュ（表示系）
- クォータ消費はバッチ書き込みにも対応

---

## 14. 決定事項まとめ（固定）

| # | 決定事項 | 状態 |
|---|---------|:----:|
| 1 | PageShellは用途別に分離し統合しない | ✅ 確定 |
| 2 | 共通処理は Core に切り出す | ✅ 確定 |
| 3 | UI統一は Provider 層で行う | ✅ 確定 |
| 4 | Admin は Policy/Config 編集者でUIの親ではない | ✅ 確定 |
| 5 | Feature可否は DB/RPC が最終決定 | ✅ 確定 |
| 6 | User（Account）領域を Dashboard から分離 | ✅ 確定 |
| 7 | Quota返却形式を統一 | ✅ 確定 |
| 8 | **すべてのRPCは subject_type/subject_id を必須にし、org優先モデルを明示** | ✅ 確定（新規） |

---

## 14.1 コンテンツ管理（Source of Truth）

### News（お知らせ）

| 項目 | 内容 |
|------|------|
| 正本（SoT） | `src/data/news.ts`（ファイル運用） |
| 公開ページ | `src/app/news/page.tsx` |
| 管理画面 | `src/app/admin/news/page.tsx` |
| 変更方法 | Git管理下のファイル編集→デプロイ |
| DBテーブル（news） | **未使用**（将来検討の余地はあるが現行参照禁止） |

**方針:** ニュースはファイルベースで管理し、DBの`news`テーブルは使用しない。

### 14.2 参照禁止DBオブジェクト（BAN_AS_UNUSED）

以下のDBオブジェクトは意図的に未使用であり、コードからの参照を禁止する。

| オブジェクト | 種別 | 理由 | 確定日 |
|-------------|------|------|--------|
| `news` | テーブル | ファイル運用確定（`src/data/news.ts`） | 2024-12-28 |
| `blocked_ips` | テーブル | `ip_blocklist`に統一 | 2024-12-28 |
| `intrusion_detection_rules` | テーブル | 静的ルール管理、コード参照不要 | 2024-12-28 |

**例外（Admin専用）:** `security_incidents` は `SecurityDashboard.tsx` から参照可（監視用）。

**CIチェック:** `scripts/check-architecture.sh` で誤参照を検出。

---

## 15. 実装状況サマリ

### 15.1 完了済み（フロントエンド/コード側）

| 項目 | ファイル | 状態 |
|------|---------|:----:|
| FeatureGate（Subject対応） | `src/lib/featureGate.ts` | ✅ |
| AdminPageShell | `src/components/admin/AdminPageShell.tsx` | ✅ |
| Admin監査ログ | `src/lib/admin/audit.ts` | ✅ |
| Quota統一形式 | `src/lib/featureGate.ts` | ✅ |
| auth-state | `src/lib/core/auth-state.ts` | ✅ |
| error-boundary | `src/lib/core/error-boundary.tsx` | ✅ |
| loading-state | `src/lib/core/loading-state.ts` | ✅ |
| ui-provider | `src/lib/core/ui-provider.tsx` | ✅ |
| audit-logger | `src/lib/core/audit-logger.ts` | ✅ |
| UserShell | `src/components/account/UserShell.tsx` | ✅ |

### 15.2 DB側（Supabase）- 実装完了

| 項目 | 状態 | 備考 |
|------|:----:|------|
| `admin_audit_logs` テーブル | ✅ | INSERT-only, RLS有効, site_admins読取専用 |
| `get_effective_feature_set` RPC | ✅ | subject_type/subject_id 対応 |
| `check_and_consume_quota` RPC | ✅ | idempotency_key対応, period汎用化済み |
| `audit_log_write` RPC | ✅ | SECURITY DEFINER, auth.uid()自動採用 |
| `feature_flags` / `feature_overrides` | ✅ | org/user両対応 |
| `user_feature_flags`（user主体のアドオン用） | 📋 | 将来実装予定 |

### 15.3 RLS / インデックス最適化（DB側）- 実装完了

| 項目 | 状態 | 備考 |
|------|:----:|------|
| 公開テーブルRLS有効化 | ✅ | organizations, services, case_studies, faqs, posts |
| Dashboard/Public ポリシー | ✅ | §7.4 参照 |
| RLS最適化インデックス | ✅ | §7.5 参照 |

### 15.4 将来の拡張候補

| 項目 | 内容 |
|------|------|
| posts status列追加 | 下書き/公開の厳密分離（status, published_at インデックス） |
| 検索最適化 | organizations.slug, posts.title への GIN/Trigram インデックス |
| Realtime通知 | broadcast + private channel, trigger + realtime.messages RLS |

---

## 付録A: ディレクトリ構造（推奨）

```
src/
├── lib/
│   ├── core/                    # 共通Core
│   │   ├── auth-state.ts
│   │   ├── error-boundary.ts
│   │   ├── loading-state.ts
│   │   ├── ui-provider.ts
│   │   └── audit-logger.ts
│   ├── featureGate.ts           # Feature Gate（独立）
│   ├── billing/                 # 課金関連
│   │   └── index.ts
│   └── admin/                   # Admin専用
│       └── audit.ts
├── components/
│   ├── admin/                   # Admin UI
│   │   ├── AdminPageShell.tsx
│   │   └── ...
│   ├── dashboard/               # Dashboard UI
│   │   ├── DashboardPageShell.tsx
│   │   └── ...
│   ├── account/                 # Account UI（将来）
│   │   └── UserShell.tsx
│   └── common/                  # 共通UI
│       └── InfoPageShell.tsx
└── app/
    ├── admin/                   # /admin/**
    ├── dashboard/               # /dashboard/**
    ├── account/                 # /account/**（将来）
    └── (public)/                # 公開ページ
```

---

## 付録B: 用語集

| 用語 | 定義 |
|------|------|
| Subject | 判定主体（org│user）。標準はorg、userは例外 |
| PageShell | ページ表示前の共通チェック・制御を行う外枠コンポーネント |
| UI Provider | アプリ全体に共通するUI・デザイン・UXルールを提供するProvider層 |
| Core | Shell・API・Server Actionから再利用可能な横断的ロジック |
| Policy/Config | Adminが変更できる設定（Plans, Features, Limits, Flags, Overrides） |
| Read Model | UIが参照するためのRPC/View（get_effective_feature_set等） |
| Feature Gate | 機能の有効/無効を判定する統一モジュール |
| Quota | 機能の利用上限 |
| site_admin | サイト全体の管理者権限 |
| org_role | 組織内での役割（viewer/editor/admin） |
| SECURITY DEFINER | DB側で越権せずに権限を委譲する関数定義 |

---

## 付録C: 移行中のモジュール（参照制限）

> **ステータス:** 移行中（2024年12月〜）

以下のモジュールは段階的に廃止予定です。新規コードでの使用は禁止されています。

### C.1 PLAN_LIMITS（正本として維持）

| 項目 | 内容 |
|------|------|
| 正本 | `@/config/plans.ts` の `PLAN_LIMITS` |
| 補助 | `@/lib/featureGate.ts` の `getPlanUiLimitsFromFeatures()`（DB由来） |
| 禁止 | ページ内にプラン比較データをハードコード（重複データ） |
| ガードレール | Check 9（ハードコード検知方式） |

> **方針転換 [2024-12-28]:**
> 以前はPLAN_LIMITS参照カウントの増加を禁止していたが、ページ内ハードコード（PLAN_COMPARISON等）を撤去して正本に戻すと「参照増加」と誤検知される問題があった。
> 新方針では、PLAN_LIMITSを正本として参照することは許可し、代わりにページ内にプラン比較データをハードコードすること（重複データの発生）を禁止する。

**禁止パターン:**
```typescript
// ❌ 禁止: ページ内にプラン比較をハードコード（重複データ）
const PLAN_COMPARISON = {
  starter: { services: 5, posts: 20 },
  pro: { services: 20, posts: 100 },
};
```

**許可パターン:**
```typescript
// ✅ 許可: 正本（PLAN_LIMITS）を参照
import { PLAN_LIMITS } from '@/config/plans';
const limits = PLAN_LIMITS[plan];

// ✅ 推奨: featureGate 経由でDB由来の値を使用
import { getEffectiveFeatures, getPlanUiLimitsFromFeatures } from '@/lib/featureGate';
const features = await getEffectiveFeatures(supabase, { type: 'org', id: orgId });
const limits = getPlanUiLimitsFromFeatures(features);
```

### C.2 org-features（参照禁止）

| 項目 | 内容 |
|------|------|
| 現行モジュール | `@/lib/org-features/*` |
| 移行先 | `@/lib/featureGate.ts` の Subject型API |
| 理由 | 非標準API（canUseFeatureFromOrg等）からSubject型API（getEffectiveFeatures）への統一 |
| ガードレール | Check 8（ベースライン方式、増加禁止） |

**移行パターン:**
```typescript
// ❌ 旧（禁止）
import { canUseFeatureFromOrg } from '@/lib/org-features';
const hasFeature = canUseFeatureFromOrg(org, 'ai_reports');

// ✅ 新（推奨）
import { getEffectiveFeatures, getFeatureEnabled } from '@/lib/featureGate';
const features = await getEffectiveFeatures(supabase, { type: 'org', id: org.id });
const hasFeature = getFeatureEnabled(features, 'ai_reports');
```

---

## Appendix D: CIガードレール一覧

> **目的:** 「正しい構造しか書けない状態」を保証するための自動チェック
>
> 📖 **境界の全体像は [設計境界（Boundaries）ガイド](./architecture/boundaries.md) を参照**
>
> 📋 **PRレビューの運用ルールは [レビューゲートガイド](./architecture/review-gates.md) を参照**

### D.1 Check一覧（check-architecture.sh）

| Check | 名称 | 説明 | 違反時 |
|-------|------|------|--------|
| 1 | @/lib/auth直接import禁止 | Core経由必須 | FAIL |
| 2 | isSiteAdmin重複定義禁止 | auth-state.ts正本 | FAIL |
| 3 | 監査ログ直接呼び出し禁止 | Core経由必須 | FAIL |
| 4 | orgId?: string \| null | Subject型推奨 | 警告 |
| 5 | PageShell内auth直叩き | 重複チェック不要 | 警告 |
| X | Supabase Auth直叩き | ベースライン管理 | 増加時FAIL |
| 6 | 参照禁止DB | news等は禁止 | FAIL |
| 7 | レガシーErrorBoundary | Core正本使用 | FAIL |
| 8 | org-features直接import | 0件必須 | FAIL |
| 9 | ページ内ハードコード | 正本参照必須 | FAIL |
| 10 | プラン名分岐 | featureGate経由必須（docs正本） | FAIL |
| 11 | feature_flags直読み | featureGate経由必須 | FAIL |
| 12 | FeatureLockedローカル定義 | 正本コンポーネント使用 | FAIL |
| 13 | /account DashboardPageShell | UserShell必須 | FAIL |
| 14 | 例外リスト増加禁止 | BASELINE超過で検知 | 増加時FAIL/期限切れWARN |

### D.2 禁止パターンと回避策

#### Check 10: プラン名分岐の禁止

**概要:** プラン名（'free', 'starter', 'pro'等）による直接分岐は禁止。featureGate経由のみ許可。

**NG例（すべて禁止）:**
```typescript
// NG: 直接比較
if (plan === 'starter') { ... }
if (organization.plan === 'pro') { ... }
if (org.plan !== 'free') { ... }

// NG: includes系
if (['free','starter'].includes(plan)) { ... }
if (['basic', 'pro'].includes(planTier)) { ... }

// NG: switch分岐
switch (plan) {
  case 'starter': ...
  case 'pro': ...
}
```

**OK例:**
```typescript
import { getEffectiveFeatures, getFeatureEnabled } from '@/lib/featureGate';
const features = await getEffectiveFeatures(supabase, { type: 'org', id: orgId });
if (getFeatureEnabled(features, 'feature_key')) {
  // ...
}
```

**例外ファイル（ホワイトリスト）[2024-12 ファイル単位に縮小]:**
| ファイル | 理由 | 分類 | featureGate置換可否 |
|---------|------|------|-------------------|
| `management-console/users/page.tsx` | 管理画面 - プラン切替UI | 表示 | 不可（管理画面） |
| `api/oem/keys/route.ts` | OEM - レート制限 | 実行制御 | 要検討 |
| `api/billing/checkout-segmented/route.ts` | Stripe入力バリデーション | 実行制御 | 不可（Stripe連携） |
| `config/plans.ts` | 正本定義 | 撤去不可 | - |
| `config/features.ts` | 正本定義 | 撤去不可 | - |
| `organizations/page.tsx` | 表示用（ソート重み/CSS/表示名） | 表示 | 不可（表示ロジック） |

**置換不可の理由（2024-12確認）:**
- `organizations/page.tsx`: ソート重み・CSSスタイル・表示名は**機能アクセス制御ではない**。featureGateは機能フラグ用であり表示ロジックの代替には不適切
- `api/billing/checkout-segmented/route.ts`: Stripeチェックアウトの**ユーザー入力バリデーション**。プラン名はStripe価格ID/商品に対応しており、featureGateでは代替不可

---

#### Check 11: feature_flags直読みの禁止

**概要:** organization.feature_flags への直接アクセスは禁止。featureGate経由のみ許可。

**NG例（すべて禁止）:**
```typescript
// NG: ブラケットアクセス
if (organization.feature_flags['ai_reports']) { ... }
if (feature_flags['custom_branding']) { ... }

// NG: ドットアクセス
const flags = org.feature_flags;
if (org?.feature_flags?.verified_badge) { ... }
```

**OK例:**
```typescript
import { getEffectiveFeatures, getFeatureEnabled } from '@/lib/featureGate';
const features = await getEffectiveFeatures(supabase, { type: 'org', id: orgId });
if (getFeatureEnabled(features, 'ai_reports')) {
  // ...
}
```

**例外ディレクトリ（ホワイトリスト）:**
| パス | 理由 | 撤去条件 |
|-----|------|----------|
| `lib/org-features/**` | 内部実装モジュール（外部import禁止はCheck8で担保） | featureGateへ完全統合時 |
| `lib/featureGate.ts` | 正本 | 撤去不可 |
| `types/**` | 型定義のみ | 撤去不可 |

**撤廃済み:**
- `components/ui/VerifiedBadge.tsx` → 2024-12に純UI化完了

---

#### Check 12: FeatureLockedローカル定義の禁止

**概要:** FeatureLockedコンポーネントのローカル定義は禁止。正本のみ使用。

**NG例（すべて禁止）:**
```typescript
// NG: ローカル関数定義
function FeatureLocked({ ... }) { ... }

// NG: ローカルconst定義
const FeatureLocked = ({ ... }) => { ... };

// NG: export付きローカル定義
export function FeatureLocked({ ... }) { ... }
```

**OK例:**
```typescript
import { FeatureLocked } from '@/components/feature/FeatureLocked';

// 使用例
<FeatureLocked
  title="AI分析レポート"
  description="AI分析レポート機能の説明"
  features={['月次レポート', 'カスタム分析']}
/>
```

**正本ファイル:**
- `src/components/feature/FeatureLocked.tsx`

**注意:** コメント例外（`// plan-branch-ok` 等）は禁止。例外はファイルパスホワイトリストのみ。

---

#### Check 13: /account での DashboardPageShell 使用禁止

**概要:** /account 配下は user主体（個人設定）であり、org主体の DashboardPageShell は禁止。

**NG例:**
```typescript
// NG: /account 配下で DashboardPageShell を使用
// src/app/account/profile/page.tsx
import { DashboardPageShell } from '@/components/dashboard';

export default function ProfilePage() {
  return (
    <DashboardPageShell>  {/* ← 禁止 */}
      ...
    </DashboardPageShell>
  );
}
```

**OK例:**
```typescript
// OK: UserShell を使用
import { UserShell } from '@/components/account';

export default async function ProfilePage() {
  return (
    <UserShell title="プロフィール">
      ...
    </UserShell>
  );
}
```

---

### D.3 /account 完成条件（Definition of Done）

/account 領域は以下の条件を満たす必要があります：

| 条件 | 現状 | 確認方法 |
|------|------|----------|
| UserShell 必須 | ✅ 適用済み | Check 13 で監視 |
| 未ログイン時リダイレクト | ✅ `/login?redirect=/account` | UserShell L40 |
| DashboardPageShell 禁止 | ✅ 監視中 | Check 13 |

**方針:** /dashboard/settings に user主体の設定が残っている場合

- **許可:** 組織に関連する設定（通知設定でorg通知等）
- **禁止:** 純粋なuser個人設定（パスワード変更、2FA等）

純粋な個人設定が /dashboard/settings に混入している場合は、/account への移行を検討してください。

---

### D.4 6領域とShell対応

| 領域 | パス | Shell/Layout | 主体 |
|------|------|--------------|------|
| Info | /, /pricing, /terms等 | InfoPageShell | なし（認証不要） |
| Dashboard | /dashboard/** | DashboardPageShell | org（組織） |
| Dashboard管理 | /dashboard/manage/** | DashboardPageShell (requiredRole) | org manager |
| Account | /account/** | UserShell | user（個人） |
| Admin | /admin/** | AdminPageShell | site_admin |
| Ops | /ops/** | OpsLayout | ops_admin |
| MgmtConsole | /management-console/** | ManagementConsoleLayout | site_admin |

**重要:** 領域を間違えてShellを使用すると、権限チェックが破綻します。

### D.4.1 権限レベルの区別

| 権限 | 対象 | 説明 |
|------|------|------|
| `site_admin` | 運営者 | サイト全体を管理（Admin, MgmtConsole） |
| `ops_admin` | 運用者 | 運用管理機能へのアクセス（Ops） |
| `org manager` | 顧客の管理者 | 組織内でadminロールを持つユーザー |
| `org_role` | 顧客のスタッフ | 組織内の一般ユーザー |

**注意:** 「admin」という用語は `site_admin`（運営者）のみに使用し、組織管理者には `org manager` を使用する。

---

**文書終了**
