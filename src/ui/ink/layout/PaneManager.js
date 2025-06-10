/**
 * Pane Manager
 * Individual pane lifecycle management for Dynamic Terminal Layout System
 * 
 * Handles pane registration, state synchronization, collapse/expand functionality,
 * and content routing and updates.
 */

import React from 'react';
import { EventEmitter } from 'events';

/**
 * Pane state enumeration
 */
export const PANE_STATES = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  LOADING: 'loading',
  ERROR: 'error',
  COLLAPSED: 'collapsed',
  FOCUSED: 'focused',
  UPDATING: 'updating'
};

/**
 * Pane configuration interface
 */
export const PANE_CONFIGS = {
  progress: {
    id: 'progress',
    title: '📊 Progress',
    description: 'Project phase progression and completion status',
    collapsible: true,
    refreshable: true,
    keyboardShortcuts: ['a', 'r', 'Space'],
    updateTriggers: ['.guidant/workflow/', '.guidant/project/config.json']
  },
  
  tasks: {
    id: 'tasks',
    title: '📋 Tasks',
    description: 'Current and upcoming tasks with dependencies',
    collapsible: true,
    refreshable: true,
    keyboardShortcuts: ['n', 'p', 'Enter'],
    updateTriggers: ['.guidant/ai/task-tickets/', '.guidant/context/current-task.json']
  },
  
  capabilities: {
    id: 'capabilities',
    title: '🔧 Capabilities',
    description: 'AI tools, coverage analysis, and gap recommendations',
    collapsible: true,
    refreshable: true,
    keyboardShortcuts: ['c', 'g', 'Enter'],
    updateTriggers: ['.guidant/ai/capabilities.json', '.guidant/ai/agents/']
  },
  
  logs: {
    id: 'logs',
    title: '📝 Logs',
    description: 'Real-time MCP tool execution and system activity',
    collapsible: true,
    refreshable: false, // Auto-updating
    keyboardShortcuts: ['f', 'c', 'Enter'],
    updateTriggers: ['.guidant/context/sessions.json', '.guidant/context/decisions.json']
  },
  
  tools: {
    id: 'tools',
    title: '⚡ MCP Tools',
    description: 'Direct MCP tool execution and status monitoring',
    collapsible: true,
    refreshable: true,
    keyboardShortcuts: ['Enter', 'i', 'h'],
    updateTriggers: ['mcp_tool_execution']
  }
};

/**
 * Individual Pane State Manager
 */
class PaneState {
  constructor(paneId, config) {
    this.id = paneId;
    this.config = config;
    this.state = PANE_STATES.INITIALIZING;
    this.data = null;
    this.error = null;
    this.lastUpdate = null;
    this.collapsed = false;
    this.focused = false;
    this.loading = false;
    this.updateCount = 0;
    this.subscribers = new Set();
  }

  /**
   * Update pane state
   */
  setState(newState, data = null, error = null) {
    const oldState = this.state;
    this.state = newState;
    
    if (data !== null) {
      this.data = data;
      this.lastUpdate = new Date();
      this.updateCount++;
    }
    
    if (error !== null) {
      this.error = error;
    }
    
    // Notify subscribers of state change
    this.notifySubscribers({
      paneId: this.id,
      oldState,
      newState,
      data: this.data,
      error: this.error,
      timestamp: new Date()
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(changeEvent) {
    this.subscribers.forEach(callback => {
      try {
        callback(changeEvent);
      } catch (error) {
        console.error(`Error in pane subscriber for ${this.id}:`, error);
      }
    });
  }

  /**
   * Toggle collapsed state
   */
  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.setState(this.collapsed ? PANE_STATES.COLLAPSED : PANE_STATES.READY);
  }

  /**
   * Set focus state
   */
  setFocus(focused) {
    this.focused = focused;
    if (focused && this.state !== PANE_STATES.ERROR) {
      this.setState(PANE_STATES.FOCUSED);
    } else if (!focused && this.state === PANE_STATES.FOCUSED) {
      this.setState(PANE_STATES.READY);
    }
  }

  /**
   * Get pane status summary
   */
  getStatus() {
    return {
      id: this.id,
      state: this.state,
      collapsed: this.collapsed,
      focused: this.focused,
      loading: this.loading,
      hasData: this.data !== null,
      hasError: this.error !== null,
      lastUpdate: this.lastUpdate,
      updateCount: this.updateCount
    };
  }
}

/**
 * Pane Manager Class
 * Manages lifecycle and state of all panes in the dynamic layout
 */
export class PaneManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.panes = new Map();
    this.updateQueue = [];
    this.updateTimer = null;
    this.updateDebounceMs = options.updateDebounceMs || 100;
    this.maxConcurrentUpdates = options.maxConcurrentUpdates || 3;
    this.activeUpdates = new Set();
    
    // Performance monitoring
    this.metrics = {
      totalUpdates: 0,
      averageUpdateTime: 0,
      errorCount: 0,
      lastMetricsReset: new Date()
    };
  }

  /**
   * Register a new pane
   */
  registerPane(paneId, component = null, options = {}) {
    if (this.panes.has(paneId)) {
      throw new Error(`Pane ${paneId} is already registered`);
    }

    const config = PANE_CONFIGS[paneId];
    if (!config) {
      throw new Error(`Unknown pane type: ${paneId}`);
    }

    const paneState = new PaneState(paneId, { ...config, ...options });
    
    // Subscribe to pane state changes
    paneState.subscribe((changeEvent) => {
      this.emit('paneStateChange', changeEvent);
    });

    this.panes.set(paneId, {
      state: paneState,
      component: component,
      options: options
    });

    this.emit('paneRegistered', { paneId, config });
    
    // Initialize pane
    this.initializePane(paneId);
    
    return paneState;
  }

