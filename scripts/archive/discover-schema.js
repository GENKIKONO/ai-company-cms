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

async function discoverSchema() {
  try {
    console.log('🔍 Discovering database schema...');
    
    // Test if sales_materials table exists at all
    console.log('\n1️⃣ Testing sales_materials table...');
    
    const { data: materialsData, error: materialsError } = await supabase
      .from('sales_materials')
      .select('*')
      .limit(1);
    
    if (materialsError) {
      console.log('❌ sales_materials error:', materialsError.message);
      console.log('❌ Table may not exist or have different name');
    } else {
      console.log('✅ sales_materials exists:', materialsData?.length || 0, 'records');
      if (materialsData && materialsData.length > 0) {
        console.log('Sample record structure:', Object.keys(materialsData[0]));
      }
    }
    
    // Test organizations table
    console.log('\n2️⃣ Testing organizations table...');
    
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError) {
      console.log('❌ organizations error:', orgsError.message);
    } else {
      console.log('✅ organizations exists:', orgsData?.length || 0, 'records');
      if (orgsData && orgsData.length > 0) {
        console.log('Sample org structure:', Object.keys(orgsData[0]));
        console.log('Sample org:', orgsData[0]);
      }
    }
    
    // Test sales_materials_stats table
    console.log('\n3️⃣ Testing sales_materials_stats table...');
    
    const { data: statsData, error: statsError } = await supabase
      .from('sales_materials_stats')
      .select('*')
      .limit(1);
    
    if (statsError) {
      console.log('❌ sales_materials_stats error:', statsError.message);
    } else {
      console.log('✅ sales_materials_stats exists:', statsData?.length || 0, 'records');
    }
    
    // Try some alternative table names for materials
    console.log('\n4️⃣ Trying alternative table names...');
    
    const alternativeNames = ['materials', 'sales_material', 'files', 'documents'];
    
    for (const name of alternativeNames) {
      try {
        const { data, error } = await supabase
          .from(name)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Found table: ${name} (${data?.length || 0} records)`);
          if (data && data.length > 0) {
            console.log(`   Structure:`, Object.keys(data[0]));
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }
    
    // Since we can't find the materials table, let's create our own test material record 
    // by directly inserting into sales_materials_stats with a dummy material_id
    console.log('\n5️⃣ Testing stats table directly with dummy material_id...');
    
    // Create a dummy UUID for testing
    const dummyMaterialId = '01234567-89ab-cdef-0123-456789abcdef';
    
    const { data: dummyStat, error: dummyError } = await supabase
      .from('sales_materials_stats')
      .insert({
        material_id: dummyMaterialId,
        action: 'view',
        user_agent: 'Discovery-Test/1.0',
        ip_address: '127.0.0.1'
      })
      .select()
      .single();
    
    if (dummyError) {
      console.log('❌ Dummy stat failed:', dummyError.message);
      
      if (dummyError.message.includes('foreign key')) {
        console.log('✅ This confirms the foreign key constraint is working');
        console.log('✅ The issue is that no sales_materials exist in the database');
        
        // Let's try to create the sales_materials table or find out what's needed
        console.log('\n6️⃣ Attempting to create a minimal sales_materials record...');
        
        // First, let's try creating a sales_materials record with minimal info
        const minimalMaterial = {
          id: dummyMaterialId,
          title: 'Test Material for Stats',
          file_path: 'test/minimal.pdf'
        };
        
        const { data: createdMaterial, error: createError } = await supabase
          .from('sales_materials')
          .insert(minimalMaterial)
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Could not create material:', createError.message);
          console.log('❌ sales_materials table may not exist or has different required fields');
        } else {
          console.log('✅ Created minimal material:', createdMaterial.id);
          
          // Now try the stat again
          const { data: retryStats, error: retryError } = await supabase
            .from('sales_materials_stats')
            .insert({
              material_id: createdMaterial.id,
              action: 'view',
              user_agent: 'Retry-Test/1.0',
              ip_address: '127.0.0.1'
            })
            .select()
            .single();
          
          if (retryError) {
            console.log('❌ Retry stat failed:', retryError.message);
          } else {
            console.log('✅ Retry stat succeeded!', retryStats.id);
            console.log('🎯 Working Material ID:', createdMaterial.id);
          }
        }
      }
    } else {
      console.log('✅ Dummy stat succeeded:', dummyStat.id);
    }
    
  } catch (error) {
    console.error('💥 Schema discovery failed:', error);
  }
}

discoverSchema();