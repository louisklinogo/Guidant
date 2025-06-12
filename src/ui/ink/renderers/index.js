/**
 * Ink Renderers - Barrel Export
 * Clean separation of static, live, and interactive dashboard renderers
 */

// Import all renderers
import { renderStaticDashboard } from './static-renderer.js';
import { renderLiveDashboard } from './live-renderer.js';
import { renderInteractiveDashboard } from './interactive-renderer.js';

// Re-export for direct use
export { renderStaticDashboard, renderLiveDashboard, renderInteractiveDashboard };

// Main render function that routes to appropriate renderer
export async function renderInkDashboard(projectState, workflowState, options = {}) {
  const { live = false, interactive = false } = options;

  if (interactive) {
    return renderInteractiveDashboard(projectState, workflowState, options);
  }

  if (live) {
    return renderLiveDashboard(projectState, workflowState, options);
  }

  // Default to static renderer
  return renderStaticDashboard(projectState, workflowState, options);
}

export default {
  renderInkDashboard,
  renderStaticDashboard,
  renderLiveDashboard,
  renderInteractiveDashboard
};