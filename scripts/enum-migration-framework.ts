#!/usr/bin/env ts-node
/**
 * P1-2 Enum Migration Framework
 * 
 * 段階的で安全なenum移行を実現するフレームワーク
 * Breaking Change防止とFeature Flag統合
 */

interface MigrationPhase {
  phase: number
  name: string
  description: string
  actions: string[]
  rollbackActions: string[]
  prerequisites: string[]
  validations: string[]
}

interface EnumMigrationPlan {
  tableName: string
  columnName: string
  enumName: string
  enumValues: string[]
  currentDataValidation: string
  phases: MigrationPhase[]
  featureFlagKey: string
  estimatedDuration: string
  riskLevel: 'low' | 'medium' | 'high'
}

function createEnumMigrationPlan(
  tableName: string,
  columnName: string, 
  enumName: string,
  enumValues: string[]
): EnumMigrationPlan {
  const tempColumnName = `${columnName}_enum_temp`
  const featureFlagKey = `use_enum_${tableName}_${columnName}`

  const phases: MigrationPhase[] = [
    {
      phase: 1,
      name: 'Preparation & Validation',
      description: 'データ検証、enum作成、Feature Flag設定',
      actions: [
        `-- データ整合性確認`,
        `SELECT DISTINCT ${columnName}, COUNT(*) FROM ${tableName} GROUP BY ${columnName};`,
        ``,
        `-- Enum型作成`,
        `CREATE TYPE ${enumName} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});`,
        ``,
        `-- Feature Flag設定追加`,
        `INSERT INTO feature_flags (key, enabled, description) VALUES`,
        `('${featureFlagKey}', false, 'Use enum for ${tableName}.${columnName}');`,
        ``,
        `-- RLS Policy確認（必要に応じて更新）`,
        `-- SELECT * FROM pg_policies WHERE tablename = '${tableName}';`
      ],
      rollbackActions: [
        `DROP TYPE IF EXISTS ${enumName};`,
        `DELETE FROM feature_flags WHERE key = '${featureFlagKey}';`
      ],
      prerequisites: [
        '実データの値がenum値に完全に含まれることを確認',
        'Feature Flagテーブルの存在確認',
        'RLS Policy影響範囲の調査完了'
      ],
      validations: [
        'すべてのデータがenum値にマッピング可能',
        'Feature Flag機能が正常動作',
        'enum型が正しく作成された'
      ]
    },
    {
      phase: 2,
      name: 'Shadow Column Addition',
      description: '新しいenum列を追加（本番影響なし）',
      actions: [
        `-- 新しいenum列追加`,
        `ALTER TABLE ${tableName} ADD COLUMN ${tempColumnName} ${enumName};`,
        ``,
        `-- 既存データをenum列にコピー`,
        `UPDATE ${tableName} SET ${tempColumnName} = ${columnName}::${enumName} WHERE ${columnName} IS NOT NULL;`,
        ``,
        `-- データ整合性確認`,
        `SELECT COUNT(*) FROM ${tableName} WHERE ${columnName} IS NOT NULL AND ${tempColumnName} IS NULL;`,
        `-- 結果は0であること`,
        ``,
        `-- 新しい列のNOT NULL制約追加（段階的）`,
        `UPDATE ${tableName} SET ${tempColumnName} = 'pending' WHERE ${tempColumnName} IS NULL;`,
        `ALTER TABLE ${tableName} ALTER COLUMN ${tempColumnName} SET NOT NULL;`
      ],
      rollbackActions: [
        `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${tempColumnName};`
      ],
      prerequisites: [
        'Phase 1が正常完了',
        'すべてのデータ検証が完了',
        'バックアップが取得済み'
      ],
      validations: [
        '新列のデータが元列と完全一致',
        '新列のNOT NULL制約が適用された',
        'アプリケーションに影響がない'
      ]
    },
    {
      phase: 3,
      name: 'Dual-Column Operation',
      description: 'アプリケーション側でのFeature Flag切り替え対応',
      actions: [
        `-- Feature Flagを段階的に有効化（まずはdev環境）`,
        `UPDATE feature_flags SET enabled = true WHERE key = '${featureFlagKey}' AND environment = 'development';`,
        ``,
        `-- Next.js側のコード更新デプロイ`,
        `-- 型安全な読み書き両方対応`,
        `-- Feature Flag確認後に新列を使用`,
        ``,
        `-- 新しいレコード挿入/更新時は両列更新`,
        `-- トリガー作成（一時的な整合性保証）`,
        `CREATE OR REPLACE FUNCTION sync_${tableName}_${columnName}()`,
        `RETURNS TRIGGER AS $$`,
        `BEGIN`,
        `  -- Feature Flag確認`,
        `  IF (SELECT enabled FROM feature_flags WHERE key = '${featureFlagKey}') THEN`,
        `    NEW.${columnName} := NEW.${tempColumnName}::text;`,
        `  ELSE`,
        `    NEW.${tempColumnName} := NEW.${columnName}::${enumName};`,
        `  END IF;`,
        `  RETURN NEW;`,
        `END;`,
        `$$ LANGUAGE plpgsql;`,
        ``,
        `CREATE TRIGGER sync_${tableName}_${columnName}_trigger`,
        `  BEFORE INSERT OR UPDATE ON ${tableName}`,
        `  FOR EACH ROW EXECUTE FUNCTION sync_${tableName}_${columnName}();`
      ],
      rollbackActions: [
        `UPDATE feature_flags SET enabled = false WHERE key = '${featureFlagKey}';`,
        `DROP TRIGGER IF EXISTS sync_${tableName}_${columnName}_trigger ON ${tableName};`,
        `DROP FUNCTION IF EXISTS sync_${tableName}_${columnName}();`
      ],
      prerequisites: [
        'Phase 2が正常完了',
        'Next.js側の対応コードが準備済み',
        'Feature Flag読み込み機能が実装済み'
      ],
      validations: [
        'Feature Flag切り替えでアプリが正常動作',
        '新旧両列のデータ整合性が保たれている',
        'パフォーマンスに問題がない'
      ]
    },
    {
      phase: 4,
      name: 'Production Cutover',
      description: '本番環境での切り替えと安定化',
      actions: [
        `-- 本番Feature Flag有効化（段階的）`,
        `UPDATE feature_flags SET enabled = true WHERE key = '${featureFlagKey}' AND environment = 'staging';`,
        `-- 24時間監視後に本番適用`,
        `UPDATE feature_flags SET enabled = true WHERE key = '${featureFlagKey}' AND environment = 'production';`,
        ``,
        `-- データ整合性最終確認`,
        `SELECT COUNT(*) FROM ${tableName} WHERE ${columnName}::${enumName} != ${tempColumnName};`,
        `-- 結果は0であること`,
        ``,
        `-- パフォーマンス監視`,
        `-- インデックスが必要な場合は追加`,
        `CREATE INDEX CONCURRENTLY idx_${tableName}_${tempColumnName} ON ${tableName}(${tempColumnName});`
      ],
      rollbackActions: [
        `UPDATE feature_flags SET enabled = false WHERE key = '${featureFlagKey}';`,
        `-- 必要に応じて旧列の動作に戻す`
      ],
      prerequisites: [
        'Phase 3でのstaging検証が完了',
        'Feature Flag動作が安定',
        '監視体制が整備済み'
      ],
      validations: [
        '本番でのenum動作が安定',
        'パフォーマンス劣化がない',
        'エラー率に変化がない'
      ]
    },
    {
      phase: 5,
      name: 'Cleanup & Finalization',
      description: '旧列削除とクリーンアップ',
      actions: [
        `-- 最低2週間の安定稼働後に実行`,
        ``,
        `-- 旧列を新列に置き換え`,
        `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${columnName}_old;`,
        `ALTER TABLE ${tableName} RENAME COLUMN ${tempColumnName} TO ${columnName};`,
        ``,
        `-- 同期トリガー削除`,
        `DROP TRIGGER IF EXISTS sync_${tableName}_${columnName}_trigger ON ${tableName};`,
        `DROP FUNCTION IF EXISTS sync_${tableName}_${columnName}();`,
        ``,
        `-- 30日後に旧列完全削除`,
        `-- ALTER TABLE ${tableName} DROP COLUMN ${columnName}_old;`,
        ``,
        `-- Feature Flag削除（必要に応じて）`,
        `-- DELETE FROM feature_flags WHERE key = '${featureFlagKey}';`
      ],
      rollbackActions: [
        `-- この段階でのrollbackは複雑なため、事前に十分な検証が必要`,
        `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${tempColumnName};`,
        `ALTER TABLE ${tableName} RENAME COLUMN ${columnName}_old TO ${columnName};`
      ],
      prerequisites: [
        '本番で最低2週間の安定稼働',
        'すべての監視指標が正常',
        'rollback不要の確信が得られた'
      ],
      validations: [
        '新enumが完全に機能している',
        'パフォーマンスが期待通り',
        'Feature Flagが不要になった'
      ]
    }
  ]

  return {
    tableName,
    columnName,
    enumName,
    enumValues,
    currentDataValidation: `SELECT ${columnName}, COUNT(*) FROM ${tableName} WHERE ${columnName} NOT IN (${enumValues.map(v => `'${v}'`).join(', ')}) GROUP BY ${columnName}`,
    phases,
    featureFlagKey,
    estimatedDuration: '2-4週間（段階的実行）',
    riskLevel: enumValues.length <= 10 ? 'low' : 'medium'
  }
}

