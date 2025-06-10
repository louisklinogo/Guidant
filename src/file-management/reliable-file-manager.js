/**
 * Reliable File Management System for Guidant Evolution
 * Provides atomic writes, backup/recovery, validation, and error handling
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

/**
 * File operation options
 */
const DEFAULT_OPTIONS = {
  encoding: 'utf8',
  backup: true,
  validate: true,
  retries: 3,
  retryDelay: 100,
  atomic: true
};

/**
 * Reliably write JSON data to file with atomic operations and backup
 */
export async function writeJSONFile(filePath, data, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fullPath = path.resolve(filePath);
  const dir = path.dirname(fullPath);
  const filename = path.basename(fullPath);
  const tempPath = path.join(dir, `.${filename}.tmp`);
  const backupPath = path.join(dir, `.${filename}.backup`);
  
  let attempt = 0;
  
  while (attempt < opts.retries) {
    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      // Validate data if requested
      if (opts.validate) {
        validateJSONData(data, filePath);
      }
      
      // Create backup of existing file
      if (opts.backup && await fileExists(fullPath)) {
        await fs.copyFile(fullPath, backupPath);
      }
      
      // Serialize data
      const jsonContent = JSON.stringify(data, null, 2);
      
      if (opts.atomic) {
        // Atomic write: write to temp file first, then rename
        await fs.writeFile(tempPath, jsonContent, opts.encoding);
        await fs.rename(tempPath, fullPath);
      } else {
        // Direct write
        await fs.writeFile(fullPath, jsonContent, opts.encoding);
      }
      
      // Verify write was successful
      if (opts.validate) {
        await verifyFileWrite(fullPath, data);
      }
      
      return {
        success: true,
        path: fullPath,
        size: jsonContent.length,
        checksum: createHash('md5').update(jsonContent).digest('hex')
      };
      
    } catch (error) {
      attempt++;
      
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      if (attempt >= opts.retries) {
        // Try to restore from backup if available
        if (opts.backup && await fileExists(backupPath)) {
          try {
            await fs.copyFile(backupPath, fullPath);
          } catch (restoreError) {
            // Backup restore failed
          }
        }
        
        return {
          success: false,
          error: error.message,
          path: fullPath,
          attempts: attempt
        };
      }
      
      // Wait before retry
      await sleep(opts.retryDelay * attempt);
    }
  }
}

/**
 * Reliably read JSON data from file with validation and error recovery
 */
export async function readJSONFile(filePath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fullPath = path.resolve(filePath);
  const backupPath = path.join(path.dirname(fullPath), `.${path.basename(fullPath)}.backup`);
  
  let attempt = 0;
  
  while (attempt < opts.retries) {
    try {
      // Check if file exists
      if (!(await fileExists(fullPath))) {
        return {
          success: false,
          error: 'File not found',
          path: fullPath
        };
      }
      
      // Read file content
      const content = await fs.readFile(fullPath, opts.encoding);
      
      // Parse JSON
      const data = JSON.parse(content);
      
      // Validate if requested
      if (opts.validate) {
        validateJSONData(data, filePath);
      }
      
      return {
        success: true,
        data,
        path: fullPath,
        size: content.length,
        checksum: createHash('md5').update(content).digest('hex')
      };
      
    } catch (error) {
      attempt++;
      
      if (attempt >= opts.retries) {
        // Try to restore from backup
        if (opts.backup && await fileExists(backupPath)) {
          try {
            const backupContent = await fs.readFile(backupPath, opts.encoding);
            const backupData = JSON.parse(backupContent);
            
            // Restore from backup
            await fs.copyFile(backupPath, fullPath);
            
            return {
              success: true,
              data: backupData,
              path: fullPath,
              restoredFromBackup: true,
              originalError: error.message
            };
          } catch (backupError) {
            return {
              success: false,
              error: error.message,
              backupError: backupError.message,
              path: fullPath,
              attempts: attempt
            };
          }
        }
        
        return {
          success: false,
          error: error.message,
          path: fullPath,
          attempts: attempt
        };
      }
      
      // Wait before retry
      await sleep(opts.retryDelay * attempt);
    }
  }
}

/**
 * Safely update JSON file with merge operation
 */
