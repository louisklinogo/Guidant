/**
 * Interactive Dashboard Renderer
 * Keyboard-controlled dashboard with navigation using InteractiveDashboardContainer
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, Newline } from 'ink';
import { InteractiveDashboardContainer, MultiPaneDashboardContainer } from '../components/DashboardApp.jsx';

/**
 * Interactive Dashboard Component - Simple keyboard controls
 */
function InteractiveDashboard({ projectState, workflowState, compact }) {
  const [selectedSection, setSelectedSection] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const sections = ['Progress', 'Capabilities', 'Tasks'];

  useEffect(() => {
    const handleInput = (data) => {
      const key = data.toString();

      switch (key) {
        case '\u0003': // Ctrl+C
        case 'q':
          process.exit(0);
          break;
        case 'h':
          setShowHelp(!showHelp);
          break;
        case 'j':
        case '\u001b[B': // Down arrow
          setSelectedSection((prev) => (prev + 1) % sections.length);
          break;
        case 'k':
        case '\u001b[A': // Up arrow
          setSelectedSection((prev) => (prev - 1 + sections.length) % sections.length);
          break;
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.on('data', handleInput);

    return () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('data', handleInput);
    };
  }, [showHelp, sections.length]);

  if (showHelp) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" borderColor="cyan" padding={1}>
          <Text color="cyan" bold>Keyboard Controls</Text>
          <Newline />
          <Text>↑/k: Move up</Text>
          <Newline />
          <Text>↓/j: Move down</Text>
          <Newline />
          <Text>h: Toggle help</Text>
          <Newline />
          <Text>q: Quit</Text>
        </Box>
      </Box>
    );
  }

  return (
    <InteractiveDashboardContainer
      projectState={projectState}
      workflowState={workflowState}
      compact={compact}
      selectedSection={selectedSection}
      onSectionChange={setSelectedSection}
    />
  );
}

/**
 * Multi-Pane Interactive Dashboard Component - Enhanced VS Code-inspired interface
 */
function MultiPaneInteractiveDashboard({ projectState, workflowState, compact, preset, terminalDimensions }) {
  const [showHelp, setShowHelp] = useState(false);

  const handlePaneUpdate = (event) => {
    // Handle pane updates for real-time feedback
    console.log(`Pane ${event.paneId} updated:`, event);
  };

  const handleLayoutChange = (layout) => {
    // Handle layout changes
    console.log('Layout changed:', layout);
  };

  const handleKeyboardAction = (action) => {
    // Handle keyboard actions
    if (action.action === 'toggleHelp') {
      setShowHelp(!showHelp);
    }
    console.log('Keyboard action:', action);
  };

  if (showHelp) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" borderColor="cyan" padding={1}>
          <Text color="cyan" bold>Multi-Pane Dashboard Controls</Text>
          <Newline />
          <Text>Tab: Next pane</Text>
          <Newline />
          <Text>Shift+Tab: Previous pane</Text>
          <Newline />
          <Text>Space: Toggle pane collapse</Text>
          <Newline />
          <Text>n: Next task</Text>
          <Newline />
          <Text>a: Advance phase</Text>
          <Newline />
          <Text>r: Refresh</Text>
          <Newline />
          <Text>h: Toggle help</Text>
          <Newline />
          <Text>q: Quit</Text>
        </Box>
      </Box>
    );
  }

  return (
    <MultiPaneDashboardContainer
      projectState={projectState}
      workflowState={workflowState}
      preset={preset}
      terminalDimensions={terminalDimensions}
      compact={compact}
      onPaneUpdate={handlePaneUpdate}
      onLayoutChange={handleLayoutChange}
      onKeyboardAction={handleKeyboardAction}
    />
  );
}

/**
 * Render interactive dashboard with keyboard controls
 */
export async function renderInteractiveDashboard(projectState, workflowState, options = {}) {
  const {
    compact = false,
    multiPane = false,
    preset = 'development',
    terminalDimensions = { width: process.stdout.columns || 120, height: process.stdout.rows || 30 }
  } = options;

  try {
    const DashboardComponent = multiPane ? MultiPaneInteractiveDashboard : InteractiveDashboard;

    const { waitUntilExit, unmount } = render(
      <DashboardComponent
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
        preset={preset}
        terminalDimensions={terminalDimensions}
      />
    );

    // Set up cleanup on exit
    const cleanup = () => {
      unmount();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    await waitUntilExit();
    return { success: true };

  } catch (error) {
    console.error('Interactive dashboard error:', error);
    return { success: false, error: error.message };
  }
}