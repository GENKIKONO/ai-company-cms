---
title: "AIOHub UI Design System Guide"
version: "1.0"
status: "Production Ready"
lastUpdated: "2025-01-25"
nextReview: "2025-04-25"
---

# AIOHub UI Design System Guide

> **Version**: 1.0 (Post Phase 3)  
> **Target**: Frontend Development Team  
> **Last Updated**: 2025-01-25

## 1. Design System Overview

### AIOHub UI System の位置づけ

AIOHub UI Systemは、Apple Human Interface Guidelines (HIG) を基盤とした統一デザインシステムです。Phase 1-3を通じて、従来の複数デザインシステムから **HIG Design Tokens** を唯一のソースオブトゥルースとする統合アーキテクチャに移行しました。

### 3つの基本原則

**Simple（シンプル）**
- 必要最小限のコンポーネントセットで表現
- 認知負荷を下げる一貫したパターン

**Consistent（一貫性）**
- 全画面で統一されたスペーシング（8pt grid）
- 予測可能なインタラクション動作

**Accessible（アクセシブル）**
- WCAG 2.1 AA準拠のコントラスト比
- 44px最小タップ領域の保証

### 現在の統合状態

- **HIGButton**: 統一されたCTAとインタラクション（5 variants）
- **HIGCard**: 構造化されたコンテンツ表示（Title/Content/Description）
- **HIGLayout**: レスポンシブレイアウト（Container/Section/Grid/Stack）
- **HIGIcons**: アクセシブルなアイコンシステム
- **HIG Design Tokens**: 色・余白・タイポグラフィの一元管理

## 2. Design Tokens Reference

### トークンカテゴリと使用原則

**Color Tokens**
```css
/* 主要カラー */
--color-primary: #2563eb
--color-text-primary: #111827
--color-background-primary: #ffffff

/* 使用例 */
className="text-[var(--color-primary)]"
```

**Spacing Tokens（8pt Grid準拠）**
```css
--spacing-xs: 0.5rem    /* 8px */
--spacing-sm: 1rem      /* 16px */
--spacing-md: 1.5rem    /* 24px */
--spacing-lg: 2rem      /* 32px */
--spacing-xl: 3rem      /* 48px */
--spacing-2xl: 4rem     /* 64px */
```

**Typography Tokens**
```css
--font-size-body: 1rem
--font-size-h3: 1.25rem
--line-height-relaxed: 1.625
```

### 命名規則と推奨使用

- **BEM準拠プレフィックス**: `hig-*` （例: `hig-jp-heading`）
- **セマンティック命名**: 色名ではなく用途で命名（`--color-error` not `--color-red-500`）
- **レスポンシブ対応**: mobile-first指定（`sm:`, `md:`, `lg:`）

### 禁止事項

❌ **直接px値指定**: `margin: 24px` → ⭕ `margin: var(--spacing-md)`  
❌ **カスタムカラー**: `#ff0000` → ⭕ `var(--color-error)`  
❌ **!important濫用**: CSSスペシフィシティで解決

## 3. Component Guidelines

### HIGButton

**設計哲学**: Appleエコシステムと同等の触感とフィードバック

**Variants**:
- `primary`: 主要アクション（1画面1個まで）
- `secondary`: 補助アクション
- `tertiary`: テキストリンク的用途
- `danger`: 削除・破壊的操作
- `ghost`: サブメニュー・ナビゲーション

**State管理**: `loading`, `disabled` プロパティでアクセシブルな状態表示

```tsx
<HIGButton variant="primary" size="lg" loading={isSubmitting}>
  保存する
</HIGButton>
```

**誤用例**:
- 1画面内のprimary複数使用
- サイズ不統一（44px未満のボタン）

### HIGCard

**設計哲学**: 情報の階層化と走査性の向上

**推奨構成**:
```tsx
<HIGCard variant="default" padding="md">
  <HIGCardTitle level={3}>見出し</HIGCardTitle>
  <HIGCardContent>
    <p>説明文...</p>
  </HIGCardContent>
</HIGCard>
```

**誤用例**:
- HIGCardTitle無しの平坦なコンテンツ
- padding値の不統一

### HIGLayout

**Container**: 横幅とセーフエリア管理
- `size="xl"`: 1280px（通常ページ）
- `size="full"`: 画面幅一杯（ヒーローセクション）

**Section**: 垂直方向のセクション区切り
- `spacing="xl"`: 64px/96px（デスクトップ/モバイル）

**Grid/Stack**: コンテンツ配置
- `HIGGrid columns={3}`: 均等グリッド
- `HIGStack direction="vertical" spacing="md"`: 垂直スタック

### HIGIcons

**サイズルール**:
- Button内: `w-5 h-5` (20px)
- Card内: `w-6 h-6` (24px)  
- Hero: `w-8 h-8` (32px)

**コントラスト**: 背景とのコントラスト比4.5:1以上維持

## 4. Accessibility Checklist (A11y)

### 必須確認項目

**タップ領域**
- ✅ 最小44px x 44px確保（HIGButton標準準拠）
- ✅ モバイルでの指タップ精度確認

**キーボードナビゲーション**
- ✅ Tab順序の論理性
- ✅ フォーカスインジケーター可視性（2px outline）
- ✅ Enter/Spaceでの操作完了

**コントラスト比（WCAG 2.1 AA）**
- ✅ 通常テキスト: 4.5:1以上
- ✅ 大きなテキスト: 3:1以上
- ✅ 非テキスト要素: 3:1以上

### 自動/手動検証ツール

**CI統合推奨**:
- axe-core（自動A11y検証）
- Playwright Visual Testing（視覚回帰）
- eslint-plugin-jsx-a11y（開発時）

