-- Advanced Analytics Functions for LuxuCare

-- Function to get industry analytics with growth calculation
CREATE OR REPLACE FUNCTION get_industry_analytics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  industry TEXT,
  count BIGINT,
  growth NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      unnest(industries) as industry_name,
      COUNT(*) as current_count
    FROM organizations 
    WHERE created_at BETWEEN start_date AND end_date
      AND visibility = 'public'
    GROUP BY unnest(industries)
  ),
  previous_period AS (
    SELECT 
      unnest(industries) as industry_name,
      COUNT(*) as previous_count
    FROM organizations 
    WHERE created_at BETWEEN (start_date - (end_date - start_date)) AND start_date
      AND visibility = 'public'
    GROUP BY unnest(industries)
  )
  SELECT 
    COALESCE(c.industry_name, p.industry_name) as industry,
    COALESCE(c.current_count, 0) as count,
    CASE 
      WHEN p.previous_count IS NULL OR p.previous_count = 0 THEN 1.0
      ELSE ROUND((c.current_count::NUMERIC - p.previous_count::NUMERIC) / p.previous_count::NUMERIC, 3)
    END as growth
  FROM current_period c
  FULL OUTER JOIN previous_period p ON c.industry_name = p.industry_name
  ORDER BY COALESCE(c.current_count, 0) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get region analytics with growth calculation  
CREATE OR REPLACE FUNCTION get_region_analytics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  region TEXT,
  count BIGINT,
  growth NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      address_region as region_name,
      COUNT(*) as current_count
    FROM organizations 
    WHERE created_at BETWEEN start_date AND end_date
      AND visibility = 'public'
      AND address_region IS NOT NULL
    GROUP BY address_region
  ),
  previous_period AS (
    SELECT 
      address_region as region_name,
      COUNT(*) as previous_count
    FROM organizations 
    WHERE created_at BETWEEN (start_date - (end_date - start_date)) AND start_date
      AND visibility = 'public'
      AND address_region IS NOT NULL
    GROUP BY address_region
  )
  SELECT 
    COALESCE(c.region_name, p.region_name) as region,
    COALESCE(c.current_count, 0) as count,
    CASE 
      WHEN p.previous_count IS NULL OR p.previous_count = 0 THEN 1.0
      ELSE ROUND((c.current_count::NUMERIC - p.previous_count::NUMERIC) / p.previous_count::NUMERIC, 3)
    END as growth
  FROM current_period c
  FULL OUTER JOIN previous_period p ON c.region_name = p.region_name
  ORDER BY COALESCE(c.current_count, 0) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate organization performance score
