/**
 * P1-2 Enum Migration Helpers
 * 
 * Feature Flagと連携したenum移行の実装ヘルパー
 */

import { featureFlags, FeatureFlagContext } from './feature-flags'
import { logger } from './logger'

export type InterviewSessionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed'
export type InterviewContentType = 'text' | 'video' | 'audio' | 'structured'
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

/**
 * AI Interview Session関連のenum-safe操作
 */
export class InterviewSessionService {
  private context: FeatureFlagContext

  constructor(context: FeatureFlagContext = {}) {
    this.context = context
  }

  /**
   * Statusの型安全な読み取り
   */
  async readStatus(rawStatus: string | InterviewSessionStatus): Promise<InterviewSessionStatus> {
    const useEnum = await featureFlags.shouldUseEnum('ai_interview_sessions', 'status', this.context)
    
    if (useEnum && typeof rawStatus === 'string') {
      // enum値への変換と検証
      if (this.isValidStatus(rawStatus)) {
        return rawStatus as InterviewSessionStatus
      }
      // 無効値の場合はfallback
      logger.warn(`Invalid status value detected: ${rawStatus}, falling back to 'pending'`)
      return 'pending'
    }

    // 旧形式の場合もvalidation
    return this.isValidStatus(rawStatus) ? rawStatus as InterviewSessionStatus : 'pending'
  }

  /**
   * Statusの型安全な書き込み
   */
  async writeStatus(status: InterviewSessionStatus): Promise<{ status: string; status_enum_temp?: InterviewSessionStatus }> {
    const useEnum = await featureFlags.shouldUseEnum('ai_interview_sessions', 'status', this.context)
    
    if (useEnum) {
      // Phase 3以降: enum列を優先
      return {
        status: status, // 互換性のため文字列も設定
        status_enum_temp: status
      }
    } else {
      // Phase 2まで: 文字列列を優先
      return {
        status: status
      }
    }
  }

  /**
   * Content Typeの型安全な読み取り
   */
  async readContentType(rawContentType: string | InterviewContentType): Promise<InterviewContentType> {
    const useEnum = await featureFlags.shouldUseEnum('ai_interview_sessions', 'content_type', this.context)
    
    if (useEnum && typeof rawContentType === 'string') {
      if (this.isValidContentType(rawContentType)) {
        return rawContentType as InterviewContentType
      }
      logger.warn(`Invalid content_type value: ${rawContentType}, falling back to 'text'`)
      return 'text'
    }

    return this.isValidContentType(rawContentType) ? rawContentType as InterviewContentType : 'text'
  }

  /**
   * Content Typeの型安全な書き込み
   */
  async writeContentType(contentType: InterviewContentType): Promise<{ content_type: string; content_type_enum_temp?: InterviewContentType }> {
    const useEnum = await featureFlags.shouldUseEnum('ai_interview_sessions', 'content_type', this.context)
    
    if (useEnum) {
      return {
        content_type: contentType,
        content_type_enum_temp: contentType
      }
    } else {
      return {
        content_type: contentType
      }
    }
  }

  private isValidStatus(status: any): status is InterviewSessionStatus {
    return typeof status === 'string' && 
           ['pending', 'in_progress', 'completed', 'cancelled', 'failed'].includes(status)
  }

  private isValidContentType(contentType: any): contentType is InterviewContentType {
    return typeof contentType === 'string' && 
           ['text', 'video', 'audio', 'structured'].includes(contentType)
  }
}

/**
 * User Profile関連のenum-safe操作
 */
export class UserProfileService {
  private context: FeatureFlagContext

  constructor(context: FeatureFlagContext = {}) {
    this.context = context
  }

  /**
   * Onboarding Statusの型安全な操作
   */
  async readOnboardingStatus(rawStatus: string | OnboardingStatus): Promise<OnboardingStatus> {
    const useEnum = await featureFlags.shouldUseEnum('user_profiles', 'onboarding_status', this.context)
    
    if (useEnum && typeof rawStatus === 'string') {
      if (this.isValidOnboardingStatus(rawStatus)) {
        return rawStatus as OnboardingStatus
      }
      logger.warn(`Invalid onboarding_status value: ${rawStatus}, falling back to 'not_started'`)
      return 'not_started'
    }

    return this.isValidOnboardingStatus(rawStatus) ? rawStatus as OnboardingStatus : 'not_started'
  }

