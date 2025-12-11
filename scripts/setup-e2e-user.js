/**
 * Setup E2E test user and organization for phase4 org access control tests
 * This ensures the E2E test user has proper organization membership
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// E2E test configuration from .env.local  
const E2E_ORG_ID = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3';
const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2'; // From test debug output
const E2E_ADMIN_EMAIL = 'admin+e2e@example.com';

async function setupE2EUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Setting up E2E test user and organization...');
  
  try {
    // 1. Create or update test organization
    console.log('1. Creating/updating test organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: E2E_ORG_ID,
        name: 'E2E Test Organization',
        slug: 'e2e-test-org',
        plan: 'pro',
        created_by: E2E_USER_ID,
        feature_flags: {},
        entitlements: {},
        show_services: true,
        show_posts: true,
        show_case_studies: true,
        show_faqs: true,
        show_qa: true,
        show_news: true,
        show_partnership: true,
        show_contact: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Error creating organization:', orgError);
      throw orgError;
    }
    console.log('✅ Organization created/updated:', orgData?.name);

    // 2. Create or update app_user record for E2E test user
    console.log('2. Creating/updating app_user record...');
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .upsert({
        id: E2E_USER_ID,
        email: E2E_ADMIN_EMAIL,
        role: 'admin',
        name: 'E2E Test Admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating app_user:', userError);
      throw userError;
    }
    console.log('✅ App user created/updated:', userData?.name);

    // 3. Create organization membership for E2E test user
    console.log('3. Creating/updating organization membership...');
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        organization_id: E2E_ORG_ID,
        user_id: E2E_USER_ID,
        role: 'owner',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,user_id'
      })
      .select()
      .single();

    if (memberError) {
      console.error('❌ Error creating organization membership:', memberError);
      throw memberError;
    }
    console.log('✅ Organization membership created/updated:', memberData?.role);

    // 4. Verify the setup by testing validate_org_access
    console.log('4. Verifying setup with validate_org_access RPC...');
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_org_access', {
        org_id: E2E_ORG_ID,
        required_permission: 'read',
        user_id: E2E_USER_ID
      });

    if (validationError) {
      console.error('❌ Error validating org access:', validationError);
      throw validationError;
    }
    
    if (validationResult) {
      console.log('✅ Organization access validation passed!');
    } else {
      console.log('❌ Organization access validation failed - user still cannot access org');
    }

    // 5. Test get_my_organizations_slim RPC
    console.log('5. Testing get_my_organizations_slim RPC...');
    
    // Create a client with the user's context (simulating auth.uid())
    const userClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'sb-user-id': E2E_USER_ID
        }
      }
    });
    
    const { data: orgSlimData, error: orgSlimError } = await userClient
      .rpc('get_my_organizations_slim');

    if (orgSlimError) {
      console.error('❌ Error with get_my_organizations_slim:', orgSlimError);
    } else {
      console.log('✅ get_my_organizations_slim result:', orgSlimData?.length || 0, 'organizations');
      if (orgSlimData && orgSlimData.length > 0) {
        console.log('   First org:', orgSlimData[0].organization_name);
      }
    }

    console.log('\n🎉 E2E setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Organization ID: ${E2E_ORG_ID}`);
    console.log(`   User ID: ${E2E_USER_ID}`);
    console.log(`   User Email: ${E2E_ADMIN_EMAIL}`);
    console.log(`   User Role: admin`);
    console.log(`   Org Membership: owner`);
    console.log(`   Access Validation: ${validationResult ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupE2EUser().catch(console.error);