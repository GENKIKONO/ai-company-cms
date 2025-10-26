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

async function verifyStatsData() {
  try {
    console.log('📊 Verifying stats data in database...');
    
    // Check all stats records
    console.log('\n1️⃣ Checking all stats records...');
    
    const { data: allStats, error: statsError } = await supabase
      .from('sales_materials_stats')
      .select(`
        *,
        sales_materials(
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });
    
    if (statsError) {
      console.log('❌ Failed to fetch stats:', statsError.message);
    } else {
      console.log(`✅ Found ${allStats?.length || 0} stats records:`);
      
      if (allStats && allStats.length > 0) {
        // Group by action for summary
        const summary = allStats.reduce((acc, stat) => {
          acc[stat.action] = (acc[stat.action] || 0) + 1;
          return acc;
        }, {});
        
        console.log('   📈 Summary by action:');
        Object.entries(summary).forEach(([action, count]) => {
          console.log(`      ${action}: ${count}`);
        });
        
        console.log('\n   📝 Recent stats:');
        allStats.slice(0, 5).forEach((stat, index) => {
          console.log(`      ${index + 1}. ${stat.action} - ${stat.user_agent} - ${stat.created_at}`);
        });
      }
    }
    
    // Test the API's aggregation functions
    console.log('\n2️⃣ Testing aggregation queries...');
    
    const materialId = '01234567-89ab-cdef-0123-456789abcdef';
    
    // Count views and downloads for our test material
    const { data: materialStats, error: materialError } = await supabase
      .from('sales_materials_stats')
      .select('action')
      .eq('material_id', materialId);
    
    if (materialError) {
      console.log('❌ Failed to fetch material stats:', materialError.message);
    } else {
      const views = materialStats?.filter(s => s.action === 'view').length || 0;
      const downloads = materialStats?.filter(s => s.action === 'download').length || 0;
      
      console.log(`✅ Test material stats:`);
      console.log(`   👁️ Views: ${views}`);
      console.log(`   ⬇️ Downloads: ${downloads}`);
    }
    
    // Test daily aggregation
    console.log('\n3️⃣ Testing daily aggregation...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayStats, error: todayError } = await supabase
      .from('sales_materials_stats')
      .select('action, created_at')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);
    
    if (todayError) {
      console.log('❌ Failed to fetch today stats:', todayError.message);
    } else {
      console.log(`✅ Today's stats: ${todayStats?.length || 0} actions`);
      
      if (todayStats && todayStats.length > 0) {
        const todayViews = todayStats.filter(s => s.action === 'view').length;
        const todayDownloads = todayStats.filter(s => s.action === 'download').length;
        
        console.log(`   👁️ Today's views: ${todayViews}`);
        console.log(`   ⬇️ Today's downloads: ${todayDownloads}`);
      }
    }
    
    console.log('\n🎯 Stats verification complete! Data is ready for the admin dashboard.');
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifyStatsData();