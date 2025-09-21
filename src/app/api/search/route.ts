import { NextRequest, NextResponse } from 'next/server';
import { facetedSearchService, SearchFilters } from '@/lib/faceted-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search parameters into filters
    const filters: SearchFilters = {};
    
    if (searchParams.get('q')) filters.query = searchParams.get('q')!;
    if (searchParams.get('industries')) {
      filters.industries = searchParams.get('industries')!.split(',');
    }
    if (searchParams.get('regions')) {
      filters.regions = searchParams.get('regions')!.split(',');
    }
    if (searchParams.get('sizes')) {
      filters.sizes = searchParams.get('sizes')!.split(',');
    }
    if (searchParams.get('technologies')) {
      filters.technologies = searchParams.get('technologies')!.split(',');
    }
    if (searchParams.get('hasUrl')) {
      filters.hasUrl = searchParams.get('hasUrl') === 'true';
    }
    if (searchParams.get('hasLogo')) {
      filters.hasLogo = searchParams.get('hasLogo') === 'true';
    }
    if (searchParams.get('hasServices')) {
      filters.hasServices = searchParams.get('hasServices') === 'true';
    }
    if (searchParams.get('hasCaseStudies')) {
      filters.hasCaseStudies = searchParams.get('hasCaseStudies') === 'true';
    }
    if (searchParams.get('isVerified')) {
      filters.isVerified = searchParams.get('isVerified') === 'true';
    }
    if (searchParams.get('lastUpdated')) {
      filters.lastUpdated = searchParams.get('lastUpdated')!;
    }
    if (searchParams.get('foundedYears')) {
      const years = searchParams.get('foundedYears')!.split(',').map(Number);
      if (years.length === 2) {
        filters.foundedYears = [years[0], years[1]];
      }
    }
    if (searchParams.get('employeeCount')) {
      const counts = searchParams.get('employeeCount')!.split(',').map(Number);
      if (counts.length === 2) {
        filters.employeeCount = [counts[0], counts[1]];
      }
    }
    if (searchParams.get('rating')) {
      const ratings = searchParams.get('rating')!.split(',').map(Number);
      if (ratings.length === 2) {
        filters.rating = [ratings[0], ratings[1]];
      }
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);

    // Perform faceted search
    const searchResult = await facetedSearchService.searchWithFacets(
      filters,
      page,
      limit
    );

    // Track search API usage

    return NextResponse.json({
      data: {
        organizations: searchResult.organizations,
        facets: searchResult.facets,
        total_count: searchResult.totalCount,
        has_more: searchResult.hasMore,
        search_time: searchResult.searchTime,
      },
      meta: {
        page,
        limit,
        filters_applied: Object.keys(filters).length,
      },
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}