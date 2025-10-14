#!/usr/bin/env ts-node

/**
 * Production Test User Cleanup Script
 * 
 * Deletes the temporary test user created for production smoke tests.
 * This ensures clean state after each test run.
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-prod-test-user.ts
 * 
 * Environment Variables:
 *   SUPABASE_URL - Production Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY - Production service role key
 */

import { createClient } from '@supabase/supabase-js';

const PROD_TEST_EMAIL = 'smoke-test@aiohub.jp';

async function cleanupProdTestUser(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🧹 Cleaning up production test user...');
  console.log(`📧 Target: ${PROD_TEST_EMAIL}`);

  try {
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find and delete test user
    console.log('🔍 Searching for test user...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    const testUser = users.users.find(user => user.email === PROD_TEST_EMAIL);
    
    if (!testUser) {
      console.log('ℹ️  No test user found to cleanup');
      console.log('✅ Cleanup complete (nothing to do)');
      return;
    }

    console.log(`🗑️  Deleting test user: ${testUser.id}`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id);
    
    if (deleteError) {
      console.error('❌ Error deleting test user:', deleteError);
      process.exit(1);
    }

    console.log('✅ Test user deleted successfully');
    
    // Verify deletion
    console.log('🔍 Verifying deletion...');
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(testUser.id);
    
    if (!verifyError || verifyUser.user) {
      console.warn('⚠️  User might still exist, but this could be due to propagation delay');
    } else {
      console.log('✅ Deletion verified');
    }

    console.log('\n🎯 Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
    // Don't exit with error code for cleanup failures to avoid failing the workflow
    console.log('⚠️  Cleanup failed, but continuing...');
  }
}

// Execute if run directly
if (require.main === module) {
  cleanupProdTestUser().catch((error) => {
    console.error('❌ Cleanup script execution failed:', error);
    // Don't exit with error for cleanup script
    console.log('⚠️  Cleanup failed, but exiting gracefully...');
  });
}

export { cleanupProdTestUser };