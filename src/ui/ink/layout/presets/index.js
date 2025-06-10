/**
 * Layout Preset Configurations
 * Defines layout presets with responsive breakpoints and keyboard mappings
 * 
 * Each preset defines:
 * - Which panes are shown and how they're arranged
 * - Minimum terminal size requirements
 * - Priority weights for responsive calculations
 * - Keyboard shortcut mappings
 */

/**
 * Layout presets configuration
 * Defines which panes are shown and how they're arranged for each mode
 */
export const LAYOUT_PRESETS = {
  quick: {
    name: 'Quick Mode',
    description: 'Single-pane compact view for essential status',
    panes: ['progress'],
    layout: 'single',
    minWidth: 60,
    minHeight: 10,
    priority: {
      progress: 1.0
    },
    keyboardShortcuts: {
      'n': 'next-task',
      'p': 'report-progress', 
      'a': 'advance-phase',
      'r': 'refresh',
      'h': 'help',
      'q': 'quit'
    }
  },
  
  development: {
    name: 'Development Mode', 
    description: '3-pane layout for active development workflow',
    panes: ['progress', 'tasks', 'capabilities'],
    layout: 'triple',
    minWidth: 120,
    minHeight: 24,
    priority: {
      progress: 0.3,
      tasks: 0.45,
      capabilities: 0.25
    },
    keyboardShortcuts: {
      'n': 'next-task',
      'p': 'report-progress',
      'a': 'advance-phase', 
      'c': 'analyze-capabilities',
      'g': 'analyze-gaps',
      'r': 'refresh',
      'h': 'help',
      'q': 'quit'
    }
  },
  
  monitoring: {
    name: 'Monitoring Mode',
    description: '4-pane layout for workflow monitoring and debugging',
    panes: ['progress', 'tasks', 'logs', 'tools'],
    layout: 'quad',
    minWidth: 160,
    minHeight: 30,
    priority: {
      progress: 0.25,
      tasks: 0.35,
      logs: 0.25,
      tools: 0.15
    },
    keyboardShortcuts: {
      'n': 'next-task',
      'p': 'report-progress',
      'a': 'advance-phase',
      'l': 'view-logs',
      't': 'execute-tool',
      'r': 'refresh',
      'h': 'help',
      'q': 'quit'
    }
  },
  
  debug: {
    name: 'Debug Mode',
    description: '5-pane layout with all available information',
    panes: ['progress', 'tasks', 'capabilities', 'logs', 'tools'],
    layout: 'full',
    minWidth: 180,
    minHeight: 35,
    priority: {
      progress: 0.2,
      tasks: 0.3,
      capabilities: 0.2,
      logs: 0.2,
      tools: 0.1
    },
    keyboardShortcuts: {
      'n': 'next-task',
      'p': 'report-progress',
      'a': 'advance-phase',
      'c': 'analyze-capabilities',
      'g': 'analyze-gaps',
      'l': 'view-logs',
      't': 'execute-tool',
      'd': 'discover-agent',
      'r': 'refresh',
      'h': 'help',
      'q': 'quit'
    }
  }
};

/**
 * Responsive breakpoints for terminal size adaptation
 */
export const RESPONSIVE_BREAKPOINTS = {
  minimal: { width: 60, height: 20 },   // Emergency fallback
  compact: { width: 80, height: 24 },   // Standard terminal
  standard: { width: 120, height: 30 }, // Wide terminal
  full: { width: 160, height: 40 }      // Ultra-wide terminal
};

/**
 * Keyboard shortcut mappings per preset
 * Maps keyboard inputs to MCP tool actions
 */
export const KEYBOARD_MAPPINGS = {
  global: {
    'Tab': 'focus-next-pane',
    'Shift+Tab': 'focus-previous-pane',
    'Ctrl+C': 'quit',
    'Escape': 'quit'
  },
  
  actions: {
    'n': {
      tool: 'guidant_get_current_task',
      description: 'Get next task',
      params: { availableTools: [] }
    },
    'p': {
      tool: 'guidant_report_progress', 
      description: 'Report progress',
      params: { deliverable: '', workCompleted: '', status: 'in_progress' }
    },
    'a': {
      tool: 'guidant_advance_phase',
      description: 'Advance to next phase',
      params: { confirmAdvancement: true }
    },
    'c': {
      tool: 'guidant_discover_agent',
      description: 'Analyze capabilities',
      params: { availableTools: [] }
    },
    'g': {
      tool: 'guidant_analyze_gaps',
      description: 'Analyze capability gaps',
      params: { agentId: '', targetProject: {} }
    },
    'l': {
      action: 'toggle-logs-pane',
      description: 'Toggle logs pane visibility'
    },
    't': {
      action: 'show-tools-menu',
      description: 'Show MCP tools menu'
    },
    'd': {
      tool: 'guidant_discover_agent',
      description: 'Discover agent capabilities',
      params: { availableTools: [] }
    },
    'r': {
      action: 'refresh-all-panes',
      description: 'Refresh all panes'
    },
    'h': {
      action: 'show-help',
      description: 'Show keyboard shortcuts help'
    },
    'q': {
      action: 'quit',
      description: 'Quit dashboard'
    }
  }
};

/**
 * Preset selection helpers
 */
export const PRESET_HELPERS = {
  /**
   * Get preset by terminal size
   */
  getPresetForTerminalSize(width, height) {
    const presets = Object.entries(LAYOUT_PRESETS);
    
    // Sort by minimum requirements (largest first for best fit)
    presets.sort((a, b) => b[1].minWidth - a[1].minWidth);
    
    // Find first preset that fits
    for (const [name, preset] of presets) {
      if (width >= preset.minWidth && height >= preset.minHeight) {
        return name;
      }
    }
    
    // Ultimate fallback
    return 'quick';
  },

  /**
   * Get all available presets for terminal size
   */
  getAvailablePresets(width, height) {
    return Object.entries(LAYOUT_PRESETS)
      .filter(([_, preset]) => width >= preset.minWidth && height >= preset.minHeight)
      .map(([name, preset]) => ({
        name,
        title: preset.name,
        description: preset.description,
        panes: preset.panes.length,
        minSize: `${preset.minWidth}x${preset.minHeight}`
      }));
  },

  /**
   * Validate preset configuration
   */
  validatePreset(presetName) {
    const preset = LAYOUT_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Invalid preset: ${presetName}`);
    }

    // Validate required fields
    const required = ['name', 'description', 'panes', 'layout', 'minWidth', 'minHeight', 'priority'];
    for (const field of required) {
      if (!(field in preset)) {
        throw new Error(`Preset ${presetName} missing required field: ${field}`);
      }
    }

    // Validate priority weights sum to 1.0
    const totalPriority = Object.values(preset.priority).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalPriority - 1.0) > 0.01) {
      console.warn(`Preset ${presetName} priority weights don't sum to 1.0 (${totalPriority})`);
    }

    return true;
  }
};

/**
 * Default export for convenience
 */
export default {
  LAYOUT_PRESETS,
  RESPONSIVE_BREAKPOINTS,
  KEYBOARD_MAPPINGS,
  PRESET_HELPERS
};
