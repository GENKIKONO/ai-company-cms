-- Faceted Search Database Functions
-- Create RPC functions for efficient faceted search queries

-- Function to get industry facets with counts
CREATE OR REPLACE FUNCTION get_industry_facets(current_filters TEXT DEFAULT '{}')
RETURNS TABLE (industry TEXT, count BIGINT) AS $$
DECLARE
  filters JSONB;
BEGIN
  filters := current_filters::JSONB;
  
  RETURN QUERY
  SELECT 
    UNNEST(o.industries) as industry,
    COUNT(DISTINCT o.id) as count
  FROM organizations o
  WHERE 
    (NOT (filters ? 'query') OR 
     o.name ILIKE '%' || (filters->>'query') || '%' OR 
     o.description ILIKE '%' || (filters->>'query') || '%' OR
     o.keywords ILIKE '%' || (filters->>'query') || '%'
    )
    AND (NOT (filters ? 'regions') OR 
         o.address_region = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'regions')))
    )
    AND (NOT (filters ? 'sizes') OR 
         o.size = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'sizes')))
    )
    AND (NOT (filters ? 'technologies') OR 
         o.technologies && ARRAY(SELECT jsonb_array_elements_text(filters->'technologies'))
    )
    AND (NOT (filters ? 'hasUrl') OR 
         (filters->>'hasUrl')::BOOLEAN = (o.url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasLogo') OR 
         (filters->>'hasLogo')::BOOLEAN = (o.logo_url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasServices') OR 
         (filters->>'hasServices')::BOOLEAN = (o.services IS NOT NULL)
    )
    AND (NOT (filters ? 'hasCaseStudies') OR 
         (filters->>'hasCaseStudies')::BOOLEAN = (o.case_studies IS NOT NULL)
    )
    AND (NOT (filters ? 'isVerified') OR 
         o.is_verified = (filters->>'isVerified')::BOOLEAN
    )
    AND o.industries IS NOT NULL
  GROUP BY UNNEST(o.industries)
  HAVING COUNT(DISTINCT o.id) > 0
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get region facets with counts
CREATE OR REPLACE FUNCTION get_region_facets(current_filters TEXT DEFAULT '{}')
RETURNS TABLE (region TEXT, count BIGINT) AS $$
DECLARE
  filters JSONB;
BEGIN
  filters := current_filters::JSONB;
  
  RETURN QUERY
  SELECT 
    o.address_region as region,
    COUNT(DISTINCT o.id) as count
  FROM organizations o
  WHERE 
    (NOT (filters ? 'query') OR 
     o.name ILIKE '%' || (filters->>'query') || '%' OR 
     o.description ILIKE '%' || (filters->>'query') || '%' OR
     o.keywords ILIKE '%' || (filters->>'query') || '%'
    )
    AND (NOT (filters ? 'industries') OR 
         o.industries && ARRAY(SELECT jsonb_array_elements_text(filters->'industries'))
    )
    AND (NOT (filters ? 'sizes') OR 
         o.size = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'sizes')))
    )
    AND (NOT (filters ? 'technologies') OR 
         o.technologies && ARRAY(SELECT jsonb_array_elements_text(filters->'technologies'))
    )
    AND (NOT (filters ? 'hasUrl') OR 
         (filters->>'hasUrl')::BOOLEAN = (o.url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasLogo') OR 
         (filters->>'hasLogo')::BOOLEAN = (o.logo_url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasServices') OR 
         (filters->>'hasServices')::BOOLEAN = (o.services IS NOT NULL)
    )
    AND (NOT (filters ? 'hasCaseStudies') OR 
         (filters->>'hasCaseStudies')::BOOLEAN = (o.case_studies IS NOT NULL)
    )
    AND (NOT (filters ? 'isVerified') OR 
         o.is_verified = (filters->>'isVerified')::BOOLEAN
    )
    AND o.address_region IS NOT NULL
  GROUP BY o.address_region
  HAVING COUNT(DISTINCT o.id) > 0
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get size facets with counts
CREATE OR REPLACE FUNCTION get_size_facets(current_filters TEXT DEFAULT '{}')
RETURNS TABLE (size TEXT, count BIGINT) AS $$
DECLARE
  filters JSONB;
BEGIN
  filters := current_filters::JSONB;
  
  RETURN QUERY
  SELECT 
    o.size as size,
    COUNT(DISTINCT o.id) as count
  FROM organizations o
  WHERE 
    (NOT (filters ? 'query') OR 
     o.name ILIKE '%' || (filters->>'query') || '%' OR 
     o.description ILIKE '%' || (filters->>'query') || '%' OR
     o.keywords ILIKE '%' || (filters->>'query') || '%'
    )
    AND (NOT (filters ? 'industries') OR 
         o.industries && ARRAY(SELECT jsonb_array_elements_text(filters->'industries'))
    )
    AND (NOT (filters ? 'regions') OR 
         o.address_region = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'regions')))
    )
    AND (NOT (filters ? 'technologies') OR 
         o.technologies && ARRAY(SELECT jsonb_array_elements_text(filters->'technologies'))
    )
    AND (NOT (filters ? 'hasUrl') OR 
         (filters->>'hasUrl')::BOOLEAN = (o.url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasLogo') OR 
         (filters->>'hasLogo')::BOOLEAN = (o.logo_url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasServices') OR 
         (filters->>'hasServices')::BOOLEAN = (o.services IS NOT NULL)
    )
    AND (NOT (filters ? 'hasCaseStudies') OR 
         (filters->>'hasCaseStudies')::BOOLEAN = (o.case_studies IS NOT NULL)
    )
    AND (NOT (filters ? 'isVerified') OR 
         o.is_verified = (filters->>'isVerified')::BOOLEAN
    )
    AND o.size IS NOT NULL
  GROUP BY o.size
  HAVING COUNT(DISTINCT o.id) > 0
  ORDER BY 
    CASE o.size
      WHEN 'small' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'large' THEN 3
      WHEN 'enterprise' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get technology facets with counts
CREATE OR REPLACE FUNCTION get_technology_facets(current_filters TEXT DEFAULT '{}', limit_count INTEGER DEFAULT 20)
RETURNS TABLE (technology TEXT, count BIGINT) AS $$
DECLARE
  filters JSONB;
BEGIN
  filters := current_filters::JSONB;
  
  RETURN QUERY
  SELECT 
    UNNEST(o.technologies) as technology,
    COUNT(DISTINCT o.id) as count
  FROM organizations o
  WHERE 
    (NOT (filters ? 'query') OR 
     o.name ILIKE '%' || (filters->>'query') || '%' OR 
     o.description ILIKE '%' || (filters->>'query') || '%' OR
     o.keywords ILIKE '%' || (filters->>'query') || '%'
    )
    AND (NOT (filters ? 'industries') OR 
         o.industries && ARRAY(SELECT jsonb_array_elements_text(filters->'industries'))
    )
    AND (NOT (filters ? 'regions') OR 
         o.address_region = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'regions')))
    )
    AND (NOT (filters ? 'sizes') OR 
         o.size = ANY(ARRAY(SELECT jsonb_array_elements_text(filters->'sizes')))
    )
    AND (NOT (filters ? 'hasUrl') OR 
         (filters->>'hasUrl')::BOOLEAN = (o.url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasLogo') OR 
         (filters->>'hasLogo')::BOOLEAN = (o.logo_url IS NOT NULL)
    )
    AND (NOT (filters ? 'hasServices') OR 
         (filters->>'hasServices')::BOOLEAN = (o.services IS NOT NULL)
    )
    AND (NOT (filters ? 'hasCaseStudies') OR 
         (filters->>'hasCaseStudies')::BOOLEAN = (o.case_studies IS NOT NULL)
    )
    AND (NOT (filters ? 'isVerified') OR 
         o.is_verified = (filters->>'isVerified')::BOOLEAN
    )
    AND o.technologies IS NOT NULL
  GROUP BY UNNEST(o.technologies)
  HAVING COUNT(DISTINCT o.id) > 0
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for advanced search with sorting and filtering
CREATE OR REPLACE FUNCTION advanced_organization_search(
  search_query TEXT DEFAULT '',
  industry_filters TEXT[] DEFAULT '{}',
  region_filters TEXT[] DEFAULT '{}',
  size_filters TEXT[] DEFAULT '{}',
  technology_filters TEXT[] DEFAULT '{}',
  has_url_filter BOOLEAN DEFAULT NULL,
  has_logo_filter BOOLEAN DEFAULT NULL,
  has_services_filter BOOLEAN DEFAULT NULL,
  has_case_studies_filter BOOLEAN DEFAULT NULL,
  is_verified_filter BOOLEAN DEFAULT NULL,
  min_founded_year INTEGER DEFAULT NULL,
  max_founded_year INTEGER DEFAULT NULL,
  sort_by TEXT DEFAULT 'updated_at',
  sort_order TEXT DEFAULT 'desc',
  limit_count INTEGER DEFAULT 24,
  offset_count INTEGER DEFAULT 0
) RETURNS SETOF organizations AS $$
BEGIN
  RETURN QUERY
  SELECT o.*
  FROM organizations o
  WHERE 
    (search_query = '' OR 
     o.name ILIKE '%' || search_query || '%' OR 
     o.description ILIKE '%' || search_query || '%' OR
     o.keywords ILIKE '%' || search_query || '%'
    )
    AND (array_length(industry_filters, 1) IS NULL OR 
         o.industries && industry_filters
    )
    AND (array_length(region_filters, 1) IS NULL OR 
         o.address_region = ANY(region_filters)
    )
    AND (array_length(size_filters, 1) IS NULL OR 
         o.size = ANY(size_filters)
    )
    AND (array_length(technology_filters, 1) IS NULL OR 
         o.technologies && technology_filters
    )
    AND (has_url_filter IS NULL OR 
         (has_url_filter = true AND o.url IS NOT NULL) OR
         (has_url_filter = false AND o.url IS NULL)
    )
    AND (has_logo_filter IS NULL OR 
         (has_logo_filter = true AND o.logo_url IS NOT NULL) OR
         (has_logo_filter = false AND o.logo_url IS NULL)
    )
    AND (has_services_filter IS NULL OR 
         (has_services_filter = true AND o.services IS NOT NULL) OR
         (has_services_filter = false AND o.services IS NULL)
    )
    AND (has_case_studies_filter IS NULL OR 
         (has_case_studies_filter = true AND o.case_studies IS NOT NULL) OR
         (has_case_studies_filter = false AND o.case_studies IS NULL)
    )
    AND (is_verified_filter IS NULL OR 
         o.is_verified = is_verified_filter
    )
    AND (min_founded_year IS NULL OR 
         o.founded_year >= min_founded_year
    )
    AND (max_founded_year IS NULL OR 
         o.founded_year <= max_founded_year
    )
  ORDER BY 
    CASE 
      WHEN sort_by = 'name' AND sort_order = 'asc' THEN o.name
    END ASC,
    CASE 
      WHEN sort_by = 'name' AND sort_order = 'desc' THEN o.name
    END DESC,
    CASE 
      WHEN sort_by = 'founded_year' AND sort_order = 'asc' THEN o.founded_year::TEXT
    END ASC,
    CASE 
      WHEN sort_by = 'founded_year' AND sort_order = 'desc' THEN o.founded_year::TEXT
    END DESC,
    CASE 
      WHEN sort_by = 'updated_at' AND sort_order = 'asc' THEN o.updated_at
    END ASC,
    CASE 
      WHEN sort_by = 'updated_at' AND sort_order = 'desc' THEN o.updated_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create search performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_search_text ON organizations 
USING gin(to_tsvector('japanese', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(keywords, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_industries ON organizations 
USING gin(industries);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_technologies ON organizations 
USING gin(technologies);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_region ON organizations (address_region);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_size ON organizations (size);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_founded_year ON organizations (founded_year);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_verified ON organizations (is_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_updated_at ON organizations (updated_at DESC);