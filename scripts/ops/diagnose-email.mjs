#!/usr/bin/env node

/**
 * Email Authentication Diagnostics Script
 * 
 * Checks email-related configurations for auth email delivery issues
 * Usage: node scripts/ops/diagnose-email.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

console.log('🔍 Email Authentication Diagnostics\n');
console.log('═'.repeat(80));

const checks = [];

// Helper function to add check results
function addCheck(name, expected, actual, status, notes = '') {
  checks.push({
    name,
    expected,
    actual,
    status,
    notes
  });
}

// 1. Check NEXT_PUBLIC_APP_URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
addCheck(
  'App URL (NEXT_PUBLIC_APP_URL)',
  'https://aiohub.jp',
  appUrl || 'NOT SET',
  appUrl === 'https://aiohub.jp' ? '✅ PASS' : '❌ FAIL'
);

// 2. Check Resend API Key
const resendApiKey = process.env.RESEND_API_KEY;
addCheck(
  'Resend API Key (RESEND_API_KEY)',
  'Present (re_xxx...)',
  resendApiKey ? `${resendApiKey.substring(0, 6)}...` : 'NOT SET',
  resendApiKey && resendApiKey.startsWith('re_') ? '✅ PASS' : '❌ FAIL'
);

// 3. Check Resend From Email
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
addCheck(
  'Resend From Email (RESEND_FROM_EMAIL)',
  'noreply@aiohub.jp',
  resendFromEmail || 'NOT SET',
  resendFromEmail === 'noreply@aiohub.jp' ? '✅ PASS' : '❌ FAIL'
);

// 4. Check Supabase URL and Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

addCheck(
  'Supabase URL (NEXT_PUBLIC_SUPABASE_URL)',
  'Present (https://xxx.supabase.co)',
  supabaseUrl || 'NOT SET',
  supabaseUrl && supabaseUrl.includes('supabase.co') ? '✅ PASS' : '❌ FAIL'
);

addCheck(
  'Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)',
  'Present (eyJ...)',
  supabaseAnonKey ? `${supabaseAnonKey.substring(0, 6)}...` : 'NOT SET',
  supabaseAnonKey && supabaseAnonKey.startsWith('eyJ') ? '✅ PASS' : '❌ FAIL'
);

// 5. Check Supabase Auth Configuration (if credentials available)
let authSiteUrl = 'CANNOT CHECK';
let emailTemplateRedirect = 'CANNOT CHECK';

if (supabaseUrl && supabaseAnonKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Note: We cannot directly access auth config via client
    // This would require admin access or manual verification
    addCheck(
      'Supabase Auth Site URL',
      'https://aiohub.jp',
      'MANUAL CHECK REQUIRED',
      '⚠️ MANUAL',
      'Check in Supabase Dashboard > Auth > Settings'
    );

    addCheck(
      'Email Template Redirect URL',
      'Contains /auth/confirm',
      'MANUAL CHECK REQUIRED',
      '⚠️ MANUAL',
      'Check in Supabase Dashboard > Auth > Email Templates'
    );
  } catch (error) {
    addCheck(
      'Supabase Connection',
      'Successful',
      `Error: ${error.message}`,
      '❌ FAIL'
    );
  }
} else {
  addCheck(
    'Supabase Auth Config Check',
    'Available',
    'SKIPPED - Missing credentials',
    '⚠️ SKIP'
  );
}

// 6. Check Custom SMTP Configuration (if using)
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (smtpHost || smtpPort || smtpUser || smtpPass) {
  addCheck(
    'Custom SMTP Host',
    'smtp.resend.com',
    smtpHost || 'NOT SET',
    smtpHost === 'smtp.resend.com' ? '✅ PASS' : '❌ FAIL'
  );

  addCheck(
    'Custom SMTP Port',
    '587 or 465',
    smtpPort || 'NOT SET',
    (smtpPort === '587' || smtpPort === '465') ? '✅ PASS' : '❌ FAIL'
  );

  addCheck(
    'Custom SMTP User',
    'resend',
    smtpUser || 'NOT SET',
    smtpUser === 'resend' ? '✅ PASS' : '❌ FAIL'
  );

  addCheck(
    'Custom SMTP Password',
    'API Key (re_xxx...)',
    smtpPass ? `${smtpPass.substring(0, 6)}...` : 'NOT SET',
    smtpPass && smtpPass.startsWith('re_') ? '✅ PASS' : '❌ FAIL'
  );
} else {
  addCheck(
    'Custom SMTP Configuration',
    'Optional',
    'NOT CONFIGURED',
    '✅ PASS',
    'Using Supabase default or not configured'
  );
}

// 7. DNS/SPF/DKIM Status (Manual check required)
addCheck(
  'DNS/SPF/DKIM Status',
  'Verified in Resend Dashboard',
  'MANUAL CHECK REQUIRED',
  '⚠️ MANUAL',
  'Check in Resend Dashboard > Domains > aiohub.jp'
);

// 8. Check if auth confirmation page exists
try {
  const confirmPagePath = join(process.cwd(), 'src/app/auth/confirm/page.tsx');
  const confirmPageExists = !!readFileSync(confirmPagePath, 'utf-8');
  
  addCheck(
    'Auth Confirm Page',
    'Exists at /auth/confirm',
    confirmPageExists ? 'EXISTS' : 'NOT FOUND',
    confirmPageExists ? '✅ PASS' : '❌ FAIL'
  );
} catch (error) {
  addCheck(
    'Auth Confirm Page',
    'Exists at /auth/confirm',
    'NOT FOUND',
    '❌ FAIL'
  );
}

// Output results in table format
console.log('\n📊 Configuration Check Results:');
console.log('─'.repeat(120));
console.log('│ Check Name'.padEnd(35) + '│ Expected'.padEnd(25) + '│ Actual'.padEnd(25) + '│ Status'.padEnd(10) + '│ Notes'.padEnd(20) + '│');
console.log('─'.repeat(120));

checks.forEach(check => {
  const name = check.name.length > 33 ? check.name.substring(0, 30) + '...' : check.name;
  const expected = check.expected.length > 23 ? check.expected.substring(0, 20) + '...' : check.expected;
  const actual = check.actual.length > 23 ? check.actual.substring(0, 20) + '...' : check.actual;
  const notes = check.notes.length > 18 ? check.notes.substring(0, 15) + '...' : check.notes;
  
  console.log(`│ ${name.padEnd(33)} │ ${expected.padEnd(23)} │ ${actual.padEnd(23)} │ ${check.status.padEnd(8)} │ ${notes.padEnd(18)} │`);
});

console.log('─'.repeat(120));

// Summary
const passCount = checks.filter(c => c.status.includes('✅')).length;
const failCount = checks.filter(c => c.status.includes('❌')).length;
const manualCount = checks.filter(c => c.status.includes('⚠️')).length;

console.log('\n📈 Summary:');
console.log(`✅ PASS: ${passCount}`);
console.log(`❌ FAIL: ${failCount}`);
console.log(`⚠️ MANUAL: ${manualCount}`);
console.log(`📊 Total: ${checks.length}`);

if (failCount > 0) {
  console.log('\n🔧 Failed Checks - Action Required:');
  checks.filter(c => c.status.includes('❌')).forEach(check => {
    console.log(`  • ${check.name}: ${check.actual} (Expected: ${check.expected})`);
  });
}

if (manualCount > 0) {
  console.log('\n👀 Manual Verification Required:');
  checks.filter(c => c.status.includes('⚠️')).forEach(check => {
    console.log(`  • ${check.name}: ${check.notes}`);
  });
}

console.log('\n📚 Next Steps:');
console.log('  1. Fix any FAILED checks');
console.log('  2. Manually verify items marked as MANUAL');
console.log('  3. Check docs/ops/email-troubleshooting.md for detailed troubleshooting');
console.log('  4. Run test signup flow to verify email delivery');

console.log('\n═'.repeat(80));
console.log('📧 Email Diagnostics Complete\n');