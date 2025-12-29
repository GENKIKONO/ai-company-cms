# UI Reachability Inventory（到達可能性インベントリ）

> **正本**: このドキュメントはUI到達可能性監査の単一ソースです。
> **作成日**: 2024-12-29
> **CI連携**: E2Eテストがこのファイルを参照

---

## 概要

このドキュメントは、各エリアで「触れる状態」であるべきルートを機械可読形式で管理します。

**原則:**
- `must_reachable_routes`: 到達できないと致命的なルート
- `conditional_routes`: 権限で見える/見えないルート
- 新規ルート追加時はこのインベントリも更新

---

## 機械可読ブロック

<!-- UI_REACHABILITY_INVENTORY_START -->
```json
{
  "version": "1.1.0",
  "last_updated": "2024-12-29",
  "areas": [
    {
      "area": "dashboard",
      "description": "ダッシュボード領域（org_role権限）",
      "canonical_entry_points": [
        { "label": "サイドバー", "component": "DashboardSidebar", "testid": "dashboard-sidenav" },
        { "label": "モバイルドロワー", "component": "MobileDrawerLayout", "testid": "mobile-drawer" }
      ],
      "must_reachable_routes": [
        { "route": "/dashboard", "label": "ダッシュボード" },
        { "route": "/dashboard/activity", "label": "アクティビティ" },
        { "route": "/dashboard/posts", "label": "記事管理" },
        { "route": "/dashboard/services", "label": "サービス管理" },
        { "route": "/dashboard/case-studies", "label": "事例管理" },
        { "route": "/dashboard/faqs", "label": "FAQ管理" },
        { "route": "/dashboard/materials", "label": "営業資料" },
        { "route": "/dashboard/org-ai-chat", "label": "企業専用AIチャット" },
        { "route": "/dashboard/interview", "label": "AIインタビュー" },
        { "route": "/dashboard/qna-stats", "label": "Q&A統計" },
        { "route": "/dashboard/analytics/ai-seo-report", "label": "分析レポート" },
        { "route": "/dashboard/ai-reports", "label": "AIレポート" },
        { "route": "/dashboard/ai-citations", "label": "AI引用" },
        { "route": "/dashboard/embed", "label": "埋め込み設定" },
        { "route": "/dashboard/billing", "label": "請求管理" },
        { "route": "/dashboard/help", "label": "ヘルプ" },
        { "route": "/dashboard/settings", "label": "設定" }
      ],
      "conditional_routes": [
        { "route": "/dashboard/admin", "label": "管理", "condition": "isSiteAdmin" }
      ]
    },
    {
      "area": "account",
      "description": "アカウント領域（user_id権限）",
      "canonical_entry_points": [
        { "label": "サイドバーリンク", "component": "DashboardSidebar", "testid": "dashboard-sidenav" }
      ],
      "must_reachable_routes": [
        { "route": "/account", "label": "アカウント" }
      ],
      "conditional_routes": []
    },
    {
      "area": "admin",
      "description": "管理者領域（site_admin権限）",
      "canonical_entry_points": [
        { "label": "管理リンク", "component": "DashboardSidebar", "testid": "dashboard-sidenav" }
      ],
      "must_reachable_routes": [],
      "conditional_routes": [
        { "route": "/admin", "label": "Admin Top", "condition": "isSiteAdmin" },
        { "route": "/admin/cms", "label": "CMS管理", "condition": "isSiteAdmin" },
        { "route": "/admin/console", "label": "運用コンソール", "condition": "isSuperAdmin" }
      ]
    },
    {
      "area": "management-console",
      "description": "運用管理コンソール（ops認証）",
      "canonical_entry_points": [
        { "label": "ops認証後", "component": "ManagementConsoleLayout", "testid": "management-console" }
      ],
      "must_reachable_routes": [],
      "conditional_routes": [
        { "route": "/management-console", "label": "運用コンソール", "condition": "opsAuth" },
        { "route": "/management-console/users", "label": "ユーザー管理", "condition": "opsAuth" },
        { "route": "/management-console/reports", "label": "レポート", "condition": "opsAuth" }
      ]
    }
  ]
}
```
<!-- UI_REACHABILITY_INVENTORY_END -->

---

## エリア別サマリー

### Dashboard (必須: 17ルート, 条件付き: 1ルート)

| ルート | ラベル | 導線 |
|--------|--------|------|
| /dashboard | ダッシュボード | サイドバー |
| /dashboard/activity | アクティビティ | サイドバー |
| /dashboard/posts | 記事管理 | サイドバー |
| /dashboard/services | サービス管理 | サイドバー |
| /dashboard/case-studies | 事例管理 | サイドバー |
| /dashboard/faqs | FAQ管理 | サイドバー |
| /dashboard/materials | 営業資料 | サイドバー |
| /dashboard/org-ai-chat | 企業専用AIチャット | サイドバー |
| /dashboard/interview | AIインタビュー | サイドバー |
| /dashboard/qna-stats | Q&A統計 | サイドバー |
| /dashboard/analytics/ai-seo-report | 分析レポート | サイドバー |
| /dashboard/ai-reports | AIレポート | サイドバー |
| /dashboard/ai-citations | AI引用 | サイドバー |
| /dashboard/embed | 埋め込み設定 | サイドバー |
| /dashboard/billing | 請求管理 | サイドバー |
| /dashboard/help | ヘルプ | サイドバー |
| /dashboard/settings | 設定 | サイドバー |
| /dashboard/admin | 管理 | **条件付き（isSiteAdmin）** |

### Account (必須: 1ルート)

| ルート | ラベル | 導線 |
|--------|--------|------|
| /account | アカウント | サイドバー |

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-29 | PR10: アクティビティ、AI引用を必須ルートに追加 |
| 2024-12-29 | PR9 で新規作成 |