export async function updateJSONFile(filePath, updateFn, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Read current data
    const readResult = await readJSONFile(filePath, opts);
    
    let currentData = {};
    if (readResult.success) {
      currentData = readResult.data;
    } else if (readResult.error !== 'File not found') {
      return readResult; // Return read error
    }
    
    // Apply update function
    const updatedData = await updateFn(currentData);
    
    // Write updated data
    return await writeJSONFile(filePath, updatedData, opts);
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: filePath
    };
  }
}

/**
 * Create a file lock to prevent concurrent access
 */
export async function withFileLock(filePath, operation, timeout = 5000) {
  const lockPath = `${filePath}.lock`;
  const lockStartTime = Date.now();
  
  // Wait for existing lock to be released
  while (await fileExists(lockPath)) {
    if (Date.now() - lockStartTime > timeout) {
      throw new Error(`File lock timeout for ${filePath}`);
    }
    await sleep(50);
  }
  
  try {
    // Create lock file
    await fs.writeFile(lockPath, JSON.stringify({
      pid: process.pid,
      timestamp: new Date().toISOString()
    }));
    
    // Execute operation
    const result = await operation();
    
    return result;
    
  } finally {
    // Always remove lock file
    try {
      await fs.unlink(lockPath);
    } catch {}
  }
}

/**
 * Validate JSON data structure
 */
function validateJSONData(data, filePath) {
  if (data === null || data === undefined) {
    throw new Error(`Invalid data: null or undefined for ${filePath}`);
  }
  
  // Check for circular references
  try {
    JSON.stringify(data);
  } catch (error) {
    throw new Error(`Invalid JSON data for ${filePath}: ${error.message}`);
  }
  
  // Basic structure validation based on file type
  const filename = path.basename(filePath);
  
  if (filename.includes('config') && typeof data !== 'object') {
    throw new Error(`Config file must be an object: ${filePath}`);
  }
  
  if (filename.includes('sessions') && !Array.isArray(data)) {
    throw new Error(`Sessions file must be an array: ${filePath}`);
  }
  
  if (filename.includes('decisions') && !Array.isArray(data)) {
    throw new Error(`Decisions file must be an array: ${filePath}`);
  }
}

/**
 * Verify that file was written correctly
 */
async function verifyFileWrite(filePath, originalData) {
  const readResult = await readJSONFile(filePath, { validate: false, backup: false });
  
  if (!readResult.success) {
    throw new Error(`File verification failed: ${readResult.error}`);
  }
  
  // Compare data (basic check)
  const originalJson = JSON.stringify(originalData);
  const readJson = JSON.stringify(readResult.data);
  
  if (originalJson !== readJson) {
    throw new Error('File verification failed: data mismatch');
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get file statistics and health info
 */
export async function getFileHealth(filePath) {
  const fullPath = path.resolve(filePath);
  const backupPath = path.join(path.dirname(fullPath), `.${path.basename(fullPath)}.backup`);
  
  try {
    const stats = await fs.stat(fullPath);
    const hasBackup = await fileExists(backupPath);
    
    let backupStats = null;
    if (hasBackup) {
      backupStats = await fs.stat(backupPath);
    }
    
    // Try to read and validate the file
    const readResult = await readJSONFile(fullPath, { validate: true, backup: false });
    
    return {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
      hasBackup,
      backupAge: hasBackup ? Date.now() - backupStats.mtime.getTime() : null,
      isValid: readResult.success,
      validationError: readResult.success ? null : readResult.error,
      checksum: readResult.success ? readResult.checksum : null
    };
    
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Repair corrupted file from backup
 */
export async function repairFileFromBackup(filePath) {
  const fullPath = path.resolve(filePath);
  const backupPath = path.join(path.dirname(fullPath), `.${path.basename(fullPath)}.backup`);
  
  try {
    if (!(await fileExists(backupPath))) {
      return {
        success: false,
        error: 'No backup file available'
      };
    }
    
    // Validate backup file
    const backupResult = await readJSONFile(backupPath, { validate: true, backup: false });
    
    if (!backupResult.success) {
      return {
        success: false,
        error: `Backup file is also corrupted: ${backupResult.error}`
      };
    }
    
    // Restore from backup
    await fs.copyFile(backupPath, fullPath);
    
    return {
      success: true,
      message: 'File restored from backup',
      data: backupResult.data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
