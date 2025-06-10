/**
 * Layout Components - Barrel Export
 * Multi-pane layout system for Dynamic Terminal Layout System
 */

// Core multi-pane layout
export { MultiPaneLayout } from './MultiPaneLayout.jsx';

// Layout utilities and helpers
export { default as MultiPaneLayout } from './MultiPaneLayout.jsx';

/**
 * Create layout component based on mode
 * Factory function for different layout types
 */
export function createLayoutComponent(mode = 'multi-pane', props = {}) {
  switch (mode) {
    case 'multi-pane':
    default:
      return MultiPaneLayout;
  }
}

/**
 * Layout configuration helpers
 */
export const LAYOUT_MODES = {
  MULTI_PANE: 'multi-pane'
};

export const DEFAULT_LAYOUT_PROPS = {
  preset: 'development',
  terminalDimensions: { width: 120, height: 30 },
  interactive: true,
  compact: false
};