CREATE OR REPLACE FUNCTION calculate_organization_performance_score(org_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  org_record organizations%ROWTYPE;
  completeness_score NUMERIC := 0;
  recency_score NUMERIC := 0;
  content_score NUMERIC := 0;
  visibility_score NUMERIC := 0;
  total_score NUMERIC := 0;
  days_since_update NUMERIC;
  description_length INTEGER;
BEGIN
  -- Get organization record
  SELECT * INTO org_record FROM organizations WHERE id = org_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Completeness score (0-30 points)
  IF org_record.name IS NOT NULL THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.description IS NOT NULL THEN completeness_score := completeness_score + 4; END IF;
  IF org_record.url IS NOT NULL THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.email IS NOT NULL THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.phone IS NOT NULL THEN completeness_score := completeness_score + 2; END IF;
  IF org_record.address IS NOT NULL THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.industries IS NOT NULL AND array_length(org_record.industries, 1) > 0 THEN completeness_score := completeness_score + 4; END IF;
  IF org_record.technologies IS NOT NULL AND array_length(org_record.technologies, 1) > 0 THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.services IS NOT NULL AND array_length(org_record.services, 1) > 0 THEN completeness_score := completeness_score + 3; END IF;
  IF org_record.employee_count IS NOT NULL THEN completeness_score := completeness_score + 2; END IF;

  -- Recency score (0-25 points)
  days_since_update := EXTRACT(EPOCH FROM (NOW() - org_record.updated_at)) / (24 * 60 * 60);
  recency_score := GREATEST(0, 25 - (days_since_update / 30) * 25);

  -- Content quality score (0-25 points)
  description_length := COALESCE(length(org_record.description), 0);
  content_score := LEAST(description_length / 50.0, 10); -- Up to 10 points for description
  IF org_record.logo_url IS NOT NULL THEN content_score := content_score + 8; END IF;
  IF org_record.case_studies IS NOT NULL AND array_length(org_record.case_studies, 1) > 0 THEN content_score := content_score + 7; END IF;

  -- Visibility score (0-20 points)
  IF org_record.visibility = 'public' THEN visibility_score := visibility_score + 12; END IF;
  IF org_record.is_verified = true THEN visibility_score := visibility_score + 8; END IF;

  -- Calculate total score (0-100)
  total_score := (completeness_score + recency_score + content_score + visibility_score) / 100.0;
  
  RETURN ROUND(total_score, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending organizations
CREATE OR REPLACE FUNCTION get_trending_organizations(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  organization_id UUID,
  name TEXT,
  trend_score NUMERIC,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    SELECT 
      o.id,
      o.name,
      -- Mock trend calculation based on recent updates and completeness
      calculate_organization_performance_score(o.id) as performance_score,
      EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / (24 * 60 * 60) as days_since_update,
      CASE 
        WHEN o.created_at > NOW() - INTERVAL '30 days' THEN 1.5
        WHEN o.created_at > NOW() - INTERVAL '90 days' THEN 1.2
        ELSE 1.0
      END as newness_factor
    FROM organizations o
    WHERE o.visibility = 'public'
  )
  SELECT 
    ra.id as organization_id,
    ra.name,
    ROUND(
      ra.performance_score * ra.newness_factor * 
      (1 + 1.0 / (1 + ra.days_since_update / 7)), 3
    ) as trend_score,
    -- Mock growth rate calculation
    ROUND(RANDOM() * 0.5 + 0.1, 3) as growth_rate
  FROM recent_activity ra
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search analytics
CREATE OR REPLACE FUNCTION get_search_analytics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  date DATE,
  search_count BIGINT,
  avg_response_time NUMERIC,
  top_keywords TEXT[]
) AS $$
BEGIN
  -- This would typically read from an analytics/events table
  -- For demo purposes, we'll generate mock data
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date::DATE, end_date::DATE, '1 day'::INTERVAL)::DATE as date
  )
  SELECT 
    ds.date,
    (50 + RANDOM() * 20)::BIGINT as search_count,
    ROUND(150 + RANDOM() * 50, 1) as avg_response_time,
    ARRAY['AI', 'スタートアップ', '東京', 'SaaS', 'フィンテック'] as top_keywords
  FROM date_series ds
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect data quality issues
CREATE OR REPLACE FUNCTION detect_data_quality_issues()
RETURNS TABLE (
  issue_type TEXT,
  organization_id UUID,
  organization_name TEXT,
  description TEXT,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Missing critical information
  SELECT 
    'missing_description' as issue_type,
    o.id as organization_id,
    o.name as organization_name,
    'Organization is missing description' as description,
    'medium' as severity
  FROM organizations o
  WHERE o.description IS NULL OR length(trim(o.description)) < 10
    AND o.visibility = 'public'
  
  UNION ALL
  
  -- Missing contact information
  SELECT 
    'missing_contact' as issue_type,
    o.id,
    o.name,
    'Organization is missing contact information' as description,
    'low' as severity
  FROM organizations o
  WHERE (o.email IS NULL AND o.phone IS NULL)
    AND o.visibility = 'public'
  
  UNION ALL
  
  -- Outdated information (not updated in 6 months)
  SELECT 
    'outdated_info' as issue_type,
    o.id,
    o.name,
    'Organization information not updated in 6 months' as description,
    'medium' as severity
  FROM organizations o
  WHERE o.updated_at < NOW() - INTERVAL '6 months'
    AND o.visibility = 'public'
  
  UNION ALL
  
  -- Missing industry classification
  SELECT 
    'missing_industry' as issue_type,
    o.id,
    o.name,
    'Organization missing industry classification' as description,
    'low' as severity
  FROM organizations o
  WHERE (o.industries IS NULL OR array_length(o.industries, 1) = 0)
    AND o.visibility = 'public'
  
  ORDER BY 
    CASE severity 
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    organization_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get competitor analysis
CREATE OR REPLACE FUNCTION get_competitor_analysis(target_org_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  competitor_id UUID,
  competitor_name TEXT,
  similarity_score NUMERIC,
  shared_industries TEXT[],
  shared_technologies TEXT[],
  performance_comparison NUMERIC
) AS $$
DECLARE
  target_org organizations%ROWTYPE;
BEGIN
  -- Get target organization
  SELECT * INTO target_org FROM organizations WHERE id = target_org_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH similarity_calc AS (
    SELECT 
      o.id,
      o.name,
      -- Calculate industry overlap
      CASE 
        WHEN target_org.industries IS NULL OR o.industries IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::NUMERIC 
          FROM unnest(target_org.industries) t(industry)
          WHERE industry = ANY(o.industries)
        ) / GREATEST(array_length(target_org.industries, 1), array_length(o.industries, 1))
      END as industry_similarity,
      -- Calculate technology overlap
      CASE 
        WHEN target_org.technologies IS NULL OR o.technologies IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::NUMERIC 
          FROM unnest(target_org.technologies) t(tech)
          WHERE tech = ANY(o.technologies)
        ) / GREATEST(array_length(target_org.technologies, 1), array_length(o.technologies, 1))
      END as tech_similarity,
      -- Calculate size similarity
      CASE 
        WHEN target_org.employee_count IS NULL OR o.employee_count IS NULL THEN 0.5
        ELSE 1.0 - ABS(target_org.employee_count - o.employee_count)::NUMERIC / GREATEST(target_org.employee_count, o.employee_count)
      END as size_similarity,
      o.industries,
      o.technologies,
      calculate_organization_performance_score(o.id) as performance_score
    FROM organizations o
    WHERE o.id != target_org_id
      AND o.visibility = 'public'
      AND (
        o.industries && target_org.industries OR
        o.technologies && target_org.technologies OR
        o.address_region = target_org.address_region
      )
  )
  SELECT 
    sc.id as competitor_id,
    sc.name as competitor_name,
    ROUND((sc.industry_similarity * 0.4 + sc.tech_similarity * 0.4 + sc.size_similarity * 0.2), 3) as similarity_score,
    CASE 
      WHEN target_org.industries IS NULL OR sc.industries IS NULL THEN ARRAY[]::TEXT[]
      ELSE (
        SELECT ARRAY_AGG(industry)
        FROM unnest(target_org.industries) industry
        WHERE industry = ANY(sc.industries)
      )
    END as shared_industries,
    CASE 
      WHEN target_org.technologies IS NULL OR sc.technologies IS NULL THEN ARRAY[]::TEXT[]
      ELSE (
        SELECT ARRAY_AGG(tech)
        FROM unnest(target_org.technologies) tech
        WHERE tech = ANY(sc.technologies)
      )
    END as shared_technologies,
    ROUND(sc.performance_score - calculate_organization_performance_score(target_org_id), 3) as performance_comparison
  FROM similarity_calc sc
  WHERE (sc.industry_similarity * 0.4 + sc.tech_similarity * 0.4 + sc.size_similarity * 0.2) > 0.1
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;