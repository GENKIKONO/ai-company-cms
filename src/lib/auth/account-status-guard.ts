/**
 * アカウント状態ガード機能
 * profiles.account_status に基づいたアクセス制御
 */

import { logger } from '@/lib/log';

/**
 * アカウントステータス型定義
 * - active: 通常利用OK
 * - warned: 機能利用許可（将来的にUI警告表示）
 * - suspended: 重要機能禁止（ブロック対象）
 * - frozen: suspended同様（ブロック対象）
 * - deleted: セッション無効として扱う
 */
export type AccountStatus = 'active' | 'warned' | 'suspended' | 'frozen' | 'deleted';

/**
 * アカウント制裁エラー（403）
 */
export class AccountRestrictedError extends Error {
  public readonly code: string;
  public readonly status: number = 403;

  constructor(status: AccountStatus) {
    const messages = {
      suspended: 'アカウントが一時停止されています',
      frozen: 'アカウントが凍結されています'
    };
    const codes = {
      suspended: 'ACCOUNT_SUSPENDED',
      frozen: 'ACCOUNT_FROZEN'
    };

    super(messages[status as 'suspended' | 'frozen'] || 'アカウントアクセスが制限されています');
    this.code = codes[status as 'suspended' | 'frozen'] || 'ACCOUNT_RESTRICTED';
    this.name = 'AccountRestrictedError';
  }
}

/**
 * アカウント削除エラー（401）
 */
export class AccountDeletedError extends Error {
  public readonly code: string = 'ACCOUNT_DELETED';
  public readonly status: number = 401;

  constructor() {
    super('アカウントが削除されています');
    this.name = 'AccountDeletedError';
  }
}

/**
 * アカウント状態チェック・ガード関数
 * @param status - profiles.account_statusの値
 * @throws AccountRestrictedError - suspended/frozen時（403）
 * @throws AccountDeletedError - deleted時（401）
 */
export function assertAccountUsable(status: AccountStatus): void {
  switch (status) {
    case 'active':
    case 'warned':
      // 利用許可 - 何もしない
      return;
      
    case 'suspended':
    case 'frozen':
      logger.warn('Account access restricted', {
        component: 'account-status-guard',
        status,
        errorCode: status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_FROZEN'
      });
      throw new AccountRestrictedError(status);
      
    case 'deleted':
      logger.warn('Deleted account access attempt', {
        component: 'account-status-guard',
        status,
        errorCode: 'ACCOUNT_DELETED'
      });
      throw new AccountDeletedError();
      
    default:
      logger.error('Unknown account status', {
        component: 'account-status-guard',
        status
      });
      throw new AccountRestrictedError(status as AccountStatus);
  }
}

/**
 * アカウント状態が利用可能かチェック（例外を投げない版）
 * @param status - profiles.account_statusの値
 * @returns 利用可能な場合true
 */
export function isAccountUsable(status: AccountStatus): boolean {
  return status === 'active' || status === 'warned';
}

/**
 * 管理機能アクセス可能かチェック（例外を投げない版）
 * @param status - profiles.account_statusの値
 * @returns 管理機能アクセス可能な場合true
 */
export function canAccessAdminFeatures(status: AccountStatus): boolean {
  return status === 'active' || status === 'warned';
}