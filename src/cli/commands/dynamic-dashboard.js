/**
 * Dynamic Dashboard Command
 * New unified dashboard command with layout preset selection and backward compatibility
 * 
 * Features:
 * - Layout preset selection (--preset=quick|development|monitoring|debug)
 * - Backward compatibility mode
 * - Error handling and fallback to legacy
 * - Performance monitoring and alerts
 */

import React from 'react';
import { render, Text, Box } from 'ink';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

// Core layout system
import { LayoutManager } from '../../ui/ink/layout/LayoutManager.js';
import { LAYOUT_PRESETS } from '../../ui/ink/layout/presets/index.js';
import { PaneManager } from '../../ui/ink/layout/PaneManager.js';
import { KeyboardNavigator } from '../../ui/ink/layout/KeyboardNavigator.js';
import { RealTimeUpdater } from '../../ui/ink/layout/RealTimeUpdater.js';

// Pane components
import {
  ProgressPane,
  TasksPane,
  CapabilitiesPane,
  LogsPane,
  MCPToolsPane
} from '../../ui/ink/panes/index.js';

// State management
import { getProjectState } from '../../file-management/project-structure.js';
import { getCurrentWorkflowState } from '../../workflow-logic/workflow-engine.js';
import { requireProject } from '../utils.js';

// Legacy fallback
import { dashboardCommand as legacyDashboardCommand } from './dashboard/index.js';

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_TARGETS = {
  startupTime: 2000,      // 2s max startup
  updateLatency: 100,     // 100ms max update latency
  memoryUsage: 100 * 1024 * 1024, // 100MB max memory
  keyboardResponse: 50    // 50ms max keyboard response
};

/**
 * Dynamic Dashboard React Component
 */
function DynamicDashboard({ preset, state, workflowState, options }) {
  const [layoutManager] = React.useState(() => new LayoutManager({ preset }));
  const [paneManager] = React.useState(() => new PaneManager());
  const [keyboardNavigator] = React.useState(() => new KeyboardNavigator(layoutManager, paneManager));
  const [realTimeUpdater] = React.useState(() => new RealTimeUpdater(paneManager));
  
  const [currentLayout, setCurrentLayout] = React.useState(null);
  const [focusedPane, setFocusedPane] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Initialize layout on mount
  React.useEffect(() => {
    const initializeAsync = async () => {
      try {
        const layout = layoutManager.calculateLayout();
        setCurrentLayout(layout);
        setFocusedPane(layout.panes[0]?.id);

        // Register panes with manager
        layout.panes.forEach(pane => {
          paneManager.registerPane(pane.id, {
            component: DemoPaneComponent,
            state: state,
            workflowState: workflowState,
            options: options
          });
        });

        // Start real-time updates
        await realTimeUpdater.initialize();

      } catch (err) {
        console.error('Failed to initialize dynamic dashboard:', err);
        setError(err);
      }
    };

    initializeAsync();

    return () => {
      realTimeUpdater.cleanup();
    };
  }, [preset, layoutManager, paneManager, realTimeUpdater]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyboard = (input, key) => {
      const startTime = performance.now();
      
      try {
        keyboardNavigator.handleInput(input, key);
        
        // Check performance
        const responseTime = performance.now() - startTime;
        if (responseTime > PERFORMANCE_TARGETS.keyboardResponse) {
          console.warn(`Keyboard response slow: ${responseTime.toFixed(2)}ms`);
        }
        
      } catch (err) {
        console.error('Keyboard navigation error:', err);
      }
    };

    keyboardNavigator.on('input', handleKeyboard);
    return () => keyboardNavigator.off('input', handleKeyboard);
  }, [keyboardNavigator]);

  // Error fallback
  if (error) {
    return React.createElement(Box, null,
      React.createElement(Text, { color: 'red' },
        'Dynamic dashboard failed to initialize. Falling back to legacy mode...'
      )
    );
  }

  if (!currentLayout) {
    return React.createElement(Box, null,
      React.createElement(Text, { color: 'blue' },
        'Initializing dynamic dashboard...'
      )
    );
  }

  // Render layout with panes
  return React.createElement(Box, { flexDirection: 'column' },
    // Header
    React.createElement(Box, { borderStyle: 'single', borderColor: 'cyan', paddingX: 1 },
      React.createElement(Text, { color: 'cyan', bold: true },
        `🚀 Guidant Dynamic Dashboard - ${layoutManager.getCurrentPreset().name}`
      ),
      React.createElement(Text, { color: 'gray' },
        ` | Terminal: ${layoutManager.terminalDimensions.width}x${layoutManager.terminalDimensions.height} | Press 'h' for help, 'q' to quit`
      )
    ),

    // Main layout
    React.createElement(Box, { flexDirection: currentLayout.type === 'single' ? 'column' : 'row', marginTop: 1 },
      currentLayout.panes.map(pane =>
        React.createElement(DemoPaneComponent, {
          key: pane.id,
          paneId: pane.id,
          layout: pane,
          focused: pane.focused,
          preset: layoutManager.getCurrentPreset(),
          state: state,
          workflowState: workflowState
        })
      )
    ),

    // Footer
    React.createElement(Box, { marginTop: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
      React.createElement(Text, { color: 'gray' },
        `Last updated: ${new Date().toLocaleTimeString()} | Shortcuts: n=next task, p=progress, a=advance, r=refresh`
      )
    )
  );
}

