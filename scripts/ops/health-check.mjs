#!/usr/bin/env node

/**
 * System Health Check Script
 * Usage: node scripts/ops/health-check.mjs [--detailed] [--url=https://your-app.com]
 */

import { performance } from 'perf_hooks';

const args = process.argv.slice(2);
const isDetailed = args.includes('--detailed');
const urlArg = args.find(arg => arg.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

console.log('🏥 System Health Check');
console.log('='.repeat(50));
console.log(`Target: ${baseUrl}`);
console.log(`Mode: ${isDetailed ? 'Detailed' : 'Basic'}`);
console.log('='.repeat(50));

async function checkHealth() {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Health-Check-Script/1.0'
      }
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    const data = await response.json();
    
    // Status emoji
    const statusEmoji = {
      'healthy': '✅',
      'degraded': '⚠️',
      'unhealthy': '❌'
    }[data.status] || '❓';
    
    console.log(`\n${statusEmoji} Overall Status: ${data.status.toUpperCase()}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`🕒 Timestamp: ${data.timestamp}`);
    
    // Service status
    console.log('\n📊 Service Status:');
    Object.entries(data.checks).forEach(([service, status]) => {
      const emoji = status ? '✅' : '❌';
      console.log(`  ${emoji} ${service.padEnd(10)}: ${status ? 'UP' : 'DOWN'}`);
    });
    
    // Exit with appropriate code based on API status
    if (data.status === 'healthy') {
      console.log('\n🎉 System is operational');
      process.exit(0);
    } else if (data.status === 'degraded') {
      console.log('\n⚠️  System is degraded but functional');
      process.exit(1);
    } else {
      console.log('\n🚨 System is unhealthy');
      process.exit(2);
    }
    
  } catch (error) {
    console.error('\n💥 Health check failed:', error.message);
    process.exit(3);
  }
}

async function checkDetailedStatus() {
  console.log('\n🔍 Attempting detailed status check...');
  
  try {
    const response = await fetch(`${baseUrl}/api/ops/status`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Health-Check-Script/1.0'
      }
    });
    
    if (response.status === 401) {
      console.log('ℹ️  Detailed status requires authentication (expected)');
      return;
    }
    
    const data = await response.json();
    
    console.log(`\n📈 System Metrics:`);
    if (data.metrics) {
      Object.entries(data.metrics).forEach(([metric, value]) => {
        console.log(`  📊 ${metric.padEnd(20)}: ${value}`);
      });
    }
    
    if (data.systemInfo) {
      console.log(`\n⚙️  System Info:`);
      console.log(`  🟢 Node Version: ${data.systemInfo.nodeVersion}`);
      console.log(`  🔧 Next Version: ${data.systemInfo.nextVersion}`);
      console.log(`  ⏰ Uptime: ${Math.round(data.uptime / 60)}m`);
      console.log(`  🌍 Environment: ${data.environment}`);
      
      const memMB = Math.round(data.systemInfo.memoryUsage.used / 1024 / 1024);
      console.log(`  💾 Memory Used: ${memMB}MB`);
    }
    
  } catch (error) {
    console.log(`❌ Detailed status failed: ${error.message}`);
  }
}

// Main execution
console.log('\n🚀 Starting health check...');

try {
  await checkHealth();
  
  if (isDetailed) {
    await checkDetailedStatus();
  }
} catch (error) {
  console.error('\n💥 Unexpected error:', error);
  process.exit(4);
}