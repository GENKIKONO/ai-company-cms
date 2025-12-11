/**
 * Create E2E test user in app_users table
 * The user exists in auth.users and organization_members but missing in app_users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const E2E_USER_ID = '64b23ce5-0304-4a80-8a91-c8a3c14ebce2';
const E2E_ADMIN_EMAIL = 'admin+e2e@example.com';

async function createE2EAppUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration.');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Creating E2E app_user record...');
  
  try {
    // Create app_user record for E2E test user
    console.log('Creating app_user record...');
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

    // Verify the setup by testing validate_org_access
    console.log('Testing validate_org_access RPC...');
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_org_access', {
        org_id: 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3',
        required_permission: 'read',
        user_id: E2E_USER_ID
      });

    if (validationError) {
      console.error('❌ Error validating org access:', validationError);
    } else {
      console.log('✅ Organization access validation:', validationResult ? 'PASS' : 'FAIL');
    }

    // Test get_my_organizations_slim RPC (this needs auth context)
    console.log('Testing get_my_organizations_slim RPC...');
    
    // First check if the function exists
    const { data: orgSlimData, error: orgSlimError } = await supabase
      .rpc('get_my_organizations_slim');

    if (orgSlimError) {
      console.error('❌ Error with get_my_organizations_slim:', orgSlimError);
      
      // Test the fallback query that /api/me uses
      console.log('Testing fallback organization_members query (as in /api/me)...');
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          organizations(
            id, name, slug, plan, feature_flags,
            show_services, show_posts, show_case_studies, show_faqs,
            show_qa, show_news, show_partnership, show_contact
          )
        `)
        .eq('user_id', E2E_USER_ID);
      
      if (memberError) {
        console.error('❌ Error with fallback organization query:', memberError);
        console.error('   This explains why /api/me fails!');
        
        // Try simplified query
        console.log('Trying simplified membership query...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('user_id', E2E_USER_ID);
          
        if (simpleError) {
          console.error('❌ Error with simple membership query:', simpleError);
        } else {
          console.log('✅ Simple membership query result:', simpleData?.length || 0, 'memberships');
          if (simpleData && simpleData.length > 0) {
            console.log('   First membership:', simpleData[0]);
          }
        }
      } else {
        console.log('✅ Fallback organization query result:', memberData?.length || 0, 'organizations');
        if (memberData && memberData.length > 0) {
          console.log('   First organization:', memberData[0].organizations?.name);
        }
      }
    } else {
      console.log('✅ get_my_organizations_slim result:', orgSlimData?.length || 0, 'organizations');
    }

    console.log('\n🎉 E2E app_user setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   User ID: ${E2E_USER_ID}`);
    console.log(`   User Email: ${E2E_ADMIN_EMAIL}`);
    console.log(`   User Role: admin`);
    console.log(`   Access Validation: ${validationResult ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
createE2EAppUser().catch(console.error);