import { FastMCP } from 'fastmcp';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerAICoordinationTools } from './tools/ai-coordination.js';

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
		if (this.initialized) return;

		// Register AI coordination tools
		registerAICoordinationTools(this.server);

		this.initialized = true;
		return this;
	}

	/**
	 * Start the MCP server
	 */
	async start() {
		if (!this.initialized) {
			await this.init();
		}

		// Start the FastMCP server
		await this.server.start({
			transportType: 'stdio',
			timeout: 120000 // 2 minutes timeout
		});

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
