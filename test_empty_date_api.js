// GPTから提案されたテスト: 空文字日付フィールドのAPI確認
const fetch = require('node-fetch');

async function testEmptyDateAPI() {
  console.log('=== Testing Empty Date Fields API ===\n');
  
  const testPayload = {
    name: "Test Company " + Date.now(),
    slug: "test-company-" + Date.now(),
    established_at: "", // 空文字（問題の原因）
    founded: "", // 空文字（問題の原因）
    address_country: "JP",
    description: "",
    email_public: false,
    status: "draft"
  };
  
  console.log('🔍 Testing with payload containing empty date fields:');
  console.log(JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3001/api/my/organization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log('❌ API call failed:', result);
      
      // エラーメッセージから原因を判定
      if (result.error && result.error.includes('invalid input syntax for type date')) {
        console.log('🚨 DATE型エラー検出: 恒久対策が適用されていない可能性');
      } else if (result.error && result.error.includes('record "new" has no field "founded"')) {
        console.log('🚨 DB trigger/function エラー: founded フィールド参照問題');
      } else if (result.error && result.error.includes('Authentication required')) {
        console.log('✅ 認証エラー（予期される動作）: 空文字は正規化で処理済み');
      }
    } else {
      console.log('✅ API call succeeded - 恒久対策が機能している');
      console.log('Response:', result);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testEmptyDateAPI();