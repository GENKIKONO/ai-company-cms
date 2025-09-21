# 要件定義（システム/技術視点）

## データモデル（MVP最小）

### 共通仕様
- すべて uuid PK、created_at / updated_at 付与
- RLS：orgId ベースで厳格制御
- Migration冒頭に `create extension if not exists pgcrypto;` 必須（gen_random_uuid()用）

### エンティティ

#### Organization（企業）
```sql
- id / name / slug(unique) / legalForm / representativeName / founded / capital / employees
- description / addressCountry / addressRegion / addressLocality / streetAddress / postalCode
- telephone / email（公開可否） / url / logoUrl / sameAs[] / gbpUrl / industries[] / eeat
- status(draft|waiting_approval|published|paused|archived)
- ownerUserId / partnerId / timestamps
```

**注意**: slug列は URL安定化のため追加。公開ページは `/o/{slug}` で参照。

#### Service（提供サービス/商品）
```sql
- id / orgId / name / summary / features[] / price(文字列) / category / media[] / ctaUrl / status
```

#### CaseStudy（導入事例）
```sql
- id / orgId / title / clientType / clientName / problem / solution / outcome / metrics[] / publishedAt
```

#### FAQ
```sql
- id / orgId / question / answer / order
```

#### ContactPoint
```sql
- id / orgId / areaServed[] / contactType(sales|support) / telephone / email / availableLanguage[]
```

#### User
```sql
- id / role(admin|partner|org_owner|org_editor|viewer) / partnerId
```

#### Partner（代理店）
```sql
- id / name / contactEmail / brandLogoUrl / subdomain / commissionRateInit / commissionRateMRR
```

#### Subscription
```sql
- id / orgId / plan(basic|pro) / status(active|paused|cancelled) / stripeCustomerId / stripeSubId
```

#### AuditLog
```sql
- id / actorUserId / entity / entityId / action(create|update|publish|approve) / timestamp / diff(JSON)
```

#### Redirect（301用・任意）
```sql
- id / fromPath / toPath / orgId
```

## JSON-LD 生成テンプレート（最小セット）

### 方針
- 空値キーは出力しない
- 電話は表示用と別に**E.164(+81)**を用意
- 価格未入力時はoffersを出力しない

### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{name}}",
  "url": "{{url}}",
  "logo": "{{logoUrl}}",
  "description": "{{description}}",
  "foundingDate": "{{founded}}",
  "inLanguage": "ja",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{streetAddress}}",
    "addressLocality": "{{addressLocality}}",
    "addressRegion": "{{addressRegion}}",
    "postalCode": "{{postalCode}}",
    "addressCountry": "JP"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "sales",
      "telephone": "{{telephoneE164}}",
      "email": "{{email}}",
      "areaServed": {{areaServedArray}},
      "availableLanguage": ["ja"]
    }
  ],
  "sameAs": {{sameAsArray}}
}
```

### Service
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{{name}}",
  "provider": { "@type": "Organization", "name": "{{org.name}}", "url": "{{org.url}}" },
  "description": "{{summary}}",
  "category": "{{category}}"
  /* "offers": { "@type":"Offer", "priceCurrency":"JPY", "price":"{{priceNumeric}}", "url":"{{ctaUrl}}", "availability":"https://schema.org/InStock" } 価格がある場合のみ出力 */
}
```

### FAQPage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{#each faqs}}
    {
      "@type": "Question",
      "name": "{{question}}",
      "acceptedAnswer": { "@type": "Answer", "text": "{{answer}}" }
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}
```

### CaseStudy
```json
{
  "@context": "https://schema.org",
  "@type": "CaseStudy",
  "headline": "{{title}}",
  "about": "{{clientType}}",
  "author": { "@type": "Organization", "name": "{{org.name}}" },
  "datePublished": "{{publishedAt}}",
  "articleBody": "Problem: {{problem}}\nSolution: {{solution}}\nOutcome: {{outcome}}",
  "inLanguage": "ja"
}
```

## 役割・権限（RLS）

### ロール定義
- **admin**: 全操作、代理店作成、料金プラン編集、監査ログ閲覧
- **partner**: 自社配下のorg CRUD、公開申請、承認URL発行
- **org_owner**: 自社データ編集、公開承認
- **org_editor**: 編集のみ（承認不可）
- **viewer**: 閲覧のみ（将来）

### RLS原則
- PostgresのRLSは1ポリシー=1コマンドが原則
- SELECT/INSERT/UPDATE/DELETE を個別ポリシーで定義
- user.partnerId == org.partnerId かつ user.role に応じた操作限定
- AuditLogは全write必須（DBトリガ）

### RLSポリシー例（Organizations）
```sql
-- admin 全権
create policy org_admin_select on organizations
for select using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));
create policy org_admin_insert on organizations
for insert with check (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));
create policy org_admin_update on organizations
for update using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));
create policy org_admin_delete on organizations
for delete using (exists (select 1 from app_users au where au.id = auth.uid() and au.role='admin'));

