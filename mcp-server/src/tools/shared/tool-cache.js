/**
 * Tool Caching System for MCP Tools
 * Intelligent caching with TTL, invalidation strategies, and performance monitoring
 * 
 * MCP-008: Tool Caching System Implementation
 */

import { createHash } from 'crypto';
import { watch } from 'fs';
import path from 'path';

/**
 * Cache Entry Structure
 */
class CacheEntry {
  constructor(key, value, ttl = 0, metadata = {}) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = ttl > 0 ? this.createdAt + ttl : 0;
    this.accessCount = 0;
    this.lastAccessed = this.createdAt;
    this.metadata = {
      size: this.calculateSize(value),
      source: 'unknown',
      ...metadata
    };
  }

  /**
   * Check if cache entry is expired
   * @returns {boolean} True if expired
   */
  isExpired() {
    return this.expiresAt > 0 && Date.now() > this.expiresAt;
  }

  /**
   * Check if cache entry is valid
   * @returns {boolean} True if valid (not expired)
   */
  isValid() {
    return !this.isExpired();
  }

  /**
   * Access the cache entry (updates access metrics)
   * @returns {any} Cached value
   */
  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
    return this.value;
  }

  /**
   * Calculate approximate size of cached value
   * @param {any} value - Value to calculate size for
   * @returns {number} Approximate size in bytes
   */
  calculateSize(value) {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 0;
    }
  }

  /**
   * Get cache entry metrics
   * @returns {object} Entry metrics
   */
  getMetrics() {
    return {
      key: this.key,
      size: this.metadata.size,
      age: Date.now() - this.createdAt,
      accessCount: this.accessCount,
      lastAccessed: this.lastAccessed,
      isExpired: this.isExpired(),
      ttl: this.expiresAt > 0 ? this.expiresAt - this.createdAt : 0,
      source: this.metadata.source
    };
  }
}

/**
 * Tool Cache Manager
 * Manages caching for MCP tools with intelligent invalidation and performance monitoring
 */
