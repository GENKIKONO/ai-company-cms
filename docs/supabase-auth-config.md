# Supabase認証設定手順書 (P0最小スコープ)

## 1. DBトリガー設定

Supabase Dashboard → SQL Editor で以下を実行：

```sql
-- sql/auth-trigger-setup.sql の内容を実行
-- auth.usersに新規ユーザーが作成されたら、自動的にapp_usersに行を追加

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_users (id, role)
  values (new.id, 'org_owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

## 2. Authentication設定

Supabase Dashboard → Authentication → URL Configuration

```
Site URL: https://aiohub.jp
Redirect URLs: https://aiohub.jp/*
Default redirect URL: https://aiohub.jp
```

## 3. Email Templates設定

Supabase Dashboard → Authentication → Email Templates

### Confirm signup
```
Subject: AIO Hubへようこそ - メールアドレスを確認してください

Body:
アカウント登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：
{{ .ConfirmationURL }}

このリンクは24時間有効です。
```

### Reset password
```
Subject: パスワードリセット - AIO Hub

Body:
パスワードリセットのご依頼を受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
{{ .ConfirmationURL }}

このリンクは1時間有効です。
```

## 4. 設定確認

- [ ] DBトリガーが作成されている
- [ ] Site URL が https://aiohub.jp に設定されている
- [ ] Redirect URLs が https://aiohub.jp/* に設定されている
- [ ] Email Templates が日本語で設定されている

## 5. /api/auth/sync の扱い

**P0最小スコープでは使用しない**
- DBトリガーでプロフィール自動作成されるため不要
- APIは残すが、ログインフローから呼び出さない
- 将来の拡張時に再利用可能