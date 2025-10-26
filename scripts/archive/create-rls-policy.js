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

async function createRLSPolicy() {
  try {
    console.log('🔒 Creating RLS policy for sales_materials_stats...');
    
    // Create the policy that allows anonymous inserts
    console.log('\n1️⃣ Creating INSERT policy for anonymous users...');
    
    // First, let's disable RLS temporarily to create the policy
    const { data: disableRLS, error: disableError } = await supabase
      .from('sales_materials_stats')
      .select('id')
      .limit(1);
    
    console.log('Current table access test:', disableError ? 'BLOCKED by RLS' : 'ALLOWED');
    
    // Try using a different approach - execute the SQL manually via a function
    console.log('\n2️⃣ Let me try creating via Supabase SQL editor approach...');
    
    // Create a simple test first
    const testResponse = await fetch('https://chyicolujwhkycpkxbej.supabase.co/rest/v1/rpc/pg_exec', {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          -- Create insert policy for anonymous users
          DROP POLICY IF EXISTS "sales_materials_stats_insert" ON public.sales_materials_stats;
          
          CREATE POLICY "sales_materials_stats_insert" 
          ON public.sales_materials_stats
          FOR INSERT 
          WITH CHECK (true);
        `
      })
    });
    
    if (testResponse.ok) {
      console.log('✅ Policy creation attempt completed');
      const result = await testResponse.json();
      console.log('Result:', result);
    } else {
      console.log('❌ Policy creation via REST failed:', testResponse.status);
      
      // Alternative approach: Try using raw SQL execution
      console.log('\n3️⃣ Trying alternative approach...');
      
      // Let me try to disable RLS entirely for testing
      try {
        // For now, let's just test without the policy and see if we can identify the issue
        console.log('Testing if we can at least query existing data...');
        
        const { data: existingData, error: queryError } = await supabase
          .from('sales_materials_stats')
          .select('*')
          .limit(5);
        
        if (queryError) {
          console.log('❌ Cannot even read from table:', queryError.message);
        } else {
          console.log('✅ Can read from table:', existingData?.length || 0, 'records');
        }
        
        // Test if we can check what the actual material_ids are
        console.log('\n4️⃣ Checking for real sales_materials to use in testing...');
        
        const { data: realMaterials, error: materialsError } = await supabase
          .from('sales_materials')
          .select('id, title')
          .limit(3);
        
        if (materialsError) {
          console.log('❌ Cannot read sales_materials:', materialsError.message);
        } else {
          console.log('✅ Found sales_materials:', realMaterials?.length || 0);
          if (realMaterials && realMaterials.length > 0) {
            console.log('Sample material ID:', realMaterials[0].id);
            console.log('Sample material title:', realMaterials[0].title);
            
            // Try to insert a real stat with a real material ID
            console.log('\n5️⃣ Trying insert with real material ID...');
            
            const realInsert = await supabase
              .from('sales_materials_stats')
              .insert({
                material_id: realMaterials[0].id,
                action: 'view',
                user_agent: 'Real-Test/1.0',
                ip_address: '127.0.0.1'
              });
            
            if (realInsert.error) {
              console.log('❌ Real material insert failed:', realInsert.error.message);
            } else {
              console.log('✅ Real material insert succeeded!');
            }
          }
        }
        
      } catch (err) {
        console.log('❌ Alternative approach failed:', err.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Policy creation failed:', error);
  }
}

createRLSPolicy();