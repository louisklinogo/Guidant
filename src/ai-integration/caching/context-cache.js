/**
 * Context Cache Implementation
 * Implements IContextCache interface with Map-based caching and TTL
 * Follows the same pattern as PhaseTransitionEngine caching
 */

import { IContextCache } from '../interfaces/context-interfaces.js';
import crypto from 'crypto';

export class ContextCache extends IContextCache {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 15 * 60 * 1000; // 15 minutes
    this.maxEntries = options.maxEntries || 100;
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      cleanups: 0
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get cached context if available and not expired
   */
  async get(cacheKey) {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    // Update access time for LRU-style eviction
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Store context in cache with TTL
   */
  async set(cacheKey, context, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictOldestEntries();
    }

    const entry = {
      data: context,
      createdAt: Date.now(),
      expiresAt,
      lastAccessed: Date.now(),
      size: this.estimateSize(context)
    };

    this.cache.set(cacheKey, entry);
    this.stats.sets++;
  }

  /**
   * Clear specific cache entry
   */
  async clear(cacheKey) {
    const deleted = this.cache.delete(cacheKey);
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  async clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Cleared ${size} cache entries`);
  }

  /**
   * Generate cache key for context request
   */
  generateCacheKey(projectRoot, phase, deliverable, options = {}) {
    // Create a deterministic key from the inputs
    const keyData = {
      projectRoot: projectRoot.replace(/\\/g, '/'), // Normalize path separators
      phase,
      deliverable,
      provider: options.provider || 'default',
      role: options.role || 'default',
      templateType: options.templateType || 'task_generation',
      // Include relevant options that affect context generation
      includeAI: options.includeAIInsights !== false,
      optimization: options.optimizationStrategy || 'priority_based'
    };

    // Create hash of the key data for consistent, short keys
    const keyString = JSON.stringify(keyData);
    const hash = crypto.createHash('md5').update(keyString).digest('hex');
    
    return `ctx_${hash}`;
  }

  /**
   * Evict oldest entries when cache is full
   */
  evictOldestEntries() {
    const entriesToEvict = Math.ceil(this.maxEntries * 0.1); // Evict 10% of entries
    
    // Sort entries by last accessed time (oldest first)
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove oldest entries
    for (let i = 0; i < entriesToEvict && i < sortedEntries.length; i++) {
      const [key] = sortedEntries[i];
      this.cache.delete(key);
      this.stats.evictions++;
    }

    console.log(`Evicted ${entriesToEvict} cache entries`);
  }

  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      this.stats.cleanups++;
    }

    return cleanedCount;
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cleanupInterval);

    // Ensure timer doesn't keep process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Estimate size of cached data (for monitoring)
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      currentEntries: this.cache.size,
      maxEntries: this.maxEntries,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length + (entry.size || 0);
    }

    return {
      totalBytes: totalSize,
      totalKB: Math.round(totalSize / 1024),
      averageEntrySize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0
    };
  }

  /**
   * Warm up cache with common context requests
   */
  async warmupCache(projectRoot, commonRequests = []) {
    console.log('Warming up context cache...');
    
    const defaultRequests = [
      { phase: 'requirements', deliverable: 'prd_complete' },
      { phase: 'design', deliverable: 'wireframes' },
      { phase: 'architecture', deliverable: 'system_design' },
      { phase: 'implementation', deliverable: 'core_features' }
    ];

    const requests = commonRequests.length > 0 ? commonRequests : defaultRequests;
    
    for (const request of requests) {
      try {
        const cacheKey = this.generateCacheKey(
          projectRoot, 
          request.phase, 
          request.deliverable, 
          request.options || {}
        );
        
        // Check if already cached
        const existing = await this.get(cacheKey);
        if (!existing) {
          // Pre-generate context for common requests
          // This would typically be called by the orchestrator
          console.log(`Pre-warming cache for ${request.phase}/${request.deliverable}`);
        }
      } catch (error) {
        console.warn(`Failed to warm up cache for ${request.phase}/${request.deliverable}:`, error.message);
      }
    }
  }

  /**
   * Export cache contents for debugging
   */
  exportCache() {
    const entries = [];
    
    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        lastAccessed: new Date(entry.lastAccessed).toISOString(),
        size: entry.size,
        expired: Date.now() > entry.expiresAt
      });
    }

    return {
      entries,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Validate cache integrity
   */
  validateCache() {
    const issues = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      // Check for corrupted entries
      if (!entry.data || !entry.createdAt || !entry.expiresAt) {
        issues.push(`Corrupted entry: ${key}`);
        continue;
      }

      // Check for invalid timestamps
      if (entry.createdAt > now || entry.expiresAt < entry.createdAt) {
        issues.push(`Invalid timestamps for entry: ${key}`);
      }

      // Check for oversized entries
      if (entry.size && entry.size > 1024 * 1024) { // 1MB
        issues.push(`Oversized entry: ${key} (${entry.size} bytes)`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      checkedEntries: this.cache.size,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Cleanup resources when shutting down
   */
  destroy() {
    this.stopCleanupTimer();
    this.clearAll();
    console.log('Context cache destroyed');
  }
}
