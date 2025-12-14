#!/usr/bin/env node

/**
 * Crash Vectors Summary Generator
 * 
 * Generates summary report for crash vectors baseline to aid in prioritization:
 * 1. Category breakdown (counts by type)
 * 2. Top files (highest violation counts)
 * 3. Dashboard-specific analysis (src/app/dashboard/**) 
 * 4. .single() API hotspots (API routes prioritized)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const baselineFile = path.join(projectRoot, 'scripts', 'crash-vectors.baseline.json');
const outputFile = path.join(projectRoot, 'reports', 'crash-vectors-summary.json');

/**
 * Load baseline data
 */
async function loadBaseline() {
  try {
    const baselineContent = await fs.readFile(baselineFile, 'utf8');
    return JSON.parse(baselineContent);
  } catch (error) {
    throw new Error(`Could not load baseline file: ${error.message}`);
  }
}

/**
 * Count violations per file
 */
function countViolationsByFile(violations) {
  const fileCounts = {};
  
  for (const violation of violations) {
    if (!fileCounts[violation.file]) {
      fileCounts[violation.file] = 0;
    }
    fileCounts[violation.file]++;
  }
  
  return Object.entries(fileCounts)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Filter violations for dashboard routes
 */
function filterDashboardViolations(violations) {
  return violations.filter(v => v.file.includes('src/app/dashboard/'));
}

/**
 * Filter violations for API routes (prioritized for .single())
 */
function filterApiViolations(violations) {
  return violations.filter(v => v.file.includes('src/app/api/'));
}

/**
 * Get top .single() locations with API priority
 */
function getTopSingleLocations(singleViolations, limit = 20) {
  const apiViolations = filterApiViolations(singleViolations);
  const nonApiViolations = singleViolations.filter(v => !v.file.includes('src/app/api/'));
  
  // Prioritize API routes, then add non-API routes
  const prioritizedViolations = [
    ...apiViolations.slice(0, Math.min(limit, apiViolations.length)),
    ...nonApiViolations.slice(0, Math.max(0, limit - apiViolations.length))
  ];
  
  return prioritizedViolations.map(v => ({
    file: v.file,
    line: v.line,
    content: v.content.substring(0, 100), // Truncate for summary
    isApi: v.file.includes('src/app/api/')
  }));
}

/**
 * Generate summary report
 */
async function generateSummary() {
  console.log('📊 Generating crash vectors summary...\n');
  
  // Ensure reports directory exists
  const reportsDir = path.join(projectRoot, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  
  // Load baseline data
  const baseline = await loadBaseline();
  
  // Category breakdown
  const categories = {};
  let totalViolations = 0;
  
  for (const [category, data] of Object.entries(baseline)) {
    categories[category] = {
      count: data.count,
      description: data.violations[0] ? getViolationDescription(category) : 'No violations'
    };
    totalViolations += data.count;
  }
  
  // Top files across all categories
  const allViolations = [];
  for (const data of Object.values(baseline)) {
    allViolations.push(...data.violations);
  }
  
  const topFiles = countViolationsByFile(allViolations).slice(0, 20);
  
  // Dashboard-specific analysis
  const dashboardViolations = filterDashboardViolations(allViolations);
  const dashboardCount = dashboardViolations.length;
  const topDashboardFiles = countViolationsByFile(dashboardViolations).slice(0, 10);
  
  // .single() hotspots (API prioritized)
  const singleViolations = baseline.supabaseSingle?.violations || [];
  const topSingleLocations = getTopSingleLocations(singleViolations, 20);
  
  // Generate summary object
  const summary = {
    generatedAt: new Date().toISOString(),
    baseline: {
      file: baselineFile,
      totalViolations
    },
    categories,
    topFiles,
    dashboard: {
      totalCount: dashboardCount,
      percentage: totalViolations > 0 ? Math.round((dashboardCount / totalViolations) * 100) : 0,
      topFiles: topDashboardFiles
    },
    singleHotspots: {
      totalCount: singleViolations.length,
      apiCount: filterApiViolations(singleViolations).length,
      topLocations: topSingleLocations
    },
    recommendations: generateRecommendations(categories, dashboardCount, singleViolations.length)
  };
  
  // Save summary
  await fs.writeFile(outputFile, JSON.stringify(summary, null, 2));
  
  // Display summary
  console.log(`📋 Total violations: ${totalViolations}`);
  console.log('');
  
  console.log('📊 Category breakdown:');
  for (const [category, data] of Object.entries(categories)) {
    const percentage = totalViolations > 0 ? Math.round((data.count / totalViolations) * 100) : 0;
    console.log(`  ${category}: ${data.count} (${percentage}%)`);
  }
  console.log('');
  
  console.log('🏢 Dashboard routes analysis:');
  console.log(`  Count: ${dashboardCount} violations (${summary.dashboard.percentage}% of total)`);
  console.log(`  Top dashboard files:`);
  for (const file of topDashboardFiles.slice(0, 5)) {
    console.log(`    ${file.file}: ${file.count} violations`);
  }
  console.log('');
  
  console.log('🎯 .single() API hotspots:');
  console.log(`  Total: ${singleViolations.length} violations`);
  console.log(`  API routes: ${summary.singleHotspots.apiCount} violations`);
  console.log(`  Top locations:`);
  for (const location of topSingleLocations.slice(0, 5)) {
    const apiMarker = location.isApi ? ' [API]' : '';
    console.log(`    ${location.file}:${location.line}${apiMarker}`);
  }
  console.log('');
  
  console.log('💡 Recommendations:');
  for (const rec of summary.recommendations) {
    console.log(`  • ${rec}`);
  }
  console.log('');
  
  console.log(`📄 Summary saved to: ${outputFile}`);
  
  return summary;
}

/**
 * Get human-readable description for violation category
 */
function getViolationDescription(category) {
  const descriptions = {
    throwError: 'Client-side throw new Error (UI crashes)',
    responseJson: 'Unguarded response.json() calls',
    supabaseSingle: 'Supabase .single() usage (PGRST116 risk)',
    hardcodedDashboard: 'Hardcoded /dashboard URLs',
    serverClientBoundary: 'Server/Client boundary violations',
    nextDocumentInAppRouter: 'next/document in App Router'
  };
  
  return descriptions[category] || category;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(categories, dashboardCount, singleCount) {
  const recommendations = [];
  
  // Prioritize by impact and ease of fixing
  if (categories.supabaseSingle?.count > 0) {
    recommendations.push(`Priority 1: Fix ${categories.supabaseSingle.count} .single() calls → .maybeSingle() (prevents 500 errors)`);
  }
  
  if (categories.throwError?.count > 0) {
    recommendations.push(`Priority 2: Handle ${categories.throwError.count} throw new Error in UI (prevents crashes)`);
  }
  
  if (categories.responseJson?.count > 0) {
    recommendations.push(`Priority 3: Guard ${categories.responseJson.count} response.json() calls (prevents parse errors)`);
  }
  
  if (dashboardCount > 0) {
    recommendations.push(`Focus area: Dashboard routes contain ${dashboardCount} violations (high user impact)`);
  }
  
  if (singleCount > 0) {
    recommendations.push(`Quick wins: Start with API .single() calls (clearer error handling, no UI impact)`);
  }
  
  return recommendations;
}

/**
 * Main execution
 */
async function main() {
  try {
    await generateSummary();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating summary:', error.message);
    process.exit(1);
  }
}

main();