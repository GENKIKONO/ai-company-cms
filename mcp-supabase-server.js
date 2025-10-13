#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createClient } = require('@supabase/supabase-js');

class SupabaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'query',
          description: 'Execute SQL query on Supabase database',
          inputSchema: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
                description: 'SQL query to execute',
              },
            },
            required: ['sql'],
          },
        },
        {
          name: 'table_info',
          description: 'Get table schema information',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Name of the table to inspect',
              },
            },
            required: ['table_name'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'query') {
        try {
          const { data, error } = await this.supabase.rpc('exec_sql', {
            query: args.sql
          });

          if (error) {
            return {
              content: [{
                type: 'text',
                text: `Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'None'}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }]
          };
        } catch (e) {
          return {
            content: [{
              type: 'text',
              text: `Exception: ${e.message}`
            }]
          };
        }
      }

      if (name === 'table_info') {
        try {
          const { data, error } = await this.supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', args.table_name)
            .eq('table_schema', 'public')
            .order('ordinal_position');

          if (error) {
            return {
              content: [{
                type: 'text',
                text: `Error getting table info: ${error.message}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }]
          };
        } catch (e) {
          return {
            content: [{
              type: 'text',
              text: `Exception getting table info: ${e.message}`
            }]
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP server running on stdio');
  }
}

const server = new SupabaseMCPServer();
server.run().catch(console.error);