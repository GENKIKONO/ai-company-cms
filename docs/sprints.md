# タスク分解（スプリント計画）

## 実装タスク概要（2週間×2〜3スプリント）

### Sprint 1（設計＋基本CRUD）
- スキーマ作成（Org/Service/CaseStudy/FAQ/User/Partner/Redirect）
- RLS/ポリシー設定／認証（メール+PW）／ロール付与
- 企業CRUD（基本情報）／JSON-LD関数（Org/Service/FAQ/CaseStudy）
- 公開ページ雛形／サイトマップ生成／SSL & Cache設定

### Sprint 2（代理店・承認・課金）
- Partner管理（サブドメイン/ロゴ）／代理店ダッシュボード
- 承認URL（署名トークン、15分、1回限り）＋メール送信（Resend）
- Stripe Checkout（初期費＋月額）＋Webhook連携
- JSON-LD検証ボタン（API or 外部ツールリンク）
- Feature Flag の埋め込み

### Sprint 3（自動抽出＋事例/FAQ/最適化）
- URL/PDFからの簡易抽出（テキスト化）
- Service/CaseStudy/FAQフォーム強化
- OGP自動生成／画像最適化（WebP, 最大幅1600px, EXIF除去）
- 最低限のアクセス解析（Plausible）／Sitemap監視ジョブ

## EPIC別詳細タスク

### EPIC A：基盤・スキーマ・RLS（Sprint1）

#### A1. Supabase プロジェクト初期化 & 環境整備
- **優先度**: P0 / **工数**: 0.5d / **依存**: なし
- **AC**: プロジェクト作成・Auth有効化・ Storage有効化・.env雛形作成
- **DoD**: Staging/Prod 環境分離、ロール/権限下書きあり

#### A2. DB スキーマ作成
- **優先度**: P0 / **工数**: 1.5d / **依存**: A1
- **AC**: 全テーブル作成・PK/FK・インデックス・CHECK制約（status等）
- **DoD**: マイグレーションSQLコミット済／ER図PNG出力

#### A3. RLS & ポリシー実装（行レベル制御）
- **優先度**: P0 / **工数**: 1d / **依存**: A2
- **AC**: partner単位・org_owner単位のCRUD制御、adminフル権限
- **DoD**: セキュリティテスト（他社データにアクセス不可の自動テスト）

#### A4. 監査トリガー（AuditLog）
- **優先度**: P1 / **工数**: 0.5d / **依存**: A2
- **AC**: 主要テーブルINSERT/UPDATE/DELETEで監査レコード挿入
- **DoD**: ユーザー・差分・タイムスタンプ記録確認

### EPIC B：認証・ロール（Sprint1）

#### B1. Auth（メール+パス）導入 & ロール付与フロー
- **優先度**: P0 / **工数**: 0.5d / **依存**: A1
- **AC**: サインアップ/ログイン、role/partnerId付与API
- **DoD**: テストユーザー（admin/partner/org_owner）作成済

#### B2. 代理店招待フロー（招待リンク & 初期ロール付与）
- **優先度**: P1 / **工数**: 0.5d / **依存**: B1
- **AC**: 管理者がメールで招待→初回ログインでpartnerロール
- **DoD**: 失効/再送の状態管理あり

### EPIC C：CRUD・公開ページ・サイトマップ（Sprint1）

#### C1. Organization 基本CRUDフォーム（必須項目＋バリデーション）
- **優先度**: P0 / **工数**: 1d / **依存**: A2, B1
- **AC**: name/description/addressRegion/addressLocality/telephone/url の必須チェック
- **DoD**: E.164整形・URL https強制・郵便番号正規表現

#### C2. 公開ページ雛形（/o/{orgSlug}）＋サイトマップ自動生成
- **優先度**: P0 / **工数**: 1d / **依存**: C1
- **AC**: CSRでなくSSR/SSGで高速表示、サイトマップに追加
- **DoD**: LCP指標ベースの軽量テンプレ＋OGP仮

#### C3. スラグ生成 & Redirect（301）
- **優先度**: P1 / **工数**: 0.5d / **依存**: C2
- **AC**: 予約語回避・社名変更時301登録
- **DoD**: redirectsテーブルとmiddleware動作

### EPIC D：JSON-LD 生成コア（Sprint1）

#### D1. JSON-LD テンプレ関数（Organization/Service/FAQ/CaseStudy）
- **優先度**: P0 / **工数**: 1d / **依存**: A2, C1
- **AC**: 空キー非出力・価格未入力時offers非出力・E.164採用
- **DoD**: スナップショットテスト（空値省略の差分検証）

