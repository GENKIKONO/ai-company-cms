# 価格改定 変更内容要約

**実施日時**: 2025-10-13T02:40:00Z  
**対象**: 新料金体系完全統一（Free ¥0 / Basic ¥5,000 / Business ¥15,000 / Enterprise ¥30,000〜）  
**デザイン変更**: なし（文言・設定・制限のみ更新）

## 1. 変更ファイル一覧

### A. 核心設定ファイル（完了）
| ファイルパス | 目的 | 主な変更 |
|-------------|------|----------|
| `src/lib/pricing.ts` | 価格設定 | BASIC ¥5,000 / BUSINESS ¥15,000 / ENTERPRISE ¥30,000 |
| `src/config/plans.ts` | プラン制限 | Q&A: Free=5 / Basic=20 / Business=∞ |
| `src/lib/plan-limits.ts` | 互換性 | 新体系への統一・後方互換保持 |
| `src/lib/stripe.ts` | 支払い連携 | SUBSCRIPTION_PLANS新体系対応 |

### B. UI・コピーファイル（完了）
| ファイルパス | 目的 | 主な変更 |
|-------------|------|----------|
| `src/app/aio/copy.ts` | AIOページ価格表示 | 4プラン表示・制限明記 |
| `src/components/pricing/PricingTable.tsx` | 料金表コンポーネント | 新4プラン構造 |
| `src/app/pricing/page.tsx` | SEOメタデータ | 「月額5,000円〜」に更新 |
| `src/app/dashboard/billing/page.tsx` | 請求画面 | プラン名・価格表示更新 |

### C. 構造化データ（完了）
| ファイルパス | 目的 | 主な変更 |
|-------------|------|----------|
| `src/app/aio/page.tsx` | JSON-LD構造化データ | Offer価格: 0/5000/15000/30000 |

### D. 制限明確化（完了）
- **Free**: 「Hub内構造化のみ（自社サイト埋め込み不可）」
- **Basic**: 「Hub＋自社サイト埋め込み対応」
- **Business**: 承認フロー・認証バッジ・Search Console連携代行

## 2. Q&A制限値の実装状況

### 設定値
- **Free**: 5件まで （`qa_items: 5`）
- **Basic**: 20件まで （`qa_items: 20`）
- **Business/Enterprise**: 無制限 （`qa_items: Number.POSITIVE_INFINITY`）

### 実装箇所
- `src/config/plans.ts`: PLAN_LIMITS定義
- `src/lib/plan-limits.ts`: 後方互換対応
- UI表示: 料金表・AIOページに明記

## 3. 互換マッピング（旧→新）

| 旧プラン | 新プラン | 価格変更 | 機能変更 |
|---------|---------|----------|----------|
| Free | Free | ¥0 → ¥0 | Q&A: ? → 5件 |
| Starter ¥9,800 | Basic | ¥9,800 → ¥5,000 | Q&A: ? → 20件 |
| Business ¥34,800 | Business | ¥34,800 → ¥15,000 | Q&A: ? → 無制限 |
| Enterprise ¥50,000〜 | Enterprise | ¥50,000〜 → ¥30,000〜 | Q&A: ? → 無制限 |

## 4. 未解決TODO

### A. Price ID設定（要確認）
```bash
# Stripe Price IDの環境変数確認要
# 以下の環境変数が新価格に対応しているか確認
BASIC_PRICE_ID=price_xxxxx
BUSINESS_PRICE_ID=price_xxxxx
ENTERPRISE_PRICE_ID=price_xxxxx
```

### B. メール通知テンプレート（低優先度）
- 購読確認メール
- プラン変更通知メール
- 請求関連メール

## 5. ビルド・動作確認

### TypeScript コンパイル
✅ **PASS**: エラーなし

### 開発サーバー
✅ **PASS**: http://localhost:3002 正常動作

### 主要ページ確認
- ✅ 料金ページ（/pricing）
- ✅ AIOページ（/aio）
- ✅ ダッシュボード請求（/dashboard/billing）

## 6. SEO・構造化データ

### JSON-LD更新
- Service Offer: 4プラン（0/5000/15000/30000）
- 通貨: JPY
- 請求周期: P1M（月額）

### メタデータ更新
- Description: 「月額5,000円〜」
- Keywords: 料金プラン, Basic, Business, Enterprise

## 7. 次ステップ

1. **Q&A上限テスト**: Free=5, Basic=20で制限動作確認
2. **ロールバックタグ**: 現在のmainにタグ付与
3. **本番デプロイ**: Vercel Production Deploy
4. **最終確認**: 本番環境での価格表示確認

**準備完了**: 本番反映可能状態