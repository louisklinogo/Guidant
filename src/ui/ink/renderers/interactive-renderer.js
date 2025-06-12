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
 * Render interactive dashboard with keyboard controls
 * Simplified to single intelligent dashboard following TaskMaster approach
 */
export async function renderInteractiveDashboard(projectState, workflowState, options = {}) {
  const {
    compact = false
  } = options;

  try {
    const { waitUntilExit, unmount } = render(
      <InteractiveDashboard
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
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