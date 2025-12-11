/**
 * Test auth.uid() context for E2E user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';
const E2E_ADMIN_EMAIL = 'admin+e2e@example.com';
const E2E_ADMIN_PASSWORD = 'TestAdmin123!';

async function testAuthUid() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔧 Testing auth.uid() context...');
  
  try {
    // Test 1: Service role client
    console.log('\n1. Testing with service role client...');
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data: serviceAuthTest, error: serviceError } = await serviceClient
      .rpc('validate_org_access', {
        org_id: 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3',
        user_id: E2E_USER_ID
      });
    
    if (serviceError) {
      console.log('❌ Service role RPC error:', serviceError.message);
    } else {
      console.log('✅ Service role RPC result:', serviceAuthTest);
    }
    
    // Test 2: Try to authenticate as the E2E user
    console.log('\n2. Testing with authenticated E2E user...');
    const userClient = createClient(supabaseUrl, anonKey);
    
    // Sign in as the E2E user  
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD
    });
    
    if (authError) {
      console.log('❌ Auth sign-in error:', authError.message);
      
      // Try to check if user exists in auth
      const serviceClient2 = createClient(supabaseUrl, serviceKey);
      const { data: users, error: listError } = await serviceClient2.auth.admin.listUsers();
      
      if (listError) {
        console.log('❌ Cannot list users:', listError.message);
      } else {
        const e2eUser = users.users.find(u => u.id === E2E_USER_ID);
        if (e2eUser) {
          console.log('✅ E2E user exists in auth.users:', e2eUser.email);
        } else {
          console.log('❌ E2E user NOT found in auth.users');
          console.log('   Available users:', users.users.map(u => ({ id: u.id, email: u.email })));
        }
      }
      
      return;
    }
    
    console.log('✅ Authenticated as E2E user:', authData.user?.email);
    
    // Test auth.uid() context by querying organization_members
    const { data: memberData, error: memberError } = await userClient
      .from('organization_members')
      .select('*')
      .limit(1);
    
    if (memberError) {
      console.log('❌ RLS error with authenticated user:', memberError.message);
    } else {
      console.log('✅ Authenticated user can access organization_members:', memberData?.length || 0);
    }
    
    // Test the RPC with authenticated context
    const { data: rpcData, error: rpcError } = await userClient
      .rpc('validate_org_access', {
        org_id: 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3'
      });
    
    if (rpcError) {
      console.log('❌ RPC error with authenticated user:', rpcError.message);
    } else {
      console.log('✅ RPC result with authenticated user:', rpcData);
    }
    
    // Sign out
    await userClient.auth.signOut();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthUid().catch(console.error);