/**
 * Layout Manager Core
 * Core layout orchestration system for Dynamic Terminal Layout System
 * 
 * Manages pane arrangements, preset switching, responsive calculations,
 * and focus management for keyboard navigation.
 */

import React from 'react';
import { Box } from 'ink';

// Import preset configurations from dedicated module
import { LAYOUT_PRESETS } from './presets/index.js';

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
 * Layout Manager Class
 * Core orchestration system for dynamic terminal layouts
 */
export class LayoutManager {
  constructor(options = {}) {
    this.terminalDimensions = options.terminalDimensions || this.getTerminalDimensions();
    this.currentPreset = options.preset || 'development';
    this.panes = new Map();
    this.focusedPane = null;
    this.layoutCache = new Map();
    
    // Validate initial preset
    if (!LAYOUT_PRESETS[this.currentPreset]) {
      console.warn(`Invalid preset '${this.currentPreset}', falling back to 'development'`);
      this.currentPreset = 'development';
    }
  }

  /**
   * Get current terminal dimensions
   */
  getTerminalDimensions() {
    return {
      width: process.stdout.columns || 100,
      height: process.stdout.rows || 30
    };
  }

  /**
   * Update terminal dimensions (called on resize)
   */
  updateTerminalDimensions(dimensions) {
    this.terminalDimensions = dimensions || this.getTerminalDimensions();
    this.layoutCache.clear(); // Clear cache on resize
  }

  /**
   * Set layout preset with validation
   */
  setPreset(presetName) {
    if (!LAYOUT_PRESETS[presetName]) {
      throw new Error(`Invalid layout preset: ${presetName}`);
    }

    const preset = LAYOUT_PRESETS[presetName];
    const { width, height } = this.terminalDimensions;

    // Check if terminal meets minimum requirements
    if (width < preset.minWidth || height < preset.minHeight) {
      const fallback = this.findFallbackPreset(width, height);
      console.warn(
        `Terminal too small for ${preset.name} (${width}x${height}), ` +
        `using ${LAYOUT_PRESETS[fallback].name} instead`
      );
      this.currentPreset = fallback;
    } else {
      this.currentPreset = presetName;
    }

    this.layoutCache.clear(); // Clear cache when preset changes
    return this.currentPreset;
  }

  /**
   * Find appropriate fallback preset for small terminals
   */
  findFallbackPreset(width, height) {
    const presets = Object.entries(LAYOUT_PRESETS);
    
    // Sort by minimum requirements (smallest first)
    presets.sort((a, b) => a[1].minWidth - b[1].minWidth);
    
    // Find first preset that fits
    for (const [name, preset] of presets) {
      if (width >= preset.minWidth && height >= preset.minHeight) {
        return name;
      }
    }
    
    // Ultimate fallback
    return 'quick';
  }

  /**
   * Get current preset configuration
   */
  getCurrentPreset() {
    return LAYOUT_PRESETS[this.currentPreset];
  }

  /**
   * Calculate layout for current preset and terminal size
   */
  calculateLayout() {
    const cacheKey = `${this.currentPreset}_${this.terminalDimensions.width}x${this.terminalDimensions.height}`;
    
    if (this.layoutCache.has(cacheKey)) {
      return this.layoutCache.get(cacheKey);
    }

    const preset = this.getCurrentPreset();
    const layout = this.calculateLayoutForPreset(preset);
    
    this.layoutCache.set(cacheKey, layout);
    return layout;
  }

  /**
   * Calculate layout dimensions for a specific preset
   */
  calculateLayoutForPreset(preset) {
    const { width, height } = this.terminalDimensions;
    const { panes, layout, priority } = preset;
    
    // Account for borders and padding
    const availableWidth = width - 4; // 2 chars padding on each side
    const availableHeight = height - 6; // Header, footer, borders
    
    switch (layout) {
      case 'single':
        return this.calculateSingleLayout(panes, availableWidth, availableHeight);
      
      case 'triple':
        return this.calculateTripleLayout(panes, priority, availableWidth, availableHeight);
      
      case 'quad':
        return this.calculateQuadLayout(panes, priority, availableWidth, availableHeight);
      
      case 'full':
        return this.calculateFullLayout(panes, priority, availableWidth, availableHeight);
      
      default:
        throw new Error(`Unknown layout type: ${layout}`);
    }
  }

  /**
   * Calculate single pane layout (Quick mode)
   */
  calculateSingleLayout(panes, width, height) {
    return {
      type: 'single',
      panes: [{
        id: panes[0],
        x: 0,
        y: 0,
        width: width,
        height: height,
        focused: true
      }]
    };
  }

