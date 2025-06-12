/**
 * Guidant UI System Tests
 * Unit tests for TaskMaster-style UI components
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  displayGuidantBanner,
  createStatusBox,
  createProgressDisplay,
  createTaskDisplay,
  createActionSuggestions,
  createProgressiveOnboarding
} from '../../src/cli/utils/guidant-ui.js';

// Helper function to strip ANSI color codes for testing
function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Mock console.log to capture output
let consoleOutput = [];
const originalConsoleLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = (...args) => {
    consoleOutput.push(args.join(' '));
  };
});

// Restore console.log after tests
process.on('exit', () => {
  console.log = originalConsoleLog;
});

describe('Guidant UI System', () => {
  describe('displayGuidantBanner', () => {
    it('should display banner with project info', () => {
      displayGuidantBanner({
        version: '1.0.0',
        projectName: 'Test Project',
        compact: false
      });

      const output = stripAnsi(consoleOutput.join('\n'));
      expect(output).toContain('AI Agent Workflow Orchestrator');
      expect(output).toContain('Version: 1.0.0');
      expect(output).toContain('Project: Test Project');
    });

    it('should display compact banner when requested', () => {
      displayGuidantBanner({
        version: '1.0.0',
        projectName: 'Test Project',
        compact: true
      });

      const output = stripAnsi(consoleOutput.join('\n'));
      expect(output).toContain('Guidant');
      expect(output).toContain('Test Project');
      // Should not contain full figlet banner
      expect(output).not.toContain('AI Agent Workflow Orchestrator');
    });
  });

  describe('createStatusBox', () => {
    it('should create info status box with blue border', () => {
      const result = stripAnsi(createStatusBox('Test message', 'info'));

      expect(result).toContain('Test message');
      expect(result).toContain('ℹ️');
      // Should contain boxen border characters
      expect(result).toContain('╭');
      expect(result).toContain('╰');
    });

    it('should create success status box with green border', () => {
      const result = stripAnsi(createStatusBox('Success message', 'success'));

      expect(result).toContain('Success message');
      expect(result).toContain('✅');
    });

    it('should create warning status box with yellow border', () => {
      const result = stripAnsi(createStatusBox('Warning message', 'warning'));

      expect(result).toContain('Warning message');
      expect(result).toContain('⚠️');
    });

    it('should create error status box with red border', () => {
      const result = stripAnsi(createStatusBox('Error message', 'error'));

      expect(result).toContain('Error message');
      expect(result).toContain('❌');
    });

    it('should include title when provided', () => {
      const result = stripAnsi(createStatusBox('Test message', 'info', { title: 'Test Title' }));

      expect(result).toContain('Test Title');
      expect(result).toContain('Test message');
    });
  });

  describe('createProgressDisplay', () => {
    it('should create progress display with phase and percentage', () => {
      const result = createProgressDisplay('Implementation', {
        current: 3,
        total: 6,
        percentage: 50,
        status: 'in-progress'
      });
      
      expect(result).toContain('Implementation');
      expect(result).toContain('50%');
      expect(result).toContain('3/6');
      expect(result).toContain('Progress:');
    });

    it('should show next phase when provided', () => {
      const result = createProgressDisplay('Implementation', {
        percentage: 75,
        nextPhase: 'Testing'
      }, { showDetails: true });
      
      expect(result).toContain('Implementation');
      expect(result).toContain('Testing');
      expect(result).toContain('Next Phase:');
    });

    it('should create compact progress display', () => {
      const result = createProgressDisplay('Implementation', {
        percentage: 50
      }, { compact: true });
      
      expect(result).toContain('Implementation');
      expect(result).toContain('50%');
      // Compact mode should be shorter
      expect(result.split('\n').length).toBeLessThan(5);
    });
  });

  describe('createTaskDisplay', () => {
    it('should display task with full context', () => {
      const task = {
        id: 'TASK-001',
        title: 'Test Task',
        priority: 'high',
        status: 'in-progress',
        phase: 'implementation',
        description: 'Test description'
      };

      const context = {
        currentPhase: 'implementation',
        totalPhases: 6,
        workflowType: 'standard'
      };

      const result = createTaskDisplay(task, context);
      
      expect(result).toContain('Test Task');
      expect(result).toContain('TASK-001');
      expect(result).toContain('high');
      expect(result).toContain('in-progress');
      expect(result).toContain('implementation');
      expect(result).toContain('Test description');
      expect(result).toContain('standard');
    });

    it('should handle missing task gracefully', () => {
      const result = createTaskDisplay(null);
      
      expect(result).toContain('No current task available');
    });

    it('should create compact task display', () => {
      const task = {
        title: 'Test Task',
        status: 'completed'
      };

      const result = createTaskDisplay(task, {}, { compact: true });
      
      expect(result).toContain('Test Task');
      expect(result).toContain('completed');
    });
  });

  describe('createActionSuggestions', () => {
    it('should display numbered action list', () => {
      const actions = [
        { description: 'First action', command: 'cmd1' },
        { description: 'Second action', command: 'cmd2' },
        'Third action'
      ];

      const result = stripAnsi(createActionSuggestions(actions));

      expect(result).toContain('Suggested Actions:');
      expect(result).toContain('1. First action');
      expect(result).toContain('2. Second action');
      expect(result).toContain('3. Third action');
      expect(result).toContain('cmd1');
      expect(result).toContain('cmd2');
    });

    it('should handle empty actions array', () => {
      const result = createActionSuggestions([]);
      
      expect(result).toContain('No actions available');
    });

    it('should limit actions in compact mode', () => {
      const actions = ['Action 1', 'Action 2', 'Action 3', 'Action 4', 'Action 5'];
      
      const result = stripAnsi(createActionSuggestions(actions, { compact: true }));

      expect(result).toContain('1. Action 1');
      expect(result).toContain('2. Action 2');
      expect(result).toContain('3. Action 3');
      expect(result).not.toContain('4. Action 4');
    });
  });

  describe('createProgressiveOnboarding', () => {
    it('should display 10-step onboarding by default', () => {
      const result = stripAnsi(createProgressiveOnboarding());

      expect(result).toContain('Things you should do next:');
      expect(result).toContain('1. Run "guidant status"');
      expect(result).toContain('10. Ship it!');
    });

    it('should display custom steps when provided', () => {
      const customSteps = [
        'Step 1',
        'Step 2',
        'Step 3'
      ];

      const result = stripAnsi(createProgressiveOnboarding(customSteps));

      expect(result).toContain('1. Step 1');
      expect(result).toContain('2. Step 2');
      expect(result).toContain('3. Step 3');
      expect(result).not.toContain('Ship it!');
    });

    it('should generate project-specific steps for prototype projects', () => {
      const result = stripAnsi(createProgressiveOnboarding([], {
        projectType: 'prototype',
        classification: {
          type: 'prototype',
          complexity: 'simple',
          projectType: { phases: ['concept', 'design', 'implementation'] }
        }
      }));

      expect(result).toContain('Define core concept and MVP scope');
      expect(result).toContain('Build and test core functionality');
      expect(result).toContain('Validate with users and stakeholders');
    });

    it('should generate project-specific steps for research projects', () => {
      const result = stripAnsi(createProgressiveOnboarding([], {
        projectType: 'research',
        classification: {
          type: 'research',
          complexity: 'standard',
          projectType: { phases: ['requirements', 'analysis', 'documentation'] }
        }
      }));

      expect(result).toContain('Set up research methodology');
      expect(result).toContain('Define research questions');
      expect(result).toContain('Analyze findings and generate insights');
    });

    it('should adjust steps based on complexity level', () => {
      const enterpriseResult = stripAnsi(createProgressiveOnboarding([], {
        projectType: 'product',
        classification: {
          type: 'product',
          complexity: 'enterprise',
          projectType: { phases: ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'] }
        }
      }));

      expect(enterpriseResult).toContain('Conduct security and compliance review');
      expect(enterpriseResult).toContain('enterprise monitoring');
    });

    it('should include commands when provided', () => {
      const stepsWithCommands = [
        { description: 'Run status', command: 'guidant status' },
        { description: 'Check health', command: 'guidant health' }
      ];

      const result = createProgressiveOnboarding(stepsWithCommands);
      
      expect(result).toContain('Run status');
      expect(result).toContain('guidant status');
      expect(result).toContain('Check health');
      expect(result).toContain('guidant health');
    });
  });

  describe('Color Coding Consistency', () => {
    it('should use consistent color scheme across components', () => {
      const infoBox = createStatusBox('Info', 'info');
      const successBox = createStatusBox('Success', 'success');
      const warningBox = createStatusBox('Warning', 'warning');
      const errorBox = createStatusBox('Error', 'error');
      
      // All should contain proper boxen borders
      [infoBox, successBox, warningBox, errorBox].forEach(box => {
        expect(box).toContain('╭');
        expect(box).toContain('╰');
      });
      
      // Should contain appropriate icons
      expect(infoBox).toContain('ℹ️');
      expect(successBox).toContain('✅');
      expect(warningBox).toContain('⚠️');
      expect(errorBox).toContain('❌');
    });
  });

  describe('Terminal Compatibility', () => {
    it('should handle different terminal widths gracefully', () => {
      // Test with narrow terminal simulation
      const result = createStatusBox('Very long message that might wrap in narrow terminals', 'info', {
        width: 40
      });
      
      expect(result).toContain('Very long message');
      expect(result).toContain('╭');
      expect(result).toContain('╰');
    });
  });
});
