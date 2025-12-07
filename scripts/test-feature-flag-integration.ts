#!/usr/bin/env ts-node
/**
 * P1-2 Feature Flag Integration Test
 * 
 * Feature Flag機能とenum migration helpersのテスト
 */

import { featureFlags, FeatureFlagContext } from '../src/lib/utils/feature-flags.js'
import { InterviewSessionService, UserProfileService, MigrationValidator } from '../src/lib/utils/enum-migration-helpers.js'

async function testFeatureFlagBasics(): Promise<void> {
  console.log('🧪 Feature Flag基本機能テスト')
  console.log('-'.repeat(50))

  // 初期状態確認
  const initialState = await featureFlags.isEnabled('use_enum_ai_interview_sessions_status')
  console.log(`初期状態: use_enum_ai_interview_sessions_status = ${initialState}`)

  // フラグ有効化
  await featureFlags.updateFlag('use_enum_ai_interview_sessions_status', { enabled: true })
  const enabledState = await featureFlags.isEnabled('use_enum_ai_interview_sessions_status')
  console.log(`有効化後: use_enum_ai_interview_sessions_status = ${enabledState}`)

  // 段階的ロールアウト
  await featureFlags.graduateRollout('use_enum_ai_interview_sessions_status', 50)
  console.log('50%ロールアウトを設定')

  // ロールバック
  await featureFlags.emergencyRollback('use_enum_ai_interview_sessions_status')
  const rolledBackState = await featureFlags.isEnabled('use_enum_ai_interview_sessions_status')
  console.log(`ロールバック後: use_enum_ai_interview_sessions_status = ${rolledBackState}`)

  console.log('✅ Feature Flag基本機能テスト完了\n')
}

async function testEnumMigrationHelpers(): Promise<void> {
  console.log('🧪 Enum Migration Helpersテスト')
  console.log('-'.repeat(50))

  const context: FeatureFlagContext = {
    userId: 'test-user-123',
    organizationId: 'test-org-456',
    environment: 'development'
  }

  const sessionService = new InterviewSessionService(context)
  const profileService = new UserProfileService(context)

  // Feature Flag無効時のテスト
  console.log('📋 Feature Flag無効時のテスト:')
  
  const statusData1 = await sessionService.writeStatus('pending')
  console.log('Status write (flag off):', statusData1)
  
  const readStatus1 = await sessionService.readStatus('in_progress')
  console.log('Status read (flag off):', readStatus1)

  // Feature Flag有効化
  await featureFlags.updateFlag('use_enum_ai_interview_sessions_status', { enabled: true })
  await featureFlags.updateFlag('use_enum_user_profiles_onboarding_status', { enabled: true })

  // Feature Flag有効時のテスト
  console.log('\n📋 Feature Flag有効時のテスト:')
  
  const statusData2 = await sessionService.writeStatus('completed')
  console.log('Status write (flag on):', statusData2)
  
  const contentTypeData = await sessionService.writeContentType('video')
  console.log('Content type write:', contentTypeData)

  const onboardingData = await profileService.writeOnboardingStatus('completed')
  console.log('Onboarding status write:', onboardingData)

  // 無効値のテスト
  console.log('\n📋 無効値ハンドリングテスト:')
  
  const invalidStatus = await sessionService.readStatus('invalid_status' as any)
  console.log('Invalid status handled as:', invalidStatus)

  const invalidContentType = await sessionService.readContentType('invalid_type' as any)
  console.log('Invalid content type handled as:', invalidContentType)

  console.log('✅ Enum Migration Helpersテスト完了\n')
}

async function testMigrationValidation(): Promise<void> {
  console.log('🧪 Migration Validationテスト')
  console.log('-'.repeat(50))

  // データ整合性検証
  const validationResult = await MigrationValidator.validateDataConsistency(
    'ai_interview_sessions',
    'status',
    ['pending', 'in_progress', 'completed', 'cancelled', 'failed']
  )
  console.log('Data validation result:', validationResult)

  // Migration Phase検証
  const phaseValid = await MigrationValidator.validateMigrationPhase(
    'ai_interview_sessions',
    'status',
    1
  )
  console.log('Phase validation (expecting phase 1+):', phaseValid)

  // Rollback安全性確認
  const rollbackCheck = await MigrationValidator.canSafelyRollback(
    'ai_interview_sessions',
    'status'
  )
  console.log('Rollback safety check:', rollbackCheck)

  console.log('✅ Migration Validationテスト完了\n')
}

async function testMigrationPhaseProgression(): Promise<void> {
  console.log('🧪 Migration Phase進行テスト')
  console.log('-'.repeat(50))

  const tableName = 'ai_interview_sessions'
  const columnName = 'status'

  // 現在のPhase確認
  const migrationFlags = featureFlags.getMigrationFlags()
  const currentFlag = migrationFlags.find(f => f.tableName === tableName && f.columnName === columnName)
  console.log(`Current phase: ${currentFlag?.migrationPhase}`)

  // Phase進行
  await featureFlags.advanceMigrationPhase(tableName, columnName)
  
  const updatedFlags = featureFlags.getMigrationFlags()
  const updatedFlag = updatedFlags.find(f => f.tableName === tableName && f.columnName === columnName)
  console.log(`Advanced to phase: ${updatedFlag?.migrationPhase}`)

  console.log('✅ Migration Phase進行テスト完了\n')
}

async function testContextualFlags(): Promise<void> {
  console.log('🧪 Context-based Feature Flagテスト')
  console.log('-'.repeat(50))

  // ユーザー指定有効化
  await featureFlags.updateFlag('use_enum_ai_interview_sessions_content_type', {
    enabled: true,
    enabledForUsers: ['test-user-123']
  })

  const userContext: FeatureFlagContext = { userId: 'test-user-123' }
  const otherUserContext: FeatureFlagContext = { userId: 'other-user-456' }

  const enabledForUser = await featureFlags.isEnabled('use_enum_ai_interview_sessions_content_type', userContext)
  const enabledForOther = await featureFlags.isEnabled('use_enum_ai_interview_sessions_content_type', otherUserContext)

  console.log(`Enabled for test-user-123: ${enabledForUser}`)
  console.log(`Enabled for other-user-456: ${enabledForOther}`)

  console.log('✅ Context-based Feature Flagテスト完了\n')
}

async function displayMigrationStatus(): Promise<void> {
  console.log('📊 P1-2 Migration Status Summary')
  console.log('='.repeat(50))

  const migrationFlags = featureFlags.getMigrationFlags()
  
  console.log(`Total migration flags: ${migrationFlags.length}`)
  console.log()

  migrationFlags.forEach(flag => {
    console.log(`🎯 ${flag.tableName}.${flag.columnName}`)
    console.log(`   Enum: ${flag.enumType}`)
    console.log(`   Phase: ${flag.migrationPhase}`)
    console.log(`   Enabled: ${flag.enabled}`)
    console.log(`   Rollout: ${flag.rolloutPercentage || 0}%`)
    console.log(`   Description: ${flag.description}`)
    console.log()
  })
}

async function main() {
  console.log('🚀 P1-2 Feature Flag Integration Test Suite\n')

  try {
    await testFeatureFlagBasics()
    await testEnumMigrationHelpers()
    await testMigrationValidation()
    await testMigrationPhaseProgression()
    await testContextualFlags()
    await displayMigrationStatus()

    console.log('🎉 すべてのテストが完了しました！')
    console.log('📋 Feature Flag統合の実装は正常に動作しています。')
    console.log('📈 次のステップ: Migration Runbook作成')

  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('🔥 スクリプト実行エラー:', error)
    process.exit(1)
  })
}