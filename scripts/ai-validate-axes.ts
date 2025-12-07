/**
 * AI Interview Axes バリデーション
 * 質問軸の健康診断を実行する軽いヘルスチェック
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 想定される軸コード（直接定義）
const INTERVIEW_AXES = {
  BASIC: 'basic',
  PRICING: 'pricing',
  VALUE: 'value',
  DIFFERENTIATION: 'differentiation',
  USE_CASES: 'use_cases',
  CUSTOMER: 'customer',
  RISKS: 'risks',
};

async function validateInterviewAxes() {
  console.log('🔍 AI Interview Axes バリデーション開始...');
  
  try {
    // Supabaseクライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 全ての軸データを取得
    const { data: axes, error } = await supabase
      .from('ai_interview_axes')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ データベース接続エラー:', error.message);
      process.exit(1);
    }

    if (!axes || axes.length === 0) {
      console.warn('⚠️  ai_interview_axes テーブルにデータが存在しません（初期状態）');
      console.log('ℹ️  スキーマ構造は正常です。初期データ投入後に再実行してください。');
      return;
    }

    console.log(`📊 軸データ数: ${axes.length}件`);

    // 2. 基本チェック：重複codeの確認
    const codes = axes.map(axis => axis.code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
      console.error('❌ 重複するcodeが存在します:', [...new Set(duplicates)]);
      process.exit(1);
    }

    // 3. アクティブな軸の存在チェック
    const activeAxes = axes.filter(axis => axis.is_active);
    if (activeAxes.length === 0) {
      console.error('❌ is_active=true の軸が存在しません');
      process.exit(1);
    }
    
    console.log(`✅ アクティブな軸: ${activeAxes.length}件`);

    // 4. 想定される軸コードの存在チェック（任意）
    const expectedAxes = Object.values(INTERVIEW_AXES);
    const existingCodes = axes.map(axis => axis.code);
    const missingExpectedAxes = expectedAxes.filter(expected => !existingCodes.includes(expected));
    
    if (missingExpectedAxes.length > 0) {
      console.warn('⚠️  想定されている軸コードが未定義:', missingExpectedAxes);
    }

    // 5. 多言語対応チェック
    const axesWithoutJa = axes.filter(axis => !axis.label_ja || axis.label_ja.trim() === '');
    const axesWithoutEn = axes.filter(axis => !axis.label_en || axis.label_en.trim() === '');
    
    if (axesWithoutJa.length > 0) {
      console.warn('⚠️  日本語ラベルが空の軸:', axesWithoutJa.map(a => a.code));
    }
    
    if (axesWithoutEn.length > 0) {
      console.warn('⚠️  英語ラベルが空の軸:', axesWithoutEn.map(a => a.code));
    }

    console.log('✅ AI Interview Axes バリデーション完了');
    console.log('');

  } catch (error) {
    console.error('❌ バリデーション中にエラーが発生:', error);
    process.exit(1);
  }
}

// 直接実行された場合
if (require.main === module) {
  validateInterviewAxes();
}

module.exports = { validateInterviewAxes };