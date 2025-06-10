/**
 * Dynamic Dashboard Integration Tests
 * End-to-end testing for dynamic dashboard commands and fallback scenarios
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { showAvailablePresets } from '../../src/cli/commands/dynamic-dashboard.js';
import { LAYOUT_PRESETS } from '../../src/ui/ink/layout/presets/index.js';
import { LayoutManager } from '../../src/ui/ink/layout/LayoutManager.js';

describe('Dynamic Dashboard Integration', () => {
  let consoleSpy;

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: spyOn(console, 'log').mockImplementation(() => {}),
      warn: spyOn(console, 'warn').mockImplementation(() => {}),
      error: spyOn(console, 'error').mockImplementation(() => {})
    };

    // Mock terminal dimensions
    process.stdout.columns = 120;
    process.stdout.rows = 30;
  });

  afterEach(() => {
    // Restore all mocks
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Layout Preset Configuration', () => {
    it('should have all required presets defined', () => {
      expect(LAYOUT_PRESETS).toBeDefined();
      expect(LAYOUT_PRESETS.quick).toBeDefined();
      expect(LAYOUT_PRESETS.development).toBeDefined();
      expect(LAYOUT_PRESETS.monitoring).toBeDefined();
      expect(LAYOUT_PRESETS.debug).toBeDefined();
    });

    it('should have valid preset configurations', () => {
      Object.entries(LAYOUT_PRESETS).forEach(([name, preset]) => {
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.panes).toBeDefined();
        expect(Array.isArray(preset.panes)).toBe(true);
        expect(preset.layout).toBeDefined();
        expect(preset.minWidth).toBeGreaterThan(0);
        expect(preset.minHeight).toBeGreaterThan(0);
        expect(preset.priority).toBeDefined();
      });
    });

    it('should have priority weights that sum to 1.0', () => {
      Object.entries(LAYOUT_PRESETS).forEach(([name, preset]) => {
        const totalPriority = Object.values(preset.priority).reduce((sum, weight) => sum + weight, 0);
        expect(Math.abs(totalPriority - 1.0)).toBeLessThan(0.01);
      });
    });
  });

  describe('Layout Manager Integration', () => {
    it('should create layout manager with valid preset', () => {
      const layoutManager = new LayoutManager({ preset: 'development' });
      expect(layoutManager.currentPreset).toBe('development');
    });

    it('should calculate layout for different presets', () => {
      const layoutManager = new LayoutManager({
        preset: 'development',
        terminalDimensions: { width: 120, height: 30 }
      });

      const layout = layoutManager.calculateLayout();
      expect(layout).toBeDefined();
      expect(layout.type).toBe('triple');
      expect(layout.panes).toHaveLength(3);
    });

    it('should handle terminal size constraints', () => {
      const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
      const layoutManager = new LayoutManager({
        preset: 'development',
        terminalDimensions: { width: 70, height: 20 }
      });

      // Try to set a preset that's too large for the terminal
      const result = layoutManager.setPreset('debug');

      // Should fallback to a compatible preset
      expect(result).toBe('quick');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });



  describe('Available Presets Display', () => {
    it('should show presets information', () => {
      process.stdout.columns = 200;
      process.stdout.rows = 50;

      showAvailablePresets();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Available Layout Presets')
      );
    });

    it('should handle small terminal display', () => {
      process.stdout.columns = 70;
      process.stdout.rows = 20;

      showAvailablePresets();

      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });
});
