#!/usr/bin/env node

/**
 * Import Migration Script
 * 
 * @/types/database からの import を新しい構造に自動移行
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 移行マッピング
const importMappings = {
  // API Response Types
  'APIResponse': '@/types/domain/api-responses',
  'MyOrganizationResponse': '@/types/domain/api-responses',
  'MyOrganizationUpdateResponse': '@/types/domain/api-responses',
  'MyOrganizationDeleteResponse': '@/types/domain/api-responses',
  'MyOrganizationErrorResponse': '@/types/domain/api-responses',
  
  // Utils Types
  'UserRole': '@/types/utils/database',
  'UserSegment': '@/types/utils/database',
  'OrganizationStatus': '@/types/utils/database',
  'PartnershipType': '@/types/utils/database',
  'ServiceMedia': '@/types/utils/database',
  
  // Organization Domain
  'OrganizationFormData': '@/types/domain/organizations',
  'PartnerFormData': '@/types/domain/organizations',
  'OrganizationWithOwner': '@/types/domain/organizations',
  
  // Content Domain
  'ServiceFormData': '@/types/domain/content',
  'PostFormData': '@/types/domain/content',
  'CaseStudyFormData': '@/types/domain/content',
  'FAQFormData': '@/types/domain/content',
  
  // Q&A System
  'QAVisibility': '@/types/domain/qa-system',
  'QAEntryVisibility': '@/types/domain/qa-system',
  'QAEntryStatus': '@/types/domain/qa-system',
  'QALogAction': '@/types/domain/qa-system',
  'QACategory': '@/types/domain/qa-system',
  'QAEntry': '@/types/domain/qa-system',
  'QAContentLog': '@/types/domain/qa-system',
  'QAQuestionTemplate': '@/types/domain/qa-system',
  'QAEntryWithCategory': '@/types/domain/qa-system',
  'QACategoryFormData': '@/types/domain/qa-system',
  'QAEntryFormData': '@/types/domain/qa-system',
  'QAViewStat': '@/types/domain/qa-system',
  'QAStatsSummary': '@/types/domain/qa-system',
  'QADailyStats': '@/types/domain/qa-system',
  'QAStatsAction': '@/types/domain/qa-system',
  
  // Reports
  'ReportStatus': '@/types/domain/reports',
  'ReportFormat': '@/types/domain/reports',
  'MonthlyReport': '@/types/domain/reports',
  
  // Questions
  'QuestionStatus': '@/types/domain/questions',
  'Question': '@/types/domain/questions',
  'QuestionWithDetails': '@/types/domain/questions',
  'QuestionFormData': '@/types/domain/questions',
  'QuestionAnswerData': '@/types/domain/questions',
  
  // Sales
  'SalesAction': '@/types/domain/sales',
  'SalesMaterial': '@/types/domain/sales',
  'SalesMaterialStat': '@/types/domain/sales',
  'SalesMaterialStatsSummary': '@/types/domain/sales',
  'SalesMaterialDailyStats': '@/types/domain/sales',
  
  // Billing
  'Subscription': '@/types/domain/billing',
  'StripeCustomer': '@/types/domain/billing',
  
  // Legacy Types (discouraged)
  'AppUser': '@/types/legacy/database',
  'Partner': '@/types/legacy/database',
  'Organization': '@/types/legacy/database',
  'Service': '@/types/legacy/database',
  'FAQ': '@/types/legacy/database',
  'CaseStudy': '@/types/legacy/database',
  'Post': '@/types/legacy/database'
};

function migrateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // @/types/database からの import を検索
  const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@\/types\/database['"]/g;
  
  content = content.replace(importRegex, (match, imports) => {
    const importList = imports.split(',').map(s => s.trim());
    const newImports = {};
    
    importList.forEach(importName => {
      // Handle 'type TypeName' pattern
      const cleanName = importName.replace(/^type\s+/, '').replace(/\s+as\s+\w+$/, '');
      if (importMappings[cleanName]) {
        const targetModule = importMappings[cleanName];
        if (!newImports[targetModule]) {
          newImports[targetModule] = [];
        }
        newImports[targetModule].push(importName);
        modified = true;
      } else {
        console.warn(`Unknown type: ${cleanName} in ${filePath}`);
      }
    });
    
    // Generate new import statements
    const newImportStatements = Object.entries(newImports)
      .map(([module, types]) => `import type { ${types.join(', ')} } from '${module}';`)
      .join('\n');
    
    return newImportStatements;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated imports in ${filePath}`);
  }
  
  return modified;
}

function findFilesToMigrate() {
  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/types/**/*', // Exclude types directory
    '!src/**/*.d.ts',  // Exclude declaration files
    '!node_modules/**/*'
  ];
  
  const files = [];
  patterns.forEach(pattern => {
    if (pattern.startsWith('!')) {
      return; // Skip exclude patterns in this simple implementation
    }
    const matches = glob.sync(pattern, { absolute: true });
    files.push(...matches);
  });
  
  return files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('from \'@/types/database\'') || content.includes('from "@/types/database"');
  });
}

function main() {
  console.log('🔄 Starting import migration...');
  
  const filesToMigrate = findFilesToMigrate();
  console.log(`📁 Found ${filesToMigrate.length} files with @/types/database imports`);
  
  let totalMigrated = 0;
  
  filesToMigrate.forEach(file => {
    try {
      if (migrateImportsInFile(file)) {
        totalMigrated++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });
  
  console.log(`✅ Migration complete! Updated ${totalMigrated} files.`);
}

if (require.main === module) {
  main();
}

module.exports = { migrateImportsInFile, importMappings };