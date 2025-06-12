/**
 * Live Dashboard Renderer
 * Auto-refreshing dashboard using LiveDashboardContainer
 */

import React from 'react';
import { render } from 'ink';
import { LiveDashboardContainer } from '../components/DashboardApp.jsx';

/**
 * Render live dashboard with auto-refresh
 */
export async function renderLiveDashboard(projectState, workflowState, options = {}) {
  const {
    refreshInterval = 5000,
    compact = false
  } = options;

  try {
    // Live dashboard - uses LiveDashboardContainer for auto-refresh behavior
    const { unmount, waitUntilExit } = render(
      <LiveDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        refreshInterval={refreshInterval}
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
    console.error('Live dashboard rendering error:', error);
    return { success: false, error: error.message };
  }
}