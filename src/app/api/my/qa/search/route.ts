import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category_id = searchParams.get('category_id');
    const status = searchParams.get('status') || 'published';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        data: [],
        message: 'Search query is required' 
      });
    }

    let searchQuery = supabase
      .from('qa_entries')
      .select(`
        id,
        question,
        answer,
        tags,
        status,
        published_at,
        qa_categories!left(id, name, slug)
      `)
      .eq('organization_id', organization.id)
      .eq('status', status)
      .textSearch('search_vector', query.trim());

    if (category_id) {
      searchQuery = searchQuery.eq('category_id', category_id);
    }

    const { data: entries, error } = await searchQuery
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching entries:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Add search relevance highlighting (simple implementation)
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const processedEntries = entries?.map(entry => {
      let questionHighlight = entry.question;
      let answerHighlight = entry.answer;
      
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        questionHighlight = questionHighlight.replace(regex, '<mark>$1</mark>');
        answerHighlight = answerHighlight.replace(regex, '<mark>$1</mark>');
      });

      return {
        ...entry,
        question_highlight: questionHighlight,
        answer_highlight: answerHighlight
      };
    }) || [];

    return NextResponse.json({
      data: processedEntries,
      query: query.trim(),
      total: processedEntries.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}