  async writeOnboardingStatus(status: OnboardingStatus): Promise<{ onboarding_status: string; onboarding_status_enum_temp?: OnboardingStatus }> {
    const useEnum = await featureFlags.shouldUseEnum('user_profiles', 'onboarding_status', this.context)
    
    if (useEnum) {
      return {
        onboarding_status: status,
        onboarding_status_enum_temp: status
      }
    } else {
      return {
        onboarding_status: status
      }
    }
  }

  private isValidOnboardingStatus(status: any): status is OnboardingStatus {
    return typeof status === 'string' && 
           ['not_started', 'in_progress', 'completed', 'skipped'].includes(status)
  }
}

/**
 * Migration Validation Utilities
 */
export class MigrationValidator {
  /**
   * データ整合性検証
   */
  static async validateDataConsistency(
    tableName: string,
    columnName: string,
    allowedValues: string[]
  ): Promise<{ valid: boolean; invalidValues: string[]; count: number }> {
    // 実際の環境では、ここでSupabaseクエリを実行
    // 開発環境では、モックデータで検証

    const mockValidation = {
      valid: true,
      invalidValues: [],
      count: 0
    }

    logger.debug(`Validating ${tableName}.${columnName} against values: [${allowedValues.join(', ')}]`)
    
    return mockValidation
  }

  /**
   * Migration Phase検証
   */
  static async validateMigrationPhase(
    tableName: string,
    columnName: string,
    expectedPhase: number
  ): Promise<boolean> {
    const flags = featureFlags.getMigrationFlags()
    const migrationFlag = flags.find(flag => 
      flag.tableName === tableName && flag.columnName === columnName
    )

    if (!migrationFlag) {
      throw new Error(`Migration flag not found for ${tableName}.${columnName}`)
    }

    return migrationFlag.migrationPhase >= expectedPhase
  }

  /**
   * Rollback安全性確認
   */
  static async canSafelyRollback(
    tableName: string,
    columnName: string
  ): Promise<{ canRollback: boolean; reasons: string[] }> {
    const reasons: string[] = []

    // Phase 5 (最終段階) では rollback が困難
    const isPhase5 = await this.validateMigrationPhase(tableName, columnName, 5)
    if (isPhase5) {
      reasons.push('Migration is in final phase - rollback requires manual intervention')
    }

    // Feature Flag有効率チェック
    const useEnum = await featureFlags.shouldUseEnum(tableName, columnName)
    if (useEnum) {
      reasons.push('Enum is currently enabled - disable feature flag first')
    }

    return {
      canRollback: reasons.length === 0,
      reasons
    }
  }
}

/**
 * Contract Violation Integration
 */
export async function logEnumMigrationViolation(
  tableName: string,
  columnName: string,
  invalidValue: any,
  context?: FeatureFlagContext
): Promise<void> {
  const { logContractViolation } = await import('./contract-violations')

  await logContractViolation({
    source: 'api',
    endpoint: `/api/enum-migration/${tableName}`,
    table_name: tableName,
    column_name: columnName,
    violation_type: 'INVALID_ENUM',
    payload: {
      invalidValue,
      migrationContext: context,
      timestamp: new Date().toISOString(),
      severity: 'warning'
    },
    request_id: `enum-migration-${Date.now()}`,
    actor_user_id: context?.userId || null,
    actor_org_id: context?.organizationId || null
  })
}

/**
 * Usage Examples for API Routes
 */
export const EnumMigrationExamples = {
  /**
   * AI Interview Session 作成例
   */
  async createInterviewSession(data: {
    status: InterviewSessionStatus
    content_type: InterviewContentType
    userId?: string
    organizationId?: string
  }) {
    const context = { userId: data.userId, organizationId: data.organizationId }
    const sessionService = new InterviewSessionService(context)

    const statusData = await sessionService.writeStatus(data.status)
    const contentTypeData = await sessionService.writeContentType(data.content_type)

    // Supabase Insert用のデータ
    const insertData = {
      ...statusData,
      ...contentTypeData,
      // 他のフィールド...
      created_at: new Date().toISOString()
    }

    logger.debug('Insert data:', insertData)
    return insertData
  },

  /**
   * User Profile更新例
   */
  async updateUserOnboarding(
    userId: string,
    status: OnboardingStatus,
    organizationId?: string
  ) {
    const context = { userId, organizationId }
    const profileService = new UserProfileService(context)

    const statusData = await profileService.writeOnboardingStatus(status)

    logger.debug('Update data:', statusData)
    return statusData
  }
}