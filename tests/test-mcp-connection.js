#!/usr/bin/env node

/**
 * Test MCP connection with Claude
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TaskMaster MCP Server for Claude...');
console.log('📍 Server path:', join(__dirname, 'mcp-server/server.js'));
console.log('\n📋 Configuration for Claude Desktop:');
console.log(JSON.stringify({
  "mcpServers": {
    "taskmaster-evolution": {
      "command": "node",
      "args": [join(__dirname, 'mcp-server/server.js')],
      "env": {}
    }
  }
}, null, 2));

console.log('\n🔧 Add the above config to your Claude Desktop config file');
console.log('📁 Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
console.log('📁 Mac: ~/Library/Application Support/Claude/claude_desktop_config.json');
console.log('\n✅ Then restart Claude Desktop to see TaskMaster tools');

// Start the server
const server = spawn('node', ['mcp-server/server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('close', (code) => {
  console.log(`\n🛑 MCP server exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping MCP server...');
  server.kill();
  process.exit(0);
});
