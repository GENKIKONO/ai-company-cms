# API Routes 認証パターン移行ステータス

## 概要

このドキュメントは、API Routes の認証パターン移行状況を追跡します。

**目標**: すべての認証が必要な API Routes を `createApiAuthClient` パターンに統一する

**正しい実装**:
- `createApiAuthClient`（認証必須）
- `createApiAuthClientOptional`（認証任意）
- すべてのレスポンスを `applyCookies()` でラップ

**禁止パターン**:
- `createClient`（server.ts）
- `supabase.auth.getSession()`
- `supabase.auth.getClaims()`
- `getUserWithClient`（非推奨）
- `withOrgAuth`（非推奨）

---

## 移行完了済み

### `/api/my/*` (Dashboard 認証必須)
- [x] `/api/my/services/route.ts`
- [x] `/api/my/services/[id]/route.ts`
- [x] `/api/my/posts/route.ts`
- [x] `/api/my/posts/[id]/route.ts`
- [x] `/api/my/faqs/route.ts`
- [x] `/api/my/faqs/[id]/route.ts`
- [x] `/api/my/case-studies/route.ts`
- [x] `/api/my/case-studies/[id]/route.ts`
- [x] `/api/my/materials/route.ts`
- [x] `/api/my/materials/[id]/route.ts`
- [x] `/api/my/team/route.ts`
- [x] `/api/my/team/[memberId]/route.ts`
- [x] `/api/my/organization/route.ts`

### `/api/dashboard/*` (Dashboard 認証必須)
- [x] `/api/dashboard/init/route.ts`

---

## 未移行（優先度: 高）

