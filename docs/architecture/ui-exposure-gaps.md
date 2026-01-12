# UI Exposure Gaps（UI露出ギャップ分析）

> **正本**: このドキュメントは Product Surface と UI Reachability の差分を管理します。
> **作成日**: 2024-12-29
> **目的**: 「機能はあるがUIから触れない」状態の可視化と解消

---

## 概要

Product Surface Inventory と UI Reachability Inventory を突合し、
UIから到達できない機能を分類・管理します。

**分類:**
- **A) UI未露出**: 機能はあるが、UIから触れない
- **B) 導線が弱い**: 露出はあるが、深い場所/分かりにくい
- **C) 壊れている**: リンク切れ/権限判定ミス/404
- **D) 出さないのが正しい**: 内部/運用/危険/未完成

---

## 機械可読ブロック

<!-- UI_EXPOSURE_GAPS_START -->
```json
{
  "version": "1.0.0",
  "last_updated": "2024-12-29",
  "gaps": {
    "A_ui_unexposed": [
      {
        "route": "/dashboard/activity",
        "label": "アクティビティ",
        "area": "dashboard",
        "user_value": "high",
        "fix_effort": "low",
        "reason": "ユーザーのダッシュボード操作履歴を確認できるが、サイドバーに導線なし"
      },
      {
        "route": "/dashboard/reports",
        "label": "レポート",
        "area": "dashboard",
        "user_value": "high",
        "fix_effort": "low",
        "reason": "レポート機能はあるが、サイドバーに導線なし（AIレポートと別）"
      },
      {
        "route": "/dashboard/ai-citations",
        "label": "AI引用",
        "area": "dashboard",
        "user_value": "high",
        "fix_effort": "low",
        "reason": "AI引用トラッキング機能はあるが、サイドバーに導線なし"
      },
      {
        "route": "/dashboard/analytics/interview",
        "label": "インタビュー分析",
        "area": "dashboard",
        "user_value": "medium",
        "fix_effort": "low",
        "reason": "AIインタビューの分析画面、インタビューページからの導線のみ"
      },
      {
        "route": "/dashboard/company",
        "label": "会社情報",
        "area": "dashboard",
        "user_value": "medium",
        "fix_effort": "low",
        "reason": "会社情報編集ページ、設定ページからの導線を検討"
      },
      {
        "route": "/account/profile",
        "label": "プロフィール編集",
        "area": "account",
        "user_value": "high",
        "fix_effort": "low",
        "reason": "/accountには到達できるが、profile/security/notificationsへの導線がない"
      },
      {
        "route": "/account/security",
        "label": "セキュリティ設定",
        "area": "account",
        "user_value": "high",
        "fix_effort": "low",
        "reason": "パスワード変更など重要機能だが、/accountからの導線がない"
      },
      {
        "route": "/account/notifications",
        "label": "通知設定",
        "area": "account",
        "user_value": "medium",
        "fix_effort": "low",
        "reason": "通知設定ページ、/accountからの導線がない"
      }
    ],
    "B_weak_navigation": [
      {
        "route": "/dashboard/interview/history",
        "label": "インタビュー履歴",
        "area": "dashboard",
        "reason": "/dashboard/interview 内に導線はあるが、見つけにくい"
      },
      {
        "route": "/dashboard/manage/*",
        "label": "管理サブページ群",
        "area": "dashboard_admin",
        "reason": "/dashboard/manage のみ表示、各サブページへの導線は admin ページ内のみ"
      },
      {
        "route": "/dashboard/questions",
        "label": "質問管理",
        "area": "dashboard",
        "reason": "Q&A統計からは行けるが、直接の導線がない"
      },
      {
        "route": "/dashboard/my-questions",
        "label": "マイ質問",
        "area": "dashboard",
        "reason": "自分が投稿した質問一覧だが、導線が分かりにくい"
      }
    ],
    "C_broken": [],
    "D_intentionally_hidden": [
      {
        "route": "/dashboard/test-interview",
        "label": "テストインタビュー",
        "area": "dashboard",
        "reason": "開発/テスト用ページ、一般公開不要"
      },
      {
        "route": "/dashboard/services-info",
        "label": "サービス情報",
        "area": "dashboard",
        "reason": "内部参照用、公開ページからのリダイレクト先"
      },
      {
        "route": "/my/*",
        "label": "マイページ群",
        "area": "my",
        "reason": "レガシーまたは特定フロー用、dashboard経由で到達可能"
      },
      {
        "route": "/admin/*",
        "label": "管理者ページ群",
        "area": "admin",
        "reason": "サイト管理者専用、dashboard/adminとは別系統"
      },
      {
        "route": "/management-console/*",
        "label": "運用コンソール",
        "area": "management-console",
        "reason": "Ops認証必須、一般ユーザー向けではない"
      },
      {
        "route": "/ops/*",
        "label": "運用ページ",
        "area": "ops",
        "reason": "Ops認証必須"
      }
    ]
  },
  "priority_fixes": [
    {
      "rank": 1,
      "route": "/dashboard/activity",
      "action": "サイドバーに「アクティビティ」を追加",
      "impact": "操作履歴の可視化でユーザー体験向上"
    },
    {
      "rank": 2,
      "route": "/dashboard/ai-citations",
      "action": "サイドバーまたはAIレポート配下に「AI引用」を追加",
      "impact": "AI引用トラッキングへのアクセス改善"
    },
    {
      "rank": 3,
      "route": "/account/*",
      "action": "/accountページにプロフィール/セキュリティ/通知へのタブまたはリンクを追加",
      "impact": "アカウント設定の完全な到達性確保"
    },
    {
      "rank": 4,
      "route": "/dashboard/analytics/interview",
      "action": "分析レポート配下または分析メニューにインタビュー分析を追加",
      "impact": "インタビュー分析への直接アクセス"
    },
    {
      "rank": 5,
      "route": "/dashboard/reports",
      "action": "AIレポートとの整理またはサイドバー追加",
      "impact": "レポート機能の明確化"
    }
  ]
}
```
<!-- UI_EXPOSURE_GAPS_END -->

