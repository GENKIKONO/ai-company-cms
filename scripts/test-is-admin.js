/**
 * Test is_admin() function for E2E user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';
const E2E_ADMIN_EMAIL = 'admin+e2e@example.com';
const E2E_ADMIN_PASSWORD = 'TestAdmin123!';

async function testIsAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔧 Testing is_admin() function...');
  
  try {
    // Test with authenticated user
    const userClient = createClient(supabaseUrl, anonKey);
    
    // Sign in as the E2E user  
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated as:', authData.user?.email);
    
    // Test get_user_role function
    console.log('\n1. Testing get_user_role() function...');
    const { data: roleData, error: roleError } = await userClient
      .rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ get_user_role error:', roleError.message);
    } else {
      console.log('✅ get_user_role result:', roleData);
    }
    
    // Test is_admin function
    console.log('\n2. Testing is_admin() function...');
    const { data: isAdminData, error: isAdminError } = await userClient
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('❌ is_admin error:', isAdminError.message);
    } else {
      console.log('✅ is_admin result:', isAdminData);
    }
    
    // Test with explicit user_id parameter
    console.log('\n3. Testing is_admin(user_id) function...');
    const { data: isAdminExplicitData, error: isAdminExplicitError } = await userClient
      .rpc('is_admin', { user_id: E2E_USER_ID });
    
    if (isAdminExplicitError) {
      console.error('❌ is_admin(user_id) error:', isAdminExplicitError.message);
    } else {
      console.log('✅ is_admin(user_id) result:', isAdminExplicitData);
    }
    
    // Manual check of app_users table
    console.log('\n4. Manual check of app_users table...');
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { data: appUserData, error: appUserError } = await serviceClient
      .from('app_users')
      .select('*')
      .eq('id', E2E_USER_ID)
      .single();
    
    if (appUserError) {
      console.error('❌ app_users query error:', appUserError.message);
    } else {
      console.log('✅ app_users record:', appUserData);
    }
    
    // Test organization_members table access with authenticated admin user
    console.log('\n5. Testing organization_members table access...');
    
    // Test 5a: Query own membership records (should work with user_id = auth.uid() policy)
    console.log('\n   5a. Testing own membership records query...');
    const { data: ownMembersData, error: ownMembersError } = await userClient
      .from('organization_members')
      .select('*')
      .eq('user_id', E2E_USER_ID);
    
    if (ownMembersError) {
      console.error('❌ Own membership query error:', ownMembersError.message);
    } else {
      console.log('✅ Own membership query works:', ownMembersData?.length || 0, 'records');
    }
    
    // Test 5b: General query (should work with admin policy)
    console.log('\n   5b. Testing general query (admin access)...');
    const { data: allMembersData, error: allMembersError } = await userClient
      .from('organization_members')
      .select('*')
      .limit(5);
    
    if (allMembersError) {
      console.error('❌ General query error:', allMembersError.message);
      console.error('   This means admin RLS policy is broken!');
    } else {
      console.log('✅ General query works:', allMembersData?.length || 0, 'records');
    }
    
    // Test 5c: Check with service role for comparison
    console.log('\n   5c. Testing with service role for comparison...');
    const serviceClient2 = createClient(supabaseUrl, serviceKey);
    const { data: serviceData, error: serviceError } = await serviceClient2
      .from('organization_members')
      .select('*')
      .eq('user_id', E2E_USER_ID);
    
    if (serviceError) {
      console.error('❌ Service role also fails:', serviceError.message);
    } else {
      console.log('✅ Service role works:', serviceData?.length || 0, 'memberships');
      if (serviceData && serviceData.length > 0) {
        console.log('   Membership record:', serviceData[0]);
      }
    }
    
    // Sign out
    await userClient.auth.signOut();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testIsAdmin().catch(console.error);