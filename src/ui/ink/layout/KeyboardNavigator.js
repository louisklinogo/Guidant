/**
 * Keyboard Navigator
 * Unified keyboard handling system for Dynamic Terminal Layout System
 * 
 * Handles Tab navigation, shortcut execution, context-sensitive help,
 * and direct MCP tool triggering with terminal-safe key combinations.
 */

import { EventEmitter } from 'events';

/**
 * Global keyboard shortcuts (work in any context)
 */
export const GLOBAL_SHORTCUTS = {
  // Navigation
  'Tab': 'focusNextPane',
  'S-Tab': 'focusPreviousPane', // Shift+Tab
  'q': 'exitDashboard',
  'h': 'toggleHelp',
  'r': 'refreshAllPanes',
  
  // Layout Control
  '1': 'setPresetQuick',
  '2': 'setPresetDevelopment', 
  '3': 'setPresetMonitoring',
  '4': 'setPresetDebug',
  
  // Pane Operations
  'Space': 'togglePaneCollapse',
  'Enter': 'executePaneAction',
  'Escape': 'clearSelection',
  
  // System
  'C-c': 'forceExit', // Ctrl+C
  'C-r': 'hardRefresh' // Ctrl+R
};

/**
 * Pane-specific keyboard shortcuts
 */
export const PANE_SHORTCUTS = {
  progress: {
    'a': 'advancePhase',
    'p': 'reportProgress',
    'r': 'refreshProgress',
    'Space': 'togglePhaseDetails',
    'Enter': 'viewPhaseDetails'
  },
  
  tasks: {
    'n': 'generateNextTask',
    'p': 'reportTaskProgress',
    'c': 'completeTask',
    'Enter': 'viewTaskDetails',
    'ArrowUp': 'selectPreviousTask',
    'ArrowDown': 'selectNextTask'
  },
  
  capabilities: {
    'c': 'analyzeCapabilities',
    'g': 'showGapAnalysis',
    'd': 'discoverAgent',
    'Enter': 'viewToolDetails',
    'ArrowUp': 'selectPreviousTool',
    'ArrowDown': 'selectNextTool'
  },
  
  logs: {
    'f': 'filterLogs',
    'c': 'clearLogs',
    'e': 'showErrors',
    'Enter': 'viewLogDetails',
    'ArrowUp': 'scrollUp',
    'ArrowDown': 'scrollDown'
  },
  
  tools: {
    'Enter': 'executeSelectedTool',
    'i': 'showToolInfo',
    'h': 'showToolHelp',
    'ArrowUp': 'selectPreviousTool',
    'ArrowDown': 'selectNextTool'
  }
};

/**
 * Help text for keyboard shortcuts
 */
export const HELP_TEXT = {
  global: [
    'Global Navigation:',
    '  Tab/Shift+Tab - Navigate between panes',
    '  1/2/3/4 - Switch layout presets',
    '  h - Toggle this help',
    '  q - Quit dashboard',
    '  r - Refresh all panes',
    '',
    'Pane Operations:',
    '  Space - Collapse/expand focused pane',
    '  Enter - Execute pane action',
    '  Escape - Clear selection'
  ],
  
  progress: [
    'Progress Pane:',
    '  a - Advance to next phase',
    '  p - Report progress',
    '  r - Refresh progress data',
    '  Space - Toggle phase details',
    '  Enter - View phase details'
  ],
  
  tasks: [
    'Tasks Pane:',
    '  n - Generate next task',
    '  p - Report task progress',
    '  c - Complete current task',
    '  ↑/↓ - Navigate task list',
    '  Enter - View task details'
  ],
  
  capabilities: [
    'Capabilities Pane:',
    '  c - Analyze capabilities',
    '  g - Show gap analysis',
    '  d - Discover agent',
    '  ↑/↓ - Navigate tools',
    '  Enter - View tool details'
  ],
  
  logs: [
    'Logs Pane:',
    '  f - Filter log level',
    '  c - Clear logs',
    '  e - Show errors only',
    '  ↑/↓ - Scroll logs',
    '  Enter - View log details'
  ],
  
  tools: [
    'MCP Tools Pane:',
    '  Enter - Execute selected tool',
    '  i - Show tool information',
    '  h - Show tool help',
    '  ↑/↓ - Navigate tools'
  ]
};

/**
 * Key combination parser
 */
class KeyParser {
  static parse(input) {
    if (typeof input !== 'string') {
      return null;
    }

    const parts = input.split('-');
    const modifiers = [];
    let key = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i === parts.length - 1) {
        key = part;
      } else {
        switch (part.toLowerCase()) {
          case 'c':
          case 'ctrl':
            modifiers.push('ctrl');
            break;
          case 's':
          case 'shift':
            modifiers.push('shift');
            break;
          case 'a':
          case 'alt':
            modifiers.push('alt');
            break;
          case 'm':
          case 'meta':
            modifiers.push('meta');
            break;
        }
      }
    }

    return { key, modifiers };
  }

  static matches(input, target) {
    const inputParsed = this.parse(input);
    const targetParsed = this.parse(target);
    
    if (!inputParsed || !targetParsed) {
      return false;
    }

    return (
      inputParsed.key === targetParsed.key &&
      inputParsed.modifiers.length === targetParsed.modifiers.length &&
      inputParsed.modifiers.every(mod => targetParsed.modifiers.includes(mod))
    );
  }
}

