#!/usr/bin/env node

/**
 * Environment Variables Verification for Production
 * Checks required environment variables for Vercel Production deployment
 */

import { writeFileSync } from 'fs';

const REQUIRED_ENV_VARS = {
  // Essential 6 Variables (REQUIRED for production)
  'SUPABASE_URL': {
    description: 'Supabase project URL (Dashboard > Settings > General > Project URL)',
    required: true,
    example: 'https://your-project.supabase.co'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key (Dashboard > Settings > API > service_role secret)',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    sensitive: true
  },
  'SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key (Dashboard > Settings > API > anon public)',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    sensitive: true
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Public Supabase URL for client-side (same as SUPABASE_URL)',
    required: true,
    example: 'https://your-project.supabase.co'
  },
  'NEXT_PUBLIC_APP_URL': {
    description: 'Application base URL (your production domain)',
    required: true,
    example: 'https://aiohub.jp'
  },
  'NEXT_PUBLIC_SITE_URL': {
    description: 'Site URL for API calls (same as NEXT_PUBLIC_APP_URL)',
    required: true,
    example: 'https://aiohub.jp'
  },
  
  // Optional Variables (checked if present)
  'ADMIN_EMAIL': {
    description: 'Admin email for system notifications',
    required: false,
    example: 'admin@aiohub.jp'
  },
  'ADMIN_OPS_PASSWORD': {
    description: 'Admin operations password',
    required: false,
    example: 'your-admin-password',
    sensitive: true
  }
};

function checkEnvironmentVariables() {
  console.log('🔍 Vercel Production Environment Variables Check\\n');
  
  const results = {
    missing: [],
    present: [],
    warnings: []
  };
  
  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];
    
    if (!value) {
      if (config.required) {
        results.missing.push({ name: varName, config });
        console.log(`❌ ${varName}: MISSING (Required)`);
      } else {
        results.warnings.push({ name: varName, config });
        console.log(`⚠️  ${varName}: Not set (Optional)`);
      }
    } else {
      results.present.push({ name: varName, config });
      const displayValue = config.sensitive ? '[REDACTED]' : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }
  
  console.log(`\\n📊 Summary:`);
  console.log(`✅ Present: ${results.present.length}`);
  console.log(`❌ Missing: ${results.missing.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.missing.length > 0) {
    console.log(`\\n🚨 CRITICAL: ${results.missing.length} required environment variables are missing!`);
    console.log('Production deployment will fail without these variables.\\n');
    console.log('📋 これらの変数を Vercel の Production environment に設定してください:');
    console.log('   Vercel Dashboard → Project → Settings → Environment Variables → Production\\n');
    
    console.log('Missing variables:');
    results.missing.forEach(({ name, config }) => {
      console.log(`- ${name}: ${config.description}`);
      console.log(`  Example: ${config.example}\\n`);
    });
    
    return false;
  }
  
  if (results.warnings.length > 0) {
    console.log(`\\n⚠️  ${results.warnings.length} optional variables are not set:`);
    results.warnings.forEach(({ name, config }) => {
      console.log(`- ${name}: ${config.description}`);
    });
  }
  
  console.log('\\n🎉 All required environment variables are present!');
  return true;
}

function generateEnvTemplate() {
  console.log('\\n📄 Generating .env.production.sample...');
  
  let template = `# Production Environment Variables Template
# Copy this file to .env.production and fill in actual values
# DO NOT commit actual values to git!

# Generated: ${new Date().toISOString()}

`;

  const categories = {
    'Supabase Configuration (REQUIRED)': ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL'],
    'Application URLs (REQUIRED)': ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'],
    'Admin Settings (OPTIONAL)': ['ADMIN_EMAIL', 'ADMIN_OPS_PASSWORD']
  };
  
  for (const [category, varNames] of Object.entries(categories)) {
    template += `# ${category}\n`;
    
    varNames.forEach(varName => {
      const config = REQUIRED_ENV_VARS[varName];
      if (config) {
        template += `# ${config.description}\n`;
        if (config.required) {
          template += `# REQUIRED\n`;
        }
        template += `${varName}=${config.example}\n\n`;
      }
    });
    
    template += '\n';
  }
  
  try {
    writeFileSync('.env.production.sample', template);
    console.log('✅ .env.production.sample generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate template:', error.message);
  }
}

// Main execution
async function main() {
  const isValid = checkEnvironmentVariables();
  await generateEnvTemplate();
  
  if (!isValid) {
    console.log('\\n🔧 Next steps:');
    console.log('1. Set missing environment variables in Vercel dashboard');
    console.log('2. Use .env.production.sample as reference');
    console.log('3. Redeploy to production after setting variables');
    process.exit(1);
  }
  
  console.log('\\n🚀 Environment is ready for production deployment!');
}

main().catch(console.error);