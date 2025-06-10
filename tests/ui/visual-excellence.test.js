/**
 * Visual Excellence Components Test Suite
 * Tests for ASCII dependency visualization, phase transitions, and health indicators
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { DependencyGraph } from '../../src/ui/ink/components/DependencyGraph.jsx';
import { PhaseTransition, PhaseTransitionModal, QuickPhaseSummary } from '../../src/ui/ink/components/PhaseTransition.jsx';
import { ProjectHealthIndicators } from '../../src/ui/ink/components/ProjectHealthIndicators.jsx';

describe('Visual Excellence Components', () => {
  let mockProjectState;
  let mockWorkflowState;
  let mockTasks;
  let mockMetrics;

  beforeEach(() => {
    mockProjectState = {
      name: 'Visual Excellence Test Project',
      capabilities: {
        tools: ['guidant_get_current_task', 'guidant_advance_phase'],
        coverage: { research: 95, design: 87, development: 92 }
      }
    };

    mockWorkflowState = {
      currentPhase: { phase: 'implementation', progress: 75 },
      phases: {
        concept: { completed: true, progress: 100 },
        requirements: { completed: true, progress: 100 },
        implementation: { completed: false, progress: 75 },
        testing: { completed: false, progress: 0 }
      },
      qualityGates: {
        implementation: {
          required: ['code_review', 'unit_tests', 'integration_tests'],
          completed: ['code_review', 'unit_tests']
        }
      }
    };

    mockTasks = [
      {
        id: 'TASK-001',
        title: 'Design System Architecture',
        status: 'completed',
        priority: 'high',
        progress: 100,
        dependencies: []
      },
      {
        id: 'TASK-002',
        title: 'Implement Core Components',
        status: 'in-progress',
        priority: 'high',
        progress: 80,
        dependencies: ['TASK-001']
      },
      {
        id: 'TASK-003',
        title: 'Add Visual Enhancements',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        dependencies: ['TASK-002']
      }
    ];

    mockMetrics = {
      tasksPerDay: '2.5',
      avgTaskTime: '3.8h',
      bugRate: '0.08',
      codeCoverage: '92%'
    };
  });

  describe('DependencyGraph Component', () => {
    it('should render dependency graph with task relationships', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockTasks[1]}
          compact={false}
          showCompleted={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🔗 Task Dependencies');
      expect(output).toContain('Design System Architecture');
      expect(output).toContain('Implement Core Components');
      expect(output).toContain('depends on');
    });

    it('should show legend in non-compact mode', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockTasks[1]}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Legend:');
      expect(output).toContain('Completed');
      expect(output).toContain('In Progress');
    });

    it('should handle compact mode correctly', () => {
      const { lastFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockTasks[1]}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🔗 Task Dependencies');
      expect(output).not.toContain('Legend:');
    });
  });

  describe('PhaseTransition Component', () => {
    it('should render phase transition with validation step', () => {
      const { lastFrame } = render(
        <PhaseTransition
          fromPhase="concept"
          toPhase="requirements"
          autoAdvance={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🚀 Phase Transition');
      expect(output).toContain('validation');
      expect(output).toContain('✅ Phase Validation Complete');
    });

    it('should show celebration step', () => {
      const { lastFrame } = render(
        <PhaseTransition
          fromPhase="concept"
          toPhase="requirements"
          autoAdvance={false}
        />
      );

      const output = lastFrame();
      expect(output).toBeTruthy();
    });

    it('should render phase transition modal', () => {
      const { lastFrame } = render(
        <PhaseTransitionModal
          isVisible={true}
          fromPhase="concept"
          toPhase="requirements"
        />
      );

      const output = lastFrame();
      expect(output).toContain('🚀 Phase Transition');
    });

    it('should not render when modal is not visible', () => {
      const { lastFrame } = render(
        <PhaseTransitionModal
          isVisible={false}
          fromPhase="concept"
          toPhase="requirements"
        />
      );

      const output = lastFrame();
      expect(output).toBe('');
    });
  });

  describe('QuickPhaseSummary Component', () => {
    it('should render phase summary in normal mode', () => {
      const { lastFrame } = render(
        <QuickPhaseSummary
          phase="implementation"
          progress={75}
          completedTasks={8}
          totalTasks={12}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Implementation Phase');
      expect(output).toContain('75%');
      expect(output).toContain('8/12');
    });

    it('should render phase summary in compact mode', () => {
      const { lastFrame } = render(
        <QuickPhaseSummary
          phase="implementation"
          progress={75}
          completedTasks={8}
          totalTasks={12}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('implementation');
      expect(output).toContain('75%');
      expect(output).toContain('(8/12)');
    });
  });

  describe('ProjectHealthIndicators Component', () => {
    it('should render project health dashboard', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🏥 Project Health');
      expect(output).toContain('Overall Health');
      expect(output).toContain('Schedule');
      expect(output).toContain('Quality');
    });

    it('should show performance metrics', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={false}
          showTrends={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('📊 Performance Metrics');
      expect(output).toContain('Tasks/Day');
      expect(output).toContain('2.5');
    });

    it('should display forecasts when enabled', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={false}
          showForecasts={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🔮 Forecasts');
      expect(output).toContain('Completion');
    });

    it('should show quality gates status', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={false}
        />
      );

      const output = lastFrame();
      expect(output).toContain('🚪 Quality Gates');
      expect(output).toContain('implementation');
      expect(output).toContain('code review');
    });

    it('should render in compact mode', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={true}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Health:');
      expect(output).toContain('/100');
    });
  });

  describe('Integration Tests', () => {
    it('should render all visual components together', () => {
      const { lastFrame: dependencyFrame } = render(
        <DependencyGraph
          tasks={mockTasks}
          currentTask={mockTasks[1]}
          compact={true}
        />
      );

      const { lastFrame: healthFrame } = render(
        <ProjectHealthIndicators
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={true}
        />
      );

      const { lastFrame: phaseFrame } = render(
        <QuickPhaseSummary
          phase="implementation"
          progress={75}
          completedTasks={8}
          totalTasks={12}
          compact={true}
        />
      );

      expect(dependencyFrame()).toBeTruthy();
      expect(healthFrame()).toBeTruthy();
      expect(phaseFrame()).toBeTruthy();
    });

    it('should handle missing data gracefully', () => {
      const { lastFrame } = render(
        <ProjectHealthIndicators
          projectState={null}
          workflowState={null}
          metrics={{}}
          compact={false}
        />
      );

      expect(lastFrame()).toBeTruthy();
    });

    it('should maintain consistent styling across components', () => {
      const components = [
        <DependencyGraph tasks={mockTasks} compact={false} />,
        <ProjectHealthIndicators 
          projectState={mockProjectState}
          workflowState={mockWorkflowState}
          metrics={mockMetrics}
          compact={false}
        />,
        <QuickPhaseSummary phase="implementation" progress={75} completedTasks={8} totalTasks={12} />
      ];

      components.forEach(component => {
        const { lastFrame } = render(component);
        const output = lastFrame();
        expect(output).toBeTruthy();
        // All components should use consistent emoji and color patterns
        expect(output).toMatch(/[🔗📊🏥🎯⚡💚💛❤️]/);
      });
    });
  });
});
