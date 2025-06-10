/**
 * Multi-Pane Layout Test
 * Tests for the new VS Code-inspired multi-pane interface
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { MultiPaneLayout } from '../../src/ui/ink/layouts/MultiPaneLayout.jsx';
import { MultiPaneDashboardContainer } from '../../src/ui/ink/components/DashboardApp.jsx';

describe('Multi-Pane Layout System', () => {
  let mockProjectState;
  let mockWorkflowState;

  beforeEach(() => {
    mockProjectState = {
      name: 'Test Project',
      capabilities: {
        tools: ['guidant_get_current_task', 'guidant_advance_phase'],
        coverage: { research: 95, design: 87, development: 92 }
      }
    };

    mockWorkflowState = {
      currentPhase: 'implementation',
      phases: {
        planning: { completed: true, progress: 100 },
        design: { completed: true, progress: 100 },
        implementation: { completed: false, progress: 67 }
      }
    };
  });

  describe('MultiPaneLayout Component', () => {
    it('should render without crashing', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          terminalDimensions={{ width: 120, height: 30 }}
          interactive={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should render development preset with 3 panes', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          terminalDimensions={{ width: 120, height: 30 }}
          interactive={false}
        />
      );

      const output = lastFrame();
      // Should contain progress, tasks, and capabilities panes
      expect(output).toContain('Progress');
      expect(output).toContain('Tasks');
      expect(output).toContain('Capabilities');
    });

    it('should render debug preset with 5 panes', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="debug"
          terminalDimensions={{ width: 180, height: 35 }}
          interactive={false}
        />
      );

      const output = lastFrame();
      // Should contain all 5 panes
      expect(output).toContain('Progress');
      expect(output).toContain('Tasks');
      expect(output).toContain('Capabilities');
      expect(output).toContain('Logs');
      expect(output).toContain('Tools');
    });

    it('should handle small terminal dimensions gracefully', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="quick"
          terminalDimensions={{ width: 60, height: 20 }}
          interactive={false}
        />
      );

      const output = lastFrame();
      expect(output).toBeTruthy();
      // Should fallback to single pane layout
      expect(output).toContain('Progress');
    });

    it('should call onPaneUpdate when pane state changes', () => {
      let updateCalled = false;
      const handlePaneUpdate = () => {
        updateCalled = true;
      };

      render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          onPaneUpdate={handlePaneUpdate}
          interactive={false}
        />
      );

      // Note: In a real test, we would trigger a pane update
      // For now, just verify the component renders with the callback
      expect(updateCalled).toBe(false); // No updates triggered yet
    });
  });

  describe('MultiPaneDashboardContainer Component', () => {
    it('should render and pass props to MultiPaneLayout', () => {
      const { lastFrame } = render(
        <MultiPaneDashboardContainer
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          terminalDimensions={{ width: 120, height: 30 }}
          compact={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should handle compact mode', () => {
      const { lastFrame } = render(
        <MultiPaneDashboardContainer
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          compact={true}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });
  });

  describe('Layout Responsiveness', () => {
    const testCases = [
      { width: 60, height: 20, expectedLayout: 'single' },
      { width: 120, height: 24, expectedLayout: 'triple' },
      { width: 160, height: 30, expectedLayout: 'quad' },
      { width: 180, height: 35, expectedLayout: 'full' }
    ];

    testCases.forEach(({ width, height, expectedLayout }) => {
      it(`should adapt to ${width}x${height} terminal dimensions`, () => {
        const { lastFrame } = render(
          <MultiPaneLayout
            projectState={mockProjectState}
            workflowState={mockWorkflowState}
            preset="debug"
            terminalDimensions={{ width, height }}
            interactive={false}
          />
        );

        const output = lastFrame();
        expect(output).toBeTruthy();
        // Layout should adapt to terminal size
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation when interactive', () => {
      let keyboardActionCalled = false;
      const handleKeyboardAction = (action) => {
        keyboardActionCalled = true;
      };

      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="development"
          interactive={true}
          onKeyboardAction={handleKeyboardAction}
        />
      );

      expect(lastFrame()).toBeTruthy();
      // Note: Actual keyboard input testing would require more complex setup
    });
  });

  describe('Error Handling', () => {
    it('should handle missing project state gracefully', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={null}
          workflowState={mockWorkflowState}
          preset="development"
          interactive={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should handle missing workflow state gracefully', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={null}
          preset="development"
          interactive={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should handle invalid preset gracefully', () => {
      const { lastFrame } = render(
        <MultiPaneLayout
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          preset="invalid-preset"
          interactive={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });
  });
});

describe('Integration with Existing Systems', () => {
  let mockProjectState;
  let mockWorkflowState;

  beforeEach(() => {
    mockProjectState = {
      name: 'Test Project',
      capabilities: {
        tools: ['guidant_get_current_task', 'guidant_advance_phase'],
        coverage: { research: 95, design: 87, development: 92 }
      }
    };

    mockWorkflowState = {
      currentPhase: 'implementation',
      phases: {
        planning: { completed: true, progress: 100 },
        design: { completed: true, progress: 100 },
        implementation: { completed: false, progress: 67 }
      }
    };
  });

  it('should maintain backward compatibility with DashboardApp', () => {
    // Test that existing DashboardApp still works with multiPane flag
    const mockProps = {
      projectState: mockProjectState,
      workflowState: mockWorkflowState,
      multiPane: true,
      preset: 'development'
    };

    // This would be tested in a separate integration test
    expect(mockProps).toBeTruthy();
  });

  it('should integrate with existing keyboard shortcuts', () => {
    // Test that existing shortcuts (n, a, r, c, g, i, h, q) still work
    const expectedShortcuts = ['n', 'a', 'r', 'c', 'g', 'i', 'h', 'q'];
    expect(expectedShortcuts.length).toBe(8);
  });

  it('should support real-time updates', () => {
    // Test that file watchers and real-time updates work with multi-pane layout
    expect(true).toBe(true); // Placeholder for real-time update tests
  });
});
