#!/usr/bin/env node

/**
 * Admin API Signature Generator
 * 
 * This script generates the required HMAC signatures for admin API requests.
 * Use this for testing admin APIs that require signature validation.
 * 
 * Usage:
 *   node scripts/generate-admin-signature.js [method] [path] [body]
 * 
 * Example:
 *   node scripts/generate-admin-signature.js GET /api/admin/system/health
 *   node scripts/generate-admin-signature.js POST /api/admin/users '{"email":"test@example.com"}'
 */

const crypto = require('crypto');
const { performance } = require('perf_hooks');

// Configuration
const ADMIN_API_SECRET_KEY = process.env.ADMIN_API_SECRET_KEY || 'your_admin_api_secret_key_64_chars_minimum';

function generateAdminSignature(method, path, body = '', customTimestamp = null, customNonce = null) {
  const timestamp = customTimestamp || Date.now().toString();
  const nonce = customNonce || crypto.randomBytes(16).toString('hex');
  
  // Create payload for signing
  const payload = `${method.toUpperCase()}|${path}|${timestamp}|${nonce}|${body}`;
  
  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', ADMIN_API_SECRET_KEY)
    .update(payload, 'utf8')
    .digest('hex');
  
  return {
    signature,
    timestamp,
    nonce,
    payload,
    headers: {
      'x-admin-signature': signature,
      'x-admin-timestamp': timestamp,
      'x-admin-nonce': nonce,
      'Content-Type': 'application/json'
    }
  };
}

function validateSignature(method, path, body, signature, timestamp, nonce) {
  const generated = generateAdminSignature(method, path, body, timestamp, nonce);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(generated.signature, 'hex')
  );
  
  return {
    isValid,
    expected: generated.signature,
    provided: signature,
    payload: generated.payload
  };
}

function generateCurlCommand(method, path, body, baseUrl = 'http://localhost:3000') {
  const sigData = generateAdminSignature(method, path, body);
  
  let curlCommand = `curl -X ${method.toUpperCase()} "${baseUrl}${path}" \\`;
  
  Object.entries(sigData.headers).forEach(([key, value]) => {
    curlCommand += `\n  -H "${key}: ${value}" \\`;
  });
  
  if (body && body.trim() !== '') {
    curlCommand += `\n  -d '${body}' \\`;
  }
  
  curlCommand = curlCommand.slice(0, -2); // Remove trailing backslash
  
  return curlCommand;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Admin API Signature Generator

Usage:
  node scripts/generate-admin-signature.js [method] [path] [body]
  node scripts/generate-admin-signature.js --validate [method] [path] [body] [signature] [timestamp] [nonce]
  node scripts/generate-admin-signature.js --curl [method] [path] [body] [base_url]

Commands:
  --help, -h     Show this help message
  --validate     Validate an existing signature
  --curl         Generate a curl command with signatures

Examples:
  # Generate signature for GET request
  node scripts/generate-admin-signature.js GET /api/admin/system/health

  # Generate signature for POST request with body
  node scripts/generate-admin-signature.js POST /api/admin/users '{"email":"admin@example.com","role":"admin"}'

  # Validate a signature
  node scripts/generate-admin-signature.js --validate GET /api/admin/system/health "" abc123 1634567890 def456

  # Generate curl command
  node scripts/generate-admin-signature.js --curl GET /api/admin/system/health
`);
    return;
  }
  
  if (args[0] === '--validate') {
    if (args.length < 6) {
      console.error('Error: --validate requires method, path, body, signature, timestamp, and nonce');
      process.exit(1);
    }
    
    const [, method, path, body, signature, timestamp, nonce] = args;
    const result = validateSignature(method, path, body, signature, timestamp, nonce);
    
    console.log('\n=== Signature Validation ===');
    console.log(`Valid: ${result.isValid ? '✓ YES' : '✗ NO'}`);
    console.log(`Expected: ${result.expected}`);
    console.log(`Provided: ${result.provided}`);
    console.log(`Payload: ${result.payload}`);
    
    process.exit(result.isValid ? 0 : 1);
  }
  
  if (args[0] === '--curl') {
    const method = args[1] || 'GET';
    const path = args[2] || '/api/admin/system/health';
    const body = args[3] || '';
    const baseUrl = args[4] || 'http://localhost:3000';
    
    console.log('\n=== Generated Curl Command ===');
    console.log(generateCurlCommand(method, path, body, baseUrl));
    return;
  }
  
  // Default: generate signature
  const method = args[0] || 'GET';
  const path = args[1] || '/api/admin/system/health';
  const body = args[2] || '';
  
  if (!ADMIN_API_SECRET_KEY || ADMIN_API_SECRET_KEY === 'your_admin_api_secret_key_64_chars_minimum') {
    console.warn('⚠️  Warning: Using default ADMIN_API_SECRET_KEY. Set environment variable for production use.');
  }
  
  console.log('\n=== Admin API Signature Generation ===');
  console.log(`Method: ${method.toUpperCase()}`);
  console.log(`Path: ${path}`);
  console.log(`Body: ${body || '(empty)'}`);
  console.log('');
  
  const startTime = performance.now();
  const result = generateAdminSignature(method, path, body);
  const endTime = performance.now();
  
  console.log('=== Generated Headers ===');
  Object.entries(result.headers).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  console.log('\n=== Details ===');
  console.log(`Payload: ${result.payload}`);
  console.log(`Signature: ${result.signature}`);
  console.log(`Generation Time: ${(endTime - startTime).toFixed(2)}ms`);
  
  console.log('\n=== JavaScript Code Example ===');
  console.log(`
const headers = {
  'x-admin-signature': '${result.signature}',
  'x-admin-timestamp': '${result.timestamp}',
  'x-admin-nonce': '${result.nonce}',
  'Content-Type': 'application/json'
};

fetch('${path}', {
  method: '${method.toUpperCase()}',
  headers,
  ${body ? `body: '${body}'` : '// body: undefined'}
});`);
  
  console.log('\n=== Curl Command ===');
  console.log(generateCurlCommand(method, path, body));
}

// Export for use as module
if (require.main === module) {
  main();
} else {
  module.exports = {
    generateAdminSignature,
    validateSignature,
    generateCurlCommand
  };
}