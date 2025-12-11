-- Setup E2E test user and organization for phase4 org access control tests
-- This ensures the E2E test user has proper organization membership

-- E2E test configuration from .env.example
-- E2E_ORG_ID=c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3
-- E2E_ADMIN_EMAIL=admin+e2e@example.com
-- Test user ID from debug output: 64b23ce5-0304-4a80-8a91-c8a3c14ebce2

-- 1. Create or update test organization
INSERT INTO organizations (
  id, 
  name, 
  slug, 
  plan,
  created_by,
  created_at,
  updated_at
) VALUES (
  'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3',
  'E2E Test Organization',
  'e2e-test-org',
  'pro',
  '64b23ce5-0304-4a80-8a91-c8a3c14ebce2',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  plan = EXCLUDED.plan,
  created_by = EXCLUDED.created_by,
  updated_at = NOW();

-- 2. Create or update app_user record for E2E test user
INSERT INTO app_users (
  id,
  email,
  role,
  name,
  created_at,
  updated_at
) VALUES (
  '64b23ce5-0304-4a80-8a91-c8a3c14ebce2',
  'admin+e2e@example.com',
  'admin',
  'E2E Test Admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  updated_at = NOW();

-- 3. Create organization membership for E2E test user
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  joined_at,
  created_at,
  updated_at
) VALUES (
  'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3',
  '64b23ce5-0304-4a80-8a91-c8a3c14ebce2',
  'owner',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (organization_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 4. Verify the setup
SELECT 'E2E Organization created/updated' as status, * FROM organizations WHERE id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3';
SELECT 'E2E User created/updated' as status, * FROM app_users WHERE id = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';
SELECT 'E2E Membership created/updated' as status, * FROM organization_members WHERE organization_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3' AND user_id = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';