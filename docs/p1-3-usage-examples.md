# P1-3 使用例: 権限ガード関数とJSONB更新ヘルパー

## SSRページでの使用例

### 1. 組織メンバー限定ページの例

```tsx
// app/dashboard/interview/page.tsx
import { requireOrgMember, handleAuthErrorForSSR } from '@/lib/auth/server';
import { updateOrgFeatureFlags } from '@/lib/server/jsonb-update';

interface PageProps {
  searchParams: { orgId: string };
}

export default async function InterviewDashboardPage({ searchParams }: PageProps) {
  const { orgId } = searchParams;
  
  try {
    // P1-3: 組織メンバーシップを要求
    const { user, organization } = await requireOrgMember(orgId);
    
    return (
      <div>
        <h1>{organization.name} - Interview Dashboard</h1>
        <p>Welcome, {user.email}</p>
        {/* メンバー限定コンテンツ */}
      </div>
    );
  } catch (error) {
    // P1-3: SSR用エラーハンドリング（リダイレクト）
    handleAuthErrorForSSR(error as Error, `/dashboard/interview?orgId=${orgId}`);
  }
}
```

### 2. 管理者権限が必要なページの例

```tsx
// app/admin/org-settings/[orgId]/page.tsx
import { requireOrgRole, handleAuthErrorForSSR } from '@/lib/auth/server';

interface PageProps {
  params: { orgId: string };
}

export default async function OrgSettingsPage({ params }: PageProps) {
  const { orgId } = params;
  
  try {
    // P1-3: admin以上の権限を要求
    const { user, organization, role } = await requireOrgRole(orgId, ['owner', 'admin']);
    
    return (
      <div>
        <h1>Settings for {organization.name}</h1>
        <p>Logged in as {user.email} (Role: {role})</p>
        {/* 管理者限定設定UI */}
      </div>
    );
  } catch (error) {
    handleAuthErrorForSSR(error as Error, `/admin/org-settings/${orgId}`);
  }
}
```

## API Routeでの使用例

### 1. 組織メンバー限定APIの例

```tsx
// app/api/my/interview/session/route.ts
import { NextRequest } from 'next/server';
import { requireOrgMember, createAuthErrorResponse } from '@/lib/auth/server';
import { updateOrgFeatureFlags } from '@/lib/server/jsonb-update';

export async function POST(request: NextRequest) {
  try {
    const { orgId, sessionData } = await request.json();
    
    // P1-3: 組織メンバーシップを要求
    const { user, organization } = await requireOrgMember(orgId);
    
    // セッション作成ロジック
    // ...
    
    // P1-3: JSONB部分更新 - セッション統計を更新
    const updateResult = await updateOrgFeatureFlags(orgId, {
      'interview_sessions_count': (organization.feature_flags?.interview_sessions_count || 0) + 1,
      'last_session_date': new Date().toISOString()
    });
    
    if (!updateResult.success) {
      console.error('Failed to update session stats:', updateResult.error);
    }
    
    return Response.json({ 
      success: true, 
      sessionId: 'session_123',
      organization: organization.name 
    });
  } catch (error) {
    // P1-3: API用エラーハンドリング（JSONレスポンス）
    return createAuthErrorResponse(error as Error);
  }
}
```

### 2. 管理者権限が必要なAPIの例

```tsx
// app/api/admin/org-config/route.ts
import { NextRequest } from 'next/server';
import { requireOrgRole, createAuthErrorResponse } from '@/lib/auth/server';
import { updateOrgEntitlements, setOrgNestedEntitlement } from '@/lib/server/jsonb-update';

export async function PATCH(request: NextRequest) {
  try {
    const { orgId, configUpdates } = await request.json();
    
    // P1-3: owner/admin権限を要求
    const { user, organization, role } = await requireOrgRole(orgId, ['owner', 'admin']);
    
    // P1-3: JSONB部分更新 - entitlements更新
    const result = await updateOrgEntitlements(orgId, {
      'api_rate_limit': configUpdates.apiRateLimit,
      'storage_quota_gb': configUpdates.storageQuota,
      'updated_by': user.id,
      'updated_at': new Date().toISOString()
    });
    
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    // ネストされた設定の更新例
    if (configUpdates.limits) {
      await setOrgNestedEntitlement(orgId, ['limits', 'monthly_tokens'], configUpdates.limits.monthlyTokens);
    }
    
    return Response.json({ 
      success: true, 
      message: `Configuration updated by ${user.email} (${role})` 
    });
  } catch (error) {
    return createAuthErrorResponse(error as Error);
  }
}
```

### 3. 単純認証が必要なAPIの例

```tsx
// app/api/profile/route.ts
import { NextRequest } from 'next/server';
import { requireAuthUser, createAuthErrorResponse } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    // P1-3: 基本認証のみ要求
    const user = await requireAuthUser();
    
    return Response.json({ 
      id: user.id,
      email: user.email,
      role: user.appRole
    });
  } catch (error) {
    return createAuthErrorResponse(error as Error);
  }
}
```

## エラーハンドリングパターン

### SSRでのパターン

- **認証エラー**: `/auth/login?redirect=現在のパス` にリダイレクト
- **組織アクセスエラー**: `/404` にリダイレクト  
- **ロール不足エラー**: `/404` にリダイレクト

