'use client';

import { supabaseBrowser } from '@/lib/supabase-client';
import { type CaseStudy, type CaseStudyFormData } from '@/types/database';

// ケーススタディ一覧取得（特定企業）
export async function getCaseStudies(organizationId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('case_studies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return { data: null, error };
  }
}

// ケーススタディ詳細取得
export async function getCaseStudy(caseStudyId: string) {
  try {
    const { data, error } = await supabaseBrowser
      .from('case_studies')
      .select(`
        *,
        organization:organizations(id, name, slug),
        service:services(id, name)
      `)
      .eq('id', caseStudyId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching case study:', error);
    return { data: null, error };
  }
}

// ケーススタディ作成
export async function createCaseStudy(organizationId: string, caseStudyData: CaseStudyFormData) {
  try {
    const { data, error } = await supabaseBrowser
      .from('case_studies')
      .insert({
        ...caseStudyData,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating case study:', error);
    return { data: null, error };
  }
}

// ケーススタディ更新
export async function updateCaseStudy(caseStudyId: string, caseStudyData: Partial<CaseStudyFormData>) {
  try {
    const { data, error } = await supabaseBrowser
      .from('case_studies')
      .update(caseStudyData)
      .eq('id', caseStudyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating case study:', error);
    return { data: null, error };
  }
}

// ケーススタディ削除
export async function deleteCaseStudy(caseStudyId: string) {
  try {
    const { error } = await supabaseBrowser
      .from('case_studies')
      .delete()
      .eq('id', caseStudyId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting case study:', error);
    return { error };
  }
}

// 業界一覧取得（ケーススタディから）
export async function getClientIndustries() {
  try {
    const { data, error } = await supabaseBrowser
      .from('case_studies')
      .select('client_industry')
      .not('client_industry', 'is', null);

    if (error) throw error;

    const industries = Array.from(
      new Set(data.map(item => item.client_industry).filter(Boolean))
    ).sort();

    return { data: industries, error: null };
  } catch (error) {
    console.error('Error fetching client industries:', error);
    return { data: [], error };
  }
}

// 企業規模一覧取得
export function getClientSizes() {
  return [
    'スタートアップ（1-10名）',
    '中小企業（11-100名）',
    '中堅企業（101-1,000名）',
    '大企業（1,001-10,000名）',
    '大手企業（10,000名以上）',
    '非営利団体',
    '政府機関',
    '教育機関'
  ];
}