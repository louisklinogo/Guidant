#!/usr/bin/env tsx

/**
 * Guidant CLI Entry Point
 * AI Agent Workflow Orchestrator with JSX/TSX Support
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root and main CLI path
const projectRoot = join(__dirname, '..');
const mainCLI = join(projectRoot, 'index.js');

try {
  // Read package.json for version info
  const packagePath = join(projectRoot, 'package.json');
  const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));

  // Use tsx to run the main CLI with JSX support
  const tsxProcess = spawn('tsx', [mainCLI, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: projectRoot
  });

  // Handle process exit
  tsxProcess.on('exit', (code) => {
    process.exit(code || 0);
  });

  tsxProcess.on('error', (error) => {
    console.error('❌ Failed to start Guidant with tsx:', error.message);
    console.log('💡 Falling back to Node.js...');

    // Fallback to regular Node.js import
    import(mainCLI).catch((fallbackError) => {
      console.error('❌ Fallback also failed:', fallbackError.message);
      process.exit(1);
    });
  });

} catch (error) {
  console.error('❌ Failed to start Guidant:', error.message);
  process.exit(1);
}
