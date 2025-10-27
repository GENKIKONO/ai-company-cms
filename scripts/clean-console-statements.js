#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Script to systematically remove and replace console statements with proper logging
 * This script performs safe replacements following established patterns
 */

// Patterns for common console statement replacements
const replacementPatterns = [
  // Error logging patterns
  {
    pattern: /console\.error\('([^']+):', error\);/g,
    replacement: "logger.error('$1', error instanceof Error ? error : new Error(String(error)));"
  },
  {
    pattern: /console\.error\('([^']+)', error\);/g,
    replacement: "logger.error('$1', error instanceof Error ? error : new Error(String(error)));"
  },
  {
    pattern: /console\.error\('([^']+)', ([^)]+)\);/g,
    replacement: "logger.error('$1', $2);"
  },

  // Debug logging patterns (development only)
  {
    pattern: /console\.log\('([^']+):', ([^)]+)\);/g,
    replacement: "logger.debug('$1', $2);"
  },
  {
    pattern: /console\.log\('([^']+)', ([^)]+)\);/g,
    replacement: "logger.debug('$1', $2);"
  },
  {
    pattern: /console\.log\(([^)]+)\);/g,
    replacement: "logger.debug('Debug', $1);"
  },

  // Warning patterns
  {
    pattern: /console\.warn\('([^']+):', ([^)]+)\);/g,
    replacement: "logger.warn('$1', $2);"
  },
  {
    pattern: /console\.warn\('([^']+)', ([^)]+)\);/g,
    replacement: "logger.warn('$1', $2);"
  },

  // Info patterns
  {
    pattern: /console\.info\('([^']+):', ([^)]+)\);/g,
    replacement: "logger.info('$1', $2);"
  },
  {
    pattern: /console\.info\('([^']+)', ([^)]+)\);/g,
    replacement: "logger.info('$1', $2);"
  },

  // Simple patterns
  {
    pattern: /console\.error\('([^']+)'\);/g,
    replacement: "logger.error('$1');"
  },
  {
    pattern: /console\.warn\('([^']+)'\);/g,
    replacement: "logger.warn('$1');"
  },
  {
    pattern: /console\.info\('([^']+)'\);/g,
    replacement: "logger.info('$1');"
  },
  {
    pattern: /console\.log\('([^']+)'\);/g,
    replacement: "logger.debug('$1');"
  },
];

// Import patterns to add if not present
const importPatterns = [
  // For API routes
  {
    check: /apiLogger/,
    existing: /import.*apiLogger.*from.*@\/lib\/utils\/logger/,
    add: "import { apiLogger } from '@/lib/utils/logger';"
  },
  // For auth files
  {
    check: /authLogger/,
    existing: /import.*authLogger.*from.*@\/lib\/utils\/logger/,
    add: "import { authLogger } from '@/lib/utils/logger';"
  },
  // For general files
  {
    check: /logger/,
    existing: /import.*logger.*from.*@\/lib\/utils\/logger/,
    add: "import { logger } from '@/lib/utils/logger';"
  }
];

// Files to skip (diagnostic, test, config files that may need console for debugging)
const skipFiles = [
  'test',
  'spec',
  '.config.',
  'jest.',
  'playwright.',
  'cypress.',
  'scripts/',
  'mcp/',
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  'diag/', // Diagnostic routes may need console for debugging
  'debug/', // Debug routes may need console for debugging
];

function shouldSkipFile(filePath) {
  return skipFiles.some(pattern => filePath.includes(pattern));
}

function addImportIfNeeded(content, filePath) {
  // Skip adding imports to certain file types
  if (filePath.includes('.d.ts') || filePath.includes('.config.') || shouldSkipFile(filePath)) {
    return content;
  }

  const lines = content.split('\n');
  let importAdded = false;
  
  // Check if logger import is needed
  if (content.includes('logger.') && !content.includes("from '@/lib/utils/logger'")) {
    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && lines[i].includes(' from ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      // Add after the last import
      lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/lib/utils/logger';");
      importAdded = true;
    } else {
      // Add at the top after 'use client' or 'use server' directives if they exist
      let insertIndex = 0;
      if (lines[0] && (lines[0].includes("'use client'") || lines[0].includes("'use server'"))) {
        insertIndex = 1;
        if (lines[1] && lines[1].trim() === '') insertIndex = 2;
      }
      lines.splice(insertIndex, 0, "import { logger } from '@/lib/utils/logger';", '');
      importAdded = true;
    }
  }
  
  return lines.join('\n');
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply replacement patterns
    for (const { pattern, replacement } of replacementPatterns) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Add import if needed and modifications were made
    if (modified) {
      content = addImportIfNeeded(content, filePath);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentDir) {
    if (shouldSkipFile(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        if (!shouldSkipFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function main() {
  const srcDir = path.join(__dirname, '../src');
  console.log(`🔍 Finding files to process in: ${srcDir}`);
  
  const files = findFiles(srcDir);
  console.log(`📁 Found ${files.length} files to process`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const file of files) {
    // Only process files that contain console statements
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('console.')) {
      processedCount++;
      const wasModified = processFile(file);
      if (wasModified) {
        modifiedCount++;
      }
    }
  }
  
  console.log(`\n✨ Summary:`);
  console.log(`📁 Total files checked: ${files.length}`);
  console.log(`🔧 Files processed: ${processedCount}`);
  console.log(`✅ Files modified: ${modifiedCount}`);
  
  // Count remaining console statements
  exec(`find ${srcDir} -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep "console\\." | wc -l`, (error, stdout) => {
    if (!error) {
      const remaining = stdout.trim();
      console.log(`📊 Console statements remaining: ${remaining}`);
      
      if (parseInt(remaining) < 100) {
        console.log(`🎉 SUCCESS: Console statements reduced to under 100!`);
      } else {
        console.log(`⚠️  Still need to process ${remaining} console statements`);
      }
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles };