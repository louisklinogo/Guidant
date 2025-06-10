/**
 * Dynamic Terminal Layout System - Pane Components
 * Phase 2: Enhanced UI Components
 * 
 * Exports all pane components for the Dynamic Terminal Layout System.
 * This module provides specialized pane implementations building on the BasePane foundation.
 */

// Base Pane Component
export { BasePane } from './BasePane.js';

// Enhanced Pane Components (building on existing sections)
export { ProgressPane } from './ProgressPane.js';
export { TasksPane } from './TasksPane.js';
export { CapabilitiesPane } from './CapabilitiesPane.js';

// New Pane Components
export { LogsPane } from './LogsPane.js';
export { MCPToolsPane } from './MCPToolsPane.js';

// Import for registry
import { BasePane } from './BasePane.js';
import { ProgressPane } from './ProgressPane.js';
import { TasksPane } from './TasksPane.js';
import { CapabilitiesPane } from './CapabilitiesPane.js';
import { LogsPane } from './LogsPane.js';
import { MCPToolsPane } from './MCPToolsPane.js';

/**
 * Pane component registry for dynamic instantiation
 */
export const PANE_COMPONENTS = {
  progress: ProgressPane,
  tasks: TasksPane,
  capabilities: CapabilitiesPane,
  logs: LogsPane,
  tools: MCPToolsPane
};

/**
 * Create a pane component instance
 * 
 * @param {string} paneId - The pane identifier
 * @param {Object} props - Component props
 * @returns {React.Component} Pane component instance
 */
export function createPaneComponent(paneId, props = {}) {
  const PaneComponent = PANE_COMPONENTS[paneId];
  
  if (!PaneComponent) {
    throw new Error(`Unknown pane component: ${paneId}`);
  }
  
  return PaneComponent;
}

/**
 * Get available pane types
 * 
 * @returns {Array<string>} Array of available pane IDs
 */
export function getAvailablePaneTypes() {
  return Object.keys(PANE_COMPONENTS);
}

/**
 * Validate pane component props
 * 
 * @param {string} paneId - The pane identifier
 * @param {Object} props - Component props to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validatePaneProps(paneId, props = {}) {
  const PaneComponent = PANE_COMPONENTS[paneId];
  
  if (!PaneComponent) {
    return {
      isValid: false,
      errors: [`Unknown pane component: ${paneId}`]
    };
  }
  
  const errors = [];
  
  // Basic prop validation
  if (props.paneId && props.paneId !== paneId) {
    errors.push(`Pane ID mismatch: expected '${paneId}', got '${props.paneId}'`);
  }
  
  // Width/height validation
  if (props.width && (typeof props.width !== 'number' || props.width < 1)) {
    errors.push('Width must be a positive number');
  }
  
  if (props.height && (typeof props.height !== 'number' || props.height < 1)) {
    errors.push('Height must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Default export for convenience
 */
export default {
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
};
