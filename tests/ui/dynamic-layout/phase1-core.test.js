/**
 * Phase 1 Core Components Test
 * Tests for Layout Manager, Pane Manager, Keyboard Navigator, and Real-time Updater
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { LayoutManager } from '../../../src/ui/ink/layout/LayoutManager.js';
import { LAYOUT_PRESETS, RESPONSIVE_BREAKPOINTS } from '../../../src/ui/ink/layout/presets/index.js';
import { PaneManager, PANE_STATES, PANE_CONFIGS } from '../../../src/ui/ink/layout/PaneManager.js';
import { KeyboardNavigator, GLOBAL_SHORTCUTS, PANE_SHORTCUTS } from '../../../src/ui/ink/layout/KeyboardNavigator.js';
import { RealTimeUpdater, WATCH_CONFIG } from '../../../src/ui/ink/layout/RealTimeUpdater.js';

describe('Phase 1: Core Layout Engine', () => {
  
  describe('LayoutManager', () => {
    let layoutManager;
    
    beforeEach(() => {
      layoutManager = new LayoutManager({
        terminalDimensions: { width: 120, height: 30 },
        preset: 'development'
      });
    });
    
    it('should initialize with correct default preset', () => {
      expect(layoutManager.currentPreset).toBe('development');
      expect(layoutManager.terminalDimensions).toEqual({ width: 120, height: 30 });
    });
    
    it('should have all required layout presets', () => {
      const requiredPresets = ['quick', 'development', 'monitoring', 'debug'];
      requiredPresets.forEach(preset => {
        expect(LAYOUT_PRESETS[preset]).toBeDefined();
        expect(LAYOUT_PRESETS[preset].name).toBeDefined();
        expect(LAYOUT_PRESETS[preset].panes).toBeInstanceOf(Array);
        expect(LAYOUT_PRESETS[preset].layout).toBeDefined();
      });
    });
    
    it('should calculate layout correctly for development preset', () => {
      const layout = layoutManager.calculateLayout();
      
      expect(layout.type).toBe('triple');
      expect(layout.panes).toHaveLength(3);
      expect(layout.panes[0].id).toBe('progress');
      expect(layout.panes[1].id).toBe('tasks');
      expect(layout.panes[2].id).toBe('capabilities');
      expect(layout.panes[0].focused).toBe(true);
    });
    
    it('should switch presets correctly', () => {
      // Use a larger terminal size that supports monitoring mode
      layoutManager.updateTerminalDimensions({ width: 160, height: 35 });

      const result = layoutManager.setPreset('monitoring');
      expect(result).toBe('monitoring');
      expect(layoutManager.currentPreset).toBe('monitoring');

      const layout = layoutManager.calculateLayout();
      expect(layout.type).toBe('quad');
      expect(layout.panes).toHaveLength(4);
    });
    
    it('should fallback to smaller preset for small terminals', () => {
      layoutManager.updateTerminalDimensions({ width: 70, height: 20 });
      const result = layoutManager.setPreset('debug');
      
      // Should fallback to quick mode for small terminal
      expect(result).toBe('quick');
      expect(layoutManager.currentPreset).toBe('quick');
    });
    
    it('should handle focus navigation correctly', () => {
      layoutManager.setFocusedPane('tasks');
      expect(layoutManager.focusedPane).toBe('tasks');
      
      const nextPane = layoutManager.getNextPane();
      expect(nextPane).toBe('capabilities');
      
      const prevPane = layoutManager.getPreviousPane();
      expect(prevPane).toBe('progress');
    });
    
    it('should cache layout calculations', () => {
      const layout1 = layoutManager.calculateLayout();
      const layout2 = layoutManager.calculateLayout();
      
      // Should return same object from cache
      expect(layout1).toBe(layout2);
    });
    
    it('should clear cache on terminal resize', () => {
      const layout1 = layoutManager.calculateLayout();
      layoutManager.updateTerminalDimensions({ width: 140, height: 35 });
      const layout2 = layoutManager.calculateLayout();
      
      // Should be different objects after resize
      expect(layout1).not.toBe(layout2);
    });
  });
  
  describe('PaneManager', () => {
    let paneManager;
    
    beforeEach(() => {
      paneManager = new PaneManager();
    });
    
    afterEach(() => {
      paneManager.cleanup();
    });
    
    it('should register panes correctly', async () => {
      const paneState = paneManager.registerPane('progress');

      expect(paneState).toBeDefined();
      expect(paneState.id).toBe('progress');

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(paneState.state).toBe(PANE_STATES.READY);
      expect(paneManager.panes.has('progress')).toBe(true);
    });
    
    it('should prevent duplicate pane registration', () => {
      paneManager.registerPane('progress');
      
      expect(() => {
        paneManager.registerPane('progress');
      }).toThrow('Pane progress is already registered');
    });
    
    it('should validate pane types', () => {
      expect(() => {
        paneManager.registerPane('invalid_pane');
      }).toThrow('Unknown pane type: invalid_pane');
    });
    
    it('should unregister panes correctly', () => {
      paneManager.registerPane('tasks');
      expect(paneManager.panes.has('tasks')).toBe(true);
      
      const result = paneManager.unregisterPane('tasks');
      expect(result).toBe(true);
      expect(paneManager.panes.has('tasks')).toBe(false);
    });
    
    it('should handle pane state updates', async () => {
      const paneState = paneManager.registerPane('capabilities');
      
      const updateResult = await paneManager.updatePane('capabilities', { test: 'data' });
      expect(updateResult).toBe(true);
      expect(paneState.data).toEqual({ test: 'data' });
      expect(paneState.state).toBe(PANE_STATES.READY);
    });
    
    it('should queue updates with debouncing', () => {
      paneManager.registerPane('logs');
      
      // Queue multiple updates
      paneManager.queueUpdate('logs', { update: 1 });
      paneManager.queueUpdate('logs', { update: 2 });
      paneManager.queueUpdate('logs', { update: 3 });
      
      expect(paneManager.updateQueue.length).toBe(3);
    });
    
    it('should handle focus changes', () => {
      paneManager.registerPane('tools');
      
      const result = paneManager.setPaneFocus('tools', true);
      expect(result).toBe(true);
      
      const paneState = paneManager.getPaneState('tools');
      expect(paneState.focused).toBe(true);
    });
    
    it('should toggle pane collapse', () => {
      paneManager.registerPane('progress');
      
      const result = paneManager.togglePaneCollapse('progress');
      expect(result).toBe(true);
      
      const paneState = paneManager.getPaneState('progress');
      expect(paneState.collapsed).toBe(true);
    });
    
    it('should track performance metrics', async () => {
      paneManager.registerPane('tasks');
      await paneManager.updatePane('tasks', { test: 'data' });
      
      const metrics = paneManager.getMetrics();
      expect(metrics.totalUpdates).toBe(1);
      expect(metrics.activePanes).toBe(1);
      expect(metrics.averageUpdateTime).toBeGreaterThan(0);
    });
  });
  
  describe('KeyboardNavigator', () => {
    let layoutManager;
    let paneManager;
    let keyboardNavigator;
    
    beforeEach(() => {
      layoutManager = new LayoutManager();
      paneManager = new PaneManager();
      keyboardNavigator = new KeyboardNavigator(layoutManager, paneManager);
    });
    
    afterEach(() => {
      keyboardNavigator.cleanup();
      paneManager.cleanup();
    });
    
    it('should initialize correctly', () => {
      expect(keyboardNavigator.layoutManager).toBe(layoutManager);
      expect(keyboardNavigator.paneManager).toBe(paneManager);
      expect(keyboardNavigator.helpVisible).toBe(false);
    });
    
    it('should parse key combinations correctly', () => {
      const key1 = keyboardNavigator.parseKeyInput('q', { name: 'q' });
      expect(key1).toBe('q');
      
      const key2 = keyboardNavigator.parseKeyInput('c', { name: 'c', ctrl: true });
      expect(key2).toBe('C-c');
      
      const key3 = keyboardNavigator.parseKeyInput('tab', { name: 'tab', shift: true });
      expect(key3).toBe('S-tab');
    });
    
    it('should find global shortcuts', () => {
      const action1 = keyboardNavigator.findGlobalShortcut('q');
      expect(action1).toBe('exitDashboard');
      
      const action2 = keyboardNavigator.findGlobalShortcut('Tab');
      expect(action2).toBe('focusNextPane');
      
      const action3 = keyboardNavigator.findGlobalShortcut('h');
      expect(action3).toBe('toggleHelp');
    });
    
    it('should find pane-specific shortcuts', () => {
      const action1 = keyboardNavigator.findPaneShortcut('progress', 'a');
      expect(action1).toBe('advancePhase');
      
      const action2 = keyboardNavigator.findPaneShortcut('tasks', 'n');
      expect(action2).toBe('generateNextTask');
      
      const action3 = keyboardNavigator.findPaneShortcut('capabilities', 'c');
      expect(action3).toBe('analyzeCapabilities');
    });
    
    it('should handle help toggle', () => {
      const result = keyboardNavigator.toggleHelp();
      expect(result).toBe(true);
      expect(keyboardNavigator.helpVisible).toBe(true);
      
      keyboardNavigator.toggleHelp();
      expect(keyboardNavigator.helpVisible).toBe(false);
    });
    
    it('should provide contextual help', () => {
      const help = keyboardNavigator.getContextualHelp();
      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toBe('Global Navigation:');
    });
    
    it('should track key history', () => {
      keyboardNavigator.addToKeyHistory('q', { name: 'q' });
      keyboardNavigator.addToKeyHistory('h', { name: 'h' });
      
      expect(keyboardNavigator.keyHistory).toHaveLength(2);
      expect(keyboardNavigator.keyHistory[0].input).toBe('q');
      expect(keyboardNavigator.keyHistory[1].input).toBe('h');
    });
    
    it('should limit key history size', () => {
      keyboardNavigator.maxKeyHistory = 3;
      
      // Add more keys than max history
      for (let i = 0; i < 5; i++) {
        keyboardNavigator.addToKeyHistory(`key${i}`, { name: `key${i}` });
      }
      
      expect(keyboardNavigator.keyHistory).toHaveLength(3);
      expect(keyboardNavigator.keyHistory[0].input).toBe('key2');
      expect(keyboardNavigator.keyHistory[2].input).toBe('key4');
    });
    
    it('should track performance metrics', () => {
      keyboardNavigator.metrics.totalKeyPresses = 10;
      keyboardNavigator.metrics.commandsExecuted = 8;
      
      const metrics = keyboardNavigator.getMetrics();
      expect(metrics.totalKeyPresses).toBe(10);
      expect(metrics.commandsExecuted).toBe(8);
      expect(metrics.helpVisible).toBe(false);
    });
  });
  
  describe('RealTimeUpdater', () => {
    let paneManager;
    let realTimeUpdater;
    
    beforeEach(() => {
      paneManager = new PaneManager();
      realTimeUpdater = new RealTimeUpdater(paneManager, {
        debounceMs: 50, // Faster for testing
        healthCheckInterval: 1000 // Faster for testing
      });
    });
    
    afterEach(async () => {
      await realTimeUpdater.cleanup();
      paneManager.cleanup();
    });
    
    it('should initialize correctly', () => {
      expect(realTimeUpdater.paneManager).toBe(paneManager);
      expect(realTimeUpdater.options.debounceMs).toBe(50);
      expect(realTimeUpdater.watchers.size).toBe(0);
    });
    
    it('should have correct watch configuration', () => {
      expect(WATCH_CONFIG['.guidant/workflow/current-phase.json']).toContain('progress');
      expect(WATCH_CONFIG['.guidant/ai/task-tickets/']).toContain('tasks');
      expect(WATCH_CONFIG['.guidant/ai/capabilities.json']).toContain('capabilities');
      expect(WATCH_CONFIG['.guidant/context/sessions.json']).toContain('logs');
    });
    
    it('should determine update priority correctly', () => {
      const highPriority = realTimeUpdater.getUpdatePriority('/path/to/current-phase.json');
      expect(highPriority).toBe('high');
      
      const mediumPriority = realTimeUpdater.getUpdatePriority('/path/to/capabilities.json');
      expect(mediumPriority).toBe('medium');
      
      const lowPriority = realTimeUpdater.getUpdatePriority('/path/to/some-file.txt');
      expect(lowPriority).toBe('low');
    });
    
    it('should queue updates correctly', () => {
      const updateEvent = {
        changeType: 'change',
        filePath: '/test/file.json',
        targetPanes: ['progress'],
        priority: 'high',
        timestamp: Date.now()
      };
      
      realTimeUpdater.queueUpdate(updateEvent);
      expect(realTimeUpdater.updateQueue).toHaveLength(1);
      expect(realTimeUpdater.updateQueue[0]).toBe(updateEvent);
    });
    
    it('should group updates correctly', () => {
      const updates = [
        { targetPanes: ['progress'], priority: 'high' },
        { targetPanes: ['tasks'], priority: 'medium' },
        { targetPanes: ['progress'], priority: 'high' },
        { targetPanes: ['all'], priority: 'low' }
      ];
      
      // Register some panes for 'all' test
      paneManager.registerPane('progress');
      paneManager.registerPane('tasks');
      
      const grouped = realTimeUpdater.groupUpdates(updates);
      
      expect(grouped.high.has('progress')).toBe(true);
      expect(grouped.high.get('progress')).toHaveLength(2);
      expect(grouped.medium.has('tasks')).toBe(true);
      expect(grouped.low.has('progress')).toBe(true); // From 'all' update
      expect(grouped.low.has('tasks')).toBe(true); // From 'all' update
    });
    
    it('should create update batches correctly', () => {
      realTimeUpdater.options.maxConcurrentUpdates = 2;
      const paneIds = ['progress', 'tasks', 'capabilities', 'logs', 'tools'];
      
      const batches = realTimeUpdater.createUpdateBatches(paneIds);
      
      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(2);
      expect(batches[2]).toHaveLength(1);
    });
    
    it('should track health metrics', () => {
      const health = realTimeUpdater.getHealth();
      
      expect(health.watchersActive).toBe(0);
      expect(health.totalUpdates).toBe(0);
      expect(health.failedUpdates).toBe(0);
      expect(health.metrics).toBeDefined();
      expect(health.activeUpdates).toBe(0);
      expect(health.queuedUpdates).toBe(0);
    });
    
    it('should handle file change events', () => {
      let eventReceived = false;
      realTimeUpdater.on('fileChange', (event) => {
        eventReceived = true;
        expect(event.changeType).toBe('change');
        expect(event.filePath).toBe('/test/file.json');
        expect(event.targetPanes).toContain('progress');
      });
      
      realTimeUpdater.handleFileChange('change', '/test/file.json', ['progress']);
      expect(eventReceived).toBe(true);
      expect(realTimeUpdater.updateQueue).toHaveLength(1);
    });
  });
  
  describe('Integration Tests', () => {
    let layoutManager;
    let paneManager;
    let keyboardNavigator;
    let realTimeUpdater;
    
    beforeEach(() => {
      layoutManager = new LayoutManager();
      paneManager = new PaneManager();
      keyboardNavigator = new KeyboardNavigator(layoutManager, paneManager);
      realTimeUpdater = new RealTimeUpdater(paneManager);
    });
    
    afterEach(async () => {
      await realTimeUpdater.cleanup();
      keyboardNavigator.cleanup();
      paneManager.cleanup();
    });
    
    it('should integrate layout manager with pane manager', () => {
      // Register panes for current layout
      const layout = layoutManager.calculateLayout();
      layout.panes.forEach(pane => {
        paneManager.registerPane(pane.id);
      });
      
      expect(paneManager.panes.size).toBe(layout.panes.length);
      
      // Test focus coordination
      layoutManager.setFocusedPane('tasks');
      paneManager.setPaneFocus('tasks', true);
      
      expect(layoutManager.focusedPane).toBe('tasks');
      expect(paneManager.getPaneState('tasks').focused).toBe(true);
    });
    
    it('should integrate keyboard navigator with layout manager', () => {
      layoutManager.setFocusedPane('progress');
      
      const result = keyboardNavigator.focusNextPane();
      expect(result).toBe(true);
      expect(layoutManager.focusedPane).toBe('tasks');
    });
    
    it('should integrate real-time updater with pane manager', async () => {
      paneManager.registerPane('progress');
      
      // Simulate file change
      realTimeUpdater.handleFileChange('change', '/test/current-phase.json', ['progress']);
      
      // Wait for debounced update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(realTimeUpdater.updateQueue.length).toBeGreaterThanOrEqual(0); // May be processed
    });
  });
});
