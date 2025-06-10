/**
 * Dynamic Terminal Layout System - Core Components
 * Phase 1: Foundation Architecture
 * 
 * Exports all core layout engine components for the Dynamic Terminal Layout System.
 * This module provides the foundation for VS Code-inspired multi-pane terminal interfaces.
 */

// Core Layout Engine Components
export { 
  LayoutManager, 
  LAYOUT_PRESETS, 
  RESPONSIVE_BREAKPOINTS 
} from './LayoutManager.js';

export { 
  PaneManager, 
  PANE_STATES, 
  PANE_CONFIGS 
} from './PaneManager.js';

export { 
  KeyboardNavigator, 
  GLOBAL_SHORTCUTS, 
  PANE_SHORTCUTS, 
  HELP_TEXT 
} from './KeyboardNavigator.js';

export { 
  RealTimeUpdater, 
  WATCH_CONFIG, 
  UPDATE_PRIORITIES, 
  CHANGE_TYPES 
} from './RealTimeUpdater.js';

/**
 * Create a complete dynamic layout system instance
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.terminalDimensions - Terminal size { width, height }
 * @param {string} options.preset - Initial layout preset
 * @param {number} options.debounceMs - Update debounce time
 * @param {number} options.maxConcurrentUpdates - Max concurrent pane updates
 * @returns {Object} Complete layout system with all components
 */
export function createDynamicLayoutSystem(options = {}) {
  const {
    terminalDimensions = { width: 120, height: 30 },
    preset = 'development',
    debounceMs = 100,
    maxConcurrentUpdates = 3,
    ...otherOptions
  } = options;

  // Create core components
  const layoutManager = new LayoutManager({
    terminalDimensions,
    preset,
    ...otherOptions
  });

  const paneManager = new PaneManager({
    updateDebounceMs: debounceMs,
    maxConcurrentUpdates,
    ...otherOptions
  });

  const keyboardNavigator = new KeyboardNavigator(layoutManager, paneManager, {
    enableGlobalShortcuts: true,
    enablePaneShortcuts: true,
    enableHelp: true,
    ...otherOptions
  });

  const realTimeUpdater = new RealTimeUpdater(paneManager, {
    debounceMs,
    maxConcurrentUpdates,
    healthCheckInterval: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    ...otherOptions
  });

  // Set up component integration
  setupComponentIntegration(layoutManager, paneManager, keyboardNavigator, realTimeUpdater);

  return {
    layoutManager,
    paneManager,
    keyboardNavigator,
    realTimeUpdater,
    
    // Convenience methods
    async initialize(projectRoot) {
      return await realTimeUpdater.initialize(projectRoot);
    },
    
    async cleanup() {
      await realTimeUpdater.cleanup();
      keyboardNavigator.cleanup();
      paneManager.cleanup();
    },
    
    getSystemStatus() {
      return {
        layout: layoutManager.getLayoutInfo(),
        panes: paneManager.getAllPaneStates(),
        keyboard: keyboardNavigator.getMetrics(),
        realTime: realTimeUpdater.getHealth()
      };
    }
  };
}

/**
 * Set up integration between components
 */
function setupComponentIntegration(layoutManager, paneManager, keyboardNavigator, realTimeUpdater) {
  // Keyboard Navigator → Layout Manager integration
  keyboardNavigator.on('focusChange', ({ paneId }) => {
    layoutManager.setFocusedPane(paneId);
  });

  keyboardNavigator.on('presetChange', ({ preset }) => {
    layoutManager.setPreset(preset);
  });

  // Keyboard Navigator → Pane Manager integration
  keyboardNavigator.on('paneFocusChange', ({ paneId, focused }) => {
    paneManager.setPaneFocus(paneId, focused);
  });

  keyboardNavigator.on('paneCollapseToggle', ({ paneId }) => {
    paneManager.togglePaneCollapse(paneId);
  });

  // Real-time Updater → Pane Manager integration
  realTimeUpdater.on('fileChange', (event) => {
    // File changes trigger pane updates through the real-time updater
    // This is handled internally by the RealTimeUpdater
  });

  // Pane Manager → Keyboard Navigator integration
  paneManager.on('paneStateChange', (event) => {
    // Notify keyboard navigator of pane state changes for context-sensitive help
    keyboardNavigator.emit('paneStateUpdate', event);
  });

  // Layout Manager → Pane Manager integration
  // Register panes based on current layout
  const layout = layoutManager.calculateLayout();
  layout.panes.forEach(pane => {
    try {
      paneManager.registerPane(pane.id);
    } catch (error) {
      // Pane might already be registered
      if (!error.message.includes('already registered')) {
        console.warn(`Failed to register pane ${pane.id}:`, error.message);
      }
    }
  });
}

/**
 * Utility function to get available layout presets for current terminal
 */
export function getAvailablePresets(terminalDimensions = null) {
  const layoutManager = new LayoutManager({ terminalDimensions });
  return layoutManager.getAvailablePresets();
}

/**
 * Utility function to validate terminal size for a specific preset
 */
export function validateTerminalForPreset(preset, terminalDimensions = null) {
  const dimensions = terminalDimensions || {
    width: process.stdout.columns || 100,
    height: process.stdout.rows || 30
  };

  const presetConfig = LAYOUT_PRESETS[preset];
  if (!presetConfig) {
    return { valid: false, error: `Unknown preset: ${preset}` };
  }

  const valid = dimensions.width >= presetConfig.minWidth && 
                dimensions.height >= presetConfig.minHeight;

  return {
    valid,
    preset,
    required: { width: presetConfig.minWidth, height: presetConfig.minHeight },
    actual: dimensions,
    error: valid ? null : `Terminal too small for ${presetConfig.name}`
  };
}

/**
 * Default export for convenience
 */
export default {
  createDynamicLayoutSystem,
  getAvailablePresets,
  validateTerminalForPreset,
  LayoutManager,
  PaneManager,
  KeyboardNavigator,
  RealTimeUpdater,
  LAYOUT_PRESETS,
  PANE_STATES,
  PANE_CONFIGS,
  GLOBAL_SHORTCUTS,
  PANE_SHORTCUTS,
  WATCH_CONFIG
};