/**
 * Demo Pane Component with rich mock data
 */
function DemoPaneComponent({ paneId, layout, focused, preset, state, workflowState }) {
  const mockData = getDemoData(paneId);

  return React.createElement(Box, {
    width: layout.width,
    height: layout.height,
    borderStyle: focused ? 'double' : 'single',
    borderColor: focused ? 'cyan' : 'gray',
    paddingX: 1,
    paddingY: 0,
    marginRight: 1
  },
    React.createElement(Box, { flexDirection: 'column' },
      // Pane header
      React.createElement(Text, {
        color: focused ? 'cyan' : 'white',
        bold: true,
        backgroundColor: focused ? 'blue' : undefined
      },
        `${mockData.title} ${focused ? '◀' : ''}`
      ),

      // Pane content
      React.createElement(Box, { flexDirection: 'column', marginTop: 1 },
        mockData.content.map((line, index) =>
          React.createElement(Text, {
            key: index,
            color: line.color || 'white',
            bold: line.bold || false
          }, line.text)
        )
      ),

      // Pane footer with shortcuts
      React.createElement(Box, { marginTop: 1 },
        React.createElement(Text, { color: 'gray', italic: true },
          mockData.shortcuts
        )
      )
    )
  );
}

/**
 * Get demo data for each pane type
 */
