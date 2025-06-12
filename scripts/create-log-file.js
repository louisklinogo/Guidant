#!/usr/bin/env bun

/**
 * Create Log File Script
 * Generates log files with current timestamps and proper formatting
 */

import { getCurrentDateTime } from './get-current-datetime.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate log filename with current timestamp
 * @param {string} logType - Type of log (e.g., 'backend-feature', 'bug-fix', 'enhancement')
 * @param {string} description - Brief description (e.g., 'phase-transition-engine')
 * @returns {string} Filename with timestamp
 */
function generateLogFilename(logType, description) {
  const dateTime = getCurrentDateTime();
  return `${logType}-${description}-${dateTime.filenameSafe}.md`;
}

/**
 * Generate log file header with current session info
 * @param {string} title - Log title
 * @param {string} sessionType - Type of session (e.g., 'Implementation', 'Bug Fix', 'Analysis')
 * @param {string} agent - Agent name (default: 'Claude Sonnet 4 (Augment Agent)')
 * @returns {string} Formatted header
 */
function generateLogHeader(title, sessionType = 'Implementation', agent = 'Claude Sonnet 4 (Augment Agent)') {
  const dateTime = getCurrentDateTime();
  
  return `# ${title} - ${dateTime.logFormat}

## Session Info
- **Start Time**: ${dateTime.timeOnly}
- **Date**: ${dateTime.dateOnly}
- **Session Type**: ${sessionType}
- **Agent**: ${agent}
- **Timestamp**: ${dateTime.timestamp}

## Executive Summary
[Brief overview of what was accomplished in this session]

`;
}

/**
 * Create a new log file with proper header
 * @param {string} logType - Type of log
 * @param {string} description - Brief description
 * @param {string} title - Full title for the log
 * @param {string} sessionType - Type of session
 * @param {string} initialContent - Initial content after header (optional)
 * @returns {object} Result with filename and path
 */
async function createLogFile(logType, description, title, sessionType = 'Implementation', initialContent = '') {
  try {
    const filename = generateLogFilename(logType, description);
    const filepath = path.join('logs', filename);
    
    // Ensure logs directory exists
    await fs.mkdir('logs', { recursive: true });
    
    // Generate header
    const header = generateLogHeader(title, sessionType);
    
    // Combine header with initial content
    const fullContent = header + initialContent;
    
    // Write file
    await fs.writeFile(filepath, fullContent, 'utf8');
    
    return {
      success: true,
      filename,
      filepath,
      timestamp: getCurrentDateTime().timestamp
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get current session timestamp for existing logs
 * @returns {object} Current session info
 */
function getCurrentSessionInfo() {
  const dateTime = getCurrentDateTime();
  return {
    startTime: dateTime.timeOnly,
    date: dateTime.dateOnly,
    logFormat: dateTime.logFormat,
    filenameSafe: dateTime.filenameSafe,
    humanReadable: dateTime.humanReadable,
    timestamp: dateTime.timestamp
  };
}

// If run directly, show usage examples
if (process.argv[1] && process.argv[1].endsWith('create-log-file.js')) {
  const dateTime = getCurrentDateTime();
  
  console.log('Log File Creation Script');
  console.log('========================');
  console.log(`Current time: ${dateTime.humanReadable}`);
  console.log('');
  console.log('Usage Examples:');
  console.log('');
  console.log('1. Generate filename:');
  console.log(`   ${generateLogFilename('backend-feature', 'new-component')}`);
  console.log('');
  console.log('2. Generate header:');
  console.log('   ```');
  console.log(generateLogHeader('New Feature Implementation', 'Development'));
  console.log('   ```');
  console.log('');
  console.log('3. In JavaScript:');
  console.log('   ```javascript');
  console.log('   import { createLogFile, getCurrentSessionInfo } from "./scripts/create-log-file.js";');
  console.log('   ');
  console.log('   // Create new log file');
  console.log('   const result = await createLogFile(');
  console.log('     "backend-feature",');
  console.log('     "phase-transition-engine", ');
  console.log('     "BACKEND-002 Phase Transition Engine Implementation"');
  console.log('   );');
  console.log('   ');
  console.log('   // Get current session info for manual logs');
  console.log('   const session = getCurrentSessionInfo();');
  console.log('   console.log(`Session started at ${session.startTime}`);');
  console.log('   ```');
}

export { 
  generateLogFilename, 
  generateLogHeader, 
  createLogFile, 
  getCurrentSessionInfo 
};
