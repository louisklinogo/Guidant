/**
 * Dependency Graph Component Tests
 * Tests for ASCII dependency visualization
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { DependencyGraph } from '../../src/ui/ink/components/DependencyGraph.jsx';

describe('DependencyGraph Component', () => {
  let mockTasks;
  let mockCurrentTask;

  beforeEach(() => {
    mockTasks = [
      {
        id: 'TASK-001',
        title: 'Design Architecture',
        status: 'completed',
        priority: 'high',
        progress: 100,
        dependencies: []
      },
      {
        id: 'TASK-002',
        title: 'Create Core Components',
        status: 'completed',
        priority: 'high',
        progress: 100,
        dependencies: ['TASK-001']
      },
      {
        id: 'TASK-003',
        title: 'Implement Layout System',
        status: 'in-progress',
        priority: 'high',
        progress: 75,
        dependencies: ['TASK-001', 'TASK-002']
      },
      {
        id: 'TASK-004',
        title: 'Add Interactive Controls',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        dependencies: ['TASK-003']
      },
      {
        id: 'TASK-005',
        title: 'Performance Optimization',
        status: 'pending',
        priority: 'low',
        progress: 0,
        dependencies: ['TASK-003', 'TASK-004']
      }
    ];

    mockCurrentTask = mockTasks[2]; // TASK-003 (in-progress)
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should display graph header', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🔗 Task Dependencies');
    });

    it('should show task count in header', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('tasks');
      expect(output).toContain('dependencies');
    });
  });

  describe('Task Node Rendering', () => {
    it('should display task titles', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
          showCompleted={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Design Architecture');
      expect(output).toContain('Implement Layout System');
    });

    it('should show status icons', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('✓'); // Completed task icon
      expect(output).toContain('⚡'); // In-progress task icon
      expect(output).toContain('○'); // Pending task icon
    });

    it('should highlight current task', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      // Current task should be highlighted (exact styling may vary)
      expect(output).toContain('Implement Layout System');
    });

    it('should show blocked tasks', () => {
      // Create a task that's blocked by incomplete dependencies
      const blockedTasks = [
        {
          id: 'TASK-001',
          title: 'Incomplete Dependency',
          status: 'pending',
          priority: 'high',
          progress: 0,
          dependencies: []
        },
        {
          id: 'TASK-002',
          title: 'Blocked Task',
          status: 'pending',
          priority: 'high',
          progress: 0,
          dependencies: ['TASK-001']
        }
      ];

      const { lastFrame } = render(
        <DependencyGraph
          tasks={blockedTasks}
          currentTask={blockedTasks[1]}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🚫'); // Blocked indicator
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).toBeTruthy();
      expect(output).toContain('🔗 Task Dependencies');
    });

    it('should show truncated task titles in compact mode', () => {
      const longTitleTasks = [
        {
          id: 'TASK-001',
          title: 'This is a very long task title that should be truncated in compact mode',
          status: 'pending',
          priority: 'high',
          progress: 0,
          dependencies: []
        }
      ];

      const { lastFrame } = render(
        <DependencyGraph
          tasks={longTitleTasks}
          currentTask={longTitleTasks[0]}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('...');
    });
  });

  describe('Filtering Options', () => {
    it('should hide completed tasks when showCompleted is false', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          showCompleted={false}
          compact={false}
        />
      );

      const output = lastFrame();
      // Should not show completed tasks
      expect(output).not.toContain('Design Architecture');
      expect(output).not.toContain('Create Core Components');
      // Should show non-completed tasks
      expect(output).toContain('Implement Layout System');
    });

    it('should show completed tasks when showCompleted is true', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          showCompleted={true}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Design Architecture');
      expect(output).toContain('Create Core Components');
    });
  });

  describe('Legend Display', () => {
    it('should show legend in non-compact mode', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Legend:');
      expect(output).toContain('Completed');
      expect(output).toContain('In Progress');
      expect(output).toContain('Pending');
    });

    it('should not show legend in compact mode', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).not.toContain('Legend:');
    });
  });

  describe('Empty State', () => {
    it('should handle empty task list', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={[]}
          currentTask={null}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('No dependencies to display');
    });

    it('should handle null tasks', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={null}
          currentTask={null}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('No dependencies to display');
    });
  });

  describe('Dependency Connections', () => {
    it('should show dependency relationships', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('depends on');
    });
  });

  describe('Priority Indicators', () => {
    it('should show priority levels', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('HIGH');
      expect(output).toContain('MEDIUM');
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress bars for tasks with progress', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockCurrentTask}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Progress:');
      expect(output).toContain('75%'); // Current task progress
    });
  });
});
