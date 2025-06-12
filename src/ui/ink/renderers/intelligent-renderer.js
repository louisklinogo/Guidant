/**
 * Intelligent Dashboard Renderer
 * Single adaptive dashboard that automatically detects optimal mode
 * Following TaskMaster's single-focus approach
 */

import React from 'react';
import { render } from 'ink';
import { DashboardApp } from '../components/DashboardApp.jsx';

/**
 * Render intelligent dashboard that auto-adapts to context
 * This is the new single dashboard mode that replaces static/live/interactive complexity
 */
export async function renderIntelligentDashboard(projectState, workflowState, options = {}) {
  const {
    autoAdapt = true,
    compact = false,
    refreshInterval = 5000
  } = options;

  try {
    const { waitUntilExit, unmount } = render(
      <DashboardApp
        projectState={projectState}
        workflowState={workflowState}
        autoAdapt={autoAdapt}
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
    console.error('Intelligent dashboard error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy function names for backward compatibility
 * All redirect to the intelligent dashboard
 */
export const renderStaticDashboard = renderIntelligentDashboard;
export const renderLiveDashboard = renderIntelligentDashboard;
export const renderInteractiveDashboard = renderIntelligentDashboard;
