# トップページ要件定義（現行）

> **目的**: 現在の理想状態を文書化し、崩れた時にすぐ復旧できるようにする  
> **最終更新**: 2024年11月  
> **対象URL**: `/` (I18nHomePage.tsx)

## 1. 対象ファイル

### メインファイル
- `src/app/I18nHomePage.tsx` - トップページ本体
- `src/components/layout/AioSection.tsx` - セクション共通ラッパー（余白・背景色統一）
- `src/app/globals.css` - カスタムクラス定義（後述の特例クラス含む）
- `src/components/pricing/PricingTable.tsx` - 料金プランコンポーネント（おすすめバッジ含む）

### サブコンポーネント（レイアウト影響あり）
- `src/components/aio/FlowSection.tsx` - 3ステップ・Before/Afterセクション用
- `src/components/aio/FAQSection.tsx` - FAQアコーディオン

## 2. ページ構成

表示順序とコンポーネント構成：

1. **Hero Section** (`I18nHomePage.tsx` 90-157行)
   - `<AioSection tone="white" className="!m-0">`
   - 特例：`!m-0`でデフォルト余白を無効化

2. **Features Section** - 「大きな商談も、小さな問い合わせも、すべてに対応」 (`I18nHomePage.tsx` 160-236行)
   - `<AioSection tone="muted" className="lg:mt-20">`
   - 3つのカード（営業資料として／採用活動で／PR・広報で）
   - ✅ **修正済**: hover時テキスト非表示問題を解決

3. **3Steps Section** - 「シンプルな3ステップでAI最適化を実現」 (`I18nHomePage.tsx` 240-377行)
   - `<AioSection tone="white" className="section-bottom-extend">`
   - ✅ **モバイル**: 横スクロール対応（`.mobile-scroll`クラス使用）
   - ✅ **CTA余白**: `section-bottom-extend`でボタン下に背景色延長

4. **Before/After Section** - 「AI時代の新しい課題を解決」 (`I18nHomePage.tsx` 381-489行)
   - `<AioSection tone="white" className="section-bottom-extend">`
   - ✅ **モバイル文字拡大**: `text-base lg:text-base`で小画面でも読みやすく

5. **Pricing Section** (`I18nHomePage.tsx` 492-507行)
   - `<AioSection tone="muted" id="pricing" className="pt-6 lg:pt-0">`
   - `<PricingTable />` コンポーネント使用
   - ✅ **特例多数**: 後述の「料金プランの特例」参照

6. **FAQ Section** (`I18nHomePage.tsx` 510-535行)
   - `<AioSection tone="muted">`
   - `<FAQSection />` コンポーネント使用

7. **Final CTA Section** (`I18nHomePage.tsx` 538-586行)
   - `<AioSection tone="white" className="text-gray-900 relative overflow-hidden">`

## 3. レイアウト・余白ルール

### 基本原則
- **全セクションは`AioSection`でラップ** - 背景色・余白を統一管理
- **余白は`padding`方式** - marginではなくsection内でpaddingを持つ
- **`section-y`クラスで縦余白統一** - `AioSection.tsx`で自動適用

### 余白数値（`globals.css` 37-47行）
```css
.section-y {
  margin-top: 4rem;    /* SP: 64px */
  margin-bottom: 4rem;
}
@media (min-width: 1024px) {
  .section-y {
    margin-top: 5rem;    /* PC: 80px */
    margin-bottom: 5rem;
  }
}
```

### 特例余白クラス

#### `.section-heading-top` (`globals.css` 49-56行)
- **用途**: セクション見出しの上余白統一
- **適用箇所**: 4つのセクションの見出しコンテナ
- **数値**: SP 4rem / PC 5rem (padding-top)

#### `.section-bottom-extend` (`globals.css` 59-66行)
- **用途**: CTAボタン下に背景色を延長してゆとりを作る
- **適用箇所**: 3ステップ・Before/Afterの2セクション
- **数値**: SP 2.5rem / PC 3.5rem (padding-bottom)
- **理由**: marginではカード背景が切れるため

### 背景色バリエーション
- `tone="white"` - 白背景 (Hero, 3Steps, Before/After, Final CTA)
- `tone="muted"` - グレー背景 (Features, Pricing, FAQ)

## 4. モバイル（～lg）での特例

### `.mobile-scroll`クラス (`globals.css` 69-92行)
```css
.mobile-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overflow-y: visible;  /* 👈 重要：バッジが上で切れないための設定 */
  scroll-snap-type: x mandatory;
  padding-top: 4.25rem; /* 👈 おすすめバッジ用余白 */
  padding-left: 1rem;
  padding-right: 1rem;
}
```