function generateMigrationScript(plan: EnumMigrationPlan): void {
  console.log(`🚀 ${plan.tableName}.${plan.columnName} → ${plan.enumName} Migration Plan`)
  console.log('='.repeat(80))
  console.log()
  console.log(`📋 概要:`)
  console.log(`  テーブル: ${plan.tableName}`)
  console.log(`  列: ${plan.columnName}`)
  console.log(`  Enum名: ${plan.enumName}`)
  console.log(`  値: [${plan.enumValues.join(', ')}]`)
  console.log(`  リスクレベル: ${plan.riskLevel}`)
  console.log(`  予想期間: ${plan.estimatedDuration}`)
  console.log(`  Feature Flag: ${plan.featureFlagKey}`)
  console.log()

  console.log(`🔍 事前データ検証クエリ:`)
  console.log(plan.currentDataValidation)
  console.log()

  plan.phases.forEach(phase => {
    console.log(`📌 Phase ${phase.phase}: ${phase.name}`)
    console.log(`説明: ${phase.description}`)
    console.log()

    console.log('前提条件:')
    phase.prerequisites.forEach(prereq => {
      console.log(`  ✅ ${prereq}`)
    })
    console.log()

    console.log('実行手順:')
    phase.actions.forEach(action => {
      console.log(`${action}`)
    })
    console.log()

    console.log('検証項目:')
    phase.validations.forEach(validation => {
      console.log(`  🔍 ${validation}`)
    })
    console.log()

    console.log('Rollback手順:')
    phase.rollbackActions.forEach(rollback => {
      console.log(`  ⚠️ ${rollback}`)
    })
    console.log()
    console.log('-'.repeat(60))
    console.log()
  })
}

