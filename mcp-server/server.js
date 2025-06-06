#!/usr/bin/env node

import TaskMasterEvolutionServer from './src/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Start the MCP server for TaskMaster Evolution
 */
async function startServer() {
	const server = new TaskMasterEvolutionServer();

	// Handle graceful shutdown
	process.on('SIGINT', async () => {
		await server.stop();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		await server.stop();
		process.exit(0);
	});

	try {
		await server.start();
	} catch (error) {
		console.error(`Failed to start MCP server: ${error.message}`);
		process.exit(1);
	}
}

// Start the server
startServer();
