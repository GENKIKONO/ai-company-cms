#!/usr/bin/env node

/**
 * Port専用kill script - 証拠ログ付き
 * Usage: node scripts/kill-port.mjs <port>
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const port = process.argv[2];
if (!port) {
  console.error('Usage: node scripts/kill-port.mjs <port>');
  process.exit(1);
}

console.log(`🔍 [KILL-PORT] Checking port ${port}...`);

function getPidsOnPort(port) {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim().split('\n').filter(pid => pid.length > 0);
  } catch (error) {
    return [];
  }
}

function getPortInfo(port) {
  try {
    const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error) {
    return '';
  }
}

// 初回確認
const initialInfo = getPortInfo(port);
if (initialInfo) {
  console.log(`📋 [KILL-PORT] Port ${port} is occupied:`);
  console.log(initialInfo);
} else {
  console.log(`✅ [KILL-PORT] Port ${port} is free`);
  process.exit(0);
}

const pids = getPidsOnPort(port);
if (pids.length === 0) {
  console.log(`⚠️ [KILL-PORT] No PIDs found for port ${port}`);
  process.exit(0);
}

console.log(`🎯 [KILL-PORT] Found PIDs: ${pids.join(', ')}`);

// SIGTERM で優雅に停止を試行
for (const pid of pids) {
  try {
    console.log(`⏹️ [KILL-PORT] Sending SIGTERM to PID ${pid}...`);
    execSync(`kill -TERM ${pid}`, { stdio: 'pipe' });
  } catch (error) {
    console.log(`⚠️ [KILL-PORT] SIGTERM to PID ${pid} failed: ${error.message}`);
  }
}

// 3秒待機
console.log(`⏳ [KILL-PORT] Waiting 3 seconds for graceful shutdown...`);
await setTimeout(3000);

// 残存確認
const remainingPids = getPidsOnPort(port);
if (remainingPids.length === 0) {
  console.log(`✅ [KILL-PORT] Port ${port} gracefully freed`);
  process.exit(0);
}

console.log(`💀 [KILL-PORT] Force killing remaining PIDs: ${remainingPids.join(', ')}`);

// SIGKILL で強制終了
for (const pid of remainingPids) {
  try {
    console.log(`🔨 [KILL-PORT] Sending SIGKILL to PID ${pid}...`);
    execSync(`kill -KILL ${pid}`, { stdio: 'pipe' });
  } catch (error) {
    console.log(`❌ [KILL-PORT] SIGKILL to PID ${pid} failed: ${error.message}`);
  }
}

// 最終確認
const finalInfo = getPortInfo(port);
if (finalInfo) {
  console.log(`❌ [KILL-PORT] Port ${port} still occupied after force kill:`);
  console.log(finalInfo);
  process.exit(1);
} else {
  console.log(`✅ [KILL-PORT] Port ${port} successfully freed`);
}