/**
 * Keyboard Navigator Class
 * Manages keyboard input routing and command execution
 */
export class KeyboardNavigator extends EventEmitter {
  constructor(layoutManager, paneManager, options = {}) {
    super();
    
    this.layoutManager = layoutManager;
    this.paneManager = paneManager;
    this.options = {
      enableGlobalShortcuts: true,
      enablePaneShortcuts: true,
      enableHelp: true,
      ...options
    };
    
    this.helpVisible = false;
    this.keyHistory = [];
    this.maxKeyHistory = 10;
    
    // Performance tracking
    this.metrics = {
      totalKeyPresses: 0,
      commandsExecuted: 0,
      averageResponseTime: 0,
      errorCount: 0
    };
  }

  /**
   * Handle keyboard input
   */
  async handleKeyPress(input, key) {
    const startTime = performance.now();
    this.metrics.totalKeyPresses++;
    
    try {
      // Add to key history
      this.addToKeyHistory(input, key);
      
      // Parse key combination
      const keyCombo = this.parseKeyInput(input, key);
      
      // Check for global shortcuts first
      if (this.options.enableGlobalShortcuts) {
        const globalAction = this.findGlobalShortcut(keyCombo);
        if (globalAction) {
          const result = await this.executeGlobalAction(globalAction, keyCombo);
          this.updateMetrics(startTime);
          return result;
        }
      }
      
      // Check for pane-specific shortcuts
      if (this.options.enablePaneShortcuts) {
        const focusedPane = this.getCurrentFocusedPane();
        if (focusedPane) {
          const paneAction = this.findPaneShortcut(focusedPane, keyCombo);
          if (paneAction) {
            const result = await this.executePaneAction(focusedPane, paneAction, keyCombo);
            this.updateMetrics(startTime);
            return result;
          }
        }
      }
      
      // No matching shortcut found
      this.emit('unknownKey', { keyCombo, focusedPane: this.getCurrentFocusedPane() });
      return false;
      
    } catch (error) {
      this.metrics.errorCount++;
      this.emit('keyboardError', { error: error.message, keyCombo: input });
      return false;
    }
  }

  /**
   * Parse keyboard input into standardized format
   */
  parseKeyInput(input, key) {
    if (!key) {
      return input;
    }

    let keyCombo = '';
    
    // Add modifiers
    if (key.ctrl) keyCombo += 'C-';
    if (key.shift) keyCombo += 'S-';
    if (key.alt) keyCombo += 'A-';
    if (key.meta) keyCombo += 'M-';
    
    // Add key name
    if (key.name) {
      keyCombo += key.name;
    } else {
      keyCombo += input;
    }
    
    return keyCombo;
  }

  /**
   * Find matching global shortcut
   */
  findGlobalShortcut(keyCombo) {
    for (const [shortcut, action] of Object.entries(GLOBAL_SHORTCUTS)) {
      if (KeyParser.matches(keyCombo, shortcut)) {
        return action;
      }
    }
    return null;
  }

  /**
   * Find matching pane shortcut
   */
  findPaneShortcut(paneId, keyCombo) {
    const paneShortcuts = PANE_SHORTCUTS[paneId];
    if (!paneShortcuts) {
      return null;
    }
    
    for (const [shortcut, action] of Object.entries(paneShortcuts)) {
      if (KeyParser.matches(keyCombo, shortcut)) {
        return action;
      }
    }
    return null;
  }

  /**
   * Execute global action
   */
  async executeGlobalAction(action, keyCombo) {
    this.metrics.commandsExecuted++;
    
    switch (action) {
      case 'focusNextPane':
        return this.focusNextPane();
      
      case 'focusPreviousPane':
        return this.focusPreviousPane();
      
      case 'exitDashboard':
        return this.exitDashboard();
      
      case 'toggleHelp':
        return this.toggleHelp();
      
      case 'refreshAllPanes':
        return this.refreshAllPanes();
      
      case 'setPresetQuick':
        return this.setLayoutPreset('quick');
      
      case 'setPresetDevelopment':
        return this.setLayoutPreset('development');
      
      case 'setPresetMonitoring':
        return this.setLayoutPreset('monitoring');
      
      case 'setPresetDebug':
        return this.setLayoutPreset('debug');
      
      case 'togglePaneCollapse':
        return this.togglePaneCollapse();
      
      case 'executePaneAction':
        return this.executePaneDefaultAction();
      
      case 'clearSelection':
        return this.clearSelection();
      
      case 'forceExit':
        return this.forceExit();
      
      case 'hardRefresh':
        return this.hardRefresh();
      
      default:
        this.emit('unknownGlobalAction', { action, keyCombo });
        return false;
    }
  }

