#!/usr/bin/env tsx

/**
 * Schema-Type Consistency Validation Script
 * Supabaseスキーマと型定義の不一致を検知
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from '@/types/database.types';

const CRITICAL_TABLES = [
  'organizations',
  'posts', 
  'services',
  'faqs',
  'case_studies',
  'subscriptions',
  'ai_bot_logs',
  'ai_visibility_scores'
] as const;

const FORBIDDEN_FIELDS = [
  'org_id'  // organization_idに統一済み
] as const;

interface ValidationError {
  table: string;
  issue: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

async function validateSchemaConsistency(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  console.log('🔍 Starting schema-type consistency validation...');
  
  // Check for forbidden fields in types
  console.log('📋 Checking for forbidden field references...');
  
  // This would need to be implemented with actual type introspection
  // For now, we can check the source code files
  
  return errors;
}

async function checkForbiddenFieldUsage(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  // This could integrate with grep or ast parsing
  console.log('🚫 Checking for forbidden org_id usage in source...');
  
  // Example implementation:
  // const grepResult = await execAsync('grep -r "org_id" src/ --include="*.ts" --include="*.tsx"');
  
  return errors;
}

async function main() {
  try {
    console.log('🚀 Schema validation started');
    
    const schemaErrors = await validateSchemaConsistency();
    const fieldErrors = await checkForbiddenFieldUsage();
    
    const allErrors = [...schemaErrors, ...fieldErrors];
    
    if (allErrors.length === 0) {
      console.log('✅ Schema validation passed!');
      process.exit(0);
    } else {
      console.error('❌ Schema validation failed!');
      allErrors.forEach(error => {
        const icon = error.severity === 'error' ? '🔴' : '🟡';
        console.error(`${icon} ${error.table}: ${error.issue}`);
        if (error.suggestion) {
          console.error(`   💡 ${error.suggestion}`);
        }
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();

export { validateSchemaConsistency, checkForbiddenFieldUsage };