### APIでのパターン

- **認証エラー**: `401 Unauthorized` + JSON
- **組織アクセスエラー**: `403 Forbidden` + JSON
- **ロール不足エラー**: `403 Forbidden` + JSON（詳細情報付き）

## JSONB更新ヘルパーの活用例

### feature_flagsの操作

```typescript
// 単一フラグの設定
await setOrgFeatureFlag(orgId, 'ai_enabled', true);

// 複数フラグのまとめて更新
await updateOrgFeatureFlags(orgId, {
  'ai_enabled': true,
  'premium_features': true,
  'updated_at': new Date().toISOString()
});

// フラグの削除
await removeOrgFeatureFlagKeys(orgId, ['deprecated_flag', 'old_setting']);
```

### entitlementsのネスト操作

```typescript
// ネストされた制限値の設定
await setOrgNestedEntitlement(orgId, ['limits', 'api_calls_per_month'], 10000);
await setOrgNestedEntitlement(orgId, ['limits', 'storage_gb'], 100);

// 複数entitlementsの更新
await updateOrgEntitlements(orgId, {
  'plan_tier': 'premium',
  'billing_cycle': 'monthly',
  'expires_at': '2024-12-31'
});
```

## 置き換え手順と注意点

### 既存コードからの移行

1. **個別認証チェックの置き換え**
   ```typescript
   // 旧: 個別実装
   const user = await getServerUser();
   if (!user) redirect('/login');
   
   // 新: P1-3標準
   const user = await requireAuthUser();
   ```

2. **組織権限チェックの統一**
   ```typescript
   // 旧: バラバラな実装
   const user = await getUser();
   const isMember = await checkOrgMembership(user.id, orgId);
   if (!isMember) throw new Error('Access denied');
   
   // 新: P1-3標準
   const { user, organization } = await requireOrgMember(orgId);
   ```

### 注意点

1. **既存のエラーハンドリングとの競合**
   - P1-3のエラーハンドリングが既存のtry-catch構造と競合しないよう注意
   - 段階的に移行することを推奨

2. **RLSとの整合性**
   - P1-3の権限チェックはアプリレベル
   - Supabase RLSは引き続き最終的な防御として機能

3. **パフォーマンス**
   - 組織情報の重複取得を避けるため、可能な限り返り値を再利用
   - 必要に応じてキャッシュ戦略を検討

4. **テスト戦略**
   - 各権限レベルでの動作テストが必要
   - エラーハンドリングのテストも重要

## エラーハンドリングとセキュリティ

### 404 と 403 の使い分けルール

P1-3 では、セキュリティ重視でエラーハンドリング方針を統一しています：

#### SSR（Server-Side Rendering）ページ

- **認証エラー**: `/auth/login?redirect=現在のパス` にリダイレクト (UX重視)
- **組織アクセスエラー**: `/404` にリダイレクト (セキュリティ重視)
- **ロール不足エラー**: `/404` にリダイレクト (セキュリティ重視)

**理由**: 一般ユーザー向けページでは、組織の存在自体を隠すことでセキュリティを確保

#### API Route

- **認証エラー**: `401 Unauthorized` + JSON
- **組織アクセスエラー**: `403 Forbidden` + JSON（詳細情報は最小限）
- **ロール不足エラー**: `403 Forbidden` + JSON（開発用の詳細情報付き）

**理由**: API は開発者が使用する前提なので、デバッグに必要な情報は提供する

### RLS による制約の考慮

Supabase の RLS（Row Level Security）により、以下のケースが発生する可能性があります：

#### 「存在しても見えない」ケース

```typescript
// ケース1: 組織は存在するが、ユーザーがメンバーでない
const { data: org } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId)
  .single();
// → RLS により null が返される（組織は実在する）

// ケース2: アプリ側で明示的にメンバーシップをチェック
const isMember = await isOrgMember(userId, orgId);
if (!isMember) {
  // → この場合は 403 を返すことも可能
}
```

#### 推奨パターン

**一般ユーザー向け**:
```typescript
// 常に 404 で統一（組織の存在を隠蔽）
if (!organization || !isMember) {
  redirect('/404');
}
```

**管理ダッシュボード**:
```typescript
// 組織の存在が前提の管理画面では 403 も検討可能
if (!organization) {
  redirect('/404'); // 組織が存在しない
}
if (!isMember) {
  redirect('/403'); // 権限不足（組織は存在する）
}
```

### セキュリティベストプラクティス

1. **情報漏洩防止**: 組織の存在確認に使われないよう、基本的に 404 で統一
2. **RLS との連携**: アプリ層の権限チェックは RLS の追加防御として機能
3. **エラーメッセージの最小化**: 攻撃者に有用な情報を与えない
4. **ログ記録**: セキュリティイベントは適切にログに記録（ユーザーには見せない）

## TODO: 確認が必要な事項

- [ ] `profiles` テーブルと `app_users` テーブルの整合性確認
- [ ] JSONB更新用のRPC関数の実装確認  
- [ ] 既存の認証フローとの整合性確認
- [ ] セキュリティポリシーの詳細レビュー