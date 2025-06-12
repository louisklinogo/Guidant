/**
 * MCP Configuration Generator
 * Generates portable MCP server configurations for different environments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Configuration Generator Class
 */
export class MCPConfigGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.serverPath = this.resolveServerPath();
  }

  /**
   * Resolve MCP server path relative to project
   */
  resolveServerPath() {
    // Try to find the server relative to project root
    const possiblePaths = [
      path.join(this.projectRoot, 'mcp-server', 'server.js'),
      path.join(this.projectRoot, 'mcp-server', 'index.js'),
      path.join(this.projectRoot, 'server.js'),
      // Fallback to relative path
      './mcp-server/server.js'
    ];

    for (const serverPath of possiblePaths) {
      if (fs.existsSync(serverPath)) {
        return path.relative(process.cwd(), serverPath);
      }
    }

    // Return relative path as fallback
    return './mcp-server/server.js';
  }

  /**
   * Generate MCP configuration for Claude Desktop
   */
  generateClaudeConfig(options = {}) {
    const {
      serverName = 'guidant',
      useNode = true,
      environment = {}
    } = options;

    const command = useNode ? 'node' : 'bun';
    
    return {
      mcpServers: {
        [serverName]: {
          command,
          args: [this.serverPath],
          env: {
            // Default environment variables
            NODE_ENV: process.env.NODE_ENV || 'development',
            GUIDANT_DEBUG: process.env.GUIDANT_DEBUG || 'false',
            // User-provided environment
            ...environment
          }
        }
      }
    };
  }

  /**
   * Generate MCP configuration for VS Code
   */
  generateVSCodeConfig(options = {}) {
    const {
      serverName = 'guidant',
      useNode = true
    } = options;

    const command = useNode ? 'node' : 'bun';

    return {
      "mcp.servers": {
        [serverName]: {
          "command": command,
          "args": [this.serverPath],
          "cwd": this.projectRoot,
          "env": {
            "NODE_ENV": process.env.NODE_ENV || 'development'
          }
        }
      }
    };
  }

  /**
   * Generate development configuration with hot reload
   */
  generateDevConfig(options = {}) {
    const {
      serverName = 'guidant-evolution-dev',
      watchMode = true
    } = options;

    const args = watchMode 
      ? ['--watch', this.serverPath]
      : [this.serverPath];

    return {
      mcpServers: {
        [serverName]: {
          command: 'node',
          args,
          env: {
            NODE_ENV: 'development',
            GUIDANT_DEBUG: 'true',
            GUIDANT_LOG_LEVEL: 'debug'
          }
        }
      }
    };
  }

  /**
   * Generate production configuration
   */
  generateProductionConfig(options = {}) {
    const {
      serverName = 'guidant-evolution',
      useNode = true,
      timeout = 120000
    } = options;

    const command = useNode ? 'node' : 'bun';

    return {
      mcpServers: {
        [serverName]: {
          command,
          args: [this.serverPath],
          env: {
            NODE_ENV: 'production',
            GUIDANT_DEBUG: 'false',
            GUIDANT_LOG_LEVEL: 'error'
          },
          timeout
        }
      }
    };
  }

  /**
   * Save configuration to file
   */
  saveConfig(config, filePath, options = {}) {
    const {
      createBackup = true,
      format = 'json'
    } = options;

    try {
      // Create backup if file exists
      if (createBackup && fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`📋 Backup created: ${backupPath}`);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write configuration
      const content = format === 'json' 
        ? JSON.stringify(config, null, 2)
        : config;

      fs.writeFileSync(filePath, content);
      console.log(`✅ MCP configuration saved: ${filePath}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to save MCP configuration: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate and save Claude Desktop configuration
   */
  setupClaudeDesktop(options = {}) {
    const config = this.generateClaudeConfig(options);
    
    // Determine Claude config path based on OS
    const configPath = this.getClaudeConfigPath();
    
    if (!configPath) {
      console.error('❌ Could not determine Claude Desktop config path');
      return false;
    }

    return this.saveConfig(config, configPath, options);
  }

  /**
   * Get Claude Desktop configuration path based on OS
   */
  getClaudeConfigPath() {
    const platform = process.platform;
    const home = process.env.HOME || process.env.USERPROFILE;

    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
      case 'darwin':
        return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      case 'linux':
        return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
      default:
        return null;
    }
  }

  /**
   * Validate MCP configuration
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    if (!config.mcpServers) {
      errors.push('Missing mcpServers configuration');
      return { valid: false, errors, warnings };
    }

    Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
      if (!serverConfig.command) {
        errors.push(`Server "${name}" missing command`);
      }

      if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
        errors.push(`Server "${name}" missing or invalid args`);
      }

      // Check for absolute paths
      if (serverConfig.args) {
        serverConfig.args.forEach(arg => {
          if (path.isAbsolute(arg) && !fs.existsSync(arg)) {
            warnings.push(`Server "${name}" uses absolute path that may not exist: ${arg}`);
          }
        });
      }

      // Check for hardcoded environment-specific values
      if (serverConfig.env) {
        Object.entries(serverConfig.env).forEach(([key, value]) => {
          if (typeof value === 'string' && value.includes('/Users/') || value.includes('C:\\')) {
            warnings.push(`Server "${name}" environment variable "${key}" contains hardcoded path`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate installation instructions
   */
  generateInstructions(configType = 'claude') {
    const instructions = [];

    instructions.push('🚀 Guidant MCP Server Setup Instructions\n');

    if (configType === 'claude') {
      instructions.push('📋 Claude Desktop Setup:');
      instructions.push('1. Close Claude Desktop if it\'s running');
      instructions.push('2. Run: guidant mcp setup-claude');
      instructions.push('3. Restart Claude Desktop');
      instructions.push('4. Look for Guidant tools in Claude\'s tool list\n');
    }

    instructions.push('🔧 Manual Setup:');
    instructions.push('1. Copy the generated configuration');
    instructions.push('2. Add it to your MCP client configuration');
    instructions.push('3. Restart your MCP client');
    instructions.push('4. Verify the connection\n');

    instructions.push('🐛 Troubleshooting:');
    instructions.push('- Check that the server path exists');
    instructions.push('- Verify Node.js/Bun is installed');
    instructions.push('- Check environment variables');
    instructions.push('- Review server logs for errors');

    return instructions.join('\n');
  }

  /**
   * Test MCP server connection
   */
  async testConnection() {
    try {
      console.log('🧪 Testing MCP server connection...');
      
      // Import and start server for testing
      const { spawn } = await import('child_process');
      
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          serverProcess.kill();
          resolve({ success: false, error: 'Connection timeout' });
        }, 5000);

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });

        serverProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('MCP server is running')) {
            clearTimeout(timeout);
            serverProcess.kill();
            resolve({ success: true });
          }
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Quick setup function
 */
export function setupMCPConfig(type = 'claude', options = {}) {
  const generator = new MCPConfigGenerator();
  
  switch (type) {
    case 'claude':
      return generator.setupClaudeDesktop(options);
    case 'dev':
      const devConfig = generator.generateDevConfig(options);
      return generator.saveConfig(devConfig, './mcp-dev-config.json', options);
    case 'production':
      const prodConfig = generator.generateProductionConfig(options);
      return generator.saveConfig(prodConfig, './mcp-production-config.json', options);
    default:
      throw new Error(`Unknown MCP config type: ${type}`);
  }
}

export default MCPConfigGenerator;
