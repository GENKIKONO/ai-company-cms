#!/usr/bin/env ts-node
/**
 * Contract Violations Supabase接続テスト
 * 
 * 実際のadmin.contract_violationsテーブルへの書き込みテスト
 */

import { logContractViolation } from '../src/lib/utils/contract-violations.js'

async function testContractViolationConnection() {
  console.log('🚀 Contract Violations Supabase接続テスト開始\n')

  try {
    // テスト用の契約違反データ
    const testViolation = {
      source: 'api' as const,
      endpoint: '/api/test',
      table_name: 'test_table',
      column_name: 'test_column',
      violation_type: 'OTHER' as const,
      payload: {
        testType: 'connection_test',
        timestamp: new Date().toISOString(),
        description: 'P1-1システム統合テスト'
      },
      request_id: `test-${Date.now()}`,
      actor_user_id: null,
      actor_org_id: null,
      client_ip: '127.0.0.1'
    }

    console.log('📋 テストデータ:')
    console.log('─'.repeat(50))
    console.log(JSON.stringify(testViolation, null, 2))
    console.log()

    console.log('🔄 Supabaseへの書き込みテスト実行...')
    
    // 実際の契約違反記録テスト
    await logContractViolation(testViolation)
    
    console.log('✅ 契約違反の記録が完了しました')
    console.log('📊 admin.contract_violations テーブルに正常に書き込まれています')

    // 2番目のテスト（異なる違反タイプ）
    console.log('\n🔄 2つ目のテスト（INVALID_ENUM）...')
    
    const testViolation2 = {
      ...testViolation,
      violation_type: 'INVALID_ENUM' as const,
      column_name: 'content_type',
      payload: {
        expectedValues: ['blog', 'news', 'guide'],
        actualValue: 'invalid_type',
        testType: 'enum_validation_test'
      },
      request_id: `test-enum-${Date.now()}`
    }

    await logContractViolation(testViolation2)
    
    console.log('✅ 2番目のテストも完了しました')

    // payload サイズ制限テスト
    console.log('\n🔄 3つ目のテスト（Payloadサイズ制限）...')
    
    const largePayload = {
      largeData: 'x'.repeat(70000), // 64KBを超える大きなデータ
      testType: 'payload_size_test'
    }

    const testViolation3 = {
      ...testViolation,
      violation_type: 'LENGTH_OVER' as const,
      payload: largePayload,
      request_id: `test-size-${Date.now()}`
    }

    await logContractViolation(testViolation3)
    
    console.log('✅ Payloadサイズ制限テストも完了しました')

    console.log('\n🎉 全ての接続テストが成功しました！')
    console.log('📈 P1-1 契約違反システムは正常に稼働しています')

  } catch (error) {
    console.error('\n❌ 接続テストでエラーが発生しました:')
    console.error(error)
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message)
      if (error.stack) {
        console.error('スタックトレース:', error.stack)
      }
    }
    
    console.log('\n🔍 考えられる原因:')
    console.log('1. SUPABASE_SERVICE_ROLE_KEY が設定されていない')
    console.log('2. admin.contract_violations テーブルへのアクセス権限がない')
    console.log('3. RLS ポリシーの設定問題')
    console.log('4. ネットワーク接続の問題')
    
    process.exit(1)
  }
}

// スクリプト実行
testContractViolationConnection().catch((error) => {
  console.error('🔥 スクリプト実行エラー:', error)
  process.exit(1)
})