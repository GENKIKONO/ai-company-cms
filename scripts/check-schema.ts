#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchemas() {
  console.log('🔍 Checking table schemas...\n');

  const tables = ['posts', 'faqs', 'case_studies', 'translation_jobs', 'embedding_jobs', 'idempotency_keys', 'job_runs_v2'];

  for (const tableName of tables) {
    try {
      console.log(`📋 ${tableName}:`);
      
      // Try to select one record to see column structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        continue;
      }

      if (!data || data.length === 0) {
        // Try to get column info using information_schema
        const { data: schemaData } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (schemaData) {
          console.log('   Columns:');
          schemaData.forEach((col: any) => {
            console.log(`     - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ' | null' : ''})`);
          });
        } else {
          console.log('   ✅ Table exists (empty)');
        }
      } else {
        console.log('   ✅ Sample record:');
        console.log('   Columns:', Object.keys(data[0]));
      }
      console.log('');
    } catch (err) {
      console.log(`   ❌ Failed: ${err}\n`);
    }
  }
}

checkSchemas().catch(console.error);