### `/api/my/*` - Dashboard 機能に直接影響

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/my/reports/route.ts` | Dashboard レポート機能 | 移行必須 |
| `/api/my/reports/monthly/route.ts` | 月次レポート | 移行必須 |
| `/api/my/qna-stats/route.ts` | Q&A 統計 | 移行必須 |
| `/api/my/qna-stats/export/route.ts` | 統計エクスポート | 移行必須 |
| `/api/my/qa/*/route.ts` | Q&A 機能 | 移行必須 |
| `/api/my/organization/publish/route.ts` | 公開設定 | 移行必須 |
| `/api/my/org-docs/*/route.ts` | 組織ドキュメント | 移行必須 |
| `/api/my/interview/*/route.ts` | インタビュー機能 | 移行必須 |
| `/api/my/interview-questions/route.ts` | インタビュー質問 | 移行必須 |
| `/api/my/ai-citations/route.ts` | AI引用 | 移行必須 |
| `/api/my/features/*/route.ts` | 機能フラグ | 移行必須 |

### `/api/admin/*` - 管理画面機能

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/admin/users/route.ts` | ユーザー管理 | 移行必須 |
| `/api/admin/organizations/route.ts` | 組織管理 | 移行必須 |
| `/api/admin/alerts/route.ts` | アラート管理 | 移行必須 |
| `/api/admin/metrics/route.ts` | メトリクス | 移行必須 |
| `/api/admin/audit/route.ts` | 監査ログ | 移行必須 |
| `/api/admin/feature-management/route.ts` | 機能管理 | 移行必須 |
| `/api/admin/content-refresh/route.ts` | コンテンツ更新 | 移行必須 |
| `/api/admin/billing-links/route.ts` | 課金リンク | 移行必須 |
| `/api/admin/rate-limit-metrics/route.ts` | レート制限 | 移行必須 |
| `/api/admin/security-metrics/route.ts` | セキュリティ | 移行必須 |
| `/api/admin/upload-logo/route.ts` | ロゴアップロード | 移行必須 |
| `/api/admin/qna-stats/route.ts` | Q&A統計 | 移行必須 |

---

## 未移行（優先度: 中）

### `/api/*` - その他認証必須 API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/services/route.ts` | サービス一覧 | 移行必須 |
| `/api/questions/route.ts` | 質問管理 | 移行必須 |
| `/api/questions/[id]/route.ts` | 個別質問 | 移行必須 |
| `/api/questions/my/route.ts` | 自分の質問 | 移行必須 |
| `/api/questions/company/route.ts` | 会社質問 | 移行必須 |
| `/api/posts/route.ts` | 投稿一覧 | 移行必須 |
| `/api/posts/[id]/route.ts` | 個別投稿 | 移行必須 |
| `/api/partners/route.ts` | パートナー | 移行必須 |
| `/api/partners/[id]/route.ts` | 個別パートナー | 移行必須 |
| `/api/partners/dashboard/route.ts` | パートナーダッシュボード | 移行必須 |
| `/api/me/route.ts` | 自分の情報 | 移行必須 |
| `/api/me/admin-orgs/route.ts` | 管理組織 | 移行必須 |
| `/api/hearing-requests/route.ts` | ヒアリング | 移行必須 |
| `/api/faqs/route.ts` | FAQ | 移行必須 |
| `/api/cases/route.ts` | ケース | 移行必須 |
| `/api/extract/route.ts` | 抽出 | 移行必須 |
| `/api/extract/url/route.ts` | URL抽出 | 移行必須 |
| `/api/extract/pdf/route.ts` | PDF抽出 | 移行必須 |
| `/api/user/plan/route.ts` | プラン | 移行必須 |
| `/api/user/change-password/route.ts` | パスワード変更 | 移行必須 |
| `/api/upload/logo/route.ts` | ロゴアップロード | 移行必須 |
| `/api/ogp/generate/route.ts` | OGP生成 | 移行必須 |
| `/api/images/optimize/route.ts` | 画像最適化 | 移行必須 |
| `/api/interview/finalize/route.ts` | インタビュー完了 | 移行必須 |
| `/api/ai-interview-sessions/route.ts` | AIインタビュー | 移行必須 |
| `/api/materials/stats/route.ts` | 資料統計 | 移行必須 |
| `/api/qna/stats/route.ts` | Q&A統計 | 移行必須 |
| `/api/stripe/products/init/route.ts` | Stripe初期化 | 移行必須 |
| `/api/account/sessions/route.ts` | セッション管理 | 移行必須 |
| `/api/dashboard/stats/route.ts` | ダッシュボード統計 | 移行必須 |
| `/api/dashboard/case-studies-stats/route.ts` | 事例統計 | 移行必須 |
| `/api/batch/ai-monthly-report-generate/route.ts` | バッチ処理 | 移行必須 |

---

## 未移行（優先度: 低 - 公開APIまたは診断用）

### `/api/public/*` - 認証不要の公開 API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/public/services/route.ts` | 公開API | `createClient`使用可（認証不要） |
| `/api/public/faqs/route.ts` | 公開API | `createClient`使用可（認証不要） |
| `/api/public/case-studies/route.ts` | 公開API | `createClient`使用可（認証不要） |
| `/api/public/cms/route.ts` | 公開API | `createClient`使用可（認証不要） |
| `/api/public/active-checkout/route.ts` | 公開API | `createClient`使用可（認証不要） |
| `/api/qa/public/route.ts` | 公開API | `createClient`使用可（認証不要） |

### `/api/diag/*` - 診断用 API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/diag/cookies/route.ts` | 診断用 | 移行推奨 |
| `/api/diag/billing/route.ts` | 診断用 | 移行推奨 |
| `/api/diag/auth/route.ts` | 診断用 | 移行推奨 |

### `/api/health/*` - ヘルスチェック API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/health/deployment/route.ts` | ヘルスチェック | 移行推奨 |
| `/api/health/dashboard-probe/route.ts` | ヘルスチェック | 移行推奨 |

### `/api/ops/*` - 運用 API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/ops/status/route.ts` | 運用 | 移行推奨 |
| `/api/ops/site-settings/route.ts` | 運用 | 移行推奨 |
| `/api/ops/login_api/route.ts` | 運用 | 移行推奨 |

### `/api/monitor/*` - 監視 API

| ルート | 理由 | 対応方針 |
|--------|------|----------|
| `/api/monitor/route.ts` | 監視 | 移行推奨 |

---

## 検証コマンド

```bash
# 違反チェック
npm run check:api-auth

# 型チェック
npm run typecheck
```

---

## 移行手順

1. 対象ファイルを開く
2. import を変更:
   ```typescript
   // Before
   import { createClient } from '@/lib/supabase/server';
   import { getUserWithClient } from '@/lib/core/auth-state';

   // After
   import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
   ```
3. 認証処理を変更:
   ```typescript
   // Before
   const supabase = await createClient();
   const user = await getUserWithClient(supabase);
   if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

   // After
   const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);
   ```
4. すべてのレスポンスを `applyCookies()` でラップ:
   ```typescript
   return applyCookies(NextResponse.json({ data }, { status: 200 }));
   ```
5. エラーハンドリング:
   ```typescript
   } catch (error) {
     if (error instanceof ApiAuthException) {
       return error.toResponse();
     }
     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
   }
   ```

---

## 最終更新

- 日付: 2026-01-22
- 完了: 13 routes
- 未完了: 約 70 routes