-- partner：自社配下のみ
create policy org_partner_select on organizations
for select using (partner_id in (select partner_id from app_users where id = auth.uid()));
create policy org_partner_insert on organizations
for insert with check (partner_id in (select partner_id from app_users where id = auth.uid()));
create policy org_partner_update on organizations
for update using (partner_id in (select partner_id from app_users where id = auth.uid()));

-- org_owner：自社Orgのみ更新可
create policy org_owner_select on organizations
for select using (owner_user_id = auth.uid());
create policy org_owner_update on organizations
for update using (owner_user_id = auth.uid());
```

**注意**: 子テーブル（services/case_studies/faqs/contact_points）も同様に、条件は `org_id in (select id from organizations where ...)` で制御

## 非機能要件（MVPで厳守）

### パフォーマンス
- LCP < 2.5s（モバイル）

### SEO/AIO
- サイトマップ自動生成
- robots適正
- JSON-LD検証エラー0

### 可用性
- 稼働99%（Vercel / Supabase標準）

### セキュリティ
- RLS有効
- トークン短寿命
- 監査ログ90日

### バックアップ・復旧
- DB日次スナップショット
- RTO=4h / RPO=24h（SOPに復旧手順を明記）

### CDN/Cache
- s-maxage=600＋公開/更新時にタグパージ

### アクセシビリティ
- 画像alt必須
- 色コントラストAA

### SSL自動化
- サブドメイン/独自ドメインはVercel/Cloudflareで自動証明書発行・更新

## 状態遷移（ステートマシン）

### 状態フロー
```
draft → waiting_approval → published → (paused|archived)
```

### ガード条件
- **draft→waiting_approval**: 必須項目充足＋JSON-LD内部検証PASS
- **waiting_approval→published**: org_owner承認＋Subscription.active＋DNS/CNAME検証OK
- **published→paused**: Stripe未払い／解約

### 不変条件
- Service.orgId は必ず既存 Organization.id を参照
- published の編集はドラフトコピーを作って更新（公開版破壊禁止）

## 公開処理の安全装置（Publish Gate）

### Preflight（全PASSで公開ボタン活性）
- JSON-LD内部検証（必須キー/型、空キー省略）
- Subscription.active（Stripe Webhook反映済み）
- ドメイン配信OK（自社サブドメイン or 独自CNAME検証OK）
- OGP生成成功／画像最適化完了
- プレビューRLS確認（第三者に漏れない）

### Search Consoleの現実対応
- **自社サブドメイン**: サイトオーナーのため自動ping可
- **独自ドメイン**: 自動登録不可 → サイトマップURL提示＋SOPで代替（将来：所有権委任API検討）

## 入力検証（JSON-LDが死なないルール）

### 必須項目
- name / description / addressRegion / addressLocality / telephone / url

### 正規化
- **telephone**: 表示用とは別に E.164(+81) をJSON-LDへ
- **url/email**: RFC検証／https強制／HEADで200/301/308のみ許可（10s timeout）
- **住所**: 都道府県プルダウン／郵便番号 ^\d{3}-\d{4}$
- **addressCountry**: ISO 3166-1 alpha-2（"JP"）
- **areaServed**: 配列で統一
- **価格未入力時**: offersを出力しない
- **空キー**: 出力しない（null/空文字弾く）

## 決済・停止の整合性（Stripe）

### Webhook仕様
- 冪等（Idempotency-Key）
- 失敗は3リトライ＋DLQ

### 主要イベント
- **checkout.session.completed** → Subscription.active
- **invoice.payment_failed** → grace_period=7日 → 未入金で paused
- **customer.subscription.deleted** → paused

### paused時のページ仕様
配信OKだが noindex + noarchive + JSON-LD非出力 + canonicalを自社ドメイン固定