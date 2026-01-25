#!/usr/bin/env node

/**
 * Crash Vector Detection Script
 *
 * Detects patterns that could cause dashboard crashes:
 * 1. Client-side throw new Error (UI crashes)
 * 2. Unguarded response.json() calls
 * 3. Supabase .single() usage (PGRST116 → 500)
 * 4. Hardcoded /dashboard URLs (should use ROUTES constants)
 * 5. Server Component importing client-only auth (@/lib/auth)
 * 6. Forbidden /auth/login redirects in dashboard code (middleware responsibility)
 *
 * Uses baseline difference to allow existing violations while blocking new ones.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const baselineFile = path.join(projectRoot, 'scripts', 'crash-vectors.baseline.json');
const allowlistFile = path.join(projectRoot, 'scripts', 'crash-vectors.allowlist.json');

// Exclusion patterns - always ignored
const excludePatterns = [
  '**/node_modules/**',
  '**/.next/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/scripts/**'
];

// API routes exclusions for throw new Error (API routes should use NextResponse)
const apiRouteExcludePatterns = ['src/app/api/**'];

// File patterns to scan (with custom scan root for testing)
function getScanPatterns(scanRoot = 'src') {
  return {
    throwError: [
      `${scanRoot}/app/dashboard/**/*.{ts,tsx}`,
      `${scanRoot}/components/**/*.{ts,tsx}`
    ],
    responseJson: [`${scanRoot}/**/*.{ts,tsx}`],
    supabaseSingle: [`${scanRoot}/**/*.{ts,tsx}`],
    hardcodedDashboard: [`${scanRoot}/**/*.{ts,tsx}`],
    serverClientBoundary: [`${scanRoot}/app/**/*.{ts,tsx}`],
    nextDocumentInAppRouter: [`${scanRoot}/app/**/*.{ts,tsx}`],
    // Dashboard/Account code should NEVER redirect to /auth/login
    // Middleware is the sole authority for auth redirects
    forbiddenLoginRedirect: [
      `${scanRoot}/app/dashboard/**/*.{ts,tsx}`,
      `${scanRoot}/app/account/**/*.{ts,tsx}`,
      `${scanRoot}/components/dashboard/**/*.{ts,tsx}`,
      `${scanRoot}/components/account/**/*.{ts,tsx}`
    ]
  };
}

// Detection patterns
const patterns = {
  throwError: /throw\s+new\s+Error\s*\(/g,
  responseJson: /(?<!\/\/.*?)response\.json\(\)(?![.\s]*\.catch)/g,
  supabaseSingle: /\.single\s*\(\s*\)/g,
  hardcodedDashboard: /['"`]\/dashboard(?:\/[^'"`]*)?['"`]/g,
  nextDocumentInAppRouter: /from\s+['"]next\/document['"]/g,
  // Forbidden: Direct /auth/login redirects in dashboard/account code
  // Patterns: window.location.href = '/auth/login', router.push('/auth/login'), redirect('/auth/login')
  forbiddenLoginRedirect: /(?:window\.location(?:\.href)?\s*=|(?:router|Router)\.(?:push|replace)\(|redirect\().*?['"`]\/auth\/login['"`]/g
};

/**
 * Normalize path for cross-platform consistency
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath, excludeType = 'general') {
  const normalizedPath = normalizePath(filePath);
  
  // Always exclude these patterns
  for (const pattern of excludePatterns) {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    if (regex.test(normalizedPath)) {
      return true;
    }
  }
  
  // Special exclusion for throw new Error in API routes
  if (excludeType === 'throwError') {
    for (const pattern of apiRouteExcludePatterns) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      if (regex.test(normalizedPath)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Load allowlist exceptions
 */
async function loadAllowlist() {
  try {
    const allowlistContent = await fs.readFile(allowlistFile, 'utf8');
    return JSON.parse(allowlistContent);
  } catch (error) {
    return []; // No allowlist file is OK
  }
}

/**
 * Check if violation is in allowlist
 */
function isAllowlisted(violation, allowlist) {
  return allowlist.some(item => 
    item.file === violation.file && 
    item.line === violation.line
  );
}

/**
 * Scan files for crash vectors
 */
async function scanFiles(pattern, regex, description, scanRoot = projectRoot, excludeType = 'general') {
  const files = [];
  
  for (const globPattern of pattern) {
    try {
      const matches = globSync(globPattern, { cwd: scanRoot });
      files.push(...matches.map(f => normalizePath(f)));
    } catch (error) {
      console.warn(`Warning: Could not scan pattern ${globPattern}: ${error.message}`);
    }
  }
  
  // Remove duplicates and sort for deterministic output
  const uniqueFiles = [...new Set(files)].sort();
  const violations = [];
  let skippedFiles = 0;
  
  for (const file of uniqueFiles) {
    if (shouldExcludeFile(file, excludeType)) {
      skippedFiles++;
      continue;
    }
    
    const fullPath = path.join(scanRoot, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');
      
      let match;
      regex.lastIndex = 0; // Reset regex state
      
      while ((match = regex.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineContent = lines[lineNumber - 1];
        
        violations.push({
          file: file,
          line: lineNumber,
          content: lineContent.trim(),
          match: match[0]
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${file}: ${error.message}`);
    }
  }
  
  // Sort violations deterministically (path → line → match)
  violations.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    return a.match.localeCompare(b.match);
  });
  
  return {
    description,
    count: violations.length,
    violations,
    skippedFiles
  };
}

/**
 * Scan for Server/Client boundary violations
 * Detects Server Components importing client-only auth functions
 */
async function scanServerClientBoundary(pattern, scanRoot = projectRoot) {
  const files = [];
  
  for (const globPattern of pattern) {
    try {
      const matches = globSync(globPattern, { cwd: scanRoot });
      files.push(...matches.map(f => normalizePath(f)));
    } catch (error) {
      console.warn(`Warning: Could not scan pattern ${globPattern}: ${error.message}`);
    }
  }
  
  const uniqueFiles = [...new Set(files)].sort();
  const violations = [];
  let skippedFiles = 0;
  
  for (const file of uniqueFiles) {
    if (shouldExcludeFile(file)) {
      skippedFiles++;
      continue;
    }
    
    const fullPath = path.join(scanRoot, file);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');
      
      // Check for import from @/lib/auth
      const authImportRegex = /import\s+.*from\s+['"`]@\/lib\/auth['"`]/;
      const authImportMatch = content.match(authImportRegex);
      
      if (authImportMatch) {
        // Check if file is a Server Component (no 'use client' directive)
        const hasUseClient = /^['"`]use client['"`]/.test(content.trim());
        
        if (!hasUseClient) {
          // Find line number of the auth import
          const beforeMatch = content.substring(0, content.indexOf(authImportMatch[0]));
          const lineNumber = beforeMatch.split('\n').length;
          const lineContent = lines[lineNumber - 1];
          
          violations.push({
            file: file,
            line: lineNumber,
            content: lineContent.trim(),
            match: authImportMatch[0]
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${file}: ${error.message}`);
    }
  }
  
  // Sort violations deterministically 
  violations.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    return a.match.localeCompare(b.match);
  });
  
  return {
    description: 'Server Component importing client-only auth',
    count: violations.length,
    violations,
    skippedFiles
  };
}

/**
 * Load baseline violations
 */
async function loadBaseline() {
  // Debug: output the file path being read
  console.log(`[DEBUG] Loading baseline from: ${baselineFile}`);
  console.log(`[DEBUG] projectRoot: ${projectRoot}`);
  console.log(`[DEBUG] __dirname: ${__dirname}`);

  try {
    const baselineContent = await fs.readFile(baselineFile, 'utf8');
    const parsed = JSON.parse(baselineContent);

    // Debug: output the parsed count
    console.log(`[DEBUG] Parsed baseline throwError.count: ${parsed.throwError?.count}`);

    return parsed;
  } catch (error) {
    console.warn('No baseline file found, treating all violations as new');
    console.log(`[DEBUG] Error reading baseline: ${error.message}`);
    return {
      throwError: { count: 0, violations: [] },
      responseJson: { count: 0, violations: [] },
      supabaseSingle: { count: 0, violations: [] },
      hardcodedDashboard: { count: 0, violations: [] },
      forbiddenLoginRedirect: { count: 0, violations: [] }
    };
  }
}

/**
 * Save baseline violations
 */
async function saveBaseline(results) {
  const baselineData = {};
  for (const [key, result] of Object.entries(results)) {
    baselineData[key] = {
      count: result.count,
      violations: result.violations
    };
  }
  
  await fs.writeFile(baselineFile, JSON.stringify(baselineData, null, 2));
  console.log(`Baseline saved to ${baselineFile}`);
}

/**
 * Create a signature for a violation to compare with baseline
 */
function createViolationSignature(violation) {
  return `${violation.file}:${violation.line}:${violation.match}`;
}

/**
 * Compare current violations with baseline, applying allowlist
 */
async function compareWithBaseline(current, baseline, allowlist) {
  const baselineSignatures = new Set(
    baseline.violations.map(createViolationSignature)
  );
  
  // Apply allowlist to current violations
  const nonAllowlistedViolations = current.violations.filter(
    v => !isAllowlisted(v, allowlist)
  );
  
  const newViolations = nonAllowlistedViolations.filter(
    v => !baselineSignatures.has(createViolationSignature(v))
  );
  
  // Calculate baseline increase (current count vs baseline count)
  const baselineIncrease = Math.max(0, current.count - baseline.count);
  
  return {
    description: current.description,
    baselineCount: baseline.count,
    currentCount: current.count,
    allowlistedCount: current.violations.length - nonAllowlistedViolations.length,
    newCount: newViolations.length,
    newViolations,
    baselineIncrease
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isUpdateBaseline = args.includes('--update-baseline');
  const scanRoot = args.find(arg => arg.startsWith('--scan-root='))?.split('=')[1] || projectRoot;
  
  console.log('🔍 Scanning for crash vectors...\n');
  
  // Load allowlist
  const allowlist = await loadAllowlist();
  if (allowlist.length > 0) {
    console.log(`📋 Loaded ${allowlist.length} allowlist entries`);
  }
  
  // Get scan patterns based on scan root
  const scanPatterns = getScanPatterns(path.relative(scanRoot, path.join(scanRoot, 'src')));
  
  // Scan for all patterns
  const results = {
    throwError: await scanFiles(
      scanPatterns.throwError, 
      patterns.throwError, 
      'Client-side throw new Error',
      scanRoot,
      'throwError'
    ),
    responseJson: await scanFiles(
      scanPatterns.responseJson, 
      patterns.responseJson, 
      'Unguarded response.json() calls',
      scanRoot
    ),
    supabaseSingle: await scanFiles(
      scanPatterns.supabaseSingle, 
      patterns.supabaseSingle, 
      'Supabase .single() usage',
      scanRoot
    ),
    hardcodedDashboard: await scanFiles(
      scanPatterns.hardcodedDashboard, 
      patterns.hardcodedDashboard, 
      'Hardcoded /dashboard URLs',
      scanRoot
    ),
    nextDocumentInAppRouter: await scanFiles(
      scanPatterns.nextDocumentInAppRouter,
      patterns.nextDocumentInAppRouter,
      'next/document imports in App Router',
      scanRoot
    ),
    serverClientBoundary: await scanServerClientBoundary(
      scanPatterns.serverClientBoundary,
      scanRoot
    ),
    forbiddenLoginRedirect: await scanFiles(
      scanPatterns.forbiddenLoginRedirect,
      patterns.forbiddenLoginRedirect,
      'Forbidden /auth/login redirects in dashboard/account (middleware responsibility)',
      scanRoot
    )
  };
  
  if (isUpdateBaseline) {
    await saveBaseline(results);
    
    console.log('📊 Updated baseline:');
    for (const [key, result] of Object.entries(results)) {
      console.log(`  ${result.description}: ${result.count} violations`);
    }
    
    return;
  }
  
  // Compare with baseline
  const baseline = await loadBaseline();
  let hasNewViolations = false;
  let hasBaselineIncrease = false;
  const isCI = process.env.CI === '1' || process.env.CI === 'true';
  
  console.log('📊 Crash Vector Analysis:\n');
  
  for (const [key, current] of Object.entries(results)) {
    const baselineData = baseline[key] || { count: 0, violations: [] };
    const comparison = await compareWithBaseline(current, baselineData, allowlist);
    
    console.log(`${comparison.description}:`);
    console.log(`  Baseline: ${comparison.baselineCount} violations`);
    console.log(`  Current:  ${comparison.currentCount} violations`);
    if (comparison.allowlistedCount > 0) {
      console.log(`  Allowlisted: ${comparison.allowlistedCount} violations`);
    }
    console.log(`  New:      ${comparison.newCount} violations`);
    
    // Check for baseline increase in CI mode
    if (comparison.baselineIncrease > 0) {
      if (isCI) {
        hasBaselineIncrease = true;
        console.log(`  🚫 Baseline increase: +${comparison.baselineIncrease} violations (CI mode: not allowed)`);
      } else {
        console.log(`  ⚠️  Baseline increase: +${comparison.baselineIncrease} violations`);
      }
    }
    
    if (comparison.newCount > 0) {
      hasNewViolations = true;
      console.log('  🚨 New violations detected:');
      
      for (const violation of comparison.newViolations) {
        console.log(`    ${violation.file}:${violation.line} → ${violation.match}`);
        console.log(`      ${violation.content}`);
      }
    } else {
      console.log('  ✅ No new violations');
    }
    
    console.log('');
  }
  
  if (hasBaselineIncrease && isCI) {
    console.log('🚫 CI MODE: Baseline increases are not allowed.');
    console.log('   Baseline can only be updated manually with --update-baseline outside CI.');
    process.exit(1);
  }
  
  if (hasNewViolations) {
    console.log('❌ New crash vectors detected. Please fix them or update baseline.');
    console.log('   To update baseline: npm run check:crash-vectors:update-baseline');
    process.exit(1);
  } else {
    console.log('✅ No new crash vectors detected.');
    process.exit(0);
  }
}

// Handle errors
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});