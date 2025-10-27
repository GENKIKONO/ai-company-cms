# デザインシステム参照ガイド

## 🚨 重要: AI開発時の必須確認事項

### **ボタン関連の指示があった場合**

❌ **NG例**: 「青いボタンを追加」
✅ **OK例**: 「PrimaryCTAコンポーネントを使用」

**既存ボタンコンポーネント:**
```typescript
// 1. プライマリCTA（メインアクション）
<PrimaryCTA size="large|medium|small" href="/path" showArrow={true}>
  テキスト
</PrimaryCTA>

// 2. セカンダリCTA（サブアクション）  
<SecondaryCTA size="large|medium|small" href="/path">
  テキスト
</SecondaryCTA>

// 3. HIGButton（一般的なボタン）
<HIGButton variant="primary|secondary" size="large|medium|small">
  テキスト
</HIGButton>
```

### **セクション/レイアウト関連の指示があった場合**

❌ **NG例**: 「白い背景のセクションを追加」
✅ **OK例**: 「sec-whiteクラスのセクションを使用」

**既存セクションシステム:**
```css
.sec-white    /* 白背景 + ダークテキスト */
.sec-alt      /* グレー背景 + ダークテキスト */  
.sec-primary  /* 青背景 + 白テキスト */
```

**良い例コンポーネント参照:**
- `src/components/hearing-service/HeroSection.tsx` (Hero型セクション)
- `src/components/ui/UnifiedCTA.tsx` (統一CTA)
- `src/components/ui/HIGCard.tsx` (カード系)

### **カラー関連の指示があった場合**

❌ **NG例**: 「青色を使って」
✅ **OK例**: 「CSS変数 --bg-primary を使用」

**デザイントークン:**
```css
--bg-white: #FFFFFF      /* メイン背景 */
--bg-alt: #F5F5F7        /* サブ背景 */
--bg-primary: #0A84FF    /* プライマリ色 */
--text-primary: #1D1D1F  /* メインテキスト */
--text-secondary: #636366 /* サブテキスト */
--text-on-primary: #FFFFFF /* プライマリ背景上のテキスト */
```

## 🔄 **AI開発ワークフロー**

### **Step 1: 要求の解釈**
```
人間: 「青いボタンを大きくして」

AI確認: 「PrimaryCTAコンポーネントのsizeをlargeにすることでしょうか？
         現在のコンポーネント: <PrimaryCTA size="medium">
         変更後: <PrimaryCTA size="large">」
```

### **Step 2: 既存コンポーネント確認**
```
AI必須チェック:
1. 該当するコンポーネントが既に存在するか？
2. デザイントークンで対応可能か？
3. 新規作成が本当に必要か？
```

### **Step 3: 提案と確認**
```
AI提案: 「以下3つの選択肢があります：
1. 既存PrimaryCTAを使用 (推奨)
2. HIGButtonをカスタマイズ  
3. 新規コンポーネント作成

どちらがご希望に近いでしょうか？」
```

## 🚫 **絶対禁止事項**

1. **className直書き禁止**
   - `className="bg-blue-500 text-white"` ❌
   - デザイントークン/コンポーネント使用 ✅

2. **インラインスタイル禁止**
   - `style={{color: 'blue'}}` ❌
   - CSS変数使用 ✅

3. **コンポーネント確認なしの新規作成禁止**
   - 既存資産を必ず確認してから作成

## 📁 **重要ファイル参照先**

- デザイントークン: `src/app/globals.css` (L34-41)
- 統一CTA: `src/components/ui/UnifiedCTA.tsx`
- HIG準拠: `src/components/ui/HIGButton.tsx`, `HIGCard.tsx`
- セクション例: `src/components/hearing-service/HeroSection.tsx`

---

**このファイルを必ず参照してからコーディングを開始してください**