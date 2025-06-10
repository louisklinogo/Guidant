/**
 * Help System Component
 * Context-sensitive help for dashboard navigation and MCP tools
 */

import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Help System Component
 * Provides context-sensitive help and documentation
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether help is visible
 * @param {string} props.context - Current context for contextual help
 * @param {Array} props.shortcuts - Available keyboard shortcuts
 * @param {Object} props.mcpTools - Available MCP tools information
 */
export function HelpSystem({ 
  visible = false, 
  context = 'dashboard',
  shortcuts = [],
  mcpTools = {}
}) {
  if (!visible) return null;

  const getContextualHelp = () => {
    switch (context) {
      case 'dashboard':
        return getDashboardHelp();
      case 'workflow':
        return getWorkflowHelp();
      case 'capabilities':
        return getCapabilitiesHelp();
      case 'tasks':
        return getTasksHelp();
      default:
        return getGeneralHelp();
    }
  };

  const getDashboardHelp = () => ({
    title: 'Dashboard Navigation',
    description: 'Navigate and control your Guidant workflow dashboard',
    sections: [
      {
        title: 'Navigation',
        items: [
          '↑/↓ or j/k: Move between sections',
          'Enter: Expand/collapse section',
          'Tab: Switch focus areas'
        ]
      },
      {
        title: 'Workflow Control',
        items: [
          'n: Get next task from workflow engine',
          'a: Advance to next phase (if current phase complete)',
          'r: Refresh project state and data'
        ]
      },
      {
        title: 'View Options',
        items: [
          'c: Toggle compact mode',
          'f: Toggle full screen view',
          'h: Show/hide this help'
        ]
      }
    ]
  });

  const getWorkflowHelp = () => ({
    title: 'Workflow Management',
    description: 'Control your project workflow and phase progression',
    sections: [
      {
        title: 'Phase Management',
        items: [
          'Each phase has specific deliverables and quality gates',
          'Complete all deliverables before advancing phases',
          'Use "a" key to advance when phase is complete'
        ]
      },
      {
        title: 'Task Generation',
        items: [
          'Tasks are generated based on your AI capabilities',
          'Use "n" key to get the next recommended task',
          'Tasks adapt to your available tools and skills'
        ]
      }
    ]
  });

  const getCapabilitiesHelp = () => ({
    title: 'AI Capabilities',
    description: 'Understand and manage your AI agent capabilities',
    sections: [
      {
        title: 'Tool Categories',
        items: [
          'Core: Project management and file operations',
          'Workflow: Task generation and progress tracking',
          'Research: Web search and content analysis',
          'Development: Code analysis and generation'
        ]
      },
      {
        title: 'Gap Analysis',
        items: [
          'Red indicators show missing critical tools',
          'Yellow shows recommended improvements',
          'Green indicates full capability coverage'
        ]
      }
    ]
  });

  const getTasksHelp = () => ({
    title: 'Task Management',
    description: 'Work with generated tasks and deliverables',
    sections: [
      {
        title: 'Task Types',
        items: [
          'Research: Information gathering and analysis',
          'Design: Architecture and planning tasks',
          'Implementation: Code and content creation',
          'Testing: Validation and quality assurance'
        ]
      },
      {
        title: 'Progress Tracking',
        items: [
          'Use CLI for detailed progress reporting',
          'Dashboard shows current task status',
          'Completed tasks unlock next phase tasks'
        ]
      }
    ]
  });

  const getGeneralHelp = () => ({
    title: 'Guidant Dashboard Help',
    description: 'Interactive workflow orchestration for AI agents',
    sections: [
      {
        title: 'Getting Started',
        items: [
          'Use arrow keys or j/k to navigate',
          'Press h to toggle this help system',
          'Press q to quit the dashboard'
        ]
      },
      {
        title: 'MCP Integration',
        items: [
          'Dashboard connects to 16+ MCP tools',
          'Real-time updates from file system changes',
          'Direct workflow control from keyboard'
        ]
      }
    ]
  });

  const helpContent = getContextualHelp();

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>{helpContent.title}</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color="gray">{helpContent.description}</Text>
      </Box>

      {helpContent.sections.map((section, sectionIndex) => (
        <Box key={sectionIndex} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>{section.title}:</Text>
          {section.items.map((item, itemIndex) => (
            <Box key={itemIndex} marginLeft={2}>
              <Text>• {item}</Text>
            </Box>
          ))}
        </Box>
      ))}

      {shortcuts.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" bold>Available Shortcuts:</Text>
          {shortcuts.map((shortcut, index) => (
            <Box key={index} marginLeft={2}>
              <Text color={shortcut.available ? 'white' : 'gray'}>
                {shortcut.key}: {shortcut.description}
                {shortcut.note && <Text color="yellow"> ({shortcut.note})</Text>}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
        <Text color="gray">
          Press 'h' again to close help • Press 'q' to quit dashboard
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Quick Help Tooltip
 * Shows brief help hints for specific UI elements
 */
export function QuickHelpTooltip({ 
  visible = false, 
  text = '', 
  position = 'bottom',
  color = 'yellow' 
}) {
  if (!visible || !text) return null;

  return (
    <Box marginTop={position === 'bottom' ? 1 : 0} marginBottom={position === 'top' ? 1 : 0}>
      <Text color={color}>💡 {text}</Text>
    </Box>
  );
}

/**
 * Context Help Provider
 * Manages help state and context switching
 */
export function useHelpSystem(initialContext = 'dashboard') {
  const [helpVisible, setHelpVisible] = useState(false);
  const [helpContext, setHelpContext] = useState(initialContext);

  const toggleHelp = () => setHelpVisible(!helpVisible);
  const showHelp = (context = helpContext) => {
    setHelpContext(context);
    setHelpVisible(true);
  };
  const hideHelp = () => setHelpVisible(false);

  return {
    helpVisible,
    helpContext,
    toggleHelp,
    showHelp,
    hideHelp,
    setHelpContext
  };
}

export default HelpSystem;
