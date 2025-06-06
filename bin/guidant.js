#!/usr/bin/env node

/**
 * Guidant CLI Entry Point
 * AI Agent Workflow Orchestrator
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the main CLI from the project root
const projectRoot = join(__dirname, '..');
const mainCLI = join(projectRoot, 'index.js');

try {
  // Read package.json for version info
  const packagePath = join(projectRoot, 'package.json');
  const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  console.log(`🎯 Guidant v${packageInfo.version}`);
  console.log('AI Agent Workflow Orchestrator\n');
  
  // Dynamic import of the main CLI
  const { default: mainModule } = await import(mainCLI);
  
} catch (error) {
  console.error('❌ Failed to start Guidant:', error.message);
  process.exit(1);
}
