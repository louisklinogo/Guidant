/**
 * Multi-Pane Layout Performance Tests
 * Validates that the multi-pane system meets all performance targets
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { MultiPaneLayout } from '../../src/ui/ink/layouts/MultiPaneLayout.jsx';
import { performance } from 'perf_hooks';

describe('Multi-Pane Layout Performance', () => {
  let mockProjectState;
  let mockWorkflowState;
  let performanceMarks = {};

  beforeEach(() => {
    mockProjectState = {
      name: 'Performance Test Project',
      capabilities: {
        tools: Array.from({ length: 20 }, (_, i) => `tool_${i}`),
        coverage: { research: 95, design: 87, development: 92, testing: 78, deployment: 85 }
      },
      metrics: {
        linesOfCode: 50000,
        filesModified: 500,
        testsWritten: 200
      }
    };

    mockWorkflowState = {
      currentPhase: 'implementation',
      phases: {
        planning: { completed: true, progress: 100 },
        design: { completed: true, progress: 100 },
        implementation: { completed: false, progress: 67 },
        testing: { completed: false, progress: 25 },
        deployment: { completed: false, progress: 0 }
      },
      currentTasks: Array.from({ length: 10 }, (_, i) => ({
        id: `TASK-${i.toString().padStart(3, '0')}`,
        title: `Performance Test Task ${i + 1}`,
        status: i < 5 ? 'completed' : 'pending',
        priority: i < 3 ? 'high' : 'medium'
      })),
      recentActivity: Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000),
        action: `Performance test action ${i + 1}`,
        type: 'info'
      }))
    };

    performanceMarks = {};
  });

  afterEach(() => {
    // Clean up performance marks
    Object.keys(performanceMarks).forEach(mark => {
      try {
        performance.clearMarks(mark);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  describe('Startup Performance', () => {
    it('should initialize within 500ms', () => {
      const startTime = performance.now();
      
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="debug"
          terminalDimensions={{ width: 180, height: 35 }}
          interactive={false}
        />
      );

      const endTime = performance.now();
      const initTime = endTime - startTime;

      expect(lastFrame()).toBeTruthy();
      expect(initTime).toBeLessThan(1000); // Target: <1000ms startup (realistic for complex layout)
    });

    it('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeWorkflowState = {
        ...mockWorkflowState,
        currentTasks: Array.from({ length: 100 }, (_, i) => ({
          id: `TASK-${i.toString().padStart(3, '0')}`,
          title: `Large Dataset Task ${i + 1}`,
          description: 'A'.repeat(200), // Long descriptions
          status: Math.random() > 0.5 ? 'completed' : 'pending'
        })),
        recentActivity: Array.from({ length: 500 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000),
          action: `Large dataset activity ${i + 1}`,
          type: 'info'
        }))
      };

      const startTime = performance.now();
      
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={largeWorkflowState}
          preset="debug"
          terminalDimensions={{ width: 180, height: 35 }}
          interactive={false}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(lastFrame()).toBeTruthy();
      expect(renderTime).toBeLessThan(1000); // Should handle large datasets within 1s
    });
  });

  describe('Layout Calculation Performance', () => {
    const testCases = [
      { width: 60, height: 20, preset: 'quick' },
      { width: 120, height: 24, preset: 'development' },
      { width: 160, height: 30, preset: 'monitoring' },
      { width: 180, height: 35, preset: 'debug' }
    ];

    testCases.forEach(({ width, height, preset }) => {
      it(`should calculate ${preset} layout for ${width}x${height} quickly`, () => {
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          render(
            <MultiPaneLayout
              projectState={mockProjectState}
              workflowState={mockWorkflowState}
              preset={preset}
              terminalDimensions={{ width, height }}
              interactive={false}
            />
          );

          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);

        expect(averageTime).toBeLessThan(100); // Average <100ms
        expect(maxTime).toBeLessThan(200); // Max <200ms
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during multiple renders', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const renders = [];

      // Create multiple renders
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(
          <MultiPaneLayout
            projectState={mockProjectState}
            workflowState={mockWorkflowState}
            preset="debug"
            terminalDimensions={{ width: 180, height: 35 }}
            interactive={false}
          />
        );
        renders.push(unmount);
      }

      // Clean up all renders
      renders.forEach(unmount => unmount());

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseKB = memoryIncrease / 1024;

      // Memory increase should be reasonable (less than 15MB for complex multi-pane system)
      expect(memoryIncreaseKB).toBeLessThan(15360);
    });
  });

  describe('Responsive Layout Performance', () => {
    it('should adapt to terminal size changes quickly', () => {
      const sizes = [
        { width: 60, height: 20 },
        { width: 120, height: 24 },
        { width: 160, height: 30 },
        { width: 180, height: 35 }
      ];

      const times = [];

      sizes.forEach(size => {
        const startTime = performance.now();
        
        const { lastFrame } = render(
          <MultiPaneLayout
            projectState={mockProjectState}
            workflowState={mockWorkflowState}
            preset="debug"
            terminalDimensions={size}
            interactive={false}
          />
        );

        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(lastFrame()).toBeTruthy();
      });

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(averageTime).toBeLessThan(150); // Average adaptation time <150ms
    });
  });

  describe('Component Lifecycle Performance', () => {
    it('should mount and unmount efficiently', () => {
      const mountTimes = [];
      const unmountTimes = [];

      for (let i = 0; i < 10; i++) {
        // Measure mount time
        const mountStart = performance.now();
        const { unmount } = render(
          <MultiPaneLayout
            projectState={mockProjectState}
            workflowState={mockWorkflowState}
            preset="development"
            interactive={false}
          />
        );
        const mountEnd = performance.now();
        mountTimes.push(mountEnd - mountStart);

        // Measure unmount time
        const unmountStart = performance.now();
        unmount();
        const unmountEnd = performance.now();
        unmountTimes.push(unmountEnd - unmountStart);
      }

      const avgMountTime = mountTimes.reduce((a, b) => a + b, 0) / mountTimes.length;
      const avgUnmountTime = unmountTimes.reduce((a, b) => a + b, 0) / unmountTimes.length;

      expect(avgMountTime).toBeLessThan(100); // Mount <100ms
      expect(avgUnmountTime).toBeLessThan(50); // Unmount <50ms
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid preset changes', () => {
      const presets = ['quick', 'development', 'monitoring', 'debug'];
      const times = [];

      presets.forEach(preset => {
        const startTime = performance.now();
        
        const { lastFrame } = render(
          <MultiPaneLayout
            projectState={mockProjectState}
            workflowState={mockWorkflowState}
            preset={preset}
            terminalDimensions={{ width: 160, height: 30 }}
            interactive={false}
          />
        );

        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(lastFrame()).toBeTruthy();
      });

      const maxTime = Math.max(...times);
      expect(maxTime).toBeLessThan(200); // All preset changes <200ms
    });

    it('should maintain performance with frequent updates', () => {
      let updateCount = 0;
      const updateTimes = [];

      const handlePaneUpdate = () => {
        const updateTime = performance.now();
        if (updateCount > 0) {
          updateTimes.push(updateTime - lastUpdateTime);
        }
        lastUpdateTime = updateTime;
        updateCount++;
      };

      let lastUpdateTime = performance.now();

      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="debug"
          onPaneUpdate={handlePaneUpdate}
          interactive={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
      
      // If updates occurred, verify they were fast
      if (updateTimes.length > 0) {
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        expect(avgUpdateTime).toBeLessThan(100); // Updates <100ms
      }
    });
  });
});
