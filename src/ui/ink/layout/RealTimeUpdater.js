/**
 * Real-time Updater
 * Enhanced file watching and state management for Dynamic Terminal Layout System
 * 
 * Provides debounced updates, selective pane updates, memory management,
 * and error recovery with health monitoring.
 */

import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';

/**
 * File watcher configuration mapping file paths to target panes
 */
export const WATCH_CONFIG = {
  // Progress Pane Updates
  '.guidant/workflow/current-phase.json': ['progress'],
  '.guidant/workflow/phases/': ['progress'],
  '.guidant/project/config.json': ['progress', 'all'],
  
  // Tasks Pane Updates
  '.guidant/ai/task-tickets/': ['tasks'],
  '.guidant/context/current-task.json': ['tasks'],
  
  // Capabilities Pane Updates
  '.guidant/ai/capabilities.json': ['capabilities'],
  '.guidant/ai/agents/': ['capabilities'],
  
  // Logs Pane Updates (All MCP activity)
  '.guidant/context/sessions.json': ['logs'],
  '.guidant/context/decisions.json': ['logs'],
  
  // Global Updates (All panes)
  '.guidant/project/': ['all']
};

/**
 * Update priority levels for different file types
 */
export const UPDATE_PRIORITIES = {
  high: ['current-phase.json', 'current-task.json'],
  medium: ['capabilities.json', 'sessions.json'],
  low: ['decisions.json', 'config.json']
};

/**
 * File change event types
 */
export const CHANGE_TYPES = {
  ADD: 'add',
  CHANGE: 'change',
  UNLINK: 'unlink',
  ADD_DIR: 'addDir',
  UNLINK_DIR: 'unlinkDir'
};

/**
 * Real-time Updater Class
 * Manages file system watching and coordinated pane updates
 */
export class RealTimeUpdater extends EventEmitter {
  constructor(paneManager, options = {}) {
    super();
    
    this.paneManager = paneManager;
    this.options = {
      debounceMs: 100,
      maxConcurrentUpdates: 3,
      healthCheckInterval: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };
    
    // State management
    this.watchers = new Map();
    this.updateQueue = [];
    this.updateTimer = null;
    this.activeUpdates = new Set();
    this.projectRoot = process.cwd();
    
    // Health monitoring
    this.health = {
      watchersActive: 0,
      totalUpdates: 0,
      failedUpdates: 0,
      lastHealthCheck: new Date(),
      errors: []
    };
    
    // Performance metrics
    this.metrics = {
      averageUpdateLatency: 0,
      totalFileChanges: 0,
      updateBatchSize: 0,
      memoryUsage: 0
    };
    
    this.healthCheckTimer = null;
  }

  /**
   * Initialize file watchers for the project
   */
  async initialize(projectRoot = null) {
    if (projectRoot) {
      this.projectRoot = projectRoot;
    }
    
    try {
      // Verify project structure exists
      await this.verifyProjectStructure();
      
      // Set up file watchers
      await this.setupWatchers();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.emit('initialized', { 
        projectRoot: this.projectRoot,
        watchersCount: this.watchers.size 
      });
      
      return true;
      
    } catch (error) {
      this.emit('initializationError', { error: error.message });
      return false;
    }
  }

