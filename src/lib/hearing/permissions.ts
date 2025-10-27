/**
 * ヒアリング代行サービス権限制御システム
 * RBAC（ロールベースアクセス制御）実装
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// 権限レベル定義
export enum HearingRole {
  CLIENT = 'client',           // 依頼者（組織オーナー）
  HEARING_AGENT = 'hearing_agent', // 代行者
  ADMIN = 'admin',             // システム管理者
  REVIEWER = 'reviewer'        // 法務・コンプライアンス担当
}

// アクション定義
export enum HearingAction {
  // 委任関連
  CREATE_DELEGATION = 'create_delegation',
  REVOKE_DELEGATION = 'revoke_delegation',
  VIEW_DELEGATION = 'view_delegation',
  
  // 下書き関連
  CREATE_DRAFT = 'create_draft',
  UPDATE_DRAFT = 'update_draft',
  VIEW_DRAFT = 'view_draft',
  DELETE_DRAFT = 'delete_draft',
  
  // 承認フロー
  SUBMIT_DRAFT = 'submit_draft',
  APPROVE_DRAFT = 'approve_draft',
  REJECT_DRAFT = 'reject_draft',
  PUBLISH_DRAFT = 'publish_draft',
  
  // 監査・管理
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EMERGENCY_STOP = 'emergency_stop',
  BULK_OPERATIONS = 'bulk_operations'
}

// リソースタイプ
export enum ResourceType {
  DELEGATION = 'delegation',
  DRAFT = 'draft',
  ORGANIZATION = 'organization',
  AUDIT_LOG = 'audit_log'
}

// 権限マトリックス
const PERMISSION_MATRIX: Record<HearingRole, HearingAction[]> = {
  [HearingRole.CLIENT]: [
    HearingAction.CREATE_DELEGATION,
    HearingAction.REVOKE_DELEGATION,
    HearingAction.VIEW_DELEGATION,
    HearingAction.VIEW_DRAFT,
    HearingAction.APPROVE_DRAFT,
    HearingAction.REJECT_DRAFT,
    HearingAction.PUBLISH_DRAFT
  ],
  [HearingRole.HEARING_AGENT]: [
    HearingAction.VIEW_DELEGATION,
    HearingAction.CREATE_DRAFT,
    HearingAction.UPDATE_DRAFT,
    HearingAction.VIEW_DRAFT,
    HearingAction.SUBMIT_DRAFT,
    HearingAction.DELETE_DRAFT
  ],
  [HearingRole.ADMIN]: [
    ...Object.values(HearingAction) // 全権限
  ],
  [HearingRole.REVIEWER]: [
    HearingAction.VIEW_DELEGATION,
    HearingAction.VIEW_DRAFT,
    HearingAction.VIEW_AUDIT_LOGS,
    HearingAction.EMERGENCY_STOP
  ]
};

// 禁止操作（絶対に許可されない組み合わせ）
const FORBIDDEN_OPERATIONS: Array<{
  role: HearingRole;
  action: HearingAction;
  resource: ResourceType;
  reason: string;
}> = [
  {
    role: HearingRole.HEARING_AGENT,
    action: HearingAction.PUBLISH_DRAFT,
    resource: ResourceType.DRAFT,
    reason: '代行者は公開権限を持ちません（依頼者承認必須）'
  },
  {
    role: HearingRole.HEARING_AGENT,
    action: HearingAction.APPROVE_DRAFT,
    resource: ResourceType.DRAFT,
    reason: '代行者は自分の作成した下書きを承認できません'
  }
];

// 権限チェック関数
export async function checkHearingPermission(
  userId: string,
  action: HearingAction,
  resourceType: ResourceType,
  resourceId?: string,
  organizationId?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  delegationRequired?: boolean;
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ユーザーの基本ロールを取得
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return { allowed: false, reason: 'ユーザーが見つかりません' };
    }

    const baseRole = user.user.app_metadata?.role || 'user';
    
    // システム管理者は常に許可
    if (baseRole === 'admin') {
      return { allowed: true };
    }

    // 禁止操作チェック
    const forbidden = FORBIDDEN_OPERATIONS.find(
      op => op.action === action && op.resource === resourceType
    );
    
    if (forbidden) {
      return { allowed: false, reason: forbidden.reason };
    }

    // リソース固有の権限チェック
    switch (resourceType) {
      case ResourceType.DELEGATION:
        return await checkDelegationPermission(supabase, userId, action, resourceId);
        
      case ResourceType.DRAFT:
        return await checkDraftPermission(supabase, userId, action, resourceId);
        
      case ResourceType.ORGANIZATION:
        return await checkOrganizationPermission(supabase, userId, action, organizationId);
        
      case ResourceType.AUDIT_LOG:
        return await checkAuditLogPermission(supabase, userId, action);
        
      default:
        return { allowed: false, reason: '無効なリソースタイプです' };
    }

  } catch (error) {
    logger.error('Permission check error', error instanceof Error ? error : new Error(String(error)));
    return { allowed: false, reason: '権限チェック中にエラーが発生しました' };
  }
}

// 委任権限チェック
async function checkDelegationPermission(
  supabase: any,
  userId: string,
  action: HearingAction,
  delegationId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  switch (action) {
    case HearingAction.CREATE_DELEGATION:
      // 組織オーナーまたは本人のみ委任作成可能
      return { allowed: true }; // 詳細チェックはAPI側で実施
      
    case HearingAction.REVOKE_DELEGATION:
    case HearingAction.VIEW_DELEGATION:
      if (!delegationId) {
        return { allowed: false, reason: '委任IDが必要です' };
      }
      
      // 委任の関係者（依頼者・代行者）のみアクセス可能
      const { data: delegation } = await supabase
        .from('hearing_delegations')
        .select('client_user_id, hearing_agent_id')
        .eq('id', delegationId)
        .single();
        
      if (!delegation) {
        return { allowed: false, reason: '委任が見つかりません' };
      }
      
      const isRelated = delegation.client_user_id === userId || 
                       delegation.hearing_agent_id === userId;
      
      return { 
        allowed: isRelated, 
        reason: isRelated ? undefined : 'この委任にアクセスする権限がありません' 
      };
      
    default:
      return { allowed: false, reason: '無効な委任アクションです' };
  }
}

// 下書き権限チェック
async function checkDraftPermission(
  supabase: any,
  userId: string,
  action: HearingAction,
  draftId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!draftId && action !== HearingAction.CREATE_DRAFT) {
    return { allowed: false, reason: '下書きIDが必要です' };
  }

  switch (action) {
    case HearingAction.CREATE_DRAFT:
      // 有効な委任があれば作成可能（詳細チェックはAPI側）
      return { allowed: true };
      
    case HearingAction.VIEW_DRAFT:
    case HearingAction.UPDATE_DRAFT:
    case HearingAction.DELETE_DRAFT:
    case HearingAction.SUBMIT_DRAFT:
      // 下書きの作成者または委任の関係者のみ
      const { data: draft } = await supabase
        .from('hearing_drafts')
        .select(`
          created_by,
          hearing_delegations (
            client_user_id,
            hearing_agent_id
          )
        `)
        .eq('id', draftId)
        .single();
        
      if (!draft) {
        return { allowed: false, reason: '下書きが見つかりません' };
      }
      
      const delegation = draft.hearing_delegations;
      const hasAccess = draft.created_by === userId ||
                       delegation.client_user_id === userId ||
                       delegation.hearing_agent_id === userId;
      
      return { 
        allowed: hasAccess, 
        reason: hasAccess ? undefined : 'この下書きにアクセスする権限がありません' 
      };
      
    case HearingAction.APPROVE_DRAFT:
    case HearingAction.REJECT_DRAFT:
    case HearingAction.PUBLISH_DRAFT:
      // 依頼者（クライアント）のみ
      const { data: approvalDraft } = await supabase
        .from('hearing_drafts')
        .select(`
          hearing_delegations (
            client_user_id
          )
        `)
        .eq('id', draftId)
        .single();
        
      if (!approvalDraft) {
        return { allowed: false, reason: '下書きが見つかりません' };
      }
      
      const isClient = approvalDraft.hearing_delegations.client_user_id === userId;
      
      return { 
        allowed: isClient, 
        reason: isClient ? undefined : '承認・公開は依頼者のみ可能です' 
      };
      
    default:
      return { allowed: false, reason: '無効な下書きアクションです' };
  }
}

// 組織権限チェック
async function checkOrganizationPermission(
  supabase: any,
  userId: string,
  action: HearingAction,
  organizationId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!organizationId) {
    return { allowed: false, reason: '組織IDが必要です' };
  }

  // 組織オーナーチェック
  const { data: organization } = await supabase
    .from('organizations')
    .select('created_by')
    .eq('id', organizationId)
    .single();
    
  if (!organization) {
    return { allowed: false, reason: '組織が見つかりません' };
  }
  
  const isOwner = organization.created_by === userId;
  
  return { 
    allowed: isOwner, 
    reason: isOwner ? undefined : 'この組織の管理権限がありません' 
  };
}

// 監査ログ権限チェック
async function checkAuditLogPermission(
  supabase: any,
  userId: string,
  action: HearingAction
): Promise<{ allowed: boolean; reason?: string }> {
  // 管理者またはレビューワーのみ監査ログにアクセス可能
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  const role = user?.user.app_metadata?.role;
  
  const hasAccess = role === 'admin' || role === 'reviewer';
  
  return { 
    allowed: hasAccess, 
    reason: hasAccess ? undefined : '監査ログへのアクセス権限がありません' 
  };
}

// 委任チェックヘルパー
export async function checkActiveDelegation(
  userId: string,
  organizationId: string,
  requiredScope: string[]
): Promise<{
  valid: boolean;
  delegation?: any;
  reason?: string;
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: delegation, error } = await supabase
      .from('hearing_delegations')
      .select('*')
      .eq('hearing_agent_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error || !delegation) {
      return { valid: false, reason: '有効な委任が見つかりません' };
    }

    // 期限チェック
    if (delegation.expires_at && new Date(delegation.expires_at) < new Date()) {
      return { valid: false, reason: '委任の有効期限が切れています' };
    }

    // スコープチェック
    const hasRequiredScope = requiredScope.every(scope => delegation.scope.includes(scope));
    if (!hasRequiredScope) {
      return { valid: false, reason: '委任範囲外の操作です' };
    }

    return { valid: true, delegation };

  } catch (error) {
    logger.error('Delegation check error', error instanceof Error ? error : new Error(String(error)));
    return { valid: false, reason: '委任チェック中にエラーが発生しました' };
  }
}

// セキュリティヘルパー：IPアドレス制限
export function checkIPRestriction(clientIP: string, allowedIPs?: string[]): boolean {
  if (!allowedIPs || allowedIPs.length === 0) {
    return true; // 制限なし
  }
  
  return allowedIPs.includes(clientIP);
}

// セキュリティヘルパー：レート制限チェック
export async function checkRateLimit(
  userId: string,
  action: HearingAction,
  windowMinutes: number = 60,
  maxAttempts: number = 10
): Promise<{ allowed: boolean; remaining?: number }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data: attempts, error } = await supabase
      .from('hearing_audit_logs')
      .select('id')
      .eq('actor_id', userId)
      .eq('action', action)
      .gte('timestamp', windowStart);

    if (error) {
      logger.error('Rate limit check error', error instanceof Error ? error : new Error(String(error)));
      return { allowed: true }; // エラー時は制限なし
    }

    const currentAttempts = attempts?.length || 0;
    const remaining = Math.max(0, maxAttempts - currentAttempts);

    return {
      allowed: currentAttempts < maxAttempts,
      remaining
    };

  } catch (error) {
    logger.error('Rate limit check error', error instanceof Error ? error : new Error(String(error)));
    return { allowed: true };
  }
}