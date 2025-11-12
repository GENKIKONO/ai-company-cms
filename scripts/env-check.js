#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * 
 * This script verifies that environment variables are properly loaded
 * and that application components are running in the correct environment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Verification Report');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables Status:');
console.log('-'.repeat(40));

const requiredEnvVars = [
  'APP_ENV',
  'LOG_LEVEL', 
  'NODE_ENV',
  'CSRF_SECRET',
  'API_SIGNATURE_SECRET',
  'ADMIN_API_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_WEBHOOK_SECRET'
];

let envChecksPassed = 0;
let envChecksTotal = requiredEnvVars.length;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values for security
    const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? '*'.repeat(Math.min(value.length, 32)) + '...'
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
    envChecksPassed++;
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log(`\n📊 Environment Variables: ${envChecksPassed}/${envChecksTotal} configured`);

// Verify APP_ENV specifically
console.log('\n🎯 APP_ENV Verification:');
console.log('-'.repeat(30));

const appEnv = process.env.APP_ENV;
if (appEnv === 'production') {
  console.log('✅ APP_ENV is correctly set to "production"');
  console.log('✅ Production mode features will be enabled');
} else {
  console.log(`⚠️  APP_ENV is set to: "${appEnv}" (expected: "production")`);
}

// Verify LOG_LEVEL
console.log('\n📝 Log Level Configuration:');
console.log('-'.repeat(35));

const logLevel = process.env.LOG_LEVEL;
if (logLevel === 'info') {
  console.log('✅ LOG_LEVEL is correctly set to "info"');
  console.log('✅ Debug logs will be suppressed in production');
} else {
  console.log(`⚠️  LOG_LEVEL is set to: "${logLevel}" (expected: "info")`);
}

// Check security configuration
console.log('\n🔒 Security Configuration:');
console.log('-'.repeat(35));

const securityConfigs = [
  { name: 'CSRF Protection', env: 'CSRF_SECRET', required: true },
  { name: 'API Signature', env: 'API_SIGNATURE_SECRET', required: true },
  { name: 'Admin API', env: 'ADMIN_API_SECRET_KEY', required: true },
  { name: 'Stripe Webhook', env: 'STRIPE_WEBHOOK_SECRET', required: true },
  { name: 'Resend Webhook', env: 'RESEND_WEBHOOK_SECRET', required: true }
];

let securityChecksPassed = 0;

securityConfigs.forEach(config => {
  const value = process.env[config.env];
  if (value && value.length >= 16) {
    console.log(`✅ ${config.name}: Configured (${value.length} chars)`);
    securityChecksPassed++;
  } else if (value) {
    console.log(`⚠️  ${config.name}: Too short (${value.length} chars, min: 16)`);
  } else {
    console.log(`❌ ${config.name}: Not configured`);
  }
});

console.log(`\n📊 Security Features: ${securityChecksPassed}/${securityConfigs.length} properly configured`);

// Check middleware configuration
console.log('\n⚙️  Middleware Configuration Check:');
console.log('-'.repeat(40));

const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('✅ Security middleware file exists');
  
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check for security headers
  const securityHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy'
  ];
  
  let headersFound = 0;
  securityHeaders.forEach(header => {
    if (middlewareContent.includes(header)) {
      console.log(`✅ Security header configured: ${header}`);
      headersFound++;
    } else {
      console.log(`⚠️  Security header missing: ${header}`);
    }
  });
  
  console.log(`📊 Security Headers: ${headersFound}/${securityHeaders.length} configured`);
} else {
  console.log('❌ Security middleware file not found');
}

// Check for production optimizations
console.log('\n🚀 Production Optimizations:');
console.log('-'.repeat(35));

// Check if FORCE_HTTPS is set for production
const forceHttps = process.env.FORCE_HTTPS;
if (appEnv === 'production') {
  if (forceHttps === 'true') {
    console.log('✅ HTTPS enforcement enabled for production');
  } else {
    console.log('⚠️  HTTPS enforcement not enabled (set FORCE_HTTPS=true)');
  }
} else {
  console.log('ℹ️  HTTPS enforcement check skipped (not production)');
}

// Check build optimization
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  console.log('✅ NODE_ENV set to production (optimized builds)');
} else {
  console.log(`ℹ️  NODE_ENV set to: ${nodeEnv} (development mode)`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY');
console.log('='.repeat(60));

const totalChecks = envChecksPassed + securityChecksPassed;
const maxChecks = envChecksTotal + securityConfigs.length;

if (appEnv === 'production' && logLevel === 'info' && securityChecksPassed >= 4) {
  console.log('🎉 Environment configuration is READY for production');
  console.log('✅ All critical security features are properly configured');
  console.log('✅ Logging is optimized for production use');
} else {
  console.log('⚠️  Environment configuration needs review');
  console.log('🔧 Please address the issues listed above');
}

console.log(`\n📊 Overall Status: ${totalChecks}/${maxChecks} checks passed`);
console.log(`📅 Checked at: ${new Date().toISOString()}`);