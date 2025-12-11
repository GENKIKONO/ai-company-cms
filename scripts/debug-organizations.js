/**
 * Debug script to check current organizations table structure and data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugOrganizations() {
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

  console.log('🔍 Debugging organizations table...');
  
  try {
    // Check table structure
    console.log('1. Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('organizations')
      .select()
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Error querying organizations:', columnsError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Sample organization structure:');
      console.log(JSON.stringify(columns[0], null, 2));
    }
    
    // Check if E2E org exists
    console.log('\n2. Checking if E2E organization exists...');
    const { data: e2eOrg, error: e2eError } = await supabase
      .from('organizations')
      .select()
      .eq('id', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3')
      .maybeSingle();
    
    if (e2eError) {
      console.error('❌ Error checking E2E org:', e2eError);
    } else if (e2eOrg) {
      console.log('✅ E2E organization exists:', e2eOrg.name);
    } else {
      console.log('❌ E2E organization does not exist');
    }
    
    // Check if E2E user exists in app_users
    console.log('\n3. Checking if E2E user exists...');
    const { data: e2eUser, error: userError } = await supabase
      .from('app_users')
      .select()
      .eq('id', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2')
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Error checking E2E user:', userError);
    } else if (e2eUser) {
      console.log('✅ E2E user exists:', e2eUser.email);
    } else {
      console.log('❌ E2E user does not exist');
    }
    
    // Check organization membership
    console.log('\n4. Checking organization membership...');
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select()
      .eq('organization_id', 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3')
      .eq('user_id', '64b23ce5-0304-4a80-8a91-c8a3c14ebce2')
      .maybeSingle();
    
    if (memberError) {
      console.error('❌ Error checking membership:', memberError);
    } else if (membership) {
      console.log('✅ E2E membership exists:', membership.role);
    } else {
      console.log('❌ E2E membership does not exist');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugOrganizations().catch(console.error);