'use client';

import { supabase } from '@/lib/supabase';
import { type Locale, locales } from '@/i18n';

export interface TranslatableContent {
  id: string;
  table: string;
  field: string;
  originalContent: string;
  locale: Locale;
  translatedContent?: string;
  status: 'pending' | 'translated' | 'approved' | 'rejected';
  translatedAt?: string;
  translatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationRequest {
  contentId: string;
  table: string;
  field: string;
  originalContent: string;
  targetLocale: Locale;
  sourceLocale: Locale;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  notes?: string;
}

export interface TranslationStats {
  totalContent: number;
  translatedContent: number;
  pendingTranslations: number;
  approvedTranslations: number;
  completionPercentage: number;
  byLocale: Record<Locale, {
    total: number;
    translated: number;
    pending: number;
    approved: number;
    completion: number;
  }>;
}

class TranslationManagerService {
  async getTranslatableContent(options: {
    locale?: Locale;
    table?: string;
    status?: TranslatableContent['status'];
    limit?: number;
    offset?: number;
  } = {}) {
    const { locale, table, status, limit = 50, offset = 0 } = options;

    let query = supabase
      .from('translatable_content')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (locale) {
      query = query.eq('locale', locale);
    }

    if (table) {
      query = query.eq('table', table);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch translatable content: ${error.message}`);
    }

    return data as TranslatableContent[];
  }

  async createTranslationRequest(request: Omit<TranslationRequest, 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('translation_requests')
      .insert({
        ...request,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create translation request: ${error.message}`);
    }

    return data;
  }

  async updateTranslation(
    contentId: string,
    updates: {
      translatedContent?: string;
      status?: TranslatableContent['status'];
      translatedBy?: string;
      approvedBy?: string;
    }
  ) {
    const now = new Date().toISOString();
    const updateData: any = {
      ...updates,
      updated_at: now,
    };

    if (updates.translatedContent) {
      updateData.translated_at = now;
    }

    if (updates.status === 'approved') {
      updateData.approved_at = now;
    }

    const { data, error } = await supabase
      .from('translatable_content')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update translation: ${error.message}`);
    }

    return data;
  }

  async approveTranslation(contentId: string, approvedBy: string) {
    return this.updateTranslation(contentId, {
      status: 'approved',
      approvedBy,
    });
  }

  async rejectTranslation(contentId: string, reason?: string) {
    const { data, error } = await supabase
      .from('translatable_content')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject translation: ${error.message}`);
    }

    return data;
  }

  async getTranslationStats(): Promise<TranslationStats> {
    const { data, error } = await supabase
      .from('translatable_content')
      .select('locale, status');

    if (error) {
      throw new Error(`Failed to fetch translation stats: ${error.message}`);
    }

    const stats: TranslationStats = {
      totalContent: data.length,
      translatedContent: 0,
      pendingTranslations: 0,
      approvedTranslations: 0,
      completionPercentage: 0,
      byLocale: {} as Record<Locale, any>,
    };

    // Initialize locale stats
    locales.forEach(locale => {
      stats.byLocale[locale] = {
        total: 0,
        translated: 0,
        pending: 0,
        approved: 0,
        completion: 0,
      };
    });

    // Calculate stats
    data.forEach(item => {
      const locale = item.locale as Locale;
      stats.byLocale[locale].total++;

      switch (item.status) {
        case 'translated':
          stats.translatedContent++;
          stats.byLocale[locale].translated++;
          break;
        case 'pending':
          stats.pendingTranslations++;
          stats.byLocale[locale].pending++;
          break;
        case 'approved':
          stats.approvedTranslations++;
          stats.byLocale[locale].approved++;
          break;
      }
    });

    // Calculate completion percentages
    stats.completionPercentage = stats.totalContent > 0 
      ? ((stats.translatedContent + stats.approvedTranslations) / stats.totalContent) * 100 
      : 0;

    locales.forEach(locale => {
      const localeStats = stats.byLocale[locale];
      localeStats.completion = localeStats.total > 0 
        ? ((localeStats.translated + localeStats.approved) / localeStats.total) * 100 
        : 0;
    });

    return stats;
  }

  async autoTranslateContent(contentId: string, targetLocale: Locale, apiKey?: string) {
    const { data: content, error } = await supabase
      .from('translatable_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error || !content) {
      throw new Error('Content not found');
    }

    try {
      // Simple auto-translation simulation
      // In a real implementation, you would call a translation API like Google Translate
      const translatedContent = await this.simulateTranslation(
        content.original_content,
        content.locale,
        targetLocale
      );

      return this.updateTranslation(contentId, {
        translatedContent,
        status: 'translated',
        translatedBy: 'auto-translator',
      });
    } catch (error) {
      console.error('Auto-translation failed:', error);
      throw new Error('Auto-translation failed');
    }
  }

  private async simulateTranslation(text: string, from: Locale, to: Locale): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple translation simulation
    const translations: Record<string, Record<Locale, string>> = {
      'ホーム': { en: 'Home', zh: '首页', ko: '홈', es: 'Inicio', fr: 'Accueil', de: 'Startseite' },
      '検索': { en: 'Search', zh: '搜索', ko: '검색', es: 'Buscar', fr: 'Rechercher', de: 'Suchen' },
      '企業': { en: 'Company', zh: '公司', ko: '기업', es: 'Empresa', fr: 'Entreprise', de: 'Unternehmen' },
      'ダッシュボード': { en: 'Dashboard', zh: '仪表板', ko: '대시보드', es: 'Panel', fr: 'Tableau de bord', de: 'Dashboard' },
    };

    return translations[text]?.[to] || `[${to}] ${text}`;
  }

  async bulkTranslate(contentIds: string[], targetLocale: Locale, translatedBy: string) {
    const results = [];

    for (const contentId of contentIds) {
      try {
        const result = await this.autoTranslateContent(contentId, targetLocale);
        results.push({ contentId, success: true, data: result });
      } catch (error) {
        results.push({ 
          contentId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  async searchTranslations(query: {
    search?: string;
    locale?: Locale;
    status?: TranslatableContent['status'];
    table?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let queryBuilder = supabase
      .from('translatable_content')
      .select('*')
      .order('updated_at', { ascending: false });

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `original_content.ilike.%${query.search}%,translated_content.ilike.%${query.search}%`
      );
    }

    if (query.locale) {
      queryBuilder = queryBuilder.eq('locale', query.locale);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.table) {
      queryBuilder = queryBuilder.eq('table', query.table);
    }

    if (query.dateFrom) {
      queryBuilder = queryBuilder.gte('created_at', query.dateFrom);
    }

    if (query.dateTo) {
      queryBuilder = queryBuilder.lte('created_at', query.dateTo);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to search translations: ${error.message}`);
    }

    return data as TranslatableContent[];
  }

  // Real-time subscription for translation updates
  subscribeToTranslationUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('translation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translatable_content',
        },
        callback
      )
      .subscribe();
  }
}

export const translationManager = new TranslationManagerService();