-- Clean up dummy/test data that might cause issues
-- Created: 2025-10-13
-- Remove test data entries that could interfere with production functionality

-- Clean up services with dummy/test data
DELETE FROM public.services 
WHERE 
    name LIKE '%テスト%' OR
    name LIKE '%ダミー%' OR 
    name LIKE '%サンプル%' OR
    name LIKE '%test%' OR
    name LIKE '%dummy%' OR
    name LIKE '%sample%' OR
    name = 'insert_own_org_services' OR
    description LIKE '%テスト%' OR
    description LIKE '%確認テスト%' OR
    description LIKE '%機能テスト%';

-- Clean up posts with dummy/test data  
DELETE FROM public.posts
WHERE
    title LIKE '%テスト%' OR
    title LIKE '%ダミー%' OR
    title LIKE '%サンプル%' OR
    title LIKE '%test%' OR
    title LIKE '%dummy%' OR
    title LIKE '%sample%' OR
    content_markdown LIKE '%テスト%';

-- Clean up case studies with dummy/test data
DELETE FROM public.case_studies
WHERE
    title LIKE '%テスト%' OR
    title LIKE '%ダミー%' OR
    title LIKE '%サンプル%' OR
    title LIKE '%test%' OR
    title LIKE '%dummy%' OR
    title LIKE '%sample%';

-- Clean up faqs with dummy/test data
DELETE FROM public.faqs
WHERE
    question LIKE '%テスト%' OR
    question LIKE '%ダミー%' OR
    question LIKE '%サンプル%' OR
    question LIKE '%test%' OR
    question LIKE '%dummy%' OR
    question LIKE '%sample%';

-- Log cleanup completion
DO $$
BEGIN
  RAISE NOTICE '✅ Dummy data cleanup completed';
END
$$;