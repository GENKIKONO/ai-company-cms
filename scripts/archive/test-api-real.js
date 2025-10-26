#!/usr/bin/env node

// Test the material stats API endpoints with real material ID

const MATERIAL_ID = '01234567-89ab-cdef-0123-456789abcdef';

async function testStatsAPIReal() {
  try {
    console.log('🧪 Testing Material Stats API with real material ID...');
    console.log('Material ID:', MATERIAL_ID);
    
    // Test 1: POST to log a view stat
    console.log('\n1️⃣ Testing POST /api/materials/stats (view)');
    
    const viewResponse = await fetch('http://localhost:3000/api/materials/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: MATERIAL_ID,
        action: 'view',
        user_agent: 'API-Test/1.0'
      })
    });
    
    const viewResult = await viewResponse.json();
    console.log('Status:', viewResponse.status);
    console.log('Response:', viewResult);
    
    // Test 2: POST to log a download stat
    console.log('\n2️⃣ Testing POST /api/materials/stats (download)');
    
    const downloadResponse = await fetch('http://localhost:3000/api/materials/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: MATERIAL_ID,
        action: 'download',
        user_agent: 'API-Test/1.0'
      })
    });
    
    const downloadResult = await downloadResponse.json();
    console.log('Status:', downloadResponse.status);
    console.log('Response:', downloadResult);
    
    // Test 3: Multiple view logs to create some data
    console.log('\n3️⃣ Creating multiple test stats...');
    
    const testStats = [
      { action: 'view', user_agent: 'Chrome/91.0' },
      { action: 'view', user_agent: 'Firefox/89.0' },
      { action: 'download', user_agent: 'Safari/14.0' },
      { action: 'view', user_agent: 'Edge/91.0' },
      { action: 'download', user_agent: 'Chrome/91.0' }
    ];
    
    for (let i = 0; i < testStats.length; i++) {
      const stat = testStats[i];
      const response = await fetch('http://localhost:3000/api/materials/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material_id: MATERIAL_ID,
          action: stat.action,
          user_agent: stat.user_agent
        })
      });
      
      const result = await response.json();
      console.log(`   ${i + 1}. ${stat.action} (${stat.user_agent}): ${response.status} - ${result.success ? '✅' : '❌'}`);
      
      // Small delay to space out the timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n✅ API tests completed! Check the admin dashboard at /admin/material-stats');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testStatsAPIReal();