  /**
   * Execute pane-specific action
   */
  async executePaneAction(paneId, action, keyCombo) {
    this.metrics.commandsExecuted++;
    
    this.emit('paneAction', { paneId, action, keyCombo });
    
    // Emit specific action event for pane to handle
    this.emit(`pane:${paneId}:${action}`, { keyCombo });
    
    return true;
  }

  /**
   * Focus next pane
   */
  focusNextPane() {
    const nextPane = this.layoutManager.getNextPane();
    if (nextPane) {
      this.layoutManager.setFocusedPane(nextPane);
      this.paneManager.setPaneFocus(nextPane, true);
      
      // Unfocus previous pane
      const layout = this.layoutManager.calculateLayout();
      layout.panes.forEach(pane => {
        if (pane.id !== nextPane) {
          this.paneManager.setPaneFocus(pane.id, false);
        }
      });
      
      this.emit('focusChange', { paneId: nextPane, direction: 'next' });
      return true;
    }
    return false;
  }

  /**
   * Focus previous pane
   */
  focusPreviousPane() {
    const prevPane = this.layoutManager.getPreviousPane();
    if (prevPane) {
      this.layoutManager.setFocusedPane(prevPane);
      this.paneManager.setPaneFocus(prevPane, true);
      
      // Unfocus other panes
      const layout = this.layoutManager.calculateLayout();
      layout.panes.forEach(pane => {
        if (pane.id !== prevPane) {
          this.paneManager.setPaneFocus(pane.id, false);
        }
      });
      
      this.emit('focusChange', { paneId: prevPane, direction: 'previous' });
      return true;
    }
    return false;
  }

  /**
   * Toggle help display
   */
  toggleHelp() {
    this.helpVisible = !this.helpVisible;
    this.emit('helpToggle', { visible: this.helpVisible });
    return true;
  }

  /**
   * Get help text for current context
   */
  getContextualHelp() {
    const focusedPane = this.getCurrentFocusedPane();
    const help = [...HELP_TEXT.global];
    
    if (focusedPane && HELP_TEXT[focusedPane]) {
      help.push('', ...HELP_TEXT[focusedPane]);
    }
    
    return help;
  }

  /**
   * Set layout preset
   */
  setLayoutPreset(preset) {
    try {
      const actualPreset = this.layoutManager.setPreset(preset);
      this.emit('presetChange', { preset: actualPreset, requested: preset });
      return true;
    } catch (error) {
      this.emit('presetError', { preset, error: error.message });
      return false;
    }
  }

  /**
   * Toggle pane collapse
   */
  togglePaneCollapse() {
    const focusedPane = this.getCurrentFocusedPane();
    if (focusedPane) {
      return this.paneManager.togglePaneCollapse(focusedPane);
    }
    return false;
  }

  /**
   * Refresh all panes
   */
  async refreshAllPanes() {
    await this.paneManager.refreshAllPanes();
    this.emit('globalRefresh');
    return true;
  }

  /**
   * Exit dashboard
   */
  exitDashboard() {
    this.emit('exit', { reason: 'user_request' });
    return true;
  }

  /**
   * Force exit (Ctrl+C)
   */
  forceExit() {
    this.emit('forceExit', { reason: 'force_quit' });
    return true;
  }

  /**
   * Hard refresh (Ctrl+R)
   */
  async hardRefresh() {
    this.emit('hardRefresh');
    await this.refreshAllPanes();
    return true;
  }

  /**
   * Execute default action for focused pane
   */
  executePaneDefaultAction() {
    const focusedPane = this.getCurrentFocusedPane();
    if (focusedPane) {
      this.emit(`pane:${focusedPane}:defaultAction`);
      return true;
    }
    return false;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.emit('clearSelection');
    return true;
  }

  /**
   * Get currently focused pane
   */
  getCurrentFocusedPane() {
    return this.layoutManager.focusedPane;
  }

  /**
   * Add key to history
   */
  addToKeyHistory(input, key) {
    this.keyHistory.push({
      input,
      key,
      timestamp: Date.now()
    });
    
    // Trim history to max size
    if (this.keyHistory.length > this.maxKeyHistory) {
      this.keyHistory = this.keyHistory.slice(-this.maxKeyHistory);
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(startTime) {
    const responseTime = performance.now() - startTime;
    
    // Calculate rolling average
    const alpha = 0.1;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (1 - alpha)) + (responseTime * alpha);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      helpVisible: this.helpVisible,
      keyHistorySize: this.keyHistory.length,
      currentFocus: this.getCurrentFocusedPane()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.keyHistory = [];
    this.removeAllListeners();
  }
}

export default KeyboardNavigator;
