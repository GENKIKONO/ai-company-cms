# UI Semantic Contract（意味論的UI契約）

> **正本**: このドキュメントはUI色の意味論的使用の単一ソースです。
> **作成日**: 2024-12-29
> **CI連携**: Check 15 がblue-*パターンを監視

---

## 概要

UIの色は「意味」を持つ。色の直書き（`text-blue-600`等）ではなく、
意味に基づいたCSS変数とコンポーネントを使用することで、一貫性と保守性を確保する。

---

## Variant定義表

| Variant | 用途 | CSS変数 |
|---------|------|---------|
| **primary** | メインアクション、ブランド強調 | `--aio-primary`, `--aio-primary-hover` |
| **info** | 情報提示、ニュートラルな通知 | `--aio-info`, `--aio-info-muted`, `--aio-info-surface`, `--aio-info-border` |
| **success** | 成功、完了、肯定的状態 | `--aio-success`, `--aio-success-muted` |
| **warning** | 注意、警告（非破壊的） | `--aio-warning`, `--aio-warning-muted` |
| **danger** | エラー、危険、破壊的操作 | `--aio-danger`, `--aio-danger-muted` |
| **neutral** | デフォルト、無色の状態 | `--aio-muted` + gray系 |

---

## 正規コンポーネント

### SemanticBadge

ステータス表示用のバッジ。

```tsx
import { SemanticBadge } from '@/components/ui/SemanticBadge';

<SemanticBadge variant="info">進行中</SemanticBadge>
<SemanticBadge variant="success">完了</SemanticBadge>
<SemanticBadge variant="warning">注意</SemanticBadge>
<SemanticBadge variant="danger">エラー</SemanticBadge>
```

### SemanticAlert

情報ボックス/アラート表示用。

```tsx
import { SemanticAlert } from '@/components/ui/SemanticAlert';

<SemanticAlert variant="info">
  情報メッセージ
</SemanticAlert>
```

---

## 置換ガイドライン

### Before → After

| Before (NG) | After (OK) | 理由 |
|-------------|------------|------|
| `text-blue-600 bg-blue-50` | `<SemanticBadge variant="info">` | ステータス表示 |
| `bg-blue-50 border-blue-200` | `<SemanticAlert variant="info">` | 情報ボックス |
| `bg-blue-600 hover:bg-blue-700` | `bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)]` | プライマリボタン |
| `text-blue-600` (リンク) | `text-[var(--aio-primary)]` | リンク色 |

### 例外（触らない）

以下は例外として維持：

- **chart**: データ可視化（`bg-blue-400/500`等）- 視覚的な一貫性が必要
- **decorative**: グラデーション装飾 - デザイン意図が明確
- **partners**: パートナーページブランドカラー - ブランドガイドライン

---

## UI Reachability Contract（"触れる状態"の定義）

> **PR9 で追加**: 2024-12-29

### 定義

「触れる状態」とは、ユーザーがUIから機能に到達できる状態を指す：

| 条件 | 説明 |
|------|------|
| **導線の存在** | サイドバー/ヘッダー/フッター/ページ内CTAのいずれかで到達できる |
| **URL直打ち不可** | URL直打ちだけでしか行けない機能は"触れる状態"ではない |
| **モバイル対応** | モバイルでも導線が存在する（ドロワー/ハンバーガーメニュー等） |
| **権限による表示制御** | 権限で見える/見えないは許容（DOMに出ないのは正常） |

### Shell別の最低保証

| Shell | 最低保証 |
|-------|----------|
| **(public)** | Header/Footerが必ずある、MobileDrawerで到達可能 |
| **dashboard** | Sidebar（PC）/ Drawer（モバイル）が必ずある |
| **account** | UserShellの導線がある（戻るだけは要注意） |
| **admin** | AdminPageShell経由、site_admin権限が必要 |
| **management-console** | ops認証後のみアクセス可能 |
| **ops** | ops認証が必要 |

### 検証基準

1. **PC**: サイドバーにラベルが表示され、クリックで遷移できる
2. **モバイル**: ハンバーガー→ドロワーに同じラベルが表示される
3. **権限制御**: adminリンクはadmin権限時のみDOMに存在する

---

## 関連ドキュメント

- [デザイントークン](../../src/styles/app-design-tokens.css)
- [例外許容リスト](./exceptions-allowlist.md)
- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)
- [UI Reachability Inventory](./ui-reachability-inventory.md)
