/**
 * TaskFocusDisplay Component Test Suite
 * Tests for UX-006: Single-Task Focus Display implementation
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createTaskFocusDisplay } from '../../src/ui/components/TaskFocusDisplay.js';

describe('TaskFocusDisplay Component', () => {
  let mockTask;
  let mockWorkflowContext;

  beforeEach(() => {
    // Mock task data
    mockTask = {
      id: 'UX-006',
      title: 'Implement TaskMaster\'s Single-Task Focus with Workflow Context',
      description: 'Replace multi-pane complexity with TaskMaster\'s proven single-task focus display, enhanced with Guidant\'s workflow context and phase information.',
      priority: 'high',
      status: 'in-progress',
      phase: 'implementation',
      progress: 60,
      estimatedHours: 8,
      actualHours: 5,
      dependencies: [
        { id: 'UX-004', title: 'Boxen UI system implemented', status: 'completed' },
        { id: 'UX-005', title: 'Progressive onboarding added', status: 'completed' }
      ],
      blockers: []
    };

    // Mock workflow context
    mockWorkflowContext = {
      currentPhase: 'implementation',
      totalPhases: 6,
      workflowType: 'standard',
      overallProgress: 50,
      nextPhase: 'deployment',
      readyToAdvance: false
    };
  });

  describe('Basic Display Functionality', () => {
    it('should render task focus display with complete task data', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('📋 Task Focus');
      expect(result).toContain(mockTask.title);
      expect(result).toContain(mockTask.id);
      expect(result).toContain('HIGH');
      expect(result).toContain('IN-PROGRESS');
    });

    it('should handle missing task gracefully', () => {
      const result = createTaskFocusDisplay(null, mockWorkflowContext);
      
      expect(result).toContain('No current task available');
      expect(result).toContain('📋 Task Focus');
    });

    it('should handle missing workflow context gracefully', () => {
      const result = createTaskFocusDisplay(mockTask, {});
      
      expect(result).toContain(mockTask.title);
      expect(result).toContain(mockTask.id);
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version when compact option is true', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { compact: true });
      
      expect(result).toContain(mockTask.title);
      expect(result).toContain('📋 Current Task');
      // Should not contain detailed sections in compact mode
      expect(result).not.toContain('🔄 Workflow Context');
    });

    it('should show dependencies in compact mode', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { compact: true });
      
      expect(result).toContain('🔗 Dependencies');
      expect(result).toContain('Boxen UI system implemented');
    });
  });

  describe('Task Details Section', () => {
    it('should display task description', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('Description:');
      expect(result).toContain(mockTask.description);
    });

    it('should display progress bar', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('Progress:');
      expect(result).toContain('60%');
    });

    it('should display time tracking information', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('Time:');
      expect(result).toContain('8h estimated');
      expect(result).toContain('5h spent');
    });

    it('should display blockers when present', () => {
      const taskWithBlockers = {
        ...mockTask,
        blockers: ['Waiting for API documentation', 'Dependency on external service']
      };
      
      const result = createTaskFocusDisplay(taskWithBlockers, mockWorkflowContext);
      
      expect(result).toContain('⚠️ Blockers:');
      expect(result).toContain('Waiting for API documentation');
      expect(result).toContain('Dependency on external service');
    });
  });

  describe('Workflow Context Section', () => {
    it('should display workflow context in full mode', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { showPhaseContext: true });

      expect(result).toContain('🔄 Workflow Context');
      expect(result).toContain('Current Phase:');
      expect(result).toContain('implementation');
      expect(result).toContain('Next Phase:');
      expect(result).toContain('deployment');
    });

    it('should hide workflow context when showPhaseContext is false', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { showPhaseContext: false });
      
      expect(result).not.toContain('🔄 Workflow Context');
    });

    it('should display overall progress', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('Overall Progress:');
      expect(result).toContain('50%');
    });
  });

  describe('Dependencies Section', () => {
    it('should display dependencies with status icons', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);

      expect(result).toContain('🔗 Dependencies');
      expect(result).toContain('Boxen UI system implemented');
      expect(result).toContain('Progressive onboarding added');
      expect(result).toContain('✅');
    });

    it('should hide dependencies when showDependencies is false', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { showDependencies: false });
      
      expect(result).not.toContain('🔗 Dependencies');
    });

    it('should handle blocked dependencies', () => {
      const taskWithBlockedDeps = {
        ...mockTask,
        dependencies: [
          { id: 'DEP-001', title: 'Blocked dependency', status: 'blocked' }
        ]
      };
      
      const result = createTaskFocusDisplay(taskWithBlockedDeps, mockWorkflowContext);
      
      expect(result).toContain('🚫');
    });
  });

  describe('Action Suggestions Section', () => {
    it('should display action suggestions in full mode', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { showActions: true });
      
      expect(result).toContain('Suggested Next Actions');
    });

    it('should hide action suggestions when showActions is false', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, { showActions: false });
      
      expect(result).not.toContain('Suggested Next Actions');
    });

    it('should generate context-appropriate actions for in-progress tasks', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).toContain('Report progress on current work');
      expect(result).toContain('Mark task as completed');
    });

    it('should generate different actions for pending tasks', () => {
      const pendingTask = { ...mockTask, status: 'pending' };
      const result = createTaskFocusDisplay(pendingTask, mockWorkflowContext);
      
      expect(result).toContain('Start working on this task');
    });
  });

  describe('Phase Transition Guidance', () => {
    it('should show phase transition guidance when ready to advance', () => {
      const readyContext = { ...mockWorkflowContext, readyToAdvance: true };
      const result = createTaskFocusDisplay(mockTask, readyContext);
      
      expect(result).toContain('🚀 Phase Transition Ready');
      expect(result).toContain('Ready to advance to "deployment"');
      expect(result).toContain('guidant advance-phase');
    });

    it('should not show phase transition guidance when not ready', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      expect(result).not.toContain('🚀 Phase Transition Ready');
    });
  });

  describe('Error Handling', () => {
    it('should handle display errors gracefully', () => {
      // Create a task that might cause errors
      const problematicTask = {
        ...mockTask,
        dependencies: null // This might cause issues
      };
      
      const result = createTaskFocusDisplay(problematicTask, mockWorkflowContext);
      
      // Should still render something, not crash
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should show error message for display failures', () => {
      // Mock a scenario that would cause an error in rendering
      const result = createTaskFocusDisplay(undefined, mockWorkflowContext);
      
      expect(result).toContain('No current task available');
    });
  });

  describe('SOLID Principles Compliance', () => {
    it('should follow Single Responsibility Principle - only handle display', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext);
      
      // Function should only return display string, not modify data
      expect(typeof result).toBe('string');
      expect(mockTask).toEqual(expect.objectContaining({
        id: 'UX-006',
        title: 'Implement TaskMaster\'s Single-Task Focus with Workflow Context'
      }));
    });

    it('should be extensible for different task types (Open/Closed Principle)', () => {
      const customTask = {
        ...mockTask,
        type: 'custom',
        customField: 'custom value'
      };
      
      const result = createTaskFocusDisplay(customTask, mockWorkflowContext);
      
      // Should handle custom task without breaking
      expect(result).toContain(customTask.title);
    });

    it('should show only relevant information (Interface Segregation Principle)', () => {
      const result = createTaskFocusDisplay(mockTask, mockWorkflowContext, {
        showDependencies: false,
        showActions: false,
        showPhaseContext: false
      });
      
      // Should only show task details, not other sections
      expect(result).toContain(mockTask.title);
      expect(result).not.toContain('🔗 Dependencies');
      expect(result).not.toContain('Suggested Next Actions');
      expect(result).not.toContain('🔄 Workflow Context');
    });
  });
});
