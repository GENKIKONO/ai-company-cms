/**
 * AuthState - 認証〜ダッシュボード遷移の状態機械
 *
 * 【重要原則】
 * - この4状態以外は存在してはならない
 * - すべての判定はこの1箇所で行う
 * - dashboard/posts/services/faqs は戻り値だけを見る
 * - 個別に supabase を叩くことは禁止
 *
 * @see Phase 1-5 完了条件
 */

// =====================================================
// AuthState 定義（4状態のみ）
// =====================================================

export type AuthState =
  | 'UNAUTHENTICATED'        // Cookieなし
  | 'AUTH_FAILED'            // invalid_credentials 等
  | 'AUTHENTICATED_NO_ORG'   // ユーザーOK・組織未確定
  | 'AUTHENTICATED_READY';   // dashboard表示可能

// =====================================================
// AuthStateResult - 判定関数の戻り値
// =====================================================

export interface AuthStateResult {
  /** 現在の認証状態（4状態のいずれか） */
  authState: AuthState;
  /** Cookie が存在するか */
  hasCookie: boolean;
  /** supabase.auth.getUser() の結果 */
  getUserStatus: 'success' | 'error' | 'no_user';
  /** getUserError のメッセージ（エラー時のみ） */
  getUserError?: string;
  /** 組織メンバーシップの状態 */
  organizationStatus: 'ok' | 'missing' | 'error';
  /** なぜブロックされているか（人間が読める理由） */
  whyBlocked: string | null;
  /** ユーザーID（認証成功時のみ） */
  userId?: string;
  /** ユーザーEmail（認証成功時のみ） */
  userEmail?: string;
  /** 組織ID（組織確定時のみ） */
  organizationId?: string;
  /** リクエストID（エラー追跡用） */
  requestId: string;
}

// =====================================================
// 状態ごとの許可される挙動
// =====================================================

export const AUTH_STATE_BEHAVIORS = {
  UNAUTHENTICATED: {
    allowDBFetch: false,
    allowDashboard: false,
    action: 'redirect_to_login',
    description: 'Loginへ誘導のみ。DBアクセス禁止',
  },
  AUTH_FAILED: {
    allowDBFetch: false,
    allowDashboard: false,
    action: 'show_error',
    description: 'Login画面に errorCode を表示',
  },
  AUTHENTICATED_NO_ORG: {
    allowDBFetch: false,
    allowDashboard: false,
    action: 'show_no_org_screen',
    description: '「組織未設定」画面',
  },
  AUTHENTICATED_READY: {
    allowDBFetch: true,
    allowDashboard: true,
    action: 'allow_content',
    description: '初めてDB fetchを許可',
  },
} as const;

// =====================================================
// Helper: DB fetch が許可されるか
// =====================================================

export function canFetchDB(state: AuthState): boolean {
  return AUTH_STATE_BEHAVIORS[state].allowDBFetch;
}

// =====================================================
// Helper: Dashboard 表示が許可されるか
// =====================================================

export function canShowDashboard(state: AuthState): boolean {
  return AUTH_STATE_BEHAVIORS[state].allowDashboard;
}

// =====================================================
// Helper: 状態に応じたアクション
// =====================================================

export function getAuthAction(state: AuthState): string {
  return AUTH_STATE_BEHAVIORS[state].action;
}
