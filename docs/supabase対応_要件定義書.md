# Supabase対応_要件定義書

## 1. 目的

Supabase修正完了後に、DB依存機能を安全に再有効化するための手順と要件を明確化する。
**この文書は、Supabase対応完了後に即座に開発を再開できるようにすることを目的とする。**

---

## 2. 対象範囲

- **対象Phase**: Phase 2, 3, 4（DB依存機能）
- **非対象**: Phase 1, 5（DB非依存機能 - 既に稼働中）
- **現行料金体系**: Starter ¥2,980 / Pro ¥8,000 / Business ¥15,000 / Enterprise カスタム

---

## 3. 現在の実装状況概要

### ✅ 完全稼働中（DB制約なし）
- **Phase 1**: AI可視化UI、レポート表示、基本分析API
- **Phase 4**: パートナー型定義、UI雛形、API雛形
- **Phase 5**: 監視ライブラリ、アラートAPI雛形、ヘルスチェックAPI

### ⚠️ 実装済み・DB待機中
- **Phase 2**: 審査履歴、再審査API、ReportFilters
- **Phase 3**: 月次レポート生成ライブラリ、Cronジョブ、ダッシュボードUI

---

## 4. 実行条件と注意事項

### 🚨 実行前必須確認事項
1. **Supabaseサポート作業完了確認**
   - サポートチームからの「作業完了」通知受領
   - 管理画面でのテーブル一覧正常表示確認

2. **SQL実行の絶対禁止事項**
   - `auth` スキーマへの一切の操作禁止
   - 認証関連テーブルの変更禁止
   - RLS設定の無断変更禁止

### ⚡ 安全な実行手順
1. **段階的実行**: Phase 2 → Phase 3 → Phase 4 の順序で実行
2. **バックアップ**: 各フェーズ実行前にSupabaseバックアップ確認
3. **動作確認**: 各テーブル作成後、即座にAPI動作確認実施
4. **ロールバック準備**: 問題発生時のテーブル削除SQL準備

---

## 5. DB依存機能一覧（有効化条件付き）

| 機能名 | 関連Phase | 依存テーブル | Supabase修正後の有効化条件 | 実行者 | 状態 |
|---------|------------|--------------|----------------------------|---------|-------|
| 審査履歴API | Phase 2 | `review_audit` | テーブル作成+RLS設定完了後 | 人間（SQL実行） | 🔴 待機中 |
| 再審査機能 | Phase 2 | `review_audit` | テーブル作成+RLS設定完了後 | 人間（SQL実行） | 🔴 待機中 |
| 月次レポート生成 | Phase 3 | `monthly_reports` | テーブル作成+RLS設定完了後 | 人間（SQL実行） | 🔴 待機中 |
| Cronジョブ | Phase 3 | `monthly_reports` | テーブル作成完了後 | 人間（SQL実行） | 🔴 待機中 |
| レポートダッシュボード | Phase 3 | `monthly_reports` | テーブル作成完了後 | 人間（SQL実行） | 🔴 待機中 |
| パートナー管理（完全版） | Phase 4 | `partners` 群 | Supabase完了+認証確認後 | 人間（SQL実行） | ⏳ 計画中 |
| 紹介・手数料機能 | Phase 4 | `partner_referrals`, `commissions` | Phase4基本テーブル完了後 | 人間（SQL実行） | ⏳ 計画中 |
| アラート・監視（完全版） | Phase 5 | `alerts`, `metrics` | 運用安定後に段階実行 | 人間（SQL実行） | ⏳ 後回し |

---

## 6. 段階的有効化計画

### 🎯 Phase 2: 通報・承認フロー（優先度：最高）

#### 実行条件
- Supabaseサポート作業完了
- 既存テーブル（`organizations`, `app_users`）の正常動作確認

#### 実行SQL
```sql
-- Step 1: review_audit テーブル作成
CREATE TABLE review_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes', 'reopen')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT CHECK (category IN ('fake_info', 'inappropriate', 'copyright', 'spam', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: RLS設定
ALTER TABLE review_audit ENABLE ROW LEVEL SECURITY;

-- Step 3: Admin専用ポリシー
CREATE POLICY "review_audit_admin_access" ON review_audit FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.id = auth.uid() AND app_users.role = 'admin'
));
```

#### 有効化される機能
- 審査履歴表示（`/admin/reviews/history`）
- 再審査API（`/api/admin/reviews/reopen`）
- ReportFilters完全版

#### 動作確認方法
```bash
# 1. API動作確認
curl GET "/api/admin/reviews/history?organization_id=SAMPLE_ORG_ID"

# 2. UI確認
# /admin/reviews/history ページで履歴表示確認

# 3. 再審査機能確認
# 承認済み組織の再審査実行確認
```

---

### 🎯 Phase 3: 月次レポート機能（優先度：高）

#### 実行条件
- Phase 2 完了・動作確認済み
- 既存データの整合性確認

#### 実行SQL
```sql
-- Step 1: monthly_reports テーブル作成
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  format TEXT NOT NULL DEFAULT 'html' CHECK (format IN ('html', 'pdf')),
  file_url TEXT,
  data_summary JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, year, month)
);

-- Step 2: RLS設定
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Step 3: 組織アクセスポリシー
CREATE POLICY "monthly_reports_org_access" ON monthly_reports FOR ALL TO authenticated 
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
    UNION
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Step 4: Admin全アクセスポリシー
CREATE POLICY "monthly_reports_admin_access" ON monthly_reports FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.id = auth.uid() AND app_users.role = 'admin'
));
```

