/**
 * P1-2 Feature Flag System for Safe Enum Migration
 * 
 * enum移行時の段階的切り替えを支援するFeature Flag機能
 */

import React from 'react'
import { logger } from './logger'

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production'
export type FeatureFlagContext = {
  userId?: string
  organizationId?: string
  environment?: FeatureFlagEnvironment
}

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  environment?: FeatureFlagEnvironment
  rolloutPercentage?: number
  enabledForUsers?: string[]
  enabledForOrgs?: string[]
  createdAt: string
  updatedAt: string
  migrationPhase?: 1 | 2 | 3 | 4 | 5
}

export interface EnumMigrationFlag extends FeatureFlag {
  tableName: string
  columnName: string
  enumType: string
  migrationPhase: 1 | 2 | 3 | 4 | 5
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map()
  private environment: FeatureFlagEnvironment

  constructor() {
    this.environment = (process.env.NODE_ENV === 'production' ? 'production' : 
                       process.env.NODE_ENV === 'test' ? 'staging' : 
                       'development') as FeatureFlagEnvironment
    this.initializeFlags()
  }

  private initializeFlags(): void {
    // P1-2 Enum Migration Feature Flags
    const enumMigrationFlags: EnumMigrationFlag[] = [
      {
        key: 'use_enum_ai_interview_sessions_status',
        enabled: false,
        description: 'Use enum for ai_interview_sessions.status',
        tableName: 'ai_interview_sessions',
        columnName: 'status',
        enumType: 'interview_session_status',
        migrationPhase: 1,
        environment: this.environment,
        rolloutPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'use_enum_ai_interview_sessions_content_type',
        enabled: false,
        description: 'Use enum for ai_interview_sessions.content_type',
        tableName: 'ai_interview_sessions',
        columnName: 'content_type', 
        enumType: 'interview_content_type',
        migrationPhase: 1,
        environment: this.environment,
        rolloutPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        key: 'use_enum_user_profiles_onboarding_status',
        enabled: false,
        description: 'Use enum for user_profiles.onboarding_status',
        tableName: 'user_profiles',
        columnName: 'onboarding_status',
        enumType: 'onboarding_status',
        migrationPhase: 1,
        environment: this.environment,
        rolloutPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    enumMigrationFlags.forEach(flag => {
      this.flags.set(flag.key, flag)
    })
  }

  /**
   * Feature Flagの状態確認
   */
  async isEnabled(
    flagKey: string, 
    context?: FeatureFlagContext
  ): Promise<boolean> {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      // フラグが見つからない場合はデフォルトでfalse
      return false
    }

    // 環境別チェック
    if (flag.environment && context?.environment && flag.environment !== context.environment) {
      return false
    }

    // 基本的な有効/無効チェック
    if (!flag.enabled) {
      return false
    }

    // ユーザー単位での有効化チェック
    if (flag.enabledForUsers && context?.userId) {
      return flag.enabledForUsers.includes(context.userId)
    }

    // 組織単位での有効化チェック
    if (flag.enabledForOrgs && context?.organizationId) {
      return flag.enabledForOrgs.includes(context.organizationId)
    }

    // ロールアウトパーセンテージチェック
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // 簡単なハッシュベースのロールアウト
      const hash = this.simpleHash(flagKey + (context?.userId || context?.organizationId || ''))
      return (hash % 100) < flag.rolloutPercentage
    }

    return flag.enabled
  }

  /**
   * Enum移行専用のフラグチェック
   */
  async shouldUseEnum(
    tableName: string,
    columnName: string,
    context?: FeatureFlagContext
  ): Promise<boolean> {
    const flagKey = `use_enum_${tableName}_${columnName}`
    return this.isEnabled(flagKey, context)
  }

  /**
   * Feature Flagの更新
   */
  async updateFlag(
    flagKey: string,
    updates: Partial<FeatureFlag>
  ): Promise<void> {
    const existingFlag = this.flags.get(flagKey)
    if (!existingFlag) {
      throw new Error(`Feature flag not found: ${flagKey}`)
    }

    const updatedFlag = {
      ...existingFlag,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.flags.set(flagKey, updatedFlag)

    // 実環境ではSupabaseに永続化
    if (process.env.NODE_ENV !== 'test') {
      // TODO: Supabaseへの永続化実装
      logger.debug(`Feature flag updated: ${flagKey}`, updatedFlag)
    }
  }

  /**
   * Migration進行管理
   */
  async advanceMigrationPhase(
    tableName: string,
    columnName: string
  ): Promise<void> {
    const flagKey = `use_enum_${tableName}_${columnName}`
    const flag = this.flags.get(flagKey) as EnumMigrationFlag
    
    if (!flag) {
      throw new Error(`Migration flag not found: ${flagKey}`)
    }

    const nextPhase = (flag.migrationPhase + 1) as EnumMigrationFlag['migrationPhase']
    
    if (nextPhase > 5) {
      throw new Error(`Migration already completed for ${tableName}.${columnName}`)
    }

    await this.updateFlag(flagKey, {
      migrationPhase: nextPhase,
      description: `${flag.description} (Phase ${nextPhase})`
    })

    logger.debug(`Advanced migration phase: ${tableName}.${columnName} → Phase ${nextPhase}`)
  }

  /**
   * 段階的ロールアウト
   */
  async graduateRollout(
    flagKey: string,
    targetPercentage: number
  ): Promise<void> {
    if (targetPercentage < 0 || targetPercentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100')
    }

    await this.updateFlag(flagKey, {
      enabled: true,
      rolloutPercentage: targetPercentage
    })

    logger.debug(`Graduated rollout: ${flagKey} → ${targetPercentage}%`)
  }

  /**
   * 緊急ロールバック
   */
  async emergencyRollback(flagKey: string): Promise<void> {
    await this.updateFlag(flagKey, {
      enabled: false,
      rolloutPercentage: 0
    })

    logger.warn(`Emergency rollback executed: ${flagKey}`)
  }

  /**
   * 全フラグ状態の取得
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Migration専用フラグの取得
   */
  getMigrationFlags(): EnumMigrationFlag[] {
    return Array.from(this.flags.values())
      .filter((flag): flag is EnumMigrationFlag => 
        'tableName' in flag && 'columnName' in flag
      )
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService()

/**
 * React Hook for Feature Flags
 */
export function useFeatureFlag(
  flagKey: string,
  context?: FeatureFlagContext
): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    featureFlags.isEnabled(flagKey, context)
      .then(setEnabled)
      .finally(() => setLoading(false))
  }, [flagKey, context])

  return { enabled, loading }
}

/**
 * Enum Migration用のHook
 */
export function useEnumMigration(
  tableName: string,
  columnName: string,
  context?: FeatureFlagContext
): { shouldUseEnum: boolean; loading: boolean } {
  const [shouldUseEnum, setShouldUseEnum] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    featureFlags.shouldUseEnum(tableName, columnName, context)
      .then(setShouldUseEnum)
      .finally(() => setLoading(false))
  }, [tableName, columnName, context])

  return { shouldUseEnum, loading }
}

// React import for hooks (conditional)
// React type declaration removed - not needed for enum migration