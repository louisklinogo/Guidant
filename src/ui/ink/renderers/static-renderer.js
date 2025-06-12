/**
 * Static Dashboard Renderer
 * Renders once and exits - uses pure DashboardLayout component
 */

import React from 'react';
import { render } from 'ink';
import { DashboardLayout } from '../components/DashboardApp.jsx';

/**
 * Static Dashboard Component - Uses pure DashboardLayout
 * No state, no effects, renders once - architectural solution to multiple render problem
 */
function StaticDashboard({ projectState, workflowState, compact = false }) {
  return (
    <DashboardLayout
      projectState={projectState}
      workflowState={workflowState}
      compact={compact}
      selectedSection={0}
      interactive={false}
    />
  );
}

/**
 * Render static dashboard - the key fix for multiple rendering
 */
export async function renderStaticDashboard(projectState, workflowState, options = {}) {
  const { compact = false } = options;

  try {
    // Render once and immediately unmount - this prevents multiple renders
    const { unmount } = render(
      <StaticDashboard
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
      />
    );

    // Wait for render to complete, then unmount cleanly
    await new Promise(resolve => setTimeout(resolve, 100));
    unmount();

    return { success: true };

  } catch (error) {
    console.error('Static dashboard rendering error:', error);
    return { success: false, error: error.message };
  }
}