  /**
   * Verify that required project directories exist
   */
  async verifyProjectStructure() {
    const requiredPaths = [
      '.guidant',
      '.guidant/workflow',
      '.guidant/ai',
      '.guidant/context',
      '.guidant/project'
    ];
    
    for (const relativePath of requiredPaths) {
      const fullPath = path.join(this.projectRoot, relativePath);
      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`Required directory not found: ${relativePath}`);
      }
    }
  }

  /**
   * Set up file system watchers
   */
  async setupWatchers() {
    for (const [watchPath, targetPanes] of Object.entries(WATCH_CONFIG)) {
      await this.createWatcher(watchPath, targetPanes);
    }
  }

  /**
   * Create individual file watcher
   */
  async createWatcher(relativePath, targetPanes) {
    const fullPath = path.join(this.projectRoot, relativePath);
    
    try {
      // Check if path exists before watching
      try {
        await fs.access(fullPath);
      } catch (error) {
        // Path doesn't exist yet, create watcher anyway for future files
        console.warn(`Watch path doesn't exist yet: ${relativePath}`);
      }
      
      const watcher = chokidar.watch(fullPath, {
        ignoreInitial: true,
        persistent: true,
        followSymlinks: false,
        depth: relativePath.endsWith('/') ? 2 : 0, // Limit depth for directories
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });
      
      // Set up event handlers
      watcher
        .on('add', (filePath) => this.handleFileChange(CHANGE_TYPES.ADD, filePath, targetPanes))
        .on('change', (filePath) => this.handleFileChange(CHANGE_TYPES.CHANGE, filePath, targetPanes))
        .on('unlink', (filePath) => this.handleFileChange(CHANGE_TYPES.UNLINK, filePath, targetPanes))
        .on('addDir', (dirPath) => this.handleFileChange(CHANGE_TYPES.ADD_DIR, dirPath, targetPanes))
        .on('unlinkDir', (dirPath) => this.handleFileChange(CHANGE_TYPES.UNLINK_DIR, dirPath, targetPanes))
        .on('error', (error) => this.handleWatcherError(relativePath, error));
      
      this.watchers.set(relativePath, {
        watcher,
        targetPanes,
        fullPath,
        active: true,
        errorCount: 0
      });
      
      this.health.watchersActive++;
      
    } catch (error) {
      console.error(`Failed to create watcher for ${relativePath}:`, error);
      this.health.errors.push({
        type: 'watcher_creation_failed',
        path: relativePath,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle file system changes
   */
  handleFileChange(changeType, filePath, targetPanes) {
    const startTime = performance.now();
    this.metrics.totalFileChanges++;
    
    // Determine update priority
    const priority = this.getUpdatePriority(filePath);
    
    // Create update event
    const updateEvent = {
      changeType,
      filePath,
      targetPanes: [...targetPanes], // Clone array
      priority,
      timestamp: Date.now(),
      startTime
    };
    
    // Queue update with debouncing
    this.queueUpdate(updateEvent);
    
    this.emit('fileChange', updateEvent);
  }

  /**
   * Determine update priority based on file path
   */
  getUpdatePriority(filePath) {
    const fileName = path.basename(filePath);
    
    for (const [priority, patterns] of Object.entries(UPDATE_PRIORITIES)) {
      if (patterns.some(pattern => fileName.includes(pattern))) {
        return priority;
      }
    }
    
    return 'low';
  }

  /**
   * Queue update with debouncing
   */
  queueUpdate(updateEvent) {
    // Add to queue
    this.updateQueue.push(updateEvent);
    
    // Clear existing timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    // Set debounced timer
    this.updateTimer = setTimeout(() => {
      this.processUpdateQueue();
    }, this.options.debounceMs);
  }

  /**
   * Process queued updates
   */
  async processUpdateQueue() {
    if (this.updateQueue.length === 0) {
      return;
    }
    
    const startTime = performance.now();
    const queueSnapshot = [...this.updateQueue];
    this.updateQueue = [];
    
    try {
      // Group updates by target panes and priority
      const groupedUpdates = this.groupUpdates(queueSnapshot);
      
      // Process updates in priority order
      await this.processGroupedUpdates(groupedUpdates);
      
      // Update metrics
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, queueSnapshot.length);
      
      this.emit('updateBatchComplete', {
        updatesProcessed: queueSnapshot.length,
        latency,
        timestamp: new Date()
      });
      
    } catch (error) {
      this.health.failedUpdates++;
      this.emit('updateBatchError', { error: error.message, queueSize: queueSnapshot.length });
    }
  }

  /**
   * Group updates by target panes and priority
   */
  groupUpdates(updates) {
    const grouped = {
      high: new Map(),
      medium: new Map(),
      low: new Map()
    };
    
    for (const update of updates) {
      const priorityGroup = grouped[update.priority];
      
      for (const paneId of update.targetPanes) {
        if (paneId === 'all') {
          // Special handling for global updates
          const allPanes = Array.from(this.paneManager.panes.keys());
          for (const allPaneId of allPanes) {
            if (!priorityGroup.has(allPaneId)) {
              priorityGroup.set(allPaneId, []);
            }
            priorityGroup.get(allPaneId).push(update);
          }
        } else {
          if (!priorityGroup.has(paneId)) {
            priorityGroup.set(paneId, []);
          }
          priorityGroup.get(paneId).push(update);
        }
      }
    }
    
    return grouped;
  }

  /**
   * Process grouped updates in priority order
   */
  async processGroupedUpdates(groupedUpdates) {
    const priorities = ['high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const paneUpdates = groupedUpdates[priority];
      
      if (paneUpdates.size === 0) {
        continue;
      }
      
      // Process pane updates with concurrency limit
      const paneIds = Array.from(paneUpdates.keys());
      const batches = this.createUpdateBatches(paneIds);
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(paneId => this.updatePane(paneId, paneUpdates.get(paneId)))
        );
      }
    }
  }

  /**
   * Create update batches respecting concurrency limits
   */
  createUpdateBatches(paneIds) {
    const batches = [];
    for (let i = 0; i < paneIds.length; i += this.options.maxConcurrentUpdates) {
      batches.push(paneIds.slice(i, i + this.options.maxConcurrentUpdates));
    }
    return batches;
  }

  /**
   * Update individual pane
   */
  async updatePane(paneId, updates) {
    if (this.activeUpdates.has(paneId)) {
      // Skip if already updating
      return;
    }
    
    this.activeUpdates.add(paneId);
    
    try {
      // Load fresh data for the pane
      const freshData = await this.loadPaneData(paneId, updates);
      
      // Update pane through pane manager
      await this.paneManager.updatePane(paneId, freshData, { 
        background: true,
        source: 'file_watcher'
      });
      
      this.health.totalUpdates++;
      
    } catch (error) {
      this.health.failedUpdates++;
      this.emit('paneUpdateError', { paneId, error: error.message });
      
    } finally {
      this.activeUpdates.delete(paneId);
    }
  }

  /**
   * Load fresh data for a pane based on file changes
   */
  async loadPaneData(paneId, updates) {
    // This would be implemented to load actual data from the file system
    // For now, return a mock data structure with update information
    return {
      paneId,
      updates: updates.length,
      lastUpdate: new Date(),
      changes: updates.map(update => ({
        type: update.changeType,
        file: path.basename(update.filePath),
        priority: update.priority
      }))
    };
  }

  /**
   * Handle watcher errors
   */
  handleWatcherError(watchPath, error) {
    const watcherInfo = this.watchers.get(watchPath);
    if (watcherInfo) {
      watcherInfo.errorCount++;
      watcherInfo.active = false;
    }
    
    this.health.errors.push({
      type: 'watcher_error',
      path: watchPath,
      error: error.message,
      timestamp: new Date()
    });
    
    this.emit('watcherError', { watchPath, error: error.message });
    
    // Attempt to restart watcher if error count is low
    if (watcherInfo && watcherInfo.errorCount < this.options.retryAttempts) {
      setTimeout(() => {
        this.restartWatcher(watchPath);
      }, this.options.retryDelay);
    }
  }

  /**
   * Restart a failed watcher
   */
  async restartWatcher(watchPath) {
    const watcherInfo = this.watchers.get(watchPath);
    if (!watcherInfo) {
      return;
    }
    
    try {
      // Close existing watcher
      await watcherInfo.watcher.close();
      
      // Create new watcher
      await this.createWatcher(watchPath, watcherInfo.targetPanes);
      
      this.emit('watcherRestarted', { watchPath });
      
    } catch (error) {
      this.emit('watcherRestartFailed', { watchPath, error: error.message });
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const now = new Date();
    
    // Check watcher health
    let activeWatchers = 0;
    for (const [path, info] of this.watchers) {
      if (info.active) {
        activeWatchers++;
      }
    }
    
    this.health.watchersActive = activeWatchers;
    this.health.lastHealthCheck = now;
    
    // Clean old errors (keep last 50)
    if (this.health.errors.length > 50) {
      this.health.errors = this.health.errors.slice(-50);
    }
    
    // Update memory usage
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;
    
    this.emit('healthCheck', {
      health: this.health,
      metrics: this.metrics
    });
  }

  /**
   * Update performance metrics
   */
  updateMetrics(latency, batchSize) {
    // Update rolling averages
    const alpha = 0.1;
    this.metrics.averageUpdateLatency = 
      (this.metrics.averageUpdateLatency * (1 - alpha)) + (latency * alpha);
    
    this.metrics.updateBatchSize = 
      (this.metrics.updateBatchSize * (1 - alpha)) + (batchSize * alpha);
  }

  /**
   * Get current health status
   */
  getHealth() {
    return {
      ...this.health,
      metrics: this.metrics,
      activeUpdates: this.activeUpdates.size,
      queuedUpdates: this.updateQueue.length
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Clear timers
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Close all watchers
    const closePromises = [];
    for (const [path, info] of this.watchers) {
      closePromises.push(info.watcher.close());
    }
    
    await Promise.all(closePromises);
    
    // Clear state
    this.watchers.clear();
    this.updateQueue = [];
    this.activeUpdates.clear();
    
    // Remove listeners
    this.removeAllListeners();
  }
}

export default RealTimeUpdater;
