# Mobile Navigation Audit Report

## 監査結果サマリー

**問題のあるパッチとオーバーライド:**

1. **globals.css (L153-156)**: `header *` に `!important` 強制可視化 - 削除必要
2. **MobileNav.tsx (L73-85)**: インライン Tailwind クラス直書き - デザイントークン化必要  
3. **console.log デバッグコード**: 本番前に削除必要
4. **z-index 不統一**: 現在 z-50、HIG tokens (--z-fixed: 1030) を使用すべき
5. **レスポンシブ不整合**: lg:hidden vs lg:1024px ブレークポイント確認済み

**推奨デザイントークン:**
- z-index: `var(--z-fixed)` (1030) 
- 色: `var(--color-primary)` (#007AFF)
- HIGButton コンポーネント利用可能

**次ステップ**: Portal + 既存デザインシステム活用で完全なモジュラー実装