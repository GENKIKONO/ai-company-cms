#!/usr/bin/env ts-node
/**
 * P1-2 Enum/Domain化候補分析スクリプト
 * 
 * 現在のデータベースの実際の値を調査し、enum化候補を特定
 */

interface EnumCandidate {
  tableName: string
  columnName: string
  currentType: string
  suggestedEnumName: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  estimatedValues: string[]
  migrationComplexity: 'simple' | 'moderate' | 'complex'
}

function analyzeEnumCandidates(): EnumCandidate[] {
  const candidates: EnumCandidate[] = []

  // AI Interview関連の状態管理
  candidates.push({
    tableName: 'ai_interview_sessions',
    columnName: 'status',
    currentType: 'text',
    suggestedEnumName: 'interview_session_status',
    rationale: '面接セッションの状態は有限で明確に定義された値',
    priority: 'high',
    estimatedValues: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    migrationComplexity: 'simple'
  })

  candidates.push({
    tableName: 'ai_interview_sessions',
    columnName: 'content_type',
    currentType: 'text',
    suggestedEnumName: 'interview_content_type',
    rationale: 'インタビューコンテンツの種類は限定的',
    priority: 'high',
    estimatedValues: ['text', 'video', 'audio', 'structured'],
    migrationComplexity: 'simple'
  })

  // AI Interview Questions
  candidates.push({
    tableName: 'ai_interview_questions',
    columnName: 'content_type',
    currentType: 'text',
    suggestedEnumName: 'question_content_type',
    rationale: '質問の形式は予め定義された種類',
    priority: 'high',
    estimatedValues: ['multiple_choice', 'free_text', 'scenario', 'coding', 'behavioral'],
    migrationComplexity: 'simple'
  })

  candidates.push({
    tableName: 'ai_interview_questions',
    columnName: 'lang',
    currentType: 'text',
    suggestedEnumName: 'supported_language',
    rationale: 'サポート言語は限定的で管理しやすい',
    priority: 'medium',
    estimatedValues: ['ja', 'en', 'ko', 'zh'],
    migrationComplexity: 'simple'
  })

  // Case Studies
  candidates.push({
    tableName: 'case_studies',
    columnName: 'category',
    currentType: 'text',
    suggestedEnumName: 'case_study_category',
    rationale: 'ケーススタディのカテゴリは業務上限定的',
    priority: 'medium',
    estimatedValues: ['healthcare', 'eldercare', 'rehabilitation', 'diagnosis', 'treatment'],
    migrationComplexity: 'moderate'
  })

  // Materials
  candidates.push({
    tableName: 'materials',
    columnName: 'content_type',
    currentType: 'text',
    suggestedEnumName: 'material_content_type',
    rationale: '資料のコンテンツタイプは有限',
    priority: 'medium',
    estimatedValues: ['document', 'video', 'image', 'audio', 'presentation', 'interactive'],
    migrationComplexity: 'moderate'
  })

  // Posts
  candidates.push({
    tableName: 'posts',
    columnName: 'content_type',
    currentType: 'text',
    suggestedEnumName: 'post_content_type',
    rationale: '投稿コンテンツの種類管理',
    priority: 'medium',
    estimatedValues: ['blog', 'news', 'announcement', 'guide', 'tutorial'],
    migrationComplexity: 'moderate'
  })

  // QA Categories
  candidates.push({
    tableName: 'qa_categories',
    columnName: 'category_type',
    currentType: 'text',
    suggestedEnumName: 'qa_category_type',
    rationale: 'Q&Aカテゴリの種類は業務上定義済み',
    priority: 'medium',
    estimatedValues: ['general', 'technical', 'billing', 'support', 'feature'],
    migrationComplexity: 'simple'
  })

  // User Profile関連
  candidates.push({
    tableName: 'user_profiles',
    columnName: 'onboarding_status',
    currentType: 'text',
    suggestedEnumName: 'onboarding_status',
    rationale: 'オンボーディングの進行状態管理',
    priority: 'high',
    estimatedValues: ['not_started', 'in_progress', 'completed', 'skipped'],
    migrationComplexity: 'simple'
  })

  return candidates
}

