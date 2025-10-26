#!/usr/bin/env node

// Test the material stats API endpoints

async function testStatsAPI() {
  try {
    console.log('🧪 Testing Material Stats API...');
    
    // Test 1: POST to log a view stat (should work without auth)
    console.log('\n1️⃣ Testing POST /api/materials/stats (anonymous view)');
    
    const viewResponse = await fetch('http://localhost:3000/api/materials/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: '00000000-0000-0000-0000-000000000001', // dummy ID
        action: 'view',
        user_agent: 'Test-Agent/1.0'
      })
    });
    
    const viewResult = await viewResponse.json();
    console.log('Status:', viewResponse.status);
    console.log('Response:', viewResult);
    
    // Test 2: POST to log a download stat
    console.log('\n2️⃣ Testing POST /api/materials/stats (anonymous download)');
    
    const downloadResponse = await fetch('http://localhost:3000/api/materials/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: '00000000-0000-0000-0000-000000000001', // dummy ID
        action: 'download',
        user_agent: 'Test-Agent/1.0'
      })
    });
    
    const downloadResult = await downloadResponse.json();
    console.log('Status:', downloadResponse.status);
    console.log('Response:', downloadResult);
    
    // Test 3: GET stats (should require admin auth and fail)
    console.log('\n3️⃣ Testing GET /api/materials/stats (should require admin)');
    
    const getResponse = await fetch('http://localhost:3000/api/materials/stats?limit=5');
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', getResult);
    
    // Test 4: Invalid action
    console.log('\n4️⃣ Testing POST with invalid action');
    
    const invalidResponse = await fetch('http://localhost:3000/api/materials/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: '00000000-0000-0000-0000-000000000001',
        action: 'invalid_action',
        user_agent: 'Test-Agent/1.0'
      })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('Status:', invalidResponse.status);
    console.log('Response:', invalidResult);
    
    console.log('\n✅ API tests completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testStatsAPI();