# 実装ガイドライン

## 技術スタック（推奨 / 代替）

### 推奨構成
- **Frontend/Backend**: Next.js（Vercel）
- **Database/Auth**: Supabase（Auth/Postgres/Storage）
- **決済**: Stripe（Checkout/Portal）
- **メール**: Resend
- **AI抽出**: GAS＋LLM（任意）
- **構造化検証**: Rich Results Test API or 外部リンク

### 暫定ノーコード（代替案）
- Webflow＋Make（JSON-LD注入）
- Airtable＋Softr＋Stripe
- ※RLS/承認は弱い → 本番はNext/Supabase推奨

## 画面・フォーム仕様（Lo-Fi）

### ダッシュボード
- 代理店ログイン → 新規企業を作成
- ステータス：Draft / WaitingApproval / Published / Paused
- KPI：未承認数／公開済み数／直近更新

### 企業編集フォーム（タブ）
1. **基本情報**（Organization）
2. **サービス**（複数）
3. **事例**（複数）
4. **FAQ**（複数）
5. **連絡先 / CTA**（ContactPoint）
6. **外部リンク**（公式 / SNS / GBP）
7. **プレビュー**（実寸＋JSON-LD検証リンク）

### UX要件
- PDF/URLアップロード → 自動抽出 → 候補入力
- **必須**: name / description / addressRegion / addressLocality / telephone / url
- 保存時：バリデーション＋JSON-LD試験生成

### 承認フロー
- 承認URLを企業担当へメール送付（署名トークン／15分有効／1回限り）
- 承認 → status=published → サイトマップ更新 & Search Console ping（自社サブドメインのみ自動）

### Search Console自動送信の扱い
- **自社サブドメイン**: サイトオーナーのため自動ping可
- **独自ドメイン**: 自動登録不可 → サイトマップURL提示＋手順SOPで対応

### 公開ページ
- `/o/{orgSlug}`（会社ページ） ※slugは organizations.slug を使用
- `/o/{orgSlug}/s/{serviceSlug}`（サービス詳細）
- `<head>` にJSON-LD複数ブロック
- 画像はWebP最適化／OGP自動生成

### Stripe Webhook（App Router対応）
```typescript
// src/app/api/stripe/webhook/route.ts
export const runtime = 'nodejs'; // 明示でNodeランタイム指定
```
**注意**: App Routerでは `api: { bodyParser: false }` は無効。`await req.text()` を使用。

## 監視・レート制御・ステージング

### 外部呼出
- timeout 10s + 3リトライ

### 監視
- **Sentry**（500/JS）＋ **Plausible**（LCP監視）＋ **Slack通知**

### APIレート制限
- 承認URL再送/抽出API/Stripe Webhookに適用

### Sitemap/robots監視
- 週次ジョブで誤noindex検知

### staging環境
- 常時 noindex,nofollow 固定

### Feature Flag
- PDF抽出/CaseStudy公開など段階ロールアウト

### 承認リンクの安全策
- ワンタイム＆15分有効
- 同端末指向（大きな地理差・短時間多回は無効化）

## 運用メモ・注意事項

### orgSlug 予約語
`o, s, admin, api, assets, static, sitemap, robots, login, signup`

### paused時の仕様
noindex/noarchive/JSON-LD非出力/canonical固定

### 承認リンク
同端末/地理ヒューリスティックで濫用防止

### URL構造とslug
- 公開ページは organizations.slug を使用（nameではなく）
- フロントは `/o/[org]/page.tsx` の取得条件を `eq('slug', params.org)` に変更

### 独自ドメインのSearch Console
- 自動登録は不可 → サイトマップURL提示＋手順SOPで対応

### 代表者の扱い
- 代表者は創業者でない場合があるため founder は原則省略
- 必要時は employee[{name, jobTitle:"代表取締役"}] を追加

## 事前チェック（開発環境）

### 必須環境
- [ ] **Docker Desktop 起動**（Supabase CLI ローカルDBで必須）
- [ ] **Node v18+** / **pnpm** インストール済み
- [ ] **Stripe ダッシュボード**で Product/Price 作成（NEXT_PUBLIC_STRIPE_PRICE_* に設定）
- [ ] **.env.local** へ Supabase URL / Keys、Stripe Keys、APP_BASE_URL 設定

### つまづきやすいポイント（即解）
- **Supabase CLI が Docker を見つけられない** → Docker Desktop を起動 → `pnpm dlx supabase start`
- **RLS で読めない** → app_users に自分の id/role が入っているか確認（/api/auth/sync を一度叩く）
- **公開ページ 404** → organizations.slug が入っているか、status='published' に上がっているか確認

### 開発着手時の手順例
```bash
# 1. プロジェクト初期化
pnpm create next-app@latest ai-cms --typescript --tailwind --eslint --app
cd ai-cms
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs stripe

# 2. Supabase初期化
pnpm dlx supabase init
pnpm dlx supabase start
pnpm dlx supabase db reset

# 3. 開発サーバー起動
pnpm dev
```

## すぐやるチェックリスト（開発着手前）

### 設計・準備
- [ ] 3業種テンプレ（建設/製造/美容）のフォーム項目を確定
- [ ] JSON-LDテンプレ×項目マッピング表（項目名/必須/型/対応schema）を作成
- [ ] **承認メール文面＆免責文（同意文）**の雛形を用意
- [ ] Stripe商品（初期費・月額）発行

### 運用・SOP
- [ ] **SOP（取材→抽出→入力→承認→公開）**の1枚化
- [ ] RTO/RPOとDR手順をSOPに追記
- [ ] staging robots noindex の固定確認
- [ ] APIレート制限とSlack通知の設定

## 開発規約・ベストプラクティス

### セキュリティ
- 常にRLS有効で開発
- シークレットは環境変数管理
- 監査ログ必須（トリガー設定）

### パフォーマンス
- SSR/SSG優先（CSRは最小限）
- 画像は常にWebP最適化
- LCP < 2.5s を目標

### データ処理
- JSON-LD空値は必ず除外
- 電話番号はE.164と表示用を分離
- 価格未入力時はoffers非出力

### ドメイン・DNS
- サブドメイン/独自ドメイン自動SSL
- CNAME検証をPreflightに組み込み
- CDNキャッシュは更新時に適切にパージ

### テスト・品質
- RLSのユニットテスト必須
- JSON-LDのスナップショットテスト
- E2E（承認フロー/課金フロー）