function printAnalysisReport(candidates: EnumCandidate[]): void {
  console.log('🔍 P1-2 Enum/Domain化候補分析レポート')
  console.log('='.repeat(60))
  console.log()

  // Priority別の集計
  const highPriority = candidates.filter(c => c.priority === 'high')
  const mediumPriority = candidates.filter(c => c.priority === 'medium')
  const lowPriority = candidates.filter(c => c.priority === 'low')

  console.log('📊 優先度別サマリー:')
  console.log(`  🔴 高優先度: ${highPriority.length}件`)
  console.log(`  🟡 中優先度: ${mediumPriority.length}件`)
  console.log(`  🟢 低優先度: ${lowPriority.length}件`)
  console.log()

  // 詳細リスト
  console.log('📋 詳細候補リスト:')
  console.log()

  candidates.forEach((candidate, index) => {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }[candidate.priority]

    const complexityEmoji = {
      simple: '🟢',
      moderate: '🟡',
      complex: '🔴'
    }[candidate.migrationComplexity]

    console.log(`${index + 1}. ${priorityEmoji} ${candidate.tableName}.${candidate.columnName}`)
    console.log(`   提案enum名: ${candidate.suggestedEnumName}`)
    console.log(`   理由: ${candidate.rationale}`)
    console.log(`   予想値: [${candidate.estimatedValues.join(', ')}]`)
    console.log(`   移行複雑度: ${complexityEmoji} ${candidate.migrationComplexity}`)
    console.log()
  })

  console.log('🎯 P1-2 実装推奨順序:')
  console.log()
  console.log('Phase 1 (高優先度・simple):')
  highPriority
    .filter(c => c.migrationComplexity === 'simple')
    .forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.tableName}.${c.columnName} → ${c.suggestedEnumName}`)
    })

  console.log()
  console.log('Phase 2 (高優先度・moderate + 中優先度・simple):')
  const phase2 = [
    ...highPriority.filter(c => c.migrationComplexity === 'moderate'),
    ...mediumPriority.filter(c => c.migrationComplexity === 'simple')
  ]
  phase2.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.tableName}.${c.columnName} → ${c.suggestedEnumName}`)
  })

  console.log()
  console.log('📝 次のアクション:')
  console.log('1. 実際のデータ値調査（SELECT DISTINCT ...）')
  console.log('2. Supabaseアシスタントとenum vs domain選択相談')
  console.log('3. Feature Flag設定でPhase 1から段階的実装開始')
}

function generateDataInvestigationQueries(candidates: EnumCandidate[]): void {
  console.log()
  console.log('🔍 実データ調査用SQLクエリ:')
  console.log('='.repeat(60))
  console.log()

  candidates.forEach(candidate => {
    console.log(`-- ${candidate.tableName}.${candidate.columnName} の実際の値調査`)
    console.log(`SELECT ${candidate.columnName}, COUNT(*) as count`)
    console.log(`FROM ${candidate.tableName}`)
    console.log(`WHERE ${candidate.columnName} IS NOT NULL`)
    console.log(`GROUP BY ${candidate.columnName}`)
    console.log(`ORDER BY count DESC;`)
    console.log()
  })
}

async function main() {
  console.log('🚀 P1-2 Enum/Domain候補分析開始\n')

  try {
    const candidates = analyzeEnumCandidates()
    printAnalysisReport(candidates)
    generateDataInvestigationQueries(candidates)

    console.log('✅ 分析完了')
    console.log('📤 次のステップ: Supabaseアシスタントに確認事項を質問')

  } catch (error) {
    console.error('❌ 分析エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('🔥 スクリプト実行エラー:', error)
    process.exit(1)
  })
}