  /**
   * Unregister a pane
   */
  unregisterPane(paneId) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      return false;
    }

    // Clean up any pending updates
    this.cancelPendingUpdates(paneId);
    
    // Remove from active updates
    this.activeUpdates.delete(paneId);
    
    // Remove pane
    this.panes.delete(paneId);
    
    this.emit('paneUnregistered', { paneId });
    return true;
  }

  /**
   * Initialize a pane
   */
  async initializePane(paneId) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      throw new Error(`Pane ${paneId} not found`);
    }

    try {
      pane.state.setState(PANE_STATES.LOADING);
      
      // Simulate initialization (in real implementation, load initial data)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      pane.state.setState(PANE_STATES.READY, { initialized: true });
      
    } catch (error) {
      pane.state.setState(PANE_STATES.ERROR, null, error.message);
      this.metrics.errorCount++;
    }
  }

  /**
   * Update pane data
   */
  async updatePane(paneId, data, options = {}) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      console.warn(`Attempted to update non-existent pane: ${paneId}`);
      return false;
    }

    const startTime = performance.now();
    
    try {
      // Set loading state if not a background update
      if (!options.background) {
        pane.state.setState(PANE_STATES.UPDATING);
      }
      
      // Add to active updates tracking
      this.activeUpdates.add(paneId);
      
      // Update the pane data
      pane.state.setState(PANE_STATES.READY, data);
      
      // Update metrics
      const updateTime = performance.now() - startTime;
      this.updateMetrics(updateTime);
      
      this.emit('paneUpdated', { paneId, data, updateTime });
      
      return true;
      
    } catch (error) {
      pane.state.setState(PANE_STATES.ERROR, null, error.message);
      this.metrics.errorCount++;
      this.emit('paneUpdateError', { paneId, error: error.message });
      return false;
      
    } finally {
      this.activeUpdates.delete(paneId);
    }
  }

  /**
   * Queue pane update with debouncing
   */
  queueUpdate(paneId, data, options = {}) {
    // Add to update queue
    this.updateQueue.push({ paneId, data, options, timestamp: Date.now() });
    
    // Clear existing timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    // Set new debounced timer
    this.updateTimer = setTimeout(() => {
      this.processUpdateQueue();
    }, this.updateDebounceMs);
  }

  /**
   * Process queued updates
   */
  async processUpdateQueue() {
    if (this.updateQueue.length === 0) {
      return;
    }

    // Group updates by pane (keep only latest for each pane)
    const latestUpdates = new Map();
    this.updateQueue.forEach(update => {
      latestUpdates.set(update.paneId, update);
    });
    
    // Clear queue
    this.updateQueue = [];
    
    // Process updates with concurrency limit
    const updates = Array.from(latestUpdates.values());
    const batches = this.createUpdateBatches(updates);
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(update => 
          this.updatePane(update.paneId, update.data, update.options)
        )
      );
    }
  }

  /**
   * Create update batches respecting concurrency limits
   */
  createUpdateBatches(updates) {
    const batches = [];
    for (let i = 0; i < updates.length; i += this.maxConcurrentUpdates) {
      batches.push(updates.slice(i, i + this.maxConcurrentUpdates));
    }
    return batches;
  }

  /**
   * Cancel pending updates for a pane
   */
  cancelPendingUpdates(paneId) {
    this.updateQueue = this.updateQueue.filter(update => update.paneId !== paneId);
  }

  /**
   * Refresh all panes
   */
  async refreshAllPanes() {
    const paneIds = Array.from(this.panes.keys());
    
    for (const paneId of paneIds) {
      const pane = this.panes.get(paneId);
      if (pane && pane.state.config.refreshable) {
        await this.refreshPane(paneId);
      }
    }
  }

  /**
   * Refresh a specific pane
   */
  async refreshPane(paneId) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      return false;
    }

    // Trigger refresh (in real implementation, reload data from source)
    return await this.updatePane(paneId, { refreshed: true, timestamp: new Date() });
  }

  /**
   * Get pane state
   */
  getPaneState(paneId) {
    const pane = this.panes.get(paneId);
    return pane ? pane.state.getStatus() : null;
  }

  /**
   * Get all pane states
   */
  getAllPaneStates() {
    const states = {};
    this.panes.forEach((pane, paneId) => {
      states[paneId] = pane.state.getStatus();
    });
    return states;
  }

  /**
   * Set pane focus
   */
  setPaneFocus(paneId, focused) {
    const pane = this.panes.get(paneId);
    if (pane) {
      pane.state.setFocus(focused);
      this.emit('paneFocusChange', { paneId, focused });
      return true;
    }
    return false;
  }

  /**
   * Toggle pane collapse state
   */
  togglePaneCollapse(paneId) {
    const pane = this.panes.get(paneId);
    if (pane && pane.state.config.collapsible) {
      pane.state.toggleCollapse();
      this.emit('paneCollapseToggle', { paneId, collapsed: pane.state.collapsed });
      return true;
    }
    return false;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(updateTime) {
    this.metrics.totalUpdates++;
    
    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageUpdateTime = 
      (this.metrics.averageUpdateTime * (1 - alpha)) + (updateTime * alpha);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activePanes: this.panes.size,
      activeUpdates: this.activeUpdates.size,
      queuedUpdates: this.updateQueue.length,
      uptime: Date.now() - this.metrics.lastMetricsReset.getTime()
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalUpdates: 0,
      averageUpdateTime: 0,
      errorCount: 0,
      lastMetricsReset: new Date()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear timers
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    // Clear queues
    this.updateQueue = [];
    this.activeUpdates.clear();
    
    // Unregister all panes
    const paneIds = Array.from(this.panes.keys());
    paneIds.forEach(paneId => this.unregisterPane(paneId));
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

export default PaneManager;
