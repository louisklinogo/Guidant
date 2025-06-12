import { FastMCP } from 'fastmcp';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerAllGuidantTools } from './tools/index.js';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Guidant Evolution MCP Server
 * Provides AI coordination tools for systematic software development
 */
class GuidantEvolutionServer {
	constructor() {
		// Get version from package.json
		const packagePath = path.join(__dirname, '../../package.json');
		const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

		this.options = {
			name: 'Guidant Evolution',
			version: packageJson.version,
			description: 'AI Agent Workflow Framework for systematic software development'
		};

		this.server = new FastMCP(this.options);
		this.initialized = false;

		// Bind methods
		this.init = this.init.bind(this);
		this.start = this.start.bind(this);
		this.stop = this.stop.bind(this);
	}

	/**
	 * Initialize the MCP server with AI coordination tools
	 */
	async init() {
		if (this.initialized) {
			console.log('🔄 MCP server already initialized');
			return;
		}

		console.log('🚀 Initializing Guidant Evolution MCP server...');

		// Register all Guidant tools (modular architecture)
		console.log('📋 Registering MCP tools...');
		registerAllGuidantTools(this.server);

		this.initialized = true;
		console.log('✅ MCP server initialization complete');
		return this;
	}

	/**
	 * Start the MCP server
	 */
	async start() {
		console.log('🌟 Starting Guidant Evolution MCP server...');

		if (!this.initialized) {
			await this.init();
		}

		console.log('🔌 Starting FastMCP server with stdio transport...');

		// Start the FastMCP server
		await this.server.start({
			transportType: 'stdio',
			timeout: 120000 // 2 minutes timeout
		});

		console.log('🎯 MCP server is running and ready for connections!');
		console.log('📡 Transport: stdio');
		console.log('⏱️  Timeout: 2 minutes');

		return this;
	}

	/**
	 * Stop the MCP server
	 */
	async stop() {
		if (this.server) {
			await this.server.stop();
		}
		return this;
	}
}

export default GuidantEvolutionServer;
