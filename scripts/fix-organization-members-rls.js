/**
 * Fix organization_members RLS policies
 * The existing policies are completely broken, need to reset them
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';

async function fixOrganizationMembersRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration.');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔧 Fixing organization_members RLS policies...');
  
  try {
    // Step 1: List existing policies to see what's there
    console.log('\n1. Checking current RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.row_security_policies')
      .select('*')
      .eq('table_name', 'organization_members')
      .eq('schema_name', 'public');
    
    if (policyError) {
      console.log('❌ Cannot query policies (expected):', policyError.message);
    } else {
      console.log('✅ Current policies:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach(p => console.log(`   - ${p.policy_name}: ${p.permissive}`));
      }
    }

    // Step 2: Create a simple working policy for E2E tests
    // We'll temporarily disable RLS and create a new simple policy
    console.log('\n2. Creating simple E2E-friendly policies...');
    
    // Note: We can't execute DDL directly via the Supabase client easily
    // Instead, let's create a migration file and document what needs to be run
    
    const migrationSQL = `
-- Fix organization_members RLS policies
-- This should be run directly in Supabase SQL editor

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "members_view_own_membership" ON organization_members;
DROP POLICY IF EXISTS "owners_view_org_members" ON organization_members;  
DROP POLICY IF EXISTS "owners_add_members" ON organization_members;
DROP POLICY IF EXISTS "owners_update_members" ON organization_members;
DROP POLICY IF EXISTS "owners_remove_members" ON organization_members;
DROP POLICY IF EXISTS "admin_full_access_members" ON organization_members;

-- 2. Create simple working policies
-- Policy 1: Users can see their own memberships  
CREATE POLICY "user_own_membership" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Admin users have full access
CREATE POLICY "admin_full_access" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Organization owners can manage their organizations
CREATE POLICY "owner_manage_org" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- Policy 4: Service role bypass (for API operations)
CREATE POLICY "service_role_access" ON organization_members
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies
SELECT 'Policy test' as test, * FROM organization_members WHERE user_id = '${E2E_USER_ID}';
`;

    console.log('\n📄 Migration SQL generated. Please run this in Supabase SQL editor:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
    // Step 3: For now, let's test if the current user can at least access via validate_org_access
    console.log('\n3. Testing current validate_org_access workaround...');
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_org_access', {
        org_id: 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3',
        user_id: E2E_USER_ID
      });
    
    if (validateError) {
      console.error('❌ validate_org_access RPC error:', validateError.message);
    } else {
      console.log('✅ validate_org_access RPC works:', validateResult);
    }
    
    // Step 4: Write the SQL to a file for manual execution
    const fs = await import('fs');
    await fs.promises.writeFile('fix_organization_members_rls.sql', migrationSQL);
    console.log('\n📁 SQL saved to: fix_organization_members_rls.sql');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from fix_organization_members_rls.sql');
    console.log('3. Re-run the E2E tests');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixOrganizationMembersRLS().catch(console.error);