#### D2. 内部検証関数（Preflight用）
- **優先度**: P0 / **工数**: 0.5d / **依存**: D1
- **AC**: 必須キー/型検証OK→PASS/FAIL返却
- **DoD**: 主要3テンプレ＋CaseStudyでユニットテスト

### EPIC E：承認・公開ガード（Sprint2）

#### E1. プレビュー画面（JSON-LD検証リンク付き）
- **優先度**: P0 / **工数**: 0.5d / **依存**: D1
- **AC**: プレビューで構造化を可視化＆外部検証リンク
- **DoD**: 権限で他社データ参照不可

#### E2. 承認URL（署名トークン/15分/ワンタイム）＋メール送信（Resend）
- **優先度**: P0 / **工数**: 1d / **依存**: B1, E1
- **AC**: 企業担当がリンク1回押下→published遷移
- **DoD**: 再利用不可・期限切れ処理

#### E3. Publish Gate（Preflight）
- **優先度**: P0 / **工数**: 1d / **依存**: D2, F2, G2
- **AC**: JSON-LD PASS／Stripe Active／DNS/CNAME OK／OGP生成OK／画像最適化OK
- **DoD**: 全PASS時のみ公開ボタン活性

#### E4. ステートマシン＆編集ドラフト運用
- **優先度**: P1 / **工数**: 0.5d / **依存**: C1, E3
- **AC**: publishedの編集はdraftコピー→再承認で置換
- **DoD**: 破壊的変更なし

### EPIC F：決済・課金（Sprint2）

#### F1. Stripe 商品作成（初期費・月額／プラン）
- **優先度**: P0 / **工数**: 0.5d / **依存**: なし
- **AC**: Checkout/Customer Portal 設定
- **DoD**: Staging動作確認

#### F2. Webhook 同期（Active/Paused）冪等 & リトライ
- **優先度**: P0 / **工数**: 1d / **依存**: F1
- **AC**: checkout.session.completed→Active／payment_failed→grace→Paused
- **DoD**: Idempotency-Key・DLQ・テストイベント通過

#### F3. 公開状態とサブスク連動（Paused=noindex/JSON-LD停止）
- **優先度**: P0 / **工数**: 0.5d / **依存**: F2, E3
- **AC**: 停止時にnoindex, noarchive, canonical固定
- **DoD**: 実ページのmeta確認

### EPIC G：ドメイン・配信・OGP（Sprint2）

#### G1. Vercelデプロイ & SSL 自動化（stg/prod）
- **優先度**: P0 / **工数**: 0.5d / **依存**: A1
- **AC**: HTTPS配信・stagingは noindex 固定
- **DoD**: 自動証明書取得/更新OK

#### G2. 独自ドメインCNAME検証 & キャッシュ設定
- **優先度**: P0 / **工数**: 0.5d / **依存**: G1
- **AC**: DNS検証API・s-maxage=600・更新時タグパージ
- **DoD**: Preflightで検証済みになる

#### G3. OGP自動生成 & 画像最適化（WebP/1600px/EXIF除去）
- **優先度**: P0 / **工数**: 0.5d / **依存**: C2
- **AC**: 企業ロゴ/社名/要約でOGP生成・アップ時最適化
- **DoD**: PreflightでOK判定

### EPIC H：サービス/事例/FAQフォーム（Sprint3）

#### H1. Service CRUD（features[]/media[]/CTA/カテゴリ）
- **優先度**: P0 / **工数**: 1d / **依存**: A2, D1
- **AC**: offersは価格入力時のみ
- **DoD**: JSON-LD出力テスト

#### H2. CaseStudy CRUD（problem/solution/outcome/metrics）
- **優先度**: P1 / **工数**: 0.5d / **依存**: H1
- **AC**: @type=CaseStudy生成
- **DoD**: 日付/匿名化フラグ対応

#### H3. FAQ CRUD & FAQPage JSON-LD
- **優先度**: P1 / **工数**: 0.5d / **依存**: H1
- **AC**: 並び順・空出力禁止
- **DoD**: リッチリザルト検証通過

### EPIC I：抽出・入力支援（Sprint3）

#### I1. PDF/URLテキスト抽出（簡易）
- **優先度**: P1 / **工数**: 1d / **依存**: C1
- **AC**: 本文/見出しの抽出→候補入力
- **DoD**: タイムアウト10s・失敗はスキップ

