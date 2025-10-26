#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration using service role key
const supabaseUrl = 'https://chyicolujwhkycpkxbej.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoeWljb2x1andoa3ljcGt4YmVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ0Mjg4NiwiZXhwIjoyMDc0MDE4ODg2fQ.rHrHkFfO8VYvF0mlpHbDQZ47SO37IQXWAXEhNAY2dGA';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for sales_materials_stats...');
    
    // Test 1: Try to insert directly with service role (should work)
    console.log('\n1️⃣ Testing direct insert with service role...');
    
    const serviceInsert = await supabase
      .from('sales_materials_stats')
      .insert({
        material_id: '00000000-0000-0000-0000-000000000001',
        action: 'view',
        user_agent: 'Service-Test/1.0',
        ip_address: '127.0.0.1'
      });
    
    if (serviceInsert.error) {
      console.log('❌ Service role insert failed:', serviceInsert.error.message);
    } else {
      console.log('✅ Service role insert succeeded');
    }
    
    // Test 2: Check if the table has RLS enabled
    console.log('\n2️⃣ Checking RLS status...');
    
    // Query pg_class to check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        query: "SELECT relrowsecurity FROM pg_class WHERE relname = 'sales_materials_stats'"
      });
    
    if (rlsError) {
      console.log('ℹ️ Could not check RLS status directly, trying policy queries...');
      
      // Test 3: Try to create anonymous client and insert
      console.log('\n3️⃣ Testing with anonymous client...');
      
      const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoeWljb2x1andoa3ljcGt4YmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDI4ODYsImV4cCI6MjA3NDAxODg4Nn0.It9t8Cmz7pn7tvONkUETsVhoqGiQCQ8mIxCQAzDzV-E');
      
      const anonInsert = await anonSupabase
        .from('sales_materials_stats')
        .insert({
          material_id: '00000000-0000-0000-0000-000000000002',
          action: 'view',
          user_agent: 'Anon-Test/1.0',
          ip_address: '127.0.0.1'
        });
      
      if (anonInsert.error) {
        console.log('❌ Anonymous insert failed:', anonInsert.error.message);
        console.log('❌ This confirms RLS is blocking anonymous inserts');
        
        // Try to enable the insert policy manually
        console.log('\n4️⃣ Attempting to fix RLS policy...');
        
        // First check what policies exist
        const policies = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'sales_materials_stats');
        
        console.log('Current policies:', policies.data?.length || 0);
        
        if (policies.data) {
          policies.data.forEach(policy => {
            console.log(`- ${policy.policyname}: ${policy.cmd} - ${policy.roles}`);
          });
        }
        
      } else {
        console.log('✅ Anonymous insert succeeded! RLS is properly configured.');
      }
    }
    
  } catch (error) {
    console.error('💥 RLS fix failed:', error);
  }
}

fixRLSPolicies();