**手動確認**:
- VoiceOverでの読み上げ
- キーボードのみ操作
- 色覚特性シミュレーション

### 注意すべき破綻パターン

❌ **意味のないaria-label**: `aria-label="ボタン"`  
❌ **color-only情報伝達**: エラー状態を赤色のみで表現  
❌ **フォーカストラップ無効**: モーダル内からのTab escape

## 5. Typography & Language Rules

### 日本語組版

**推奨text-wrap設定**:
- **見出し**: `text-wrap: balance`（行長の均等化）
- **本文**: `text-wrap: pretty`（孤立行防止）

```css
.hig-jp-heading { text-wrap: balance; }
.hig-jp-body { text-wrap: pretty; }
```

**行間ルール**:
- 見出し: `line-height: 1.4`
- 本文: `line-height: 1.6`
- 注釈: `line-height: 1.5`

### 英日併記時の指針

- **括弧表記**: 日本語（English）形式で統一
- **比率**: 日本語主体、英語は補完的位置づけ
- **改行**: 言語混在行での自然な折り返し優先

### アクセントと強調

**推奨パターン**:
- 強調: `font-weight: 600`（semibold）
- アクセント: `color: var(--color-primary)`
- 重要情報: 太字+色変更の組み合わせ

**制約**:
- 1段落内の強調は3箇所まで
- アクセントカラーの過用回避

## 6. Code Conventions

### 命名規則

**Props命名**:
```tsx
// 推奨
<HIGButton variant="primary" size="lg" />

// 非推奨  
<HIGButton type="blue" btnSize="large" />
```

**CSSクラス命名**:
```css
/* HIG準拠 */
.hig-jp-heading { }
.hig-space-stack-lg { }

/* レガシー（使用禁止） */
.btn-unified { }
.highlights-custom { }
```

### Import順序

```tsx
// 1. React/Next.js
import React from 'react';
import Link from 'next/link';

// 2. サードパーティ
import { Icons } from 'lucide-react';

// 3. HIG Components（Layout → UI順）
import { HIGContainer, HIGSection } from '@/components/layout/HIGLayout';
import { HIGButton, HIGCard } from '@/components/ui';

// 4. プロジェクト固有
import { CustomHook } from '@/hooks';
```

### 禁止パターン

❌ **インラインスタイル**: `style={{ margin: '24px' }}`  
❌ **複合!important**: `margin: 24px !important; padding: 16px !important;`  
❌ **直接DOM操作**: `document.getElementById().style.display`

## 7. Change Control & Governance

### Design Token変更フロー

1. **提案**: GitHub Issue with `design-token` label
2. **影響調査**: 使用箇所grep + visual regression test
3. **承認**: Frontend Lead review
4. **実装**: Pull Request with evidence
5. **検証**: CI通過 + manual A11y check

### コンポーネント拡張提案

**新規variant追加**:
- 既存5 variantで解決不可の証明
- Apple HIG準拠の根拠提示
- A11y impact assessment

**新規コンポーネント**:
- 既存HIGコンポーネント組み合わせでの解決困難性
- 3回以上の再利用見込み
- TypeScript型定義完備

### Pull Request テンプレート

```markdown
## HIG Compliance Checklist
- [ ] 44px minimum tap targets verified
- [ ] 8pt grid spacing maintained  
- [ ] WCAG 2.1 AA contrast verified
- [ ] axe-core CI checks passing
- [ ] Visual regression ≤1px difference
- [ ] No direct px values introduced
- [ ] HIG component variants used
```

## 8. CI/CD Integration

### 自動検証統合

**axe-core設定**:
```json
{
  "rules": {
    "color-contrast": { "enabled": true },
    "focus-order-semantics": { "enabled": true },
    "target-size": { "enabled": true }
  }
}
```

**Visual Regression**:
- Playwright: 3 viewport (375px/768px/1280px)
- 差分閾値: ≤1px
- 対象: 主要5ページ（Home/Hearing/Organizations/Dashboard/Search）

**CI Pipeline推奨構成**:
1. TypeScript type check
2. ESLint（jsx-a11y rules）
3. axe-core accessibility test
4. Playwright visual regression
5. Bundle size analysis

### デプロイポリシー

**環境戦略**:
- ❌ Preview deployment（非推奨）
- ⭕ Production deployment only
- ⭕ Feature branch → main → production

**承認要件**:
- Frontend Lead approval
- CI全通過
- A11y manual verification（重要な変更時）

## 9. Appendix

### Quick Reference

**Spacing Scale**:
```
xs: 8px   →  gap-2, p-2
sm: 16px  →  gap-4, p-4  
md: 24px  →  gap-6, p-6
lg: 32px  →  gap-8, p-8
xl: 48px  →  gap-12, p-12
2xl: 64px →  gap-16, p-16
```

**Color Palette Core**:
```
Primary: #2563eb (Blue 600)
Success: #16a34a (Green 600)  
Warning: #ca8a04 (Yellow 600)
Error: #dc2626 (Red 600)
Neutral: #4b5563 (Gray 600)
```

**Typography Scale**:
```
text-xs: 12px/16px
text-sm: 14px/20px  
text-base: 16px/24px
text-lg: 18px/28px
text-xl: 20px/28px
```

### 外部リンク

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

### 問い合わせフロー

**デザイン相談**: Frontend Lead → Design System Working Group  
**技術実装**: GitHub Issue with `hig-support` label  
**緊急対応**: Slack #frontend-support channel

---

> **Document Status**: ✅ Production Ready  
> **Coverage**: Phase 1-3 Complete Implementation  
> **Next Review**: 2025-04-25 (Quarterly)

**🎯 AIOHub UI一元化プロジェクト Phase 4 Final: 完了**