export class ToolCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.watchers = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      startTime: Date.now()
    };
    
    // Configuration
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.maxEntries = options.maxEntries || 1000;
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes
    this.enableFileWatching = options.enableFileWatching !== false;
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Generate cache key from tool name and parameters
   * @param {string} toolName - Name of the tool
   * @param {object} params - Tool parameters
   * @param {object} options - Caching options
   * @returns {string} Cache key
   */
  generateKey(toolName, params = {}, options = {}) {
    const keyData = {
      tool: toolName,
      params: this.normalizeParams(params),
      version: options.version || '1.0'
    };
    
    const keyString = JSON.stringify(keyData);
    return createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  /**
   * Normalize parameters for consistent cache keys
   * @param {object} params - Parameters to normalize
   * @returns {object} Normalized parameters
   */
  normalizeParams(params) {
    if (!params || typeof params !== 'object') return {};
    
    // Sort keys and remove undefined values
    const normalized = {};
    Object.keys(params)
      .sort()
      .forEach(key => {
        if (params[key] !== undefined) {
          normalized[key] = params[key];
        }
      });
    
    return normalized;
  }

  /**
   * Get cached value
   * @param {string} toolName - Tool name
   * @param {object} params - Tool parameters
   * @param {object} options - Cache options
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(toolName, params = {}, options = {}) {
    const key = this.generateKey(toolName, params, options);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    
    if (entry.isExpired()) {
      this.delete(key);
      this.metrics.misses++;
      return null;
    }
    
    this.metrics.hits++;
    return entry.access();
  }

  /**
   * Set cached value
   * @param {string} toolName - Tool name
   * @param {object} params - Tool parameters
   * @param {any} value - Value to cache
   * @param {object} options - Cache options
   * @returns {string} Cache key
   */
  set(toolName, params = {}, value, options = {}) {
    const key = this.generateKey(toolName, params, options);
    const ttl = options.ttl || this.defaultTTL;
    
    // Create cache entry
    const entry = new CacheEntry(key, value, ttl, {
      source: toolName,
      ...options.metadata
    });
    
    // Check if we need to evict entries
    this.evictIfNeeded(entry.metadata.size);
    
    // Store entry
    this.cache.set(key, entry);
    this.metrics.sets++;
    this.metrics.totalSize += entry.metadata.size;
    
    // Set up file watching if applicable
    if (this.enableFileWatching && options.watchFiles) {
      this.setupFileWatching(key, options.watchFiles);
    }
    
    return key;
  }

  /**
   * Delete cached entry
   * @param {string} key - Cache key
   * @returns {boolean} True if entry was deleted
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.metrics.deletes++;
    this.metrics.totalSize -= entry.metadata.size;
    
    // Clean up file watchers
    this.cleanupFileWatcher(key);
    
    return true;
  }

  /**
   * Clear all cached entries
   */
  clear() {
    const count = this.cache.size;
    this.cache.clear();
    this.metrics.deletes += count;
    this.metrics.totalSize = 0;
    
    // Clean up all file watchers
    this.watchers.forEach((watcher, key) => {
      this.cleanupFileWatcher(key);
    });
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match tool names
   */
  invalidateByPattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache) {
      if (regex.test(entry.metadata.source)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Invalidate cache entries for specific files
   * @param {string|Array} filePaths - File paths that changed
   */
  invalidateByFiles(filePaths) {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache) {
      const watchedFiles = entry.metadata.watchedFiles || [];
      if (watchedFiles.some(file => paths.includes(file))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Setup file watching for cache invalidation
   * @param {string} cacheKey - Cache key
   * @param {Array} filePaths - Files to watch
   */
  setupFileWatching(cacheKey, filePaths) {
    if (!Array.isArray(filePaths)) return;
    
    const watchers = [];
    
    filePaths.forEach(filePath => {
      try {
        const watcher = watch(filePath, (eventType) => {
          if (eventType === 'change') {
            this.delete(cacheKey);
          }
        });
        
        watchers.push(watcher);
      } catch (error) {
        console.warn(`Failed to watch file ${filePath}:`, error.message);
      }
    });
    
    if (watchers.length > 0) {
      this.watchers.set(cacheKey, watchers);
      
      // Store watched files in entry metadata
      const entry = this.cache.get(cacheKey);
      if (entry) {
        entry.metadata.watchedFiles = filePaths;
      }
    }
  }

  /**
   * Cleanup file watcher for cache key
   * @param {string} cacheKey - Cache key
   */
  cleanupFileWatcher(cacheKey) {
    const watchers = this.watchers.get(cacheKey);
    if (watchers) {
      watchers.forEach(watcher => {
        try {
          watcher.close();
        } catch (error) {
          console.warn('Error closing file watcher:', error.message);
        }
      });
      this.watchers.delete(cacheKey);
    }
  }

  /**
   * Evict entries if cache size limits are exceeded
   * @param {number} newEntrySize - Size of new entry being added
   */
  evictIfNeeded(newEntrySize) {
    // Check entry count limit
    while (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }
    
    // Check size limit
    while (this.metrics.totalSize + newEntrySize > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Start cleanup interval for expired entries
   */
  startCleanup() {
    setInterval(() => {
      this.cleanupExpired();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired() {
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const uptime = Date.now() - this.metrics.startTime;
    const hitRate = this.metrics.hits + this.metrics.misses > 0 ? 
      (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 : 0;
    
    return {
      entries: this.cache.size,
      totalSize: this.metrics.totalSize,
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      evictions: this.metrics.evictions,
      uptime,
      watchers: this.watchers.size
    };
  }

  /**
   * Get detailed cache entries information
   * @returns {Array} Array of cache entry metrics
   */
  getEntries() {
    return Array.from(this.cache.values()).map(entry => entry.getMetrics());
  }
}

// Export singleton instance
export const toolCacheManager = new ToolCacheManager();
