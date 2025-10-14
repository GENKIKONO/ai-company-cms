#!/usr/bin/env ts-node

/**
 * Production Test User Creation Script
 * 
 * Creates a temporary test user for production smoke tests.
 * The user is automatically deleted after tests complete.
 * 
 * Usage:
 *   npx ts-node scripts/create-prod-test-user.ts
 * 
 * Environment Variables:
 *   SUPABASE_URL - Production Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY - Production service role key
 */

import { createClient } from '@supabase/supabase-js';

interface TestUser {
  email: string;
  password: string;
  metadata?: {
    full_name?: string;
    role?: string;
  };
}

const PROD_TEST_USER: TestUser = {
  email: 'smoke-test@aiohub.jp',
  password: 'TempSmoke123!',
  metadata: {
    full_name: 'Production Smoke Test User',
    role: 'test_user',
  },
};

async function createProdTestUser(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔧 Creating production test user...');
  console.log(`📧 Email: ${PROD_TEST_USER.email}`);

  try {
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user already exists and delete if necessary
    console.log('🔍 Checking for existing test user...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (listError) {
      console.error('❌ Error checking existing users:', listError);
      process.exit(1);
    }

    const existingUser = existingUsers.users.find(user => user.email === PROD_TEST_USER.email);
    
    if (existingUser) {
      console.log('🗑️  Deleting existing test user...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.error('❌ Error deleting existing user:', deleteError);
        process.exit(1);
      }
      
      console.log('✅ Existing test user deleted');
      
      // Wait a moment for deletion to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create new test user
    console.log('➕ Creating new test user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: PROD_TEST_USER.email,
      password: PROD_TEST_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: PROD_TEST_USER.metadata,
    });

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      process.exit(1);
    }

    if (!newUser.user) {
      console.error('❌ User creation failed: No user returned');
      process.exit(1);
    }

    console.log('✅ Test user created successfully');
    console.log(`📝 User ID: ${newUser.user.id}`);
    console.log(`📧 Email: ${newUser.user.email}`);
    console.log(`🕐 Created: ${newUser.user.created_at}`);

    // Verify user can be retrieved
    console.log('🔍 Verifying user creation...');
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(newUser.user.id);
    
    if (verifyError || !verifyUser.user) {
      console.error('❌ User verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ User verification successful');
    
    // Store user ID for potential cleanup
    console.log('\n📋 Test user details:');
    console.log(`export PROD_SMOKE_TEST_USER_ID="${newUser.user.id}"`);
    console.log(`export PROD_SMOKE_TEST_EMAIL="${PROD_TEST_USER.email}"`);
    console.log(`export PROD_SMOKE_TEST_PASSWORD="${PROD_TEST_USER.password}"`);

    console.log('\n🎯 Test user ready for smoke tests');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  createProdTestUser().catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { createProdTestUser, PROD_TEST_USER };