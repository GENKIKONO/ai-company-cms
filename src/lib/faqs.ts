'use client';

import { supabaseBrowser } from '@/lib/supabase-client';
import { type FAQ, type FAQFormData } from '@/types/database';

// FAQ一覧取得（特定企業）
export async function getFAQs(organizationId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('faqs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return { data: null, error };
  }
}

// FAQ詳細取得
export async function getFAQ(faqId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('faqs')
      .select(`
        *,
        organization:organizations(id, name, slug),
        service:services(id, name)
      `)
      .eq('id', faqId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return { data: null, error };
  }
}

// FAQ作成
export async function createFAQ(organizationId: string, faqData: FAQFormData) {
  try {
    // 新しいorder_indexを自動設定（最後に追加）
    const { data: maxOrderData } = await supabaseBrowser
      .from('faqs')
      .select('order_index')
      .eq('organization_id', organizationId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
      ? maxOrderData[0].order_index + 1 
      : 1;

    // Map sort_order to order_index for database
    const { sort_order, ...restData } = faqData;
    const { data, error } = await supabaseBrowser
      .from('faqs')
      .insert({
        ...restData,
        organization_id: organizationId,
        order_index: sort_order || nextOrderIndex
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return { data: null, error };
  }
}

// FAQ更新
export async function updateFAQ(faqId: string, faqData: Partial<FAQFormData>) {
  try {
    // Map sort_order to order_index for database
    const { sort_order, ...restData } = faqData;
    const updateData = {
      ...restData,
      ...(sort_order !== undefined && { order_index: sort_order })
    };
    
    const { data, error } = await supabaseBrowser
      .from('faqs')
      .update(updateData)
      .eq('id', faqId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return { data: null, error };
  }
}

// FAQ削除
export async function deleteFAQ(faqId: string) {
  try {
    const { error } = await supabaseBrowser
      .from('faqs')
      .delete()
      .eq('id', faqId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { error };
  }
}

// FAQ並び替え
export async function reorderFAQs(organizationId: string, faqIds: string[]) {
  try {
    // 複数のFAQのorder_indexを一括更新
    const updates = faqIds.map((id, index) => ({
      id,
      order_index: index + 1
    }));

    for (const update of updates) {
      await supabaseBrowser
        .from('faqs')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('organization_id', organizationId);
    }

    return { error: null };
  } catch (error) {
    console.error('Error reordering FAQs:', error);
    return { error };
  }
}

// FAQカテゴリ一覧取得
export async function getFAQCategories() {
  try {
    const { data, error } = await supabaseBrowser
      .from('faqs')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = Array.from(
      new Set(data.map(item => item.category).filter(Boolean))
    ).sort();

    return { data: categories, error: null };
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return { data: [], error };
  }
}

// よく使われるFAQカテゴリ
export function getPopularFAQCategories() {
  return [
    '基本機能',
    '料金・プラン',
    'セットアップ',
    'トラブルシューティング',
    'セキュリティ',
    'API・連携',
    'サポート',
    'アカウント管理',
    'データ移行',
    'その他'
  ];
}