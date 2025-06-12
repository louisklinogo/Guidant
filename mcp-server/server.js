#!/usr/bin/env bun

import GuidantEvolutionServer from './src/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Start the MCP server for Guidant Evolution
 */
async function startServer() {
	console.log('🚀 Starting Guidant Evolution MCP Server...');
	console.log('🏃‍♂️ Runtime: Bun');

	const server = new GuidantEvolutionServer();

	// Handle graceful shutdown
	process.on('SIGINT', async () => {
		console.log('\n🛑 Received SIGINT, shutting down gracefully...');
		await server.stop();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
		await server.stop();
		process.exit(0);
	});

	try {
		await server.start();
	} catch (error) {
		console.error(`❌ Failed to start MCP server: ${error.message}`);
		if (process.env.DEBUG) {
			console.error('🐛 Full error stack:', error.stack);
		}
		process.exit(1);
	}
}

// Start the server
startServer();
