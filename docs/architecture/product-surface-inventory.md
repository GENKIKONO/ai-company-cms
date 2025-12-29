# Product Surface Inventory（機能表面インベントリ）

> **正本**: このドキュメントはプロダクト機能のソース一覧です。
> **作成日**: 2024-12-29
> **目的**: UI Reachability との突合により「機能はあるがUIから触れない」状態を検出

---

## 概要

このドキュメントは、プロダクトの「真実のソース」を機械可読形式で管理します。

**正本の種類:**
- `features`: featureGate で管理される機能フラグ
- `routes`: 実際に存在するページルート (page.tsx)
- `api_routes`: API エンドポイント (route.ts)
- `db_entities`: コアなDBエンティティ

---

## 機械可読ブロック

<!-- PRODUCT_SURFACE_INVENTORY_START -->
```json
{
  "version": "1.0.0",
  "last_updated": "2024-12-29",
  "features": [
    { "key": "services", "description": "サービス管理", "has_limit": true },
    { "key": "qa_items", "description": "Q&Aアイテム", "has_limit": true },
    { "key": "case_studies", "description": "事例管理", "has_limit": true },
    { "key": "faqs", "description": "FAQ管理", "has_limit": true },
    { "key": "posts", "description": "記事管理", "has_limit": true },
    { "key": "materials", "description": "営業資料", "has_limit": true },
    { "key": "embeds", "description": "埋め込み設定", "has_limit": true },
    { "key": "verified_badge", "description": "認証バッジ", "has_limit": false },
    { "key": "ai_reports", "description": "AIレポート", "has_limit": false },
    { "key": "system_monitoring", "description": "システム監視", "has_limit": false },
    { "key": "ai_interview", "description": "AIインタビュー", "has_limit": true },
    { "key": "org_ai_chat", "description": "企業専用AIチャット", "has_limit": true }
  ],
  "routes": {
    "dashboard": [
      { "route": "/dashboard", "label": "ダッシュボード", "in_sidebar": true },
      { "route": "/dashboard/posts", "label": "記事管理", "in_sidebar": true },
      { "route": "/dashboard/posts/new", "label": "新規記事作成", "in_sidebar": false },
      { "route": "/dashboard/services", "label": "サービス管理", "in_sidebar": true },
      { "route": "/dashboard/services/new", "label": "新規サービス作成", "in_sidebar": false },
      { "route": "/dashboard/services/[id]/edit", "label": "サービス編集", "in_sidebar": false },
      { "route": "/dashboard/case-studies", "label": "事例管理", "in_sidebar": true },
      { "route": "/dashboard/case-studies/new", "label": "新規事例作成", "in_sidebar": false },
      { "route": "/dashboard/faqs", "label": "FAQ管理", "in_sidebar": true },
      { "route": "/dashboard/faqs/new", "label": "新規FAQ作成", "in_sidebar": false },
      { "route": "/dashboard/materials", "label": "営業資料", "in_sidebar": true },
      { "route": "/dashboard/materials/[id]", "label": "資料詳細", "in_sidebar": false },
      { "route": "/dashboard/org-ai-chat", "label": "企業専用AIチャット", "in_sidebar": true },
      { "route": "/dashboard/interview", "label": "AIインタビュー", "in_sidebar": true },
      { "route": "/dashboard/interview/history", "label": "インタビュー履歴", "in_sidebar": false },
      { "route": "/dashboard/interview/[sessionId]", "label": "インタビューセッション", "in_sidebar": false },
      { "route": "/dashboard/test-interview", "label": "テストインタビュー", "in_sidebar": false },
      { "route": "/dashboard/qna-stats", "label": "Q&A統計", "in_sidebar": true },
      { "route": "/dashboard/my-questions", "label": "マイ質問", "in_sidebar": false },
      { "route": "/dashboard/questions", "label": "質問管理", "in_sidebar": false },
      { "route": "/dashboard/analytics", "label": "分析", "in_sidebar": false },
      { "route": "/dashboard/analytics/ai-seo-report", "label": "分析レポート", "in_sidebar": true },
      { "route": "/dashboard/analytics/interview", "label": "インタビュー分析", "in_sidebar": false },
      { "route": "/dashboard/ai-reports", "label": "AIレポート", "in_sidebar": true },
      { "route": "/dashboard/ai-reports/[period]", "label": "期間別AIレポート", "in_sidebar": false },
      { "route": "/dashboard/ai-citations", "label": "AI引用", "in_sidebar": false },
      { "route": "/dashboard/reports", "label": "レポート", "in_sidebar": false },
      { "route": "/dashboard/embed", "label": "埋め込み設定", "in_sidebar": true },
      { "route": "/dashboard/billing", "label": "請求管理", "in_sidebar": true },
      { "route": "/dashboard/billing/new-session", "label": "新規セッション", "in_sidebar": false },
      { "route": "/dashboard/help", "label": "ヘルプ", "in_sidebar": true },
      { "route": "/dashboard/settings", "label": "設定", "in_sidebar": true },
      { "route": "/dashboard/activity", "label": "アクティビティ", "in_sidebar": false },
      { "route": "/dashboard/company", "label": "会社情報", "in_sidebar": false },
      { "route": "/dashboard/services-info", "label": "サービス情報", "in_sidebar": false }
    ],
    "dashboard_admin": [
      { "route": "/dashboard/admin", "label": "管理", "in_sidebar": true, "condition": "isSiteAdmin" },
      { "route": "/dashboard/admin/contents", "label": "コンテンツ管理", "in_sidebar": false },
      { "route": "/dashboard/admin/billing-links", "label": "請求リンク", "in_sidebar": false },
      { "route": "/dashboard/admin/ai-usage", "label": "AI使用量", "in_sidebar": false },
      { "route": "/dashboard/admin/jobs", "label": "ジョブ管理", "in_sidebar": false },
      { "route": "/dashboard/admin/storage-logs", "label": "ストレージログ", "in_sidebar": false },
      { "route": "/dashboard/admin/ai-visibility", "label": "AI可視性", "in_sidebar": false },
      { "route": "/dashboard/admin/alerts", "label": "アラート", "in_sidebar": false },
      { "route": "/dashboard/admin/org-groups", "label": "組織グループ", "in_sidebar": false },
      { "route": "/dashboard/admin/security", "label": "セキュリティ", "in_sidebar": false },
      { "route": "/dashboard/admin/audit", "label": "監査ログ", "in_sidebar": false }
    ],
    "account": [
      { "route": "/account", "label": "アカウント", "in_sidebar": true },
      { "route": "/account/profile", "label": "プロフィール", "in_sidebar": false },
      { "route": "/account/security", "label": "セキュリティ", "in_sidebar": false },
      { "route": "/account/notifications", "label": "通知設定", "in_sidebar": false }
    ],
    "admin": [
      { "route": "/admin", "label": "Admin Top", "condition": "isSiteAdmin" },
      { "route": "/admin/cms", "label": "CMS管理", "condition": "isSiteAdmin" },
      { "route": "/admin/news", "label": "ニュース管理", "condition": "isSiteAdmin" },
      { "route": "/admin/billing", "label": "請求管理", "condition": "isSiteAdmin" },
      { "route": "/admin/db-inventory", "label": "DBインベントリ", "condition": "isSiteAdmin" },
      { "route": "/admin/feature-management", "label": "機能管理", "condition": "isSiteAdmin" },
      { "route": "/admin/schema-diff", "label": "スキーマ差分", "condition": "isSiteAdmin" },
      { "route": "/admin/enforcement", "label": "強制措置", "condition": "isSiteAdmin" },
      { "route": "/admin/questions", "label": "質問管理", "condition": "isSiteAdmin" },
      { "route": "/admin/material-stats", "label": "資料統計", "condition": "isSiteAdmin" },
      { "route": "/admin/qna-stats", "label": "QnA統計", "condition": "isSiteAdmin" },
      { "route": "/admin/ai-visibility", "label": "AI可視性", "condition": "isSiteAdmin" },
      { "route": "/admin/org-groups/join", "label": "組織グループ参加", "condition": "isSiteAdmin" },
      { "route": "/admin/org-groups/[groupId]", "label": "組織グループ詳細", "condition": "isSiteAdmin" }
    ],
    "management_console": [
      { "route": "/management-console", "label": "運用コンソール", "condition": "opsAuth" },
      { "route": "/management-console/embed-dashboard", "label": "埋め込みダッシュボード", "condition": "opsAuth" },
      { "route": "/management-console/settings", "label": "設定", "condition": "opsAuth" },
      { "route": "/management-console/security", "label": "セキュリティ", "condition": "opsAuth" }
    ],
    "ops": [
      { "route": "/ops/login", "label": "Opsログイン" },
      { "route": "/ops/analytics", "label": "分析", "condition": "opsAuth" },
      { "route": "/ops/site", "label": "サイト設定", "condition": "opsAuth" },
      { "route": "/ops/monitor", "label": "モニター", "condition": "opsAuth" }
    ],
    "public": [
      { "route": "/", "label": "トップ" },
      { "route": "/about", "label": "About" },
      { "route": "/pricing", "label": "料金" },
      { "route": "/features", "label": "機能" },
      { "route": "/terms", "label": "利用規約" },
      { "route": "/privacy", "label": "プライバシーポリシー" },
      { "route": "/security", "label": "セキュリティ" },
      { "route": "/docs", "label": "ドキュメント" },
      { "route": "/news", "label": "ニュース" },
      { "route": "/support", "label": "サポート" },
      { "route": "/status", "label": "ステータス" },
      { "route": "/search", "label": "検索" },
      { "route": "/login", "label": "ログイン" },
      { "route": "/service", "label": "サービス紹介" },
      { "route": "/aio", "label": "AIO紹介" },
      { "route": "/hearing-service", "label": "ヒアリングサービス" },
      { "route": "/qna/ask", "label": "質問投稿" },
      { "route": "/o/[slug]", "label": "企業ページ" },
      { "route": "/faqs/[slug]", "label": "FAQ詳細" },
      { "route": "/organizations/new", "label": "組織作成" },
      { "route": "/organizations/[id]", "label": "組織詳細" },
      { "route": "/agency", "label": "代理店" },
      { "route": "/agency/[agencyId]/clients", "label": "代理店クライアント" }
    ],
    "my": [
      { "route": "/my/faqs", "label": "マイFAQ" },
      { "route": "/my/faqs/new", "label": "FAQ新規作成" },
      { "route": "/my/faqs/[id]/edit", "label": "FAQ編集" },
      { "route": "/my/reports", "label": "マイレポート" },
      { "route": "/my/ai-interviewer/service", "label": "AIインタビューサービス" }
    ]
  },
  "api_routes": {
    "core": [
      "/api/health",
      "/api/contact",
      "/api/organizations",
      "/api/posts",
      "/api/posts/[id]",
      "/api/services",
      "/api/faqs",
      "/api/cases",
      "/api/questions",
      "/api/questions/[id]",
      "/api/questions/company",
      "/api/questions/my",
      "/api/materials/stats",
      "/api/hearing-requests",
      "/api/user/plan",
      "/api/user/change-password",
      "/api/me"
    ],
    "my": [
      "/api/my/organization",
      "/api/my/organization/publish",
      "/api/my/posts",
      "/api/my/posts/[id]",
      "/api/my/services",
      "/api/my/services/[id]",
      "/api/my/case-studies",
      "/api/my/case-studies/[id]",
      "/api/my/faqs",
      "/api/my/faqs/[id]",
      "/api/my/materials",
      "/api/my/materials/[id]",
      "/api/my/materials/[id]/download",
      "/api/my/qa/entries",
      "/api/my/qa/entries/[id]",
      "/api/my/qa/categories",
      "/api/my/qa/categories/[id]",
      "/api/my/qa/search",
      "/api/my/qna-stats",
      "/api/my/qna-stats/export",
      "/api/my/org-docs/chat",
      "/api/my/org-docs/files",
      "/api/my/interview/quota",
      "/api/my/interview/sessions",
      "/api/my/reports",
      "/api/my/reports/monthly",
      "/api/my/reports/monthly/[period]",
      "/api/my/reports/monthly/[period]/regenerate",
      "/api/my/ai-citations",
      "/api/my/features/ai-reports",
      "/api/my/features/system-monitoring"
    ],
    "admin": [
      "/api/admin/users",
      "/api/admin/users/[id]/details",
      "/api/admin/organizations",
      "/api/admin/contacts",
      "/api/admin/my-organizations",
      "/api/admin/cms/sections",
      "/api/admin/cms/assets",
      "/api/admin/cms/site-settings",
      "/api/admin/reviews",
      "/api/admin/reviews/history",
      "/api/admin/reviews/reopen",
      "/api/admin/translations",
      "/api/admin/translations/bulk",
      "/api/admin/translations/analytics",
      "/api/admin/feature-management",
      "/api/admin/feature-management/overrides",
      "/api/admin/content-refresh",
      "/api/admin/content-refresh/kpi",
      "/api/admin/embeddings",
      "/api/admin/embeddings/jobs",
      "/api/admin/embeddings/metrics",
      "/api/admin/org-groups",
      "/api/admin/org-groups/[groupId]",
      "/api/admin/org-groups/join-requests",
      "/api/admin/alerts",
      "/api/admin/alerts/[id]",
      "/api/admin/alerts/rules/[id]",
      "/api/admin/alerts/dashboard",
      "/api/admin/audit",
      "/api/admin/metrics",
      "/api/admin/system/health",
      "/api/admin/schema-diff/recent",
      "/api/admin/schema-diff/stats",
      "/api/admin/billing-links",
      "/api/admin/qna-stats",
      "/api/admin/material-stats",
      "/api/admin/ai-visibility/latest",
      "/api/admin/ai-visibility/run"
    ],
    "dashboard": [
      "/api/dashboard/stats",
      "/api/dashboard/activities",
      "/api/dashboard/case-studies-stats",
      "/api/dashboard/export"
    ],
    "public": [
      "/api/public/organizations",
      "/api/public/organizations/summary",
      "/api/public/organizations/[slug]",
      "/api/public/services",
      "/api/public/faqs",
      "/api/public/case-studies",
      "/api/public/stats",
      "/api/public/sitemap",
      "/api/public/cms",
      "/api/public/embed/[slug]/iframe",
      "/api/public/embed/[slug]/widget",
      "/api/public/o/[slug]/posts/[postId]"
    ],
    "ops": [
      "/api/ops/login_api",
      "/api/ops/logout_api",
      "/api/ops/status",
      "/api/ops/site-settings",
      "/api/ops/monitoring/health",
      "/api/ops/monitoring/alerts"
    ]
  },
  "db_entities": {
    "core": [
      { "table": "organizations", "description": "組織" },
      { "table": "services", "description": "サービス" },
      { "table": "case_studies", "description": "事例" },
      { "table": "faqs", "description": "FAQ" },
      { "table": "posts", "description": "記事" },
      { "table": "materials", "description": "営業資料" },
      { "table": "user_profiles", "description": "ユーザープロフィール" },
      { "table": "org_memberships", "description": "組織メンバーシップ" }
    ],
    "ai": [
      { "table": "ai_queries", "description": "AIクエリ" },
      { "table": "ai_answers", "description": "AI回答" },
      { "table": "ai_feedback", "description": "AIフィードバック" },
      { "table": "ai_visibility_scores", "description": "AI可視性スコア" },
      { "table": "ai_interview_sessions", "description": "AIインタビューセッション" }
    ],
    "reports": [
      { "table": "monthly_report_sections", "description": "月次レポートセクション" },
      { "table": "monthly_report_jobs", "description": "月次レポートジョブ" }
    ],
    "billing": [
      { "table": "products", "description": "プロダクト/プラン" },
      { "table": "subscriptions", "description": "サブスクリプション" },
      { "table": "billing_links", "description": "請求リンク" }
    ],
    "security": [
      { "table": "audit_logs", "description": "監査ログ" },
      { "table": "rate_limit_logs", "description": "レート制限ログ" },
      { "table": "blocked_ips", "description": "ブロックIP" },
      { "table": "organization_verifications", "description": "組織認証" }
    ]
  }
}
```
<!-- PRODUCT_SURFACE_INVENTORY_END -->