---

## ギャップサマリー

### A) UI未露出（8件）- 要対応

| Route | Label | User Value | Fix Effort |
|-------|-------|------------|------------|
| /dashboard/activity | アクティビティ | High | Low |
| /dashboard/reports | レポート | High | Low |
| /dashboard/ai-citations | AI引用 | High | Low |
| /dashboard/analytics/interview | インタビュー分析 | Medium | Low |
| /dashboard/company | 会社情報 | Medium | Low |
| /account/profile | プロフィール編集 | High | Low |
| /account/security | セキュリティ設定 | High | Low |
| /account/notifications | 通知設定 | Medium | Low |

### B) 導線が弱い（4件）- 改善検討

| Route | Label | Reason |
|-------|-------|--------|
| /dashboard/interview/history | インタビュー履歴 | インタビューページ内のみ |
| /dashboard/manage/* | 管理サブページ群 | adminトップからのみ |
| /dashboard/questions | 質問管理 | Q&A統計からのみ |
| /dashboard/my-questions | マイ質問 | 導線不明確 |

### C) 壊れている（0件）

現時点でリンク切れ/404は検出されていません。

### D) 出さないのが正しい（多数）

開発/テスト用、運用専用、レガシーページは意図的に非公開です。

---

## 優先修正リスト（Top 5）

| Rank | Route | Action | Impact |
|------|-------|--------|--------|
| 1 | /dashboard/activity | サイドバーに追加 | 操作履歴の可視化 |
| 2 | /dashboard/ai-citations | サイドバーまたはAIレポート配下に追加 | AI引用トラッキング |
| 3 | /account/* | タブ/リンク追加 | アカウント設定到達性 |
| 4 | /dashboard/analytics/interview | 分析配下に追加 | インタビュー分析直接アクセス |
| 5 | /dashboard/reports | 整理またはサイドバー追加 | レポート機能明確化 |

---

## 関連ドキュメント

- [Product Surface Inventory](./product-surface-inventory.md)
- [UI Reachability Inventory](./ui-reachability-inventory.md)
- [UI Semantic Contract](./ui-semantic-contract.md)