async function main() {
  console.log('🎯 P1-2 段階的Enum移行フレームワーク\n')

  // Phase 1対象候補の移行計画生成
  const highPriorityPlans = [
    createEnumMigrationPlan(
      'ai_interview_sessions',
      'status',
      'interview_session_status',
      ['pending', 'in_progress', 'completed', 'cancelled', 'failed']
    ),
    createEnumMigrationPlan(
      'ai_interview_sessions', 
      'content_type',
      'interview_content_type',
      ['text', 'video', 'audio', 'structured']
    ),
    createEnumMigrationPlan(
      'user_profiles',
      'onboarding_status', 
      'onboarding_status',
      ['not_started', 'in_progress', 'completed', 'skipped']
    )
  ]

  console.log(`📊 Generated ${highPriorityPlans.length} migration plans for Phase 1 candidates`)
  console.log()

  // 最初の計画の詳細表示
  generateMigrationScript(highPriorityPlans[0])

  console.log(`💡 次のステップ:`)
  console.log('1. Supabaseアシスタントに移行手順を確認')
  console.log('2. Feature Flag機能の実装')
  console.log('3. 最初の候補で移行テスト実行')
  console.log('4. Migration Runbookの完成')
}

if (require.main === module) {
  main().catch((error) => {
    console.error('🔥 スクリプト実行エラー:', error)
    process.exit(1)
  })
}