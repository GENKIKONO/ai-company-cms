# Supabase認証設定手順書（商用レベル完全版）

## 概要
商用レベルの認証システムをSupabaseで構築するための設定手順書。
プロジェクトID: `chyicolujwhkycpkxbej`

## 1. Authentication URL設定

**Supabase Dashboard** → **Authentication** → **URL Configuration**

### 必須設定項目
```
Site URL: https://aiohub.jp
Redirect URLs: https://aiohub.jp/*
Default redirect URL: https://aiohub.jp
```

### ⚠️ 注意事項
- プレビュービルドでもlocalhostは設定しない
- 全環境で`https://aiohub.jp`を使用してリンク誤送信を防止
- ワイルドカード`/*`は認証後の遷移先を柔軟にサポート

## 2. Email Templates設定

**Supabase Dashboard** → **Authentication** → **Email Templates**

### Confirm signup（メールアドレス確認）
```
Subject: 【AIO Hub】メールアドレスの確認をお願いします

Body:
AIO Hubへのご登録ありがとうございます。

下記のリンクをクリックして、メールアドレスの確認を完了してください：
{{ .ConfirmationURL }}

このリンクは24時間有効です。

━━━━━━━━━━━━━━━━━━━━
AIO Hub チーム
https://aiohub.jp
━━━━━━━━━━━━━━━━━━━━
```

### Reset password（パスワードリセット）
```
Subject: 【AIO Hub】パスワードリセットのご案内

Body:
パスワードリセットのご依頼を受け付けました。

下記のリンクをクリックして、新しいパスワードを設定してください：
{{ .ConfirmationURL }}

このリンクは1時間有効です。
お心当たりがない場合は、このメールを無視してください。

━━━━━━━━━━━━━━━━━━━━
AIO Hub チーム
https://aiohub.jp
━━━━━━━━━━━━━━━━━━━━
```

### Invite user（招待）
```
Subject: 【AIO Hub】チームへの招待

Body:
{{ .SiteURL }}への招待が届いています。

下記のリンクをクリックして、アカウントを作成してください：
{{ .ConfirmationURL }}

このリンクは72時間有効です。

━━━━━━━━━━━━━━━━━━━━
AIO Hub チーム
https://aiohub.jp
━━━━━━━━━━━━━━━━━━━━
```

## 3. DBトリガー設定

**Supabase Dashboard** → **SQL Editor** で実行：

```sql
-- 詳細は supabase/sql/auth-trigger-setup.sql を参照
-- ここでは概要のみ記載

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'org_owner', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. SMTP設定

### 推奨設定
- **SMTP**: OFF（Supabase標準メール使用）
- **Custom SMTP**: 使用しない（Resendは補助通知のみ）

### 理由
- Supabaseの標準メール配信は認証リンクのセキュリティが確実
- Resendは見た目向上のための補助通知として活用
- 二重送信を避けてユーザー体験を最適化

## 5. Security設定

### Row Level Security（RLS）
```sql
-- app_usersテーブルのRLS有効化
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（詳細はマイグレーションSQL参照）
CREATE POLICY "Users can view own profile" ON public.app_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.app_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage all profiles" ON public.app_users FOR ALL USING (auth.role() = 'service_role');
```

## 6. API Keys確認

以下の環境変数が設定されていることを確認：

```env
NEXT_PUBLIC_SUPABASE_URL=https://chyicolujwhkycpkxbej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```