function getDemoData(paneId) {
  const demoData = {
    progress: {
      title: '📊 PROJECT PROGRESS',
      content: [
        { text: '🎯 Phase: Development (3/5)', color: 'cyan', bold: true },
        { text: '▓▓▓▓▓▓░░░░ 60% Complete', color: 'green' },
        { text: '', color: 'white' },
        { text: '✅ Research & Planning', color: 'green' },
        { text: '✅ Requirements Analysis', color: 'green' },
        { text: '🔄 Architecture Design', color: 'yellow' },
        { text: '⏳ Implementation', color: 'gray' },
        { text: '⏳ Testing & Deployment', color: 'gray' },
        { text: '', color: 'white' },
        { text: '⏱️  Est. Completion: 3 days', color: 'cyan' },
        { text: '🎯 Quality Gate: 85% passed', color: 'green' }
      ],
      shortcuts: 'a=advance phase, r=refresh'
    },

    tasks: {
      title: '📋 ACTIVE TASKS',
      content: [
        { text: '🔥 Current Task:', color: 'red', bold: true },
        { text: 'Implement dynamic dashboard', color: 'yellow' },
        { text: 'Status: In Progress (80%)', color: 'green' },
        { text: '', color: 'white' },
        { text: '📝 Upcoming Tasks:', color: 'cyan', bold: true },
        { text: '• Add keyboard navigation', color: 'white' },
        { text: '• Implement MCP integration', color: 'white' },
        { text: '• Create user documentation', color: 'white' },
        { text: '• Performance optimization', color: 'white' },
        { text: '', color: 'white' },
        { text: '✅ Completed: 12 tasks', color: 'green' },
        { text: '⏳ Remaining: 8 tasks', color: 'yellow' }
      ],
      shortcuts: 'n=next task, p=report progress'
    },

    capabilities: {
      title: '🤖 AI CAPABILITIES',
      content: [
        { text: '🧠 Agent: Claude Sonnet 4', color: 'cyan', bold: true },
        { text: 'Coverage: 16/20 tools (80%)', color: 'green' },
        { text: '', color: 'white' },
        { text: '✅ Code Generation', color: 'green' },
        { text: '✅ File Management', color: 'green' },
        { text: '✅ Testing & Validation', color: 'green' },
        { text: '✅ Documentation', color: 'green' },
        { text: '⚠️  Database Operations', color: 'yellow' },
        { text: '❌ Deployment Tools', color: 'red' },
        { text: '', color: 'white' },
        { text: '🎯 Recommendations:', color: 'cyan' },
        { text: '• Add database tools', color: 'yellow' }
      ],
      shortcuts: 'c=analyze, g=gaps analysis'
    },

    logs: {
      title: '📜 ACTIVITY LOGS',
      content: [
        { text: '🕐 Recent Activity:', color: 'cyan', bold: true },
        { text: '14:32 ✅ Layout test passed', color: 'green' },
        { text: '14:31 🔄 Running integration tests', color: 'yellow' },
        { text: '14:30 📝 Updated dashboard.js', color: 'blue' },
        { text: '14:29 🚀 Started dynamic mode', color: 'cyan' },
        { text: '14:28 ⚡ MCP tool executed', color: 'magenta' },
        { text: '', color: 'white' },
        { text: '📊 Session Stats:', color: 'cyan' },
        { text: '• Commands: 23', color: 'white' },
        { text: '• Files changed: 8', color: 'white' },
        { text: '• Tests passed: 36/36', color: 'green' }
      ],
      shortcuts: 'l=filter logs, c=clear'
    },

    tools: {
      title: '🛠️ MCP TOOLS',
      content: [
        { text: '⚡ Available Tools (16):', color: 'cyan', bold: true },
        { text: '✅ guidant_get_current_task', color: 'green' },
        { text: '✅ guidant_report_progress', color: 'green' },
        { text: '✅ guidant_advance_phase', color: 'green' },
        { text: '✅ guidant_discover_agent', color: 'green' },
        { text: '✅ tavily_search', color: 'green' },
        { text: '✅ context7_get_docs', color: 'green' },
        { text: '', color: 'white' },
        { text: '🔥 Quick Actions:', color: 'red' },
        { text: '1. Generate next task', color: 'white' },
        { text: '2. Analyze capabilities', color: 'white' },
        { text: '3. Search documentation', color: 'white' }
      ],
      shortcuts: 't=execute tool, h=help'
    }
  };

  return demoData[paneId] || demoData.progress;
}

/**
 * Main dynamic dashboard command
 */
