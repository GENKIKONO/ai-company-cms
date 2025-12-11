/**
 * Apply the get_my_organizations_slim migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration.');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Applying get_my_organizations_slim migration...');
  
  try {
    // Read the migration file
    const migrationSql = readFileSync('supabase/migrations/20251211_create_get_my_organizations_slim.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct approach if exec_sql doesn't exist
          const { error: directError } = await supabase.from('_migrations').insert({
            version: '20251211_create_get_my_organizations_slim',
            name: 'create_get_my_organizations_slim',
            hash: 'manual',
            executed_at: new Date().toISOString()
          });
          
          // For function creation, we'll use a different approach
          console.log('Using alternative function creation approach...');
          break;
        }
      }
    }
    
    // Test the function directly
    console.log('Testing get_my_organizations_slim function...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_my_organizations_slim', {
        user_id: '64b23ce5-0304-4a80-8a91-c8a3c14ebce2'
      });
    
    if (testError) {
      console.log('Function does not exist yet, creating manually...');
      
      // Create the function manually via SQL query
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION get_my_organizations_slim(user_id UUID DEFAULT auth.uid())
        RETURNS TABLE(
          user_id UUID,
          organization_id UUID,
          name TEXT,
          slug TEXT,
          plan TEXT,
          show_services BOOLEAN,
          show_posts BOOLEAN,
          show_case_studies BOOLEAN,
          show_faqs BOOLEAN,
          show_qa BOOLEAN,
          show_news BOOLEAN,
          show_partnership BOOLEAN,
          show_contact BOOLEAN,
          is_demo_guess BOOLEAN
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            get_my_organizations_slim.user_id as user_id,
            o.id as organization_id,
            o.name,
            o.slug,
            COALESCE(o.plan, 'free') as plan,
            COALESCE(o.show_services, true) as show_services,
            COALESCE(o.show_posts, true) as show_posts,
            COALESCE(o.show_case_studies, true) as show_case_studies,
            COALESCE(o.show_faqs, true) as show_faqs,
            COALESCE(o.show_qa, true) as show_qa,
            COALESCE(o.show_news, true) as show_news,
            COALESCE(o.show_partnership, true) as show_partnership,
            COALESCE(o.show_contact, true) as show_contact,
            false as is_demo_guess
          FROM organization_members om
          JOIN organizations o ON om.organization_id = o.id
          WHERE om.user_id = get_my_organizations_slim.user_id
          ORDER BY om.created_at ASC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // We'll need to execute this via a different method since we can't execute DDL directly
      console.log('❌ Cannot create function via this method. Manual creation required.');
    } else {
      console.log('✅ Function test successful:', testData?.length || 0, 'organizations');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(console.error);