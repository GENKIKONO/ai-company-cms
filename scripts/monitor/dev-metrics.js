#!/usr/bin/env node

/**
 * Phase 4 - リソース監視スクリプト
 * Next.js開発サーバーのCPU・メモリ使用量を30秒ごとに監視・記録
 *
 * 🔍 【監視機能】グループ: リソース監視システム
 * 📊 使用場面: 開発中のパフォーマンス監視
 * ⚡ 実行: `node scripts/monitor/dev-metrics.js`
 * 🎯 目的: CPU80%・メモリ1GB超過時の早期検知・アラート
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const CONFIG = {
  INTERVAL: 30 * 1000, // 30秒間隔
  LOG_FILE: 'logs/dev-metrics.log',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  RETENTION_DAYS: 7,
  ALERT_CPU_THRESHOLD: 80, // CPU使用率80%でアラート
  ALERT_MEMORY_THRESHOLD: 1024, // メモリ1GB使用でアラート
};

// カラー定義
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class DevMetricsMonitor {
  constructor() {
    this.logFile = path.resolve(CONFIG.LOG_FILE);
    this.ensureLogDirectory();
    this.startTime = new Date();
    
    console.log(`${colors.blue}🔍 AIO Hub 開発環境リソース監視開始${colors.reset}`);
    console.log(`${colors.cyan}ログファイル: ${this.logFile}${colors.reset}`);
    console.log(`${colors.cyan}監視間隔: ${CONFIG.INTERVAL / 1000}秒${colors.reset}`);
    console.log('---');
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // システムメトリクス取得
  getSystemMetrics() {
    try {
      // CPU使用率 (全体)
      const loadAvg = require('os').loadavg();
      const cpuCount = require('os').cpus().length;
      const systemCpuUsage = ((loadAvg[0] / cpuCount) * 100).toFixed(1);

      // メモリ使用量 (全体)
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

      return {
        systemCpu: parseFloat(systemCpuUsage),
        systemMemory: {
          total: Math.round(totalMem / 1024 / 1024),
          used: Math.round(usedMem / 1024 / 1024),
          free: Math.round(freeMem / 1024 / 1024),
          usagePercent: parseFloat(memUsagePercent)
        },
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2)
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Node.js/Next.js プロセスメトリクス取得
  getNodeMetrics() {
    try {
      // Node.js プロセス検索
      const nodeProcesses = execSync(`ps aux | grep -E "(node|npm)" | grep -v grep`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parts[1],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]), // %
            memoryMB: Math.round(parseInt(parts[5]) / 1024), // KB to MB
            command: parts.slice(10).join(' ')
          };
        });

      // 合計値計算
      const totalNodeCpu = nodeProcesses.reduce((sum, proc) => sum + proc.cpu, 0);
      const totalNodeMemoryMB = nodeProcesses.reduce((sum, proc) => sum + proc.memoryMB, 0);

      // Next.js開発サーバー特定
      const devServer = nodeProcesses.find(proc => 
        proc.command.includes('next dev') || 
        proc.command.includes('npm run dev')
      );

      return {
        totalCpu: totalNodeCpu.toFixed(1),
        totalMemoryMB: totalNodeMemoryMB,
        processCount: nodeProcesses.length,
        devServer,
        processes: nodeProcesses.slice(0, 3) // 上位3プロセス
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ポート使用状況チェック
  getPortStatus() {
    try {
      const port3000 = execSync('lsof -i :3000 2>/dev/null || echo "free"', { encoding: 'utf8' }).trim();
      const isPort3000Used = !port3000.includes('free');
      
      return {
        port3000: {
          inUse: isPort3000Used,
          details: isPort3000Used ? port3000.split('\n')[1] : 'Available'
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // アプリケーション正常性チェック
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      
      // HTTP レスポンス確認
      const response = await fetch('http://localhost:3000/', { 
        signal: AbortSignal.timeout(5000) 
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        httpCode: response.status,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // メトリクス収集
  async collectMetrics() {
    const timestamp = new Date();
    
    const [systemMetrics, nodeMetrics, portStatus, healthStatus] = await Promise.all([
      this.getSystemMetrics(),
      this.getNodeMetrics(),
      this.getPortStatus(),
      this.getHealthStatus()
    ]);

    return {
      timestamp: timestamp.toISOString(),
      uptime: Math.round((timestamp - this.startTime) / 1000), // 秒
      system: systemMetrics,
      node: nodeMetrics,
      ports: portStatus,
      health: healthStatus
    };
  }

  // アラート判定
  checkAlerts(metrics) {
    const alerts = [];

    // CPU使用率アラート
    if (metrics.node.totalCpu && parseFloat(metrics.node.totalCpu) > CONFIG.ALERT_CPU_THRESHOLD) {
      alerts.push({
        type: 'HIGH_CPU',
        message: `Node.js CPU使用率が高すぎます: ${metrics.node.totalCpu}%`,
        severity: 'WARNING'
      });
    }

    // メモリ使用量アラート
    if (metrics.node.totalMemoryMB > CONFIG.ALERT_MEMORY_THRESHOLD) {
      alerts.push({
        type: 'HIGH_MEMORY',
        message: `Node.js メモリ使用量が高すぎます: ${metrics.node.totalMemoryMB}MB`,
        severity: 'WARNING'
      });
    }

    // アプリケーション異常アラート
    if (metrics.health.status !== 'healthy') {
      alerts.push({
        type: 'APP_UNHEALTHY',
        message: `アプリケーションが異常です: ${metrics.health.error || metrics.health.httpCode}`,
        severity: 'CRITICAL'
      });
    }

    return alerts;
  }

  // ログ出力
  writeLog(metrics) {
    const logEntry = {
      timestamp: metrics.timestamp,
      uptime: metrics.uptime,
      system_cpu: metrics.system.systemCpu,
      system_memory_percent: metrics.system.systemMemory.usagePercent,
      system_memory_mb: metrics.system.systemMemory.used,
      node_cpu: metrics.node.totalCpu,
      node_memory_mb: metrics.node.totalMemoryMB,
      node_process_count: metrics.node.processCount,
      app_status: metrics.health.status,
      app_response_time: metrics.health.responseTime,
      port_3000_in_use: metrics.ports.port3000.inUse
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error(`${colors.red}ログ書き込みエラー: ${error.message}${colors.reset}`);
    }
  }

  // コンソール出力
  displayMetrics(metrics) {
    const alerts = this.checkAlerts(metrics);
    
    // アラート表示
    if (alerts.length > 0) {
      console.log(`${colors.red}🚨 アラート:${colors.reset}`);
      alerts.forEach(alert => {
        const color = alert.severity === 'CRITICAL' ? colors.red : colors.yellow;
        console.log(`${color}  ${alert.message}${colors.reset}`);
      });
      console.log('');
    }

    // メトリクス表示
    console.log(`${colors.bright}📊 ${new Date().toLocaleTimeString()} - リソース使用状況:${colors.reset}`);
    console.log(`${colors.green}  システム:${colors.reset} CPU ${metrics.system.systemCpu}%, RAM ${metrics.system.systemMemory.used}MB (${metrics.system.systemMemory.usagePercent}%)`);
    console.log(`${colors.cyan}  Node.js:${colors.reset} CPU ${metrics.node.totalCpu}%, RAM ${metrics.node.totalMemoryMB}MB, プロセス数 ${metrics.node.processCount}`);
    
    if (metrics.node.devServer) {
      console.log(`${colors.magenta}  開発サーバー:${colors.reset} PID ${metrics.node.devServer.pid}, CPU ${metrics.node.devServer.cpu}%, RAM ${metrics.node.devServer.memoryMB}MB`);
    }
    
    const healthColor = metrics.health.status === 'healthy' ? colors.green : colors.red;
    const healthIcon = metrics.health.status === 'healthy' ? '✅' : '❌';
    console.log(`${healthColor}  アプリ:${colors.reset} ${healthIcon} ${metrics.health.status} (${metrics.health.responseTime || 0}ms)`);
    
    console.log('');
  }

  // ログファイルローテーション
  rotateLogIfNeeded() {
    try {
      const stats = fs.statSync(this.logFile);
      if (stats.size > CONFIG.MAX_LOG_SIZE) {
        const backupFile = `${this.logFile}.${Date.now()}`;
        fs.renameSync(this.logFile, backupFile);
        console.log(`${colors.yellow}ログローテーション実行: ${backupFile}${colors.reset}`);
      }
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  }

  // 監視開始
  async start() {
    console.log(`${colors.green}監視開始 - Ctrl+C で停止${colors.reset}\n`);

    const monitor = async () => {
      try {
        const metrics = await this.collectMetrics();
        this.displayMetrics(metrics);
        this.writeLog(metrics);
        this.rotateLogIfNeeded();
      } catch (error) {
        console.error(`${colors.red}メトリクス収集エラー: ${error.message}${colors.reset}`);
      }
    };

    // 初回実行
    await monitor();
    
    // 定期実行
    const interval = setInterval(monitor, CONFIG.INTERVAL);
    
    // 終了処理
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(`\n${colors.yellow}監視を停止しました${colors.reset}`);
      process.exit(0);
    });
  }
}

// メイン実行
if (require.main === module) {
  const monitor = new DevMetricsMonitor();
  monitor.start().catch(error => {
    console.error(`${colors.red}監視開始エラー: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = DevMetricsMonitor;