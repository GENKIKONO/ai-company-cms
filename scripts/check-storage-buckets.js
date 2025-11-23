const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCreateBuckets() {
  try {
    console.log('🔍 Checking existing storage buckets...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Existing buckets:', buckets?.map(b => b.name) || []);
    
    // Check if 'assets' bucket exists
    const assetsExists = buckets?.some(bucket => bucket.name === 'assets');
    
    if (!assetsExists) {
      console.log('📥 Creating "assets" bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('assets', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating assets bucket:', createError);
        return;
      }
      
      console.log('✅ Created "assets" bucket successfully');
    } else {
      console.log('✅ "assets" bucket already exists');
    }
    
    // Test upload permissions
    console.log('🧪 Testing upload permissions...');
    const testFile = Buffer.from('test image data');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(`test/${testFileName}`, testFile, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful');
      
      // Clean up test file
      await supabase.storage.from('assets').remove([`test/${testFileName}`]);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAndCreateBuckets();