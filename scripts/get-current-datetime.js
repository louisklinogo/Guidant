#!/usr/bin/env node

/**
 * Get Current Date and Time Script
 * Provides current date/time in various formats for logging and file naming
 */

function getCurrentDateTime() {
  const now = new Date();
  
  // ISO format: 2025-01-29T15:30:45.123Z
  const iso = now.toISOString();
  
  // Date only: 2025-01-29
  const dateOnly = iso.split('T')[0];
  
  // Time only: 15:30:45
  const timeOnly = iso.split('T')[1].split('.')[0];
  
  // Filename safe format: 2025-01-29-15-30-45
  const filenameSafe = `${dateOnly}-${timeOnly.replace(/:/g, '-')}`;
  
  // Human readable: January 29, 2025 at 3:30:45 PM
  const humanReadable = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Short format for logs: 2025-01-29 15:30:45
  const logFormat = `${dateOnly} ${timeOnly}`;
  
  return {
    iso,
    dateOnly,
    timeOnly,
    filenameSafe,
    humanReadable,
    logFormat,
    timestamp: now.getTime()
  };
}

// If run directly (not imported), output the current date/time
if (process.argv[1] && process.argv[1].endsWith('get-current-datetime.js')) {
  const dateTime = getCurrentDateTime();
  
  console.log('Current Date and Time Information:');
  console.log('=====================================');
  console.log(`ISO Format:        ${dateTime.iso}`);
  console.log(`Date Only:         ${dateTime.dateOnly}`);
  console.log(`Time Only:         ${dateTime.timeOnly}`);
  console.log(`Filename Safe:     ${dateTime.filenameSafe}`);
  console.log(`Human Readable:    ${dateTime.humanReadable}`);
  console.log(`Log Format:        ${dateTime.logFormat}`);
  console.log(`Timestamp:         ${dateTime.timestamp}`);
  console.log('');
  console.log('Usage Examples:');
  console.log('=====================================');
  console.log(`Log filename:      logs/feature-name-${dateTime.filenameSafe}.md`);
  console.log(`Session header:    ## Session Info - ${dateTime.logFormat}`);
  console.log(`Human date:        Started on ${dateTime.humanReadable}`);
}

export { getCurrentDateTime };
