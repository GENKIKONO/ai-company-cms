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

async function createTestMaterial() {
  try {
    console.log('📄 Creating test sales material...');
    
    // First check organizations to get an organization_id
    console.log('\n1️⃣ Checking organizations...');
    
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (orgError || !orgs || orgs.length === 0) {
      console.log('❌ No organizations found:', orgError?.message || 'empty result');
      return;
    }
    
    const orgId = orgs[0].id;
    console.log('✅ Using organization:', orgs[0].name, '(', orgId, ')');
    
    // Create a test sales material
    console.log('\n2️⃣ Creating test sales material...');
    
    const { data: material, error: materialError } = await supabase
      .from('sales_materials')
      .insert({
        title: 'Test Material for Stats',
        organization_id: orgId,
        file_path: 'test/test-material.pdf',
        file_type: 'application/pdf',
        file_size: 1024000
      })
      .select()
      .single();
    
    if (materialError) {
      console.log('❌ Failed to create material:', materialError.message);
      return;
    }
    
    console.log('✅ Created test material:', material.id);
    console.log('   Title:', material.title);
    
    // Now test inserting stats for this material
    console.log('\n3️⃣ Testing stats insertion with real material ID...');
    
    const { data: stat, error: statError } = await supabase
      .from('sales_materials_stats')
      .insert({
        material_id: material.id,
        action: 'view',
        user_agent: 'Test-Agent/1.0',
        ip_address: '127.0.0.1'
      })
      .select()
      .single();
    
    if (statError) {
      console.log('❌ Failed to create stat:', statError.message);
    } else {
      console.log('✅ Created test stat:', stat.id);
      console.log('   Action:', stat.action);
      console.log('   Created at:', stat.created_at);
    }
    
    // Test anonymous insertion 
    console.log('\n4️⃣ Testing anonymous stats insertion...');
    
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoeWljb2x1andoa3ljcGt4YmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDI4ODYsImV4cCI6MjA3NDAxODg4Nn0.It9t8Cmz7pn7tvONkUETsVhoqGiQCQ8mIxCQAzDzV-E');
    
    const { data: anonStat, error: anonError } = await anonSupabase
      .from('sales_materials_stats')
      .insert({
        material_id: material.id,
        action: 'download',
        user_agent: 'Anonymous-Test/1.0',
        ip_address: '192.168.1.1'
      })
      .select()
      .single();
    
    if (anonError) {
      console.log('❌ Anonymous stat insertion failed:', anonError.message);
      console.log('🔍 This suggests RLS policy needs to be created');
    } else {
      console.log('✅ Anonymous stat insertion succeeded:', anonStat.id);
    }
    
    console.log('\n🎯 Test Material ID for API testing:', material.id);
    
  } catch (error) {
    console.error('💥 Test material creation failed:', error);
  }
}

createTestMaterial();