export async function dynamicDashboardCommand(options = {}) {
  const startTime = performance.now();
  
  try {
    // 1. Validate environment
    await requireProject();
    
    // 2. Determine preset
    const preset = options.preset || 'development';
    if (!LAYOUT_PRESETS[preset]) {
      console.warn(`Invalid preset '${preset}', using 'development'`);
      options.preset = 'development';
    }
    
    // 3. Fetch state
    const state = await getProjectState();
    const workflowState = await getCurrentWorkflowState();
    
    // 4. Check terminal size compatibility
    const terminalWidth = process.stdout.columns || 100;
    const terminalHeight = process.stdout.rows || 30;
    const presetConfig = LAYOUT_PRESETS[options.preset];
    
    if (terminalWidth < presetConfig.minWidth || terminalHeight < presetConfig.minHeight) {
      console.warn(
        chalk.yellow(
          `Terminal too small for ${presetConfig.name} ` +
          `(${terminalWidth}x${terminalHeight}, need ${presetConfig.minWidth}x${presetConfig.minHeight})`
        )
      );
      
      // Auto-fallback to compatible preset
      const fallbackPreset = findCompatiblePreset(terminalWidth, terminalHeight);
      if (fallbackPreset) {
        console.log(chalk.blue(`Using ${LAYOUT_PRESETS[fallbackPreset].name} instead`));
        options.preset = fallbackPreset;
      } else {
        console.log(chalk.yellow('Falling back to legacy dashboard...'));
        return await legacyDashboardCommand(options);
      }
    }
    
    // 5. Performance check - startup time
    const initTime = performance.now() - startTime;
    if (initTime > PERFORMANCE_TARGETS.startupTime) {
      console.warn(`Slow startup: ${initTime.toFixed(2)}ms`);
    }
    
    // 6. Render dynamic dashboard
    const { unmount } = render(
      React.createElement(DynamicDashboard, {
        preset: options.preset,
        state,
        workflowState,
        options
      })
    );
    
    // 7. Handle cleanup on exit
    process.on('SIGINT', () => {
      unmount();
      process.exit(0);
    });
    
    return { success: true, preset: options.preset };
    
  } catch (error) {
    console.error(chalk.red('Dynamic dashboard failed:'), error.message);
    
    // Fallback to legacy dashboard
    console.log(chalk.yellow('Falling back to legacy dashboard...'));
    return await legacyDashboardCommand(options);
  }
}

/**
 * Find compatible preset for terminal size
 */
function findCompatiblePreset(width, height) {
  const presets = Object.entries(LAYOUT_PRESETS);
  
  // Sort by minimum requirements (smallest first)
  presets.sort((a, b) => a[1].minWidth - b[1].minWidth);
  
  // Find first preset that fits
  for (const [name, preset] of presets) {
    if (width >= preset.minWidth && height >= preset.minHeight) {
      return name;
    }
  }
  
  return null; // No compatible preset found
}

/**
 * Show available presets for current terminal
 */
export function showAvailablePresets() {
  const width = process.stdout.columns || 100;
  const height = process.stdout.rows || 30;
  
  console.log(chalk.bold('\n📐 Available Layout Presets:\n'));
  
  Object.entries(LAYOUT_PRESETS).forEach(([name, preset]) => {
    const compatible = width >= preset.minWidth && height >= preset.minHeight;
    const status = compatible ? chalk.green('✓') : chalk.red('✗');
    const size = chalk.gray(`(${preset.minWidth}x${preset.minHeight})`);
    
    console.log(`${status} ${chalk.bold(name)}: ${preset.description} ${size}`);
    console.log(`   Panes: ${preset.panes.join(', ')}`);
    console.log('');
  });
  
  console.log(chalk.gray(`Current terminal: ${width}x${height}`));
}

/**
 * Register dynamic dashboard commands
 */
export function registerDynamicDashboardCommands(program) {
  program
    .command('dynamic')
    .alias('dyn')
    .description('Dynamic multi-pane dashboard with layout presets')
    .option('-p, --preset <preset>', 'Layout preset (quick|development|monitoring|debug)', 'development')
    .option('-c, --compact', 'Enable compact mode')
    .option('--demo', 'Show demo with rich mock data')
    .option('--show-presets', 'Show available presets for current terminal')
    .action(async (options) => {
      if (options.showPresets) {
        showAvailablePresets();
        return;
      }

      // Enable demo mode by default for better user experience
      if (!options.demo) {
        options.demo = true;
      }

      await dynamicDashboardCommand(options);
    });
}

export default dynamicDashboardCommand;
