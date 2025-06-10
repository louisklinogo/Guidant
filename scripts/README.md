# Guidant Scripts Directory

This directory contains utility scripts for development, logging, and project management.

## 📅 Date/Time Scripts

### `get-current-datetime.js`
**Purpose:** Get current date and time in various formats

**Usage:**
```bash
# Get current date/time info
node scripts/get-current-datetime.js
# or
bun run scripts/get-current-datetime.js
```

**Output:**
```
Current Date and Time Information:
=====================================
ISO Format:        2025-06-09T15:54:18.471Z
Date Only:         2025-06-09
Time Only:         15:54:18
Filename Safe:     2025-06-09-15-54-18
Human Readable:    June 9, 2025 at 3:54:18 PM
Log Format:        2025-06-09 15:54:18
Timestamp:         1749484458471
```

### `log-helper.js` ⭐ **RECOMMENDED FOR MANUAL LOG CREATION**
**Purpose:** Quick utility to get current date/time for creating logs manually

**Usage:**
```bash
# Get formatted date/time for log creation
node scripts/log-helper.js
```

**Output:** Provides ready-to-copy values for:
- Log filenames with timestamps
- Log headers with session info
- Examples for different log types

### `create-log-file.js`
**Purpose:** Programmatically create log files with proper timestamps and headers

**Usage in JavaScript:**
```javascript
import { createLogFile, getCurrentSessionInfo } from './scripts/create-log-file.js';

// Create a new log file
const result = await createLogFile(
  'backend-feature',           // log type
  'new-component',            // description
  'New Component Implementation', // title
  'Development'               // session type
);

console.log(`Created: ${result.filepath}`);

// Get current session info for manual logs
const session = getCurrentSessionInfo();
console.log(`Session started at ${session.startTime}`);
```

## 🔧 **How to Always Use Current Date in Logs**

### **Method 1: Use log-helper.js (Recommended)**
1. Run `node scripts/log-helper.js`
2. Copy the provided values into your log file
3. Use the suggested filename format

### **Method 2: Programmatic Creation**
```javascript
import { createLogFile } from './scripts/create-log-file.js';

const result = await createLogFile(
  'backend-feature',
  'phase-transition-engine',
  'BACKEND-002 Phase Transition Engine Implementation'
);
```

### **Method 3: Manual with Current Date**
1. Run `node scripts/get-current-datetime.js`
2. Use the "Filename Safe" format for your log filename
3. Use the "Log Format" for your session header

## 📝 **Log File Naming Convention**

**Format:** `logs/{type}-{description}-{YYYY-MM-DD-HH-mm-ss}.md`

**Examples:**
- `logs/backend-feature-phase-transition-engine-2025-06-09-15-54-18.md`
- `logs/bug-fix-interface-compatibility-2025-06-09-15-54-18.md`
- `logs/analysis-component-audit-2025-06-09-15-54-18.md`
- `logs/enhancement-performance-optimization-2025-06-09-15-54-18.md`

## 🎯 **Quick Start for Log Creation**

**For any new log file:**

1. **Get current timestamp:**
   ```bash
   node scripts/log-helper.js
   ```

2. **Copy the suggested filename and header format**

3. **Create your log file with the provided template**

**Example workflow:**
```bash
# 1. Get current date/time
$ node scripts/log-helper.js

# 2. Create log file using the suggested format
# logs/your-log-name-2025-06-09-15-54-18.md

# 3. Use the provided header template in your log
```

## 🔄 **Integration with Development Workflow**

**Always run the log helper before creating logs to ensure:**
- ✅ Consistent timestamp formats
- ✅ Proper filename conventions  
- ✅ Accurate session information
- ✅ Easy chronological sorting of logs

**Remember:** The scripts automatically get the current system date/time, so you'll always have accurate timestamps for your development logs.

## 📁 **File Structure**
```
scripts/
├── README.md                 # This file
├── get-current-datetime.js   # Core date/time utility
├── create-log-file.js        # Programmatic log creation
└── log-helper.js            # Manual log creation helper ⭐
```

**⭐ Most commonly used:** `log-helper.js` for manual log creation with current timestamps.
