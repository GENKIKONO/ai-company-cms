/**
 * AI Interview Questions バリデーション
 * 質問テンプレートの健康診断を実行する軽いヘルスチェック
 */

import { createClient } from '@supabase/supabase-js';
import { CONTENT_TYPES, SUPPORTED_LANGUAGES } from '../src/types/ai-interviewer';

async function validateInterviewQuestions() {
  console.log('🔍 AI Interview Questions バリデーション開始...');
  
  try {
    // Supabaseクライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 全ての質問データを取得
    const { data: questions, error: questionsError } = await supabase
      .from('ai_interview_questions')
      .select(`
        *,
        ai_interview_axes!inner(code, is_active)
      `);

    if (questionsError) {
      console.error('❌ 質問データ取得エラー:', questionsError.message);
      process.exit(1);
    }

    if (!questions || questions.length === 0) {
      console.warn('⚠️  ai_interview_questions テーブルにデータが存在しません（初期状態）');
      console.log('ℹ️  スキーマ構造は正常です。初期データ投入後に再実行してください。');
      return;
    }

    console.log(`📊 質問データ数: ${questions.length}件`);

    // 2. 基本チェック：question_textが空でないか
    const emptyQuestions = questions.filter(q => !q.question_text || q.question_text.trim() === '');
    if (emptyQuestions.length > 0) {
      console.error('❌ question_textが空の質問:', emptyQuestions.map(q => q.id));
      process.exit(1);
    }

    // 3. 軸の存在チェック（JOIN先のデータが存在するか）
    const orphanQuestions = questions.filter(q => !q.ai_interview_axes);
    if (orphanQuestions.length > 0) {
      console.error('❌ 軸データが見つからない質問:', orphanQuestions.map(q => q.id));
      process.exit(1);
    }

    // 4. content_typeの妥当性チェック
    const validContentTypes = Object.values(CONTENT_TYPES);
    const invalidContentTypes = questions.filter(q => !validContentTypes.includes(q.content_type));
    if (invalidContentTypes.length > 0) {
      console.warn('⚠️  想定外のcontent_type:', 
        [...new Set(invalidContentTypes.map(q => q.content_type))]);
    }

    // 5. langの妥当性チェック
    const validLanguages = Object.values(SUPPORTED_LANGUAGES);
    const invalidLanguages = questions.filter(q => !validLanguages.includes(q.lang));
    if (invalidLanguages.length > 0) {
      console.warn('⚠️  想定外のlang:', 
        [...new Set(invalidLanguages.map(q => q.lang))]);
    }

    // 6. アクティブな質問の統計
    const activeQuestions = questions.filter(q => q.is_active);
    console.log(`✅ アクティブな質問: ${activeQuestions.length}件`);

    // 7. content_type別の統計
    const contentTypeStats = validContentTypes.reduce((stats, contentType) => {
      const count = activeQuestions.filter(q => q.content_type === contentType).length;
      if (count > 0) stats[contentType] = count;
      return stats;
    }, {} as Record<string, number>);

    if (Object.keys(contentTypeStats).length > 0) {
      console.log('📋 content_type別の質問数:');
      Object.entries(contentTypeStats).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}件`);
      });
    }

    // 8. 言語別の統計
    const langStats = validLanguages.reduce((stats, lang) => {
      const count = activeQuestions.filter(q => q.lang === lang).length;
      if (count > 0) stats[lang] = count;
      return stats;
    }, {} as Record<string, number>);

    if (Object.keys(langStats).length > 0) {
      console.log('🌐 言語別の質問数:');
      Object.entries(langStats).forEach(([lang, count]) => {
        console.log(`  - ${lang}: ${count}件`);
      });
    }

    console.log('✅ AI Interview Questions バリデーション完了');
    console.log('');

  } catch (error) {
    console.error('❌ バリデーション中にエラーが発生:', error);
    process.exit(1);
  }
}

// 直接実行された場合
if (require.main === module) {
  validateInterviewQuestions();
}

export { validateInterviewQuestions };