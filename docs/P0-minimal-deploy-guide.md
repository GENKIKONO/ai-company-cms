# P0最小スコープ安定版 - 最小デプロイガイド

## 🎯 目標
**一発で安定稼働する認証システム**を本番環境に導入

## 📋 実行手順

### Step 1: SQLトリガー設定（必須）

1. **Supabase Dashboard アクセス**
   - プロジェクトダッシュボード → **SQL Editor**

2. **SQLスクリプト実行**
   ```sql
   -- sql/auth-trigger-setup.sql の内容を貼り付けて実行
   
   -- 1. トリガー関数作成（冪等性対応）
   create or replace function public.handle_new_user()
   returns trigger
   language plpgsql
   security definer
   as $$
   begin
     insert into public.app_users (id, email, role, created_at, updated_at)
     values (
       new.id, 
       new.email, 
       'org_owner',
       now(),
       now()
     )
     on conflict (id) do update set
       email = new.email,
       updated_at = now();
     
     return new;
   end;
   $$;

   -- 2. トリガー再作成
   drop trigger if exists on_auth_user_created on auth.users;
   create trigger on_auth_user_created
   after insert on auth.users
   for each row execute function public.handle_new_user();

   -- 3. RLSポリシー設定
   alter table public.app_users enable row level security;
   
   create policy "Users can view own profile"
     on public.app_users for select using (auth.uid() = id);
   
   create policy "Users can update own profile" 
     on public.app_users for update using (auth.uid() = id);
   
   create policy "Service role can manage all profiles"
     on public.app_users for all using (auth.role() = 'service_role');
   ```

3. **実行確認**
   ```sql
   -- トリガー確認
   select tgname from pg_trigger where tgname = 'on_auth_user_created';
   -- 期待結果: 1件
   
   -- RLSポリシー確認
   select policyname from pg_policies where tablename = 'app_users';
   -- 期待結果: 3件
   ```

### Step 2: Supabase設定確認

1. **Authentication → URL Configuration**
   ```
   Site URL: https://aiohub.jp
   Redirect URLs: https://aiohub.jp/*
   ```

2. **Email Templates 日本語化確認**
   - Confirm signup: 「AIO Hubへようこそ」
   - Reset password: 「パスワードリセット」

### Step 3: コードデプロイ確認

**重要**: 以下のファイルが最新版になっていることを確認
- `/src/app/auth/login/page.tsx` - `/api/auth/sync` 非依存
- `/src/app/api/auth/resend-confirmation/route.ts` - 424エラー対策済み
- `/src/app/api/auth/reset-password/route.ts` - 405エラー対策済み

### Step 4: 本番テスト実行

**テスト順序**: 必ず以下の順番で実行
1. **Test Case 1**: 新規ユーザー登録フロー
2. **Test Case 2**: 既存ユーザー（重複登録）
3. **Test Case 3**: メール期限切れ・再送信

**各テスト**:
- `docs/P0-auth-test-checklist.md` の全項目をチェック
- 🖼️ スクリーンショット確認点で証跡取得
- SQLクエリでDB状態確認

## ✅ 成功基準

### 技術成功（全項目必須）
- [ ] **3テストケース全完了**: 全パターンでダッシュボード到達
- [ ] **API非依存確認**: `/api/auth/sync` リクエスト発生ゼロ  
- [ ] **DBトリガー動作**: プロフィール自動作成 (`role = 'org_owner'`)
- [ ] **RLS動作確認**: ユーザー自身のみアクセス可能
- [ ] **セッション保持**: ページリロード後もログイン維持

### ビジネス成功（UX確認）
- [ ] **日本語メッセージ**: 全エラーが適切な日本語表示
- [ ] **高速レスポンス**: ログイン→ダッシュボード 2秒以内
- [ ] **メール受信**: Subject「AIO Hubへようこそ」で正常受信
- [ ] **エラー処理**: 重複登録・未確認で適切なエラー表示

## 🚨 失敗パターン（即座に原因調査）

**絶対NGな症状**:
- ❌ `/api/auth/sync` へのリクエストが発生
- ❌ 「Auth session missing」エラー表示
- ❌ ログイン後リダイレクトループ
- ❌ `app_users` テーブルレコード未作成
- ❌ ダッシュボードから強制ログアウト

## 📊 導入完了判定

### 🎯 P0達成条件
✅ **最小スコープ**: 認証機能のみ（管理機能等なし）  
✅ **最大安定**: `/api/auth/sync` 削除による障害リスク排除  
✅ **標準準拠**: Supabase公式推奨パターン準拠  
✅ **一発稼働**: テスト全項目クリア

**→ 上記4条件達成 = P0「最小スコープ安定版」完全導入完了**

## 🔧 トラブルシューティング

### SQLトリガー未作成の場合
```sql
-- 手動でapp_usersレコード確認
SELECT id, email, role FROM app_users WHERE email = 'test@example.com';
-- 空の場合: トリガー未動作、SQL再実行
```

### セッションエラーの場合
1. ブラウザのSession Storage確認
2. F12 → Application → Session Storage → supabase.auth.token 存在確認
3. 存在しない場合: ログイン処理に問題あり

### メール未受信の場合
1. Supabase Dashboard → Authentication → Logs で送信ログ確認
2. Email Templates設定再確認
3. Site URL / Redirect URLs再確認

---

**🎯 このガイドで P0最小スコープ安定版が本番で一発稼働します**