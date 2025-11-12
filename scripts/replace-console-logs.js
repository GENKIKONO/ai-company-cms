#!/usr/bin/env node

/**
 * Console Log Replacement Script
 * 
 * Replaces all console.* calls with logger.* equivalents throughout the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting console.* to logger.* replacement...');

// Track statistics
let stats = {
  filesProcessed: 0,
  replacements: 0,
  imports: 0,
  skippedFiles: 0
};

const replacementMap = {
  'console.log': 'logger.info',
  'console.info': 'logger.info', 
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug'
};

// Files to exclude from processing
const excludePatterns = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /scripts\//,
  /test/i,
  /spec/i,
  /__tests__/,
  /playwright/,
  /\.d\.ts$/,
  /next\.config/,
  /tailwind\.config/,
  /postcss\.config/
];

function shouldProcessFile(filePath) {
  // Only process TypeScript and TypeScript React files
  if (!filePath.match(/\.(ts|tsx)$/)) {
    return false;
  }
  
  return !excludePatterns.some(pattern => pattern.test(filePath));
}

function addLoggerImport(content, filePath) {
  // Check if logger import already exists
  if (content.includes('from \'@/lib/log\'') || content.includes('from "@/lib/log"')) {
    return content;
  }
  
  // Check if any logger import exists (old path)
  const loggerImportRegex = /import.*logger.*from\s+['"][^'"]*['"];?\n?/;
  const existingImport = content.match(loggerImportRegex);
  
  if (existingImport) {
    // Replace existing logger import
    content = content.replace(loggerImportRegex, "import { logger } from '@/lib/log';\n");
    stats.imports++;
  } else {
    // Add new import after other imports
    const lastImportRegex = /^import.*from.*['"];?\s*$/gm;
    const imports = content.match(lastImportRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + 
                '\nimport { logger } from \'@/lib/log\';' +
                content.slice(insertIndex);
      stats.imports++;
    } else {
      // No imports found, add at the beginning
      content = 'import { logger } from \'@/lib/log\';\n\n' + content;
      stats.imports++;
    }
  }
  
  return content;
}

function processConsoleUsage(content) {
  let replacementCount = 0;
  
  // Replace console.* calls with logger.*
  for (const [oldMethod, newMethod] of Object.entries(replacementMap)) {
    const regex = new RegExp(`\\b${oldMethod.replace('.', '\\.')}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newMethod);
      replacementCount += matches.length;
    }
  }
  
  return { content, replacementCount };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file contains console usage
  if (!content.match(/console\.(log|info|warn|error|debug)/)) {
    return false;
  }
  
  stats.filesProcessed++;
  
  // Process console replacements
  const { content: processedContent, replacementCount } = processConsoleUsage(content);
  
  if (replacementCount === 0) {
    return false;
  }
  
  // Add logger import if needed
  const finalContent = addLoggerImport(processedContent, filePath);
  
  // Write back to file
  fs.writeFileSync(filePath, finalContent, 'utf8');
  
  stats.replacements += replacementCount;
  
  console.log(`✅ ${filePath}: ${replacementCount} replacements`);
  return true;
}

function findTSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!excludePatterns.some(pattern => pattern.test(fullPath))) {
          traverse(fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    process.exit(1);
  }
  
  console.log(`🔍 Scanning for TypeScript files in: ${srcDir}`);
  
  const tsFiles = findTSFiles(srcDir);
  console.log(`📁 Found ${tsFiles.length} TypeScript files to process`);
  
  let processedFiles = 0;
  
  for (const file of tsFiles) {
    try {
      const processed = processFile(file);
      if (processed) {
        processedFiles++;
      } else {
        stats.skippedFiles++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      stats.skippedFiles++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPLACEMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`📁 Files scanned: ${tsFiles.length}`);
  console.log(`✅ Files processed: ${stats.filesProcessed}`);
  console.log(`⚪ Files skipped: ${stats.skippedFiles}`);
  console.log(`🔄 Console replacements: ${stats.replacements}`);
  console.log(`📦 Logger imports added: ${stats.imports}`);
  
  if (stats.replacements > 0) {
    console.log('\n🎉 Console replacement completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Review changed files');
    console.log('   2. Run type checking: npm run type-check');
    console.log('   3. Run build: npm run build');
  } else {
    console.log('\nℹ️  No console.* calls found to replace');
  }
}

main();