#### I2. 候補入力UI（候補→確定の1クリック反映）
- **優先度**: P2 / **工数**: 0.5d / **依存**: I1
- **AC**: 候補を逐次採用できる
- **DoD**: フィールドごとに差分表示

### EPIC J：監視・レート制御・運用（Sprint2〜3）

#### J1. Sentry/Slack/Plausible 導入
- **優先度**: P0 / **工数**: 0.5d / **依存**: G1
- **AC**: 500/JSエラー通知・LCP監視
- **DoD**: Slackに通知流れる

#### J2. API レート制限（承認リンク/抽出/Stripe Webhook）
- **優先度**: P1 / **工数**: 0.5d / **依存**: E2, I1, F2
- **AC**: 連打や濫用を429で制御
- **DoD**: テストで閾値動作

#### J3. RTO/RPO手順 & バックアップ確認（SOP化）
- **優先度**: P1 / **工数**: 0.5d / **依存**: A1
- **AC**: RTO=4h / RPO=24h で復旧手順記述
- **DoD**: 復旧ドリル一回実施

### EPIC K：法務ライト・SOP（Sprint2）

#### K1. 同意文/免責/プライバシー掲示（UI反映）
- **優先度**: P0 / **工数**: 0.5d / **依存**: E2
- **AC**: 公開前チェックボックス＋ログ保存
- **DoD**: 文面固定・変更はadminのみ

#### K2. Cookie同意・DPIAメモ
- **優先度**: P2 / **工数**: 0.5d / **依存**: J1
- **AC**: 解析Cookieの同意UI
- **DoD**: NotionにDPIAメモ残す

#### K3. 取材→公開 SOP 1枚
- **優先度**: P0 / **工数**: 0.5d / **依存**: 全体
- **AC**: 60分手順書完成（チェックリスト）
- **DoD**: 初見でも運用できる

### EPIC L：UAT・Go/No-Go（Sprint3）

#### L1. UATシナリオ自動化（主要フロー）
- **優先度**: P0 / **工数**: 1d / **依存**: E3, F2, G2, H1〜3
- **AC**: 5ケース自動E2E（作成→承認→公開／課金→停止 等）
- **DoD**: CIで緑・スクショ保存

#### L2. Go/No-Go ゲート & リリースノート
- **優先度**: P0 / **工数**: 0.5d / **依存**: L1
- **AC**: KPI/Preflight/セキュリティ項目チェック済
- **DoD**: リリースノート公開・タグ付け

## 推奨スプリント割り当て

### Sprint1（基盤）
**タスク**: A1–A4, B1, C1–C3, D1–D2

### Sprint2（公開/決済/承認）
**タスク**: E1–E4, F1–F3, G1–G3, J1, K1

### Sprint3（入力支援/拡張/UAT）
**タスク**: H1–H3, I1–I2, J2–J3, K2–K3, L1–L2

## 受け入れテスト（UAT）

### 主要シナリオ
1. **新規企業作成** → 必須入力 → プレビュー → 承認メール → 公開
2. **JSON-LD検証PASS**（主要3テンプレ＋CaseStudy）
3. **サイトマップ更新** → Search Consoleへ送信（自社ドメイン自動）
4. **RLS**：他社データへアクセス不可
5. **Stripe**：課金→Active→公開、解約→Paused→noindex/JSON-LD非出力
6. **空値省略**の単体テスト（テンプレごとSnapshot）
7. **URL健全性**：HEAD 200/301/308のみ許可、4xx/5xxは公開ブロック
8. **OGP生成成功**＆画像最適化のPreflight通過

## ラベル例（GitHub）

### エリア
`area:db` `area:auth` `area:ui` `area:api` `area:billing` `area:seo` `area:ops`

### タイプ
`type:feature` `type:bug` `type:chore` `type:sop` `type:test`

### リスク
`risk:high` `risk:medium` `risk:low`

### 優先度
`priority:P0/P1/P2`

## 受け入れの共通テンプレ（Issueに貼る）

### AC（受け入れ条件）
- [ ] 仕様どおりの入力バリデーション
- [ ] JSON-LD内部検証PASS（空キーなし）
- [ ] 権限/RLSユニットテスト緑
- [ ] LCP < 2.5s（公開ページ）
- [ ] ログ/監視にエラーなし

### DoD（完了の定義）
- [ ] コード／テスト／ドキュメント（SOP含む）更新
- [ ] スクショ or 動画付き
- [ ] ステージングにデプロイ済 & 動作確認
- [ ] リリースノート追記