  /**
   * Calculate triple pane layout (Development mode)
   * Layout: [Progress] [Tasks] [Capabilities]
   */
  calculateTripleLayout(panes, priority, width, height) {
    const paneWidth = Math.floor(width / 3);
    const remainder = width % 3;
    
    return {
      type: 'triple',
      panes: [
        {
          id: panes[0], // progress
          x: 0,
          y: 0,
          width: paneWidth + (remainder > 0 ? 1 : 0),
          height: height,
          focused: true
        },
        {
          id: panes[1], // tasks
          x: paneWidth + (remainder > 0 ? 1 : 0),
          y: 0,
          width: paneWidth + (remainder > 1 ? 1 : 0),
          height: height,
          focused: false
        },
        {
          id: panes[2], // capabilities
          x: paneWidth * 2 + (remainder > 0 ? 1 : 0) + (remainder > 1 ? 1 : 0),
          y: 0,
          width: paneWidth,
          height: height,
          focused: false
        }
      ]
    };
  }

  /**
   * Calculate quad pane layout (Monitoring mode)
   * Layout: [Progress] [Tasks]
   *         [Logs]     [Tools]
   */
  calculateQuadLayout(panes, priority, width, height) {
    const topHeight = Math.floor(height * 0.7); // 70% for top panes
    const bottomHeight = height - topHeight;
    const leftWidth = Math.floor(width * 0.6); // 60% for left panes
    const rightWidth = width - leftWidth;
    
    return {
      type: 'quad',
      panes: [
        {
          id: panes[0], // progress
          x: 0,
          y: 0,
          width: leftWidth,
          height: topHeight,
          focused: true
        },
        {
          id: panes[1], // tasks
          x: leftWidth,
          y: 0,
          width: rightWidth,
          height: topHeight,
          focused: false
        },
        {
          id: panes[2], // logs
          x: 0,
          y: topHeight,
          width: leftWidth,
          height: bottomHeight,
          focused: false
        },
        {
          id: panes[3], // tools
          x: leftWidth,
          y: topHeight,
          width: rightWidth,
          height: bottomHeight,
          focused: false
        }
      ]
    };
  }

  /**
   * Calculate full layout (Debug mode)
   * Layout: [Progress] [Tasks] [Capabilities]
   *         [Logs]     [Tools]
   */
  calculateFullLayout(panes, priority, width, height) {
    const topHeight = Math.floor(height * 0.65); // 65% for top row
    const bottomHeight = height - topHeight;
    const topPaneWidth = Math.floor(width / 3);
    const bottomPaneWidth = Math.floor(width / 2);
    
    return {
      type: 'full',
      panes: [
        {
          id: panes[0], // progress
          x: 0,
          y: 0,
          width: topPaneWidth,
          height: topHeight,
          focused: true
        },
        {
          id: panes[1], // tasks
          x: topPaneWidth,
          y: 0,
          width: topPaneWidth,
          height: topHeight,
          focused: false
        },
        {
          id: panes[2], // capabilities
          x: topPaneWidth * 2,
          y: 0,
          width: width - (topPaneWidth * 2),
          height: topHeight,
          focused: false
        },
        {
          id: panes[3], // logs
          x: 0,
          y: topHeight,
          width: bottomPaneWidth,
          height: bottomHeight,
          focused: false
        },
        {
          id: panes[4], // tools
          x: bottomPaneWidth,
          y: topHeight,
          width: width - bottomPaneWidth,
          height: bottomHeight,
          focused: false
        }
      ]
    };
  }

  /**
   * Get available presets for current terminal size
   */
  getAvailablePresets() {
    const { width, height } = this.terminalDimensions;
    
    return Object.entries(LAYOUT_PRESETS)
      .filter(([_, preset]) => width >= preset.minWidth && height >= preset.minHeight)
      .map(([name, preset]) => ({
        name,
        title: preset.name,
        description: preset.description,
        panes: preset.panes.length,
        current: name === this.currentPreset
      }));
  }

  /**
   * Focus management for keyboard navigation
   */
  setFocusedPane(paneId) {
    const layout = this.calculateLayout();
    const pane = layout.panes.find(p => p.id === paneId);
    
    if (pane) {
      // Update focus in layout
      layout.panes.forEach(p => p.focused = (p.id === paneId));
      this.focusedPane = paneId;
      return true;
    }
    
    return false;
  }

  /**
   * Get next pane for Tab navigation
   */
  getNextPane() {
    const layout = this.calculateLayout();
    const currentIndex = layout.panes.findIndex(p => p.focused);
    const nextIndex = (currentIndex + 1) % layout.panes.length;
    return layout.panes[nextIndex].id;
  }

  /**
   * Get previous pane for Shift+Tab navigation
   */
  getPreviousPane() {
    const layout = this.calculateLayout();
    const currentIndex = layout.panes.findIndex(p => p.focused);
    const prevIndex = currentIndex === 0 ? layout.panes.length - 1 : currentIndex - 1;
    return layout.panes[prevIndex].id;
  }

  /**
   * Get layout information for debugging
   */
  getLayoutInfo() {
    const preset = this.getCurrentPreset();
    const layout = this.calculateLayout();
    
    return {
      preset: this.currentPreset,
      presetConfig: preset,
      terminalSize: this.terminalDimensions,
      layout: layout,
      focusedPane: this.focusedPane,
      availablePresets: this.getAvailablePresets()
    };
  }
}

export default LayoutManager;
