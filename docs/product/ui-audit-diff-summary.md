# UI Audit Diff Summary（差分集計）

> **目的**: 数の集計のみ。評価・判断は含まない。
> **作成日**: 2024-12-29
> **参照元**: ui-reachability-inventory.md, product-surface-inventory.md, ui-exposure-gaps.md

---

## 集計結果

### UI Reachability Inventory

| Area | must_reachable | conditional | Total |
|------|----------------|-------------|-------|
| dashboard | 17 | 1 | 18 |
| account | 1 | 0 | 1 |
| admin | 0 | 3 | 3 |
| management-console | 0 | 3 | 3 |
| **Total** | **18** | **7** | **25** |

### Product Surface Inventory

| Area | Total Routes | in_sidebar=true | in_sidebar=false |
|------|--------------|-----------------|------------------|
| dashboard | 35 | 15 | 20 |
| dashboard_admin | 11 | 1 | 10 |
| account | 4 | 1 | 3 |
| admin | 14 | 0 | 14 |
| management_console | 4 | 0 | 4 |
| ops | 4 | 0 | 4 |
| public | 20 | - | - |
| my | 5 | 0 | 5 |
| **Total** | **97** | **17** | **60** |

### UI Exposure Gaps

| Category | Count |
|----------|-------|
| A_ui_unexposed | 8 |
| B_weak_navigation | 4 |
| C_broken | 0 |
| D_intentionally_hidden | 6 |
| **Total Gaps** | **18** |

---

## 差分（数値のみ）

| Metric | Value |
|--------|-------|
| Product Surface Total Routes | 97 |
| UI Reachability Total | 25 |
| Difference | 72 |
| Gaps Documented | 18 |
| Undocumented Difference | 54 |

---

## 備考

- この文書は数の集計のみを行う
- 評価・判断・推奨事項は含まない
- 人間が判断するための数値提供のみ
