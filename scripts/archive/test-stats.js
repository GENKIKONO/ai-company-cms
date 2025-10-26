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

async function testStatsTable() {
  try {
    console.log('🔍 Testing if sales_materials_stats table exists...');
    
    // Test if we can query the table
    const { data, error } = await supabase
      .from('sales_materials_stats')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      
      // Check if sales_materials table exists for reference
      console.log('🔍 Checking if sales_materials table exists...');
      const { data: materialsData, error: materialsError } = await supabase
        .from('sales_materials')
        .select('id')
        .limit(1);
      
      if (materialsError) {
        console.log('❌ sales_materials table also does not exist:', materialsError.message);
      } else {
        console.log('✅ sales_materials table exists, found records:', materialsData?.length || 0);
      }
      
    } else {
      console.log('✅ sales_materials_stats table exists! Found records:', data?.length || 0);
      
      // Show table structure by trying to insert a test record (will fail but show fields)
      console.log('📊 Testing table structure...');
      const testInsert = await supabase
        .from('sales_materials_stats')
        .insert({
          material_id: '00000000-0000-0000-0000-000000000000',
          action: 'view',
          user_agent: 'test-agent'
        });
      
      if (testInsert.error) {
        console.log('Structure test error (expected):', testInsert.error.message);
      }
    }
    
    // Test organizations table
    console.log('🔍 Testing organizations table...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(3);
    
    if (orgError) {
      console.log('❌ Organizations table error:', orgError.message);
    } else {
      console.log('✅ Organizations table exists:', orgData?.length || 0, 'records');
      console.log('Sample organizations:', orgData?.map(o => o.name) || []);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testStatsTable();