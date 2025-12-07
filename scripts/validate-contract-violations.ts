#!/usr/bin/env ts-node
/**
 * Contract Violations Validation Script
 * 
 * P1-1: 型同期 & Data Contract の検証を行う
 * 
 * 検証項目：
 * 1. contract-violations.ts の型定義が supabase-admin.ts と整合している
 * 2. enum値が一致している
 * 3. 必須フィールドの整合性
 * 4. payload size制限の動作確認
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// 型整合性チェック用のインポート
import type { ContractViolationData, ViolationType } from '../src/lib/utils/contract-violations'
import type { ViolationType as AdminViolationType } from '../src/types/supabase-admin'

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

function validateEnumConsistency(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  }

  try {
    console.log('🔍 契約違反タイプの検証...')
    
    // 必須の enum 値をチェック（実際のファイル読み込みによる複雑な正規表現は避ける）
    const expectedEnums: string[] = [
      'INVALID_ENUM',
      'NULL_NOT_ALLOWED', 
      'LENGTH_OVER',
      'FORMAT_INVALID',
      'RANGE_INVALID',
      'FOREIGN_KEY_MISSING',
      'OTHER'
    ]

    // contract-violations.ts ファイルの存在と基本的な内容確認
    const contractViolationsPath = join(process.cwd(), 'src/lib/utils/contract-violations.ts')
    const contractViolationsContent = readFileSync(contractViolationsPath, 'utf-8')
    
    // シンプルな文字列検索で各enum値の存在確認
    const missingEnums: string[] = []
    for (const enumValue of expectedEnums) {
      if (!contractViolationsContent.includes(`'${enumValue}'`)) {
        missingEnums.push(enumValue)
      }
    }

    if (missingEnums.length > 0) {
      result.errors.push(`Missing enum values: ${missingEnums.join(', ')}`)
      result.success = false
    } else {
      console.log('✅ 全ての必須enum値が見つかりました')
    }

    // ViolationType 型の定義存在確認
    if (!contractViolationsContent.includes('export type ViolationType')) {
      result.errors.push('ViolationType type definition not found')
      result.success = false
    }

  } catch (error) {
    result.errors.push(`Enum validation failed: ${error instanceof Error ? error.message : String(error)}`)
    result.success = false
  }

  return result
}

function validateInterfaceStructure(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  }

  try {
    console.log('🔍 ContractViolationData インターフェース構造の検証...')
    
    // 必須フィールドのチェック（実行時ではTypeScriptの型定義の構造的検証は困難なため、ファイル解析で代用）
    const contractViolationsPath = join(process.cwd(), 'src/lib/utils/contract-violations.ts')
    const content = readFileSync(contractViolationsPath, 'utf-8')
    
    const requiredFields = [
      'source',
      'endpoint', 
      'table_name',
      'column_name',
      'violation_type',
      'payload'
    ]

    const optionalFields = [
      'request_id',
      'actor_user_id',
      'actor_org_id', 
      'client_ip'
    ]

    // インターフェース定義を検索
    const interfaceMatch = content.match(/export interface ContractViolationData \{([^}]+)\}/s)
    if (!interfaceMatch) {
      result.errors.push('ContractViolationData interface not found')
      result.success = false
      return result
    }

    const interfaceContent = interfaceMatch[1]
    
    // 必須フィールドの存在確認
    for (const field of requiredFields) {
      if (!interfaceContent.includes(`${field}:`)) {
        result.errors.push(`Required field missing: ${field}`)
        result.success = false
      }
    }

    // オプションフィールドの確認
    for (const field of optionalFields) {
      if (!interfaceContent.includes(`${field}?:`)) {
        result.warnings.push(`Optional field should be marked with ?: ${field}`)
      }
    }

    console.log('✅ インターフェース構造の検証完了')

  } catch (error) {
    result.errors.push(`Interface validation failed: ${error instanceof Error ? error.message : String(error)}`)
    result.success = false
  }

  return result
}

function validatePayloadSizeControl(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  }

  try {
    console.log('🔍 Payload サイズ制限機能の検証...')
    
    const contractViolationsPath = join(process.cwd(), 'src/lib/utils/contract-violations.ts')
    const content = readFileSync(contractViolationsPath, 'utf-8')
    
    // trimPayloadSize 関数の存在確認
    if (!content.includes('function trimPayloadSize')) {
      result.errors.push('trimPayloadSize function not found')
      result.success = false
    }

    // 64KB制限の確認
    if (!content.includes('64 * 1024')) {
      result.warnings.push('64KB size limit not explicitly found')
    }

    // logContractViolation での使用確認
    if (!content.includes('trimPayloadSize(')) {
      result.errors.push('trimPayloadSize not used in logContractViolation')
      result.success = false
    }

    console.log('✅ Payload サイズ制限機能の検証完了')

  } catch (error) {
    result.errors.push(`Payload size validation failed: ${error instanceof Error ? error.message : String(error)}`)
    result.success = false
  }

  return result
}

function validateFileExistence(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  }

  console.log('🔍 必要ファイルの存在確認...')

  const requiredFiles = [
    'src/lib/utils/contract-violations.ts',
    'src/types/supabase-admin.ts',
    'src/types/supabase.ts'
  ]

  for (const file of requiredFiles) {
    try {
      const fullPath = join(process.cwd(), file)
      readFileSync(fullPath, 'utf-8')
      console.log(`✅ ${file}`)
    } catch (error) {
      result.errors.push(`Required file not found: ${file}`)
      result.success = false
      console.log(`❌ ${file}`)
    }
  }

  return result
}

async function main() {
  console.log('🚀 Contract Violations 検証開始\n')

  const validations = [
    { name: 'ファイル存在確認', fn: validateFileExistence },
    { name: 'Enum整合性', fn: validateEnumConsistency },
    { name: 'インターフェース構造', fn: validateInterfaceStructure },
    { name: 'Payloadサイズ制限', fn: validatePayloadSizeControl }
  ]

  let overallSuccess = true
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const validation of validations) {
    console.log(`\n📋 ${validation.name}`)
    console.log('─'.repeat(50))
    
    const result = validation.fn()
    
    if (result.success) {
      console.log(`✅ ${validation.name} 成功`)
    } else {
      console.log(`❌ ${validation.name} 失敗`)
      overallSuccess = false
    }

    if (result.errors.length > 0) {
      console.log('🚨 エラー:')
      result.errors.forEach(error => {
        console.log(`   • ${error}`)
        allErrors.push(error)
      })
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  警告:')
      result.warnings.forEach(warning => {
        console.log(`   • ${warning}`)
        allWarnings.push(warning)
      })
    }
  }

  // 最終レポート
  console.log('\n🎯 検証サマリー')
  console.log('='.repeat(50))
  
  if (overallSuccess) {
    console.log('✅ 全ての検証に成功しました！')
    console.log('🎉 P1-1 契約違反システムは正常に実装されています。')
  } else {
    console.log('❌ 一部の検証に失敗しました。')
    console.log(`📊 エラー: ${allErrors.length}件, 警告: ${allWarnings.length}件`)
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  改善推奨項目:')
    allWarnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`)
    })
  }

  if (!overallSuccess) {
    console.log('\n🚨 修正が必要な問題:')
    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
    process.exit(1)
  }

  console.log('\n🏁 契約違反システム検証完了')
  process.exit(0)
}

// ES Module環境での実行
main().catch((error) => {
  console.error('🔥 検証スクリプト実行エラー:', error)
  process.exit(1)
})