### 適用箇所
1. **3ステップセクション** (`I18nHomePage.tsx` 258行)
   - グリッドを横スクロールに変更
   - 各ステップカード: `min-w-[85%] snap-center lg:min-w-0`

2. **料金プランセクション** (`PricingTable.tsx` 109行)
   - 3カラムを横スクロールに変更
   - 各プランカード: `min-w-[80%] snap-center lg:min-w-0`

### ⚠️ 注意事項
- **`overflow-y: visible`を削除すると**おすすめバッジが上端で切れる
- **`padding-top`を減らすと**バッジが見切れる
- これらの値は「おすすめバッジの大きさ＋食い込み量」に依存

## 5. コンポーネントごとの注意点

### AioSection.tsx
- **`className={`section-y ${className ?? ""}`}`** - 必ずsection-yを自動適用
- **background/colorスタイル** - CSS変数使用（tonePropに基づく）

### PricingTable.tsx
- **2つの表示版**: モバイル用（109行〜）とデスクトップ用（219行〜）
- **完全別実装** - レスポンシブではなく条件分岐で切り替え

### FlowSection.tsx
- 3ステップとBefore/Afterの内容を管理
- レイアウト自体はI18nHomePage.tsx側で制御

## 6. 今回のカスタム点（崩れやすいところ）

### 🏷️ 料金プランの「おすすめ」バッジ (PricingTable.tsx)

#### バッジ仕様
- **位置**: `absolute -top-6 left-1/2 transform -translate-x-1/2 z-10`
- **サイズ**: `px-7 py-3` (約2倍の存在感)
- **枠線**: `border-[5px] border-blue-400` ⭐ カードと同じ太さ・色
- **内容**: `👑 おすすめ` (王冠 + 日本語のみ)
- **食い込み**: カードの上枠に1/3程度重なる配置

#### Proプランカード仕様
- **枠線**: `border-[5px] border-blue-400` ⭐ バッジと統一
- **影**: `shadow-lg` でプレミアム感
- **アイコン余白**: `${plan.popular ? 'mt-6' : 'mt-1'}` でバッジと干渉回避

#### ⚠️ 崩れるパターン
1. **border太さ・色を変更** → バッジとカードの一体感が崩れる
2. **バッジ位置を変更** → mobile-scrollのpadding-topと合わなくなる
3. **z-indexを変更** → バッジがカードの後ろに隠れる

### 🎯 hover時のテキスト非表示対策 (I18nHomePage.tsx 176-219行)

#### 修正内容
- **Before**: `absolute inset-0`のオーバーレイでテキストが隠れる
- **After**: `hover:bg-blue-50`で直接背景変更 + `relative z-10`でコンテンツ前面化

```tsx
// ✅ 修正後の構造
<div className="hover:bg-blue-50 transition-all duration-500">
  <div className="relative z-10 mb-8">
    {/* アイコン・テキストが必ず前面に表示される */}
  </div>
</div>
```

### 📱 モバイルでの文字サイズ調整

#### Before/Afterカード (`I18nHomePage.tsx` 416, 452, 422, 426, 458, 462行)
- **メインテキスト**: `text-base lg:text-base` (小画面でも読める)
- **リストアイテム**: `text-base lg:text-base` で統一

#### 理由
- デフォルトの`text-sm`では小画面で読みにくい
- `text-base`でモバイル最適化

## 7. 今後の更新時の注意

### ❌ やってはいけないこと
1. **AioSectionを削除** → 余白・背景色の統一性が崩れる
2. **mobile-scrollのoverflow-y設定変更** → バッジが切れる
3. **料金プランでborder太さ変更** → バッジとの一体感が崩れる
4. **section-bottom-extendを削除** → CTA下で背景色が切れる

### ✅ 安全な変更方法
1. **文言変更**: セクション内のテキストは自由に変更可能
2. **色調整**: CSS変数（--aio-primary等）なら全体で統一される
3. **新規セクション追加**: AioSectionでラップすれば統一感維持
4. **アイコン変更**: Lucide-react内であれば問題なし

### 🔧 トラブルシューティング
- **バッジが切れる** → `.mobile-scroll`の`padding-top`を増やす
- **hover時にテキスト消える** → `relative z-10`が削除されていないか確認
- **余白がバラバラ** → `AioSection`＋`section-y`の適用を確認
- **モバイルで横スクロールしない** → `mobile-scroll`クラスの適用を確認

---

💡 **このファイルを定期的に更新して、実装状態との同期を保つことを推奨します。**