#### 有効化される機能
- 月次レポート自動生成
- Cronジョブ（`/api/cron/monthly-report`）
- ダッシュボード（`/dashboard/reports`）
- PDF出力・メール送信

#### 動作確認方法
```bash
# 1. レポート生成API確認
curl POST "/api/my/reports" -d '{"year": 2025, "month": 11}'

# 2. ダッシュボード確認
# /dashboard/reports ページでレポート一覧表示確認

# 3. Cronジョブ確認（手動実行）
curl POST "/api/cron/monthly-report"
```

---

### 🎯 Phase 4: パートナー機能（優先度：中）

#### 実行条件
- Phase 3 完了・安定稼働確認（1週間程度）
- パートナー機能要件の最終確認

#### 実行SQL（段階的実行）
```sql
-- Step 1: partners 基本テーブル
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('agency', 'freelancer', 'consultant', 'integrator', 'reseller')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  contact_email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: partner_referrals テーブル
CREATE TABLE partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired', 'invalid')),
  conversion_date TIMESTAMP WITH TIME ZONE,
  lifetime_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: RLS設定
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

-- Step 4: ポリシー設定
CREATE POLICY "partners_self_access" ON partners FOR ALL TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "partners_admin_access" ON partners FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.id = auth.uid() AND app_users.role = 'admin'
));
```

#### 有効化される機能
- パートナー登録・管理
- 紹介コード追跡
- ダッシュボード完全版
- 成果管理

---

## 7. 旧定義ファイルの棚卸結果

| ファイル | 状況 | 対応方針 | 理由 |
|-----------|------|----------|------|
| `/docs/release/pricing_overhaul_changes.md` | ❌ 削除推奨 | 削除 | 旧料金体系（Free/Basic/Business/Enterprise）記載 |
| `/docs/release/pricing_overhaul_scan.md` | ❌ 削除推奨 | 削除 | 旧料金体系記載・一時的なスキャン結果 |
| `/docs/requirements_overview.md` | ⚠️ 要更新 | 修正 | ¥5,000/月単一プランの記載あり |
| `/docs/requirements_business.md` | ✅ 最新版 | 保持 | 現行料金体系（Starter/Pro/Business/Enterprise）記載済み |
| `/docs/requirements_system.md` | ✅ 最新版 | 保持 | 技術要件は最新 |
| `/docs/sprints.md` | ⚠️ 保留 | 保留 | 古いスプリント計画・参考資料として保持 |
| `/docs/implementation.md` | ✅ 最新版 | 保持 | 実装ガイドライン最新 |

---

## 8. 実行チェックリスト

### Phase 2 実行前チェック
- [ ] Supabaseサポート完了確認
- [ ] 既存テーブル正常動作確認
- [ ] バックアップ状況確認
- [ ] `review_audit` テーブル作成SQL準備完了
- [ ] RLSポリシーSQL準備完了
- [ ] 動作確認手順準備完了

### Phase 2 実行後チェック
- [ ] テーブル作成成功確認
- [ ] RLS設定確認
- [ ] 審査履歴API動作確認
- [ ] 再審査機能動作確認
- [ ] フロントエンドUI表示確認

### Phase 3 実行前チェック
- [ ] Phase 2 安定稼働確認（1-2日）
- [ ] `monthly_reports` テーブル作成SQL準備完了
- [ ] レポート生成ライブラリ動作確認
- [ ] Cronジョブ設定確認

### Phase 3 実行後チェック
- [ ] レポート生成API動作確認
- [ ] ダッシュボード表示確認
- [ ] PDF生成機能確認
- [ ] Cronジョブ動作確認

### Phase 4 実行前チェック
- [ ] Phase 3 安定稼働確認（1週間）
- [ ] パートナー機能要件最終確認
- [ ] `partners` 関連テーブル作成SQL準備完了

---

## 9. エラー時のロールバック手順

### テーブル削除SQL（緊急時用）
```sql
-- Phase 4 ロールバック
DROP TABLE IF EXISTS partner_referrals CASCADE;
DROP TABLE IF EXISTS partners CASCADE;

-- Phase 3 ロールバック  
DROP TABLE IF EXISTS monthly_reports CASCADE;

-- Phase 2 ロールバック
DROP TABLE IF EXISTS review_audit CASCADE;
```

### 緊急時連絡先
- **開発責任者**: [開発チーム責任者]
- **Supabaseサポート**: [サポートチケットシステム]
- **システム管理者**: [システム管理者]

---

## 10. 成功確認指標

### Phase 2 成功指標
- 審査履歴API応答時間 < 2秒
- 再審査機能エラー率 < 1%
- フロントエンドUI正常表示率 100%

### Phase 3 成功指標  
- 月次レポート生成成功率 > 98%
- Cronジョブ実行成功率 > 99%
- PDF生成成功率 > 95%

### Phase 4 成功指標
- パートナー登録成功率 > 99%
- 紹介追跡精度 100%
- ダッシュボード応答時間 < 3秒

---

**最終更新**: 2025年11月9日  
**次回更新予定**: Supabase対応完了後  
**文書管理者**: AIO Hub開発チーム