---

## サマリー

### Features (12件)
| Key | Description | Has Limit |
|-----|-------------|-----------|
| services | サービス管理 | ✓ |
| qa_items | Q&Aアイテム | ✓ |
| case_studies | 事例管理 | ✓ |
| faqs | FAQ管理 | ✓ |
| posts | 記事管理 | ✓ |
| materials | 営業資料 | ✓ |
| embeds | 埋め込み設定 | ✓ |
| verified_badge | 認証バッジ | |
| ai_reports | AIレポート | |
| system_monitoring | システム監視 | |
| ai_interview | AIインタビュー | ✓ |
| org_ai_chat | 企業専用AIチャット | ✓ |

### Routes Summary

| Area | Total | In Sidebar | Hidden |
|------|-------|------------|--------|
| Dashboard | 35 | 15 | 20 |
| Dashboard Admin | 11 | 1 | 10 |
| Account | 4 | 1 | 3 |
| Admin | 14 | 0 | 14 |
| Management Console | 4 | 0 | 4 |
| Ops | 4 | 0 | 4 |
| Public | 20 | - | - |
| My | 5 | 0 | 5 |

---

## 関連ドキュメント

- [UI Reachability Inventory](./ui-reachability-inventory.md)
- [UI Exposure Gaps](./ui-exposure-gaps.md)
- [Core Architecture](../core-architecture.md)
