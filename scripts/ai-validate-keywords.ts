/**
 * Organization Keywords バリデーション
 * 組織キーワードの健康診断を実行する軽いヘルスチェック
 */

import { createClient } from '@supabase/supabase-js';

async function validateOrganizationKeywords() {
  console.log('🔍 Organization Keywords バリデーション開始...');
  
  try {
    // Supabaseクライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 全てのキーワードデータを取得
    const { data: keywords, error } = await supabase
      .from('organization_keywords')
      .select(`
        *,
        organizations!inner(name, status)
      `)
      .order('priority', { ascending: false });

    if (error) {
      console.error('❌ キーワードデータ取得エラー:', error.message);
      process.exit(1);
    }

    if (!keywords || keywords.length === 0) {
      console.warn('⚠️  organization_keywords テーブルにデータが存在しません（初期状態）');
      console.log('ℹ️  スキーマ構造は正常です。初期データ投入後に再実行してください。');
      return;
    }

    console.log(`📊 キーワードデータ数: ${keywords.length}件`);

    // 2. 基本チェック：keywordが空白でないか
    const emptyKeywords = keywords.filter(k => !k.keyword || k.keyword.trim() === '');
    if (emptyKeywords.length > 0) {
      console.error('❌ keywordが空のレコード:', emptyKeywords.map(k => k.id));
      process.exit(1);
    }

    // 3. priority値の妥当性チェック（極端に変な値を検出）
    const invalidPriorities = keywords.filter(k => k.priority < 0 || k.priority > 1000);
    if (invalidPriorities.length > 0) {
      console.warn('⚠️  異常なpriority値:', 
        invalidPriorities.map(k => ({ id: k.id, priority: k.priority })));
    }

    // 4. アクティブなキーワードの統計
    const activeKeywords = keywords.filter(k => k.is_active);
    console.log(`✅ アクティブなキーワード: ${activeKeywords.length}件`);

    // 5. 組織別キーワード数の統計（上位5組織）
    const orgKeywordCounts = keywords.reduce((counts, keyword) => {
      const orgId = keyword.organization_id;
      const orgName = keyword.organizations?.name || 'Unknown';
      const key = `${orgName} (${orgId.substring(0, 8)}...)`;
      
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const topOrgs = Object.entries(orgKeywordCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    if (topOrgs.length > 0) {
      console.log('🏢 組織別キーワード数（上位5組織）:');
      topOrgs.forEach(([orgName, count]) => {
        console.log(`  - ${orgName}: ${count}件`);
      });
    }

    // 6. locale別の統計
    const localeStats = keywords.reduce((stats, keyword) => {
      const locale = keyword.locale || 'null';
      stats[locale] = (stats[locale] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    if (Object.keys(localeStats).length > 0) {
      console.log('🌐 locale別キーワード数:');
      Object.entries(localeStats).forEach(([locale, count]) => {
        console.log(`  - ${locale}: ${count}件`);
      });
    }

    // 7. priority分布の統計
    const priorityRanges = {
      'High (80-100)': keywords.filter(k => k.priority >= 80 && k.priority <= 100).length,
      'Medium (50-79)': keywords.filter(k => k.priority >= 50 && k.priority < 80).length,
      'Low (1-49)': keywords.filter(k => k.priority >= 1 && k.priority < 50).length,
      'Default (100)': keywords.filter(k => k.priority === 100).length,
    };

    console.log('📊 priority範囲別分布:');
    Object.entries(priorityRanges).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`  - ${range}: ${count}件`);
      }
    });

    // 8. 重複チェック（同一organization_id, keyword, localeの組み合わせ）
    const duplicateCheck = keywords.reduce((acc, keyword) => {
      const key = `${keyword.organization_id}-${keyword.keyword}-${keyword.locale || 'null'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(keyword.id);
      return acc;
    }, {} as Record<string, string[]>);

    const duplicates = Object.entries(duplicateCheck).filter(([, ids]) => (ids as string[]).length > 1);
    if (duplicates.length > 0) {
      console.warn('⚠️  重複の可能性があるキーワード組み合わせ:');
      duplicates.forEach(([key, ids]) => {
        console.log(`  - ${key}: ${(ids as string[]).length}件 (${(ids as string[]).join(', ')})`);
      });
    }

    console.log('✅ Organization Keywords バリデーション完了');
    console.log('');

  } catch (error) {
    console.error('❌ バリデーション中にエラーが発生:', error);
    process.exit(1);
  }
}

// 直接実行された場合
if (require.main === module) {
  validateOrganizationKeywords();
}

export { validateOrganizationKeywords };