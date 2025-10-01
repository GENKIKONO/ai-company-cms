#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

class PostgresMCPServer {
  constructor() {
    this.client = null;
  }

  async connect() {
    const connectionString = process.env.POSTGRES_CONNECTION_STRING || process.env.SUPABASE_DB_URL_RO;
    if (!connectionString) {
      throw new Error('POSTGRES_CONNECTION_STRING or SUPABASE_DB_URL_RO not set');
    }
    
    this.client = new Client({ connectionString });
    await this.client.connect();
  }

  async runQuery(sql) {
    if (!this.client) {
      await this.connect();
    }
    
    // Only allow SELECT queries for read-only access
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    try {
      const result = await this.client.query(sql);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) || []
      };
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async close() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}

const server = new PostgresMCPServer();

// Simple MCP protocol handler
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());
    
    if (request.method === 'tools/call' && request.params?.name === 'runQuery') {
      const sql = request.params.arguments?.sql || request.params.arguments?.query;
      if (!sql) {
        throw new Error('SQL query is required');
      }
      
      const result = await server.runQuery(sql);
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        result: result
      }) + '\n');
    } else {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: "Method not found" }
      }) + '\n');
    }
  } catch (error) {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32603, message: error.message }
    }) + '\n');
  }
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});