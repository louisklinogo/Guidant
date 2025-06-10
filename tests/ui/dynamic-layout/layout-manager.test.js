/**
 * Layout Manager Tests
 * Comprehensive testing for the Dynamic Terminal Layout System
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { LayoutManager } from '../../../src/ui/ink/layout/LayoutManager.js';
import { LAYOUT_PRESETS } from '../../../src/ui/ink/layout/presets/index.js';

describe('LayoutManager', () => {
  let layoutManager;
  
  beforeEach(() => {
    // Mock terminal dimensions
    process.stdout.columns = 120;
    process.stdout.rows = 30;
    
    layoutManager = new LayoutManager({
      preset: 'development',
      terminalDimensions: { width: 120, height: 30 }
    });
  });

  afterEach(() => {
    layoutManager = null;
  });

  describe('Initialization', () => {
    it('should initialize with default preset', () => {
      const manager = new LayoutManager();
      expect(manager.currentPreset).toBe('development');
    });

    it('should initialize with custom preset', () => {
      const manager = new LayoutManager({ preset: 'quick' });
      expect(manager.currentPreset).toBe('quick');
    });

    it('should fallback to development for invalid preset', () => {
      const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
      const manager = new LayoutManager({ preset: 'invalid' });

      expect(manager.currentPreset).toBe('development');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid preset 'invalid'")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Terminal Dimensions', () => {
    it('should get current terminal dimensions', () => {
      const dimensions = layoutManager.getTerminalDimensions();
      expect(dimensions).toEqual({ width: 120, height: 30 });
    });

    it('should update terminal dimensions', () => {
      layoutManager.updateTerminalDimensions({ width: 160, height: 40 });
      expect(layoutManager.terminalDimensions).toEqual({ width: 160, height: 40 });
    });

    it('should clear layout cache on dimension update', () => {
      // Calculate layout to populate cache
      layoutManager.calculateLayout();
      expect(layoutManager.layoutCache.size).toBeGreaterThan(0);
      
      // Update dimensions should clear cache
      layoutManager.updateTerminalDimensions({ width: 160, height: 40 });
      expect(layoutManager.layoutCache.size).toBe(0);
    });
  });

  describe('Preset Management', () => {
    it('should set valid preset', () => {
      const result = layoutManager.setPreset('quick');
      expect(result).toBe('quick');
      expect(layoutManager.currentPreset).toBe('quick');
    });

    it('should throw error for invalid preset', () => {
      expect(() => {
        layoutManager.setPreset('invalid');
      }).toThrow('Invalid layout preset: invalid');
    });

    it('should fallback to compatible preset for small terminal', () => {
      const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
      layoutManager.updateTerminalDimensions({ width: 70, height: 20 });

      const result = layoutManager.setPreset('debug');
      expect(result).toBe('quick'); // Should fallback to quick mode
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should get current preset configuration', () => {
      layoutManager.setPreset('development');
      const preset = layoutManager.getCurrentPreset();
      expect(preset).toEqual(LAYOUT_PRESETS.development);
    });
  });

  describe('Layout Calculations', () => {
    it('should calculate single layout for quick mode', () => {
      layoutManager.setPreset('quick');
      const layout = layoutManager.calculateLayout();
      
      expect(layout.type).toBe('single');
      expect(layout.panes).toHaveLength(1);
      expect(layout.panes[0].id).toBe('progress');
      expect(layout.panes[0].focused).toBe(true);
    });

    it('should calculate triple layout for development mode', () => {
      layoutManager.setPreset('development');
      const layout = layoutManager.calculateLayout();
      
      expect(layout.type).toBe('triple');
      expect(layout.panes).toHaveLength(3);
      expect(layout.panes.map(p => p.id)).toEqual(['progress', 'tasks', 'capabilities']);
      expect(layout.panes[0].focused).toBe(true);
    });

    it('should calculate quad layout for monitoring mode', () => {
      layoutManager.updateTerminalDimensions({ width: 160, height: 30 });
      layoutManager.setPreset('monitoring');
      const layout = layoutManager.calculateLayout();
      
      expect(layout.type).toBe('quad');
      expect(layout.panes).toHaveLength(4);
      expect(layout.panes.map(p => p.id)).toEqual(['progress', 'tasks', 'logs', 'tools']);
    });

    it('should calculate full layout for debug mode', () => {
      layoutManager.updateTerminalDimensions({ width: 180, height: 35 });
      layoutManager.setPreset('debug');
      const layout = layoutManager.calculateLayout();
      
      expect(layout.type).toBe('full');
      expect(layout.panes).toHaveLength(5);
      expect(layout.panes.map(p => p.id)).toEqual(['progress', 'tasks', 'capabilities', 'logs', 'tools']);
    });

    it('should cache layout calculations', () => {
      const layout1 = layoutManager.calculateLayout();
      const layout2 = layoutManager.calculateLayout();
      
      expect(layout1).toBe(layout2); // Should be same object reference (cached)
      expect(layoutManager.layoutCache.size).toBe(1);
    });

    it('should clear cache when preset changes', () => {
      layoutManager.calculateLayout();
      expect(layoutManager.layoutCache.size).toBe(1);
      
      layoutManager.setPreset('quick');
      expect(layoutManager.layoutCache.size).toBe(0);
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      layoutManager.setPreset('development'); // 3 panes
    });

    it('should set focused pane', () => {
      const result = layoutManager.setFocusedPane('tasks');
      expect(result).toBe(true);
      expect(layoutManager.focusedPane).toBe('tasks');
    });

    it('should return false for invalid pane', () => {
      const result = layoutManager.setFocusedPane('invalid');
      expect(result).toBe(false);
    });

    it('should get next pane for tab navigation', () => {
      layoutManager.setFocusedPane('progress');
      const nextPane = layoutManager.getNextPane();
      expect(nextPane).toBe('tasks');
    });

    it('should wrap around to first pane', () => {
      layoutManager.setFocusedPane('capabilities');
      const nextPane = layoutManager.getNextPane();
      expect(nextPane).toBe('progress');
    });

    it('should get previous pane for shift+tab navigation', () => {
      layoutManager.setFocusedPane('tasks');
      const prevPane = layoutManager.getPreviousPane();
      expect(prevPane).toBe('progress');
    });

    it('should wrap around to last pane', () => {
      layoutManager.setFocusedPane('progress');
      const prevPane = layoutManager.getPreviousPane();
      expect(prevPane).toBe('capabilities');
    });
  });

  describe('Available Presets', () => {
    it('should return available presets for large terminal', () => {
      layoutManager.updateTerminalDimensions({ width: 200, height: 50 });
      const available = layoutManager.getAvailablePresets();
      
      expect(available).toHaveLength(4); // All presets should be available
      expect(available.map(p => p.name)).toEqual(['quick', 'development', 'monitoring', 'debug']);
    });

    it('should filter presets for small terminal', () => {
      layoutManager.updateTerminalDimensions({ width: 70, height: 20 });
      const available = layoutManager.getAvailablePresets();
      
      expect(available).toHaveLength(1); // Only quick should be available
      expect(available[0].name).toBe('quick');
    });

    it('should mark current preset', () => {
      layoutManager.setPreset('development');
      const available = layoutManager.getAvailablePresets();
      
      const current = available.find(p => p.current);
      expect(current.name).toBe('development');
    });
  });

  describe('Layout Information', () => {
    it('should provide comprehensive layout info', () => {
      layoutManager.setPreset('development');
      layoutManager.setFocusedPane('tasks');
      
      const info = layoutManager.getLayoutInfo();
      
      expect(info).toHaveProperty('preset', 'development');
      expect(info).toHaveProperty('presetConfig');
      expect(info).toHaveProperty('terminalSize');
      expect(info).toHaveProperty('layout');
      expect(info).toHaveProperty('focusedPane', 'tasks');
      expect(info).toHaveProperty('availablePresets');
    });
  });

  describe('Performance', () => {
    it('should calculate layout within performance target', () => {
      const start = performance.now();
      layoutManager.calculateLayout();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // Should be under 50ms
    });

    it('should handle multiple rapid preset changes', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const presets = ['quick', 'development'];
        layoutManager.setPreset(presets[i % 2]);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should handle 100 changes in under 1s
    });
  });
});
