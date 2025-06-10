#!/usr/bin/env node

/**
 * Log Helper Script
 * Quick utility for getting current date/time info for manual log creation
 * Use this when creating logs manually to ensure consistent timestamps
 */

import { getCurrentDateTime } from './get-current-datetime.js';
import { getCurrentSessionInfo } from './create-log-file.js';

// Get current date/time information
const dateTime = getCurrentDateTime();
const session = getCurrentSessionInfo();

console.log('='.repeat(60));
console.log('📅 CURRENT DATE/TIME FOR LOG CREATION');
console.log('='.repeat(60));
console.log('');
console.log('📋 **Copy these values for your log:**');
console.log('');
console.log(`**Date:** ${dateTime.dateOnly}`);
console.log(`**Time:** ${dateTime.timeOnly}`);
console.log(`**Filename suffix:** ${dateTime.filenameSafe}`);
console.log(`**Human readable:** ${dateTime.humanReadable}`);
console.log('');
console.log('🔧 **For log filenames:**');
console.log(`logs/your-log-name-${dateTime.filenameSafe}.md`);
console.log('');
console.log('📝 **For log headers:**');
console.log(`# Your Log Title - ${dateTime.logFormat}`);
console.log('');
console.log('## Session Info');
console.log(`- **Start Time**: ${dateTime.timeOnly}`);
console.log(`- **Date**: ${dateTime.dateOnly}`);
console.log('- **Session Type**: [Implementation/Analysis/Bug Fix/etc.]');
console.log('- **Agent**: Claude Sonnet 4 (Augment Agent)');
console.log(`- **Timestamp**: ${dateTime.timestamp}`);
console.log('');
console.log('='.repeat(60));
console.log('💡 **Quick Examples:**');
console.log('='.repeat(60));
console.log('');
console.log('**Backend Feature Log:**');
console.log(`logs/backend-feature-new-component-${dateTime.filenameSafe}.md`);
console.log('');
console.log('**Bug Fix Log:**');
console.log(`logs/bug-fix-issue-description-${dateTime.filenameSafe}.md`);
console.log('');
console.log('**Analysis Log:**');
console.log(`logs/analysis-component-audit-${dateTime.filenameSafe}.md`);
console.log('');
console.log('**Enhancement Log:**');
console.log(`logs/enhancement-performance-optimization-${dateTime.filenameSafe}.md`);
console.log('');
console.log('='.repeat(60));

export { dateTime, session };
