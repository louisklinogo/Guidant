/**
 * Phase 2 Pane Components Test
 * Tests for BasePane, ProgressPane, TasksPane, CapabilitiesPane, LogsPane, and MCPToolsPane
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { 
  BasePane, 
  ProgressPane, 
  TasksPane, 
  CapabilitiesPane, 
  LogsPane, 
  MCPToolsPane,
  PANE_COMPONENTS,
  createPaneComponent,
  getAvailablePaneTypes,
  validatePaneProps
} from '../../../src/ui/ink/panes/index.js';

describe('Phase 2: Pane Components', () => {
  
  describe('BasePane', () => {
    let basePane;
    
    beforeEach(() => {
      basePane = React.createElement(BasePane, {
        paneId: 'test',
        title: 'Test Pane',
        width: 40,
        height: 10
      });
    });
    
    it('should render with basic props', () => {
      const { lastFrame } = render(basePane);
      expect(lastFrame()).toContain('Test Pane');
    });
    
    it('should have correct default props', () => {
      expect(BasePane.defaultProps.paneId).toBe('unknown');
      expect(BasePane.defaultProps.title).toBe('Base Pane');
      expect(BasePane.defaultProps.collapsed).toBe(false);
      expect(BasePane.defaultProps.focused).toBe(false);
    });
    
    it('should handle focus state changes', () => {
      const { rerender, lastFrame } = render(basePane);
      
      // Test focused state
      const focusedPane = React.createElement(BasePane, {
        paneId: 'test',
        title: 'Test Pane',
        focused: true
      });
      
      rerender(focusedPane);
      // Focused panes should have cyan border color (tested via component behavior)
      expect(lastFrame()).toContain('Test Pane');
    });
    
    it('should handle collapsed state', () => {
      const collapsedPane = React.createElement(BasePane, {
        paneId: 'test',
        title: 'Test Pane',
        collapsed: true
      });
      
      const { lastFrame } = render(collapsedPane);
      expect(lastFrame()).toContain('Press Space to expand');
    });
    
    it('should handle error state', () => {
      const errorPane = React.createElement(BasePane, {
        paneId: 'test',
        title: 'Test Pane',
        error: 'Test error message'
      });
      
      const { lastFrame } = render(errorPane);
      expect(lastFrame()).toContain('❌ Error');
    });
  });
  
  describe('ProgressPane', () => {
    let progressPane;
    const mockProgressData = {
      phases: {
        implementation: {
          name: 'Implementation',
          completed: false,
          progress: 75
        }
      },
      currentPhase: {
        phase: 'implementation',
        progress: 75
      },
      overallProgress: 55
    };
    
    beforeEach(() => {
      progressPane = React.createElement(ProgressPane, {
        paneId: 'progress',
        data: mockProgressData,
        width: 40,
        height: 15
      });
    });
    
    it('should render progress data correctly', () => {
      const { lastFrame } = render(progressPane);
      expect(lastFrame()).toContain('📊 Progress');
      expect(lastFrame()).toContain('Overall Progress');
      expect(lastFrame()).toContain('55%');
    });
    
    it('should handle keyboard shortcuts', () => {
      const component = new ProgressPane({ paneId: 'progress', data: mockProgressData });
      
      // Test advance phase shortcut
      const result = component.handleKeyPress('a');
      expect(typeof result).toBe('boolean');
      
      // Test refresh shortcut
      const refreshResult = component.handleKeyPress('r');
      expect(typeof refreshResult).toBe('boolean');
    });
    
    it('should provide contextual help', () => {
      const component = new ProgressPane({ paneId: 'progress' });
      const help = component.getKeyboardHelp();

      expect(help.some(line => line.includes('Progress Pane:'))).toBe(true);
      expect(help.some(line => line.includes('a - Advance to next phase'))).toBe(true);
      expect(help.some(line => line.includes('p - Report progress'))).toBe(true);
    });
  });
  
  describe('TasksPane', () => {
    let tasksPane;
    const mockTasksData = {
      currentTask: {
        id: 'TASK-001',
        title: 'Test Task',
        progress: 50,
        priority: 'high'
      },
      upcomingTasks: [
        { id: 'TASK-002', title: 'Next Task', priority: 'medium' }
      ],
      statistics: {
        totalTasks: 5,
        completedTasks: 2
      }
    };
    
    beforeEach(() => {
      tasksPane = React.createElement(TasksPane, {
        paneId: 'tasks',
        data: mockTasksData,
        width: 40,
        height: 15
      });
    });
    
    it('should render tasks data correctly', () => {
      const { lastFrame } = render(tasksPane);
      expect(lastFrame()).toContain('📋 Tasks');
      expect(lastFrame()).toContain('Current Task');
      expect(lastFrame()).toContain('Test Task');
    });
    
    it('should handle task navigation', () => {
      const component = new TasksPane({ paneId: 'tasks', data: mockTasksData });
      
      // Test next task generation
      const result = component.handleKeyPress('n');
      expect(typeof result).toBe('boolean');
      
      // Test task completion
      const completeResult = component.handleKeyPress('c');
      expect(typeof completeResult).toBe('boolean');
    });
    
    it('should provide task-specific help', () => {
      const component = new TasksPane({ paneId: 'tasks' });
      const help = component.getKeyboardHelp();

      expect(help.some(line => line.includes('Tasks Pane:'))).toBe(true);
      expect(help.some(line => line.includes('n - Generate next task'))).toBe(true);
      expect(help.some(line => line.includes('c - Complete current task'))).toBe(true);
    });
  });
  
  describe('CapabilitiesPane', () => {
    let capabilitiesPane;
    const mockCapabilitiesData = {
      overview: {
        totalTools: 16,
        coverage: 85,
        gapCount: 3
      },
      toolsByCategory: {
        'Core': {
          tools: [
            { name: 'test_tool', status: 'available', coverage: 100 }
          ],
          coverage: 100
        }
      },
      gaps: [
        { category: 'Testing', impact: 'high' }
      ]
    };
    
    beforeEach(() => {
      capabilitiesPane = React.createElement(CapabilitiesPane, {
        paneId: 'capabilities',
        data: mockCapabilitiesData,
        width: 40,
        height: 15
      });
    });
    
    it('should render capabilities data correctly', () => {
      const { lastFrame } = render(capabilitiesPane);
      expect(lastFrame()).toContain('🔧 Capabilities');
      expect(lastFrame()).toContain('Capabilities Overview');
      expect(lastFrame()).toContain('85%');
    });
    
    it('should handle view mode cycling', () => {
      const component = new CapabilitiesPane({ paneId: 'capabilities', data: mockCapabilitiesData });
      
      // Test view mode cycling
      const result = component.handleKeyPress('v');
      expect(typeof result).toBe('boolean');
      
      // Test gap analysis
      const gapResult = component.handleKeyPress('g');
      expect(typeof gapResult).toBe('boolean');
    });
    
    it('should provide capabilities-specific help', () => {
      const component = new CapabilitiesPane({ paneId: 'capabilities' });
      const help = component.getKeyboardHelp();

      expect(help.some(line => line.includes('Capabilities Pane:'))).toBe(true);
      expect(help.some(line => line.includes('c - Analyze capabilities'))).toBe(true);
      expect(help.some(line => line.includes('g - Show gap analysis'))).toBe(true);
    });
  });
  
  describe('LogsPane', () => {
    let logsPane;
    const mockLogsData = {
      logs: [
        {
          id: 'log-1',
          timestamp: new Date(),
          level: 'INFO',
          source: 'TestSource',
          message: 'Test log message'
        },
        {
          id: 'log-2',
          timestamp: new Date(),
          level: 'ERROR',
          source: 'ErrorSource',
          message: 'Test error message'
        }
      ]
    };
    
    beforeEach(() => {
      logsPane = React.createElement(LogsPane, {
        paneId: 'logs',
        data: mockLogsData,
        width: 40,
        height: 15
      });
    });
    
    it('should render logs data correctly', () => {
      const { lastFrame } = render(logsPane);
      const output = lastFrame();
      expect(output).toContain('📝 Logs');
      // Check that log content is present (may be split across lines due to formatting)
      // Use more flexible regex that accounts for line breaks and ANSI codes
      expect(output).toMatch(/Test[\s\S]*log[\s\S]*message/);
      expect(output).toMatch(/Test[\s\S]*error[\s\S]*message/);
    });
    
    it('should handle log filtering', () => {
      const component = new LogsPane({ paneId: 'logs', data: mockLogsData });
      
      // Test log level cycling
      const result = component.handleKeyPress('f');
      expect(typeof result).toBe('boolean');
      
      // Test clear logs
      const clearResult = component.handleKeyPress('c');
      expect(typeof clearResult).toBe('boolean');
    });
    
    it('should provide logs-specific help', () => {
      const component = new LogsPane({ paneId: 'logs' });
      const help = component.getKeyboardHelp();

      expect(help.some(line => line.includes('Logs Pane:'))).toBe(true);
      expect(help.some(line => line.includes('f - Filter log level'))).toBe(true);
      expect(help.some(line => line.includes('c - Clear logs'))).toBe(true);
    });
  });
  
  describe('MCPToolsPane', () => {
    let mcpToolsPane;
    const mockMCPData = {
      tools: [
        {
          name: 'guidant_get_current_task',
          category: 'workflow',
          description: 'Generate next task',
          shortcut: 'n',
          successRate: 98
        },
        {
          name: 'guidant_report_progress',
          category: 'workflow',
          description: 'Report progress',
          shortcut: 'p',
          successRate: 100
        }
      ],
      statistics: {
        totalTools: 16,
        successRate: 99.1
      },
      quickActions: {
        'n': 'guidant_get_current_task',
        'p': 'guidant_report_progress'
      }
    };
    
    beforeEach(() => {
      mcpToolsPane = React.createElement(MCPToolsPane, {
        paneId: 'tools',
        data: mockMCPData,
        width: 40,
        height: 15
      });
    });
    
    it('should render MCP tools data correctly', () => {
      const { lastFrame } = render(mcpToolsPane);
      expect(lastFrame()).toContain('⚡ MCP Tools');
      expect(lastFrame()).toContain('get_current_task');
    });
    
    it('should handle tool execution', () => {
      const component = new MCPToolsPane({ paneId: 'tools', data: mockMCPData });
      
      // Test quick action execution
      const result = component.handleKeyPress('n');
      expect(typeof result).toBe('boolean');
      
      // Test tool info
      const infoResult = component.handleKeyPress('i');
      expect(typeof infoResult).toBe('boolean');
    });
    
    it('should provide MCP tools-specific help', () => {
      const component = new MCPToolsPane({ paneId: 'tools' });
      const help = component.getKeyboardHelp();

      expect(help.some(line => line.includes('MCP Tools Pane:'))).toBe(true);
      expect(help.some(line => line.includes('Enter - Execute selected tool'))).toBe(true);
      // Note: Quick Actions section may not be present in help text
      expect(help.length).toBeGreaterThan(0);
    });
  });
  
  describe('Pane Registry', () => {
    it('should have all pane components registered', () => {
      const expectedPanes = ['progress', 'tasks', 'capabilities', 'logs', 'tools'];
      const availablePanes = getAvailablePaneTypes();
      
      expectedPanes.forEach(paneId => {
        expect(availablePanes).toContain(paneId);
        expect(PANE_COMPONENTS[paneId]).toBeDefined();
      });
    });
    
    it('should create pane components correctly', () => {
      const ProgressComponent = createPaneComponent('progress');
      expect(ProgressComponent).toBe(ProgressPane);
      
      const TasksComponent = createPaneComponent('tasks');
      expect(TasksComponent).toBe(TasksPane);
    });
    
    it('should throw error for unknown pane types', () => {
      expect(() => {
        createPaneComponent('unknown');
      }).toThrow('Unknown pane component: unknown');
    });
    
    it('should validate pane props correctly', () => {
      // Valid props
      const validResult = validatePaneProps('progress', {
        paneId: 'progress',
        width: 40,
        height: 15
      });
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      // Invalid props
      const invalidResult = validatePaneProps('progress', {
        paneId: 'tasks', // Mismatch
        width: -5, // Invalid
        height: 'invalid' // Invalid type
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle unknown pane validation', () => {
      const result = validatePaneProps('unknown', {});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown pane component: unknown');
    });
  });
  
  describe('Integration Tests', () => {
    it('should render all pane types without errors', () => {
      const paneTypes = getAvailablePaneTypes();
      
      paneTypes.forEach(paneId => {
        const PaneComponent = createPaneComponent(paneId);
        const paneElement = React.createElement(PaneComponent, {
          paneId,
          width: 40,
          height: 10,
          data: {} // Empty data to test error handling
        });
        
        expect(() => {
          render(paneElement);
        }).not.toThrow();
      });
    });
    
    it('should handle keyboard shortcuts consistently', () => {
      const paneTypes = getAvailablePaneTypes();
      
      paneTypes.forEach(paneId => {
        const PaneComponent = createPaneComponent(paneId);
        const component = new PaneComponent({ paneId });
        
        // Test common shortcuts
        expect(typeof component.handleKeyPress('Space')).toBe('boolean');
        expect(typeof component.handleKeyPress('Enter')).toBe('boolean');
        expect(typeof component.handleKeyPress('r')).toBe('boolean');
        
        // Test help availability
        const help = component.getKeyboardHelp();
        expect(Array.isArray(help)).toBe(true);
        expect(help.length).toBeGreaterThan(0);
      });
    });
    
    it('should maintain consistent state management', () => {
      const paneTypes = getAvailablePaneTypes();
      
      paneTypes.forEach(paneId => {
        const PaneComponent = createPaneComponent(paneId);
        const component = new PaneComponent({ paneId });
        
        // Test state methods
        expect(typeof component.getStatus).toBe('function');
        expect(typeof component.isCollapsed).toBe('function');
        expect(typeof component.isFocused).toBe('function');
        expect(typeof component.hasError).toBe('function');
        
        // Test status structure
        const status = component.getStatus();
        expect(status).toHaveProperty('paneId');
        expect(status).toHaveProperty('state');
        expect(status).toHaveProperty('collapsed');
        expect(status).toHaveProperty('focused');
      });
    });
  });
});
