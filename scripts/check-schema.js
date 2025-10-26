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

async function checkSchema() {
  try {
    console.log('🔍 Checking sales_materials schema...');
    
    // Try to insert with minimal fields to see what's required/available
    const { data, error } = await supabase
      .from('sales_materials')
      .insert({
        title: 'Schema Test Material',
        organization_id: '036a642f-8511-4c23-9527-a6f3f313e073',
        file_path: 'test/schema-test.pdf'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Material created successfully!');
      console.log('Created material:', data);
      
      // Now try to create a stat for it
      console.log('\n🔍 Testing stats with this material...');
      
      const { data: stat, error: statError } = await supabase
        .from('sales_materials_stats')
        .insert({
          material_id: data.id,
          action: 'view',
          user_agent: 'Schema-Test/1.0',
          ip_address: '127.0.0.1'
        })
        .select()
        .single();
      
      if (statError) {
        console.log('❌ Stat creation failed:', statError.message);
      } else {
        console.log('✅ Stat created successfully!', stat.id);
      }
      
      // Test anonymous stat insertion
      console.log('\n🔍 Testing anonymous stat insertion...');
      
      const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoeWljb2x1andoa3ljcGt4YmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDI4ODYsImV4cCI6MjA3NDAxODg4Nn0.It9t8Cmz7pn7tvONkUETsVhoqGiQCQ8mIxCQAzDzV-E');
      
      const { data: anonStat, error: anonError } = await anonSupabase
        .from('sales_materials_stats')
        .insert({
          material_id: data.id,
          action: 'download',
          user_agent: 'Anon-Schema-Test/1.0',
          ip_address: '192.168.1.100'
        })
        .select()
        .single();
      
      if (anonError) {
        console.log('❌ Anonymous stat failed:', anonError.message);
      } else {
        console.log('✅ Anonymous stat succeeded!', anonStat.id);
      }
      
      console.log('\n🎯 Use this Material ID for API testing:', data.id);
    }
    
  } catch (error) {
    console.error('💥 Schema check failed:', error);
  }
}

checkSchema();