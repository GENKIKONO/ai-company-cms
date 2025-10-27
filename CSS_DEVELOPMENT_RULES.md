# CSS開発ルール - 複雑化防止対策

## 🚨 **絶対禁止事項**

### ❌ **CSS直書きの禁止**
```tsx
// ❌ 絶対にやってはいけない
<div style={{ color: '#3B82F6', background: '#FFFFFF' }}>

// ❌ globals.cssへの直接追加禁止
.my-custom-class { 
  background: #123456; 
}
```

### ✅ **必須の開発パターン**
```tsx
// ✅ デザインシステムを使用
import { PrimaryCTA, HIGCard } from '@/design-system';

// ✅ CSS変数を使用
<div className="bg-primary text-white">

// ✅ ユーティリティクラスを使用
<div className="apple-hero-section">
```

## 📁 **モジュール構造 - 変更禁止**

```
src/design-system/
├── tokens/
│   ├── colors.css      // カラー定義のみ
│   ├── typography.css  // フォント定義のみ
│   └── utilities.css   // ユーティリティクラス
├── components/
│   ├── UnifiedCTA.tsx  // 統一ボタン
│   ├── HIGButton.tsx   // Apple HIG準拠
│   └── HIGCard.tsx     // カード
└── patterns/
    └── sections.css    // セクションパターン
```

## 🔒 **変更管理ルール**

### 1. **新しいスタイルが必要な場合**
1. 既存のデザインシステムを確認
2. 類似パターンがあるか検索
3. ユーティリティクラスで対応可能か確認
4. 本当に新規が必要な場合のみ追加

### 2. **色の追加**
```css
/* ✅ colors.css のみに追加 */
:root {
  --color-new-primary: #123456;
}
```

### 3. **コンポーネント作成**
```tsx
// ✅ design-system/components/ に作成
export const NewComponent = ({ children }: Props) => (
  <div className="new-component">{children}</div>
);
```

## 🛡️ **自動防止機能**

### 1. **ESLint規則** (設定済み)
- インラインスタイル警告
- ハードコードカラー検出
- console.log警告

### 2. **Git Pre-commit Hook** 
```bash
# コミット前チェック
npm run lint
npm run type-check
```

### 3. **ビルド時検証**
- CSS構文チェック
- 重複クラス検出
- 未使用スタイル警告

## 📋 **開発フロー**

### ✅ **正しいUI開発手順**
1. **設計システム確認** → 既存コンポーネント使用
2. **トークン活用** → CSS変数でスタイリング
3. **ユーティリティ活用** → 共通パターン適用
4. **最終手段** → 新規コンポーネント作成

### ❌ **やってはいけない開発**
1. 急いでいるからインラインスタイル
2. 一時的だからglobals.cssに追加
3. 他で使わないから直書き
4. 動けばいいからコピペ

## 🚨 **緊急時の対応**

### 本当に緊急でスタイル追加が必要な場合
1. **一時ファイル作成**: `temp-styles.css`
2. **TODOコメント追加**: `// TODO: デザインシステムに移行`
3. **Issueチケット作成**: 後でリファクタリング予約
4. **レビュー必須**: チーム確認後マージ

## 🎯 **成功指標**

- globals.css: 200行以下維持
- インラインスタイル: 100個以下維持  
- ハードコードカラー: 200個以下維持
- 新規CSS追加: 月5個以下

## 📞 **相談窓口**

スタイル実装で迷った場合:
1. デザインシステムドキュメント確認
2. 既存コンポーネント検索
3. チームSlackで相談
4. コードレビューで確認

---

**このルールを守ることで、保守可能で美しいUIを効率的に開発できます。**