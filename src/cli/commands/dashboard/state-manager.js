/**
 * Dashboard State Manager
 * Centralized state fetching and validation
 */

import { getCurrentWorkflowState } from '../../../workflow-logic/workflow-engine.js';
import { getProjectState } from '../../../file-management/project-structure.js';
import { createDashboardError, ERROR_TYPES, withErrorHandling } from './error-handler.js';

/**
 * State Manager - Centralized state fetching and validation
 */
export class StateManager {
  /**
   * Get validated project state with sensible defaults
   */
  static async getProjectState() {
    return withErrorHandling(
      async () => {
        const state = await getProjectState();
        
        // Validate critical state
        if (!state || typeof state !== 'object') {
          throw createDashboardError(
            ERROR_TYPES.STATE_INVALID, 
            'Invalid project state structure'
          );
        }
        
        // Provide sensible defaults
        return {
          config: {
            name: 'Unnamed Project',
            version: '0.1.0',
            ...state.config
          },
          workflow: {
            projectType: 'unknown',
            adaptive: false,
            ...state.workflow
          },
          ai: {
            capabilities: {
              totalTools: 0,
              categories: 0,
              coverage: 0,
              gaps: [],
              toolsByCategory: {}
            },
            ...state.ai
          },
          ...state
        };
      },
      'Project state fetch',
      ERROR_TYPES.STATE_FETCH_FAILED
    );
  }
  
  /**
   * Get validated workflow state with sensible defaults
   */
  static async getWorkflowState() {
    return withErrorHandling(
      async () => {
        const workflow = await getCurrentWorkflowState();
        
        // Provide sensible defaults
        return {
          currentPhase: workflow?.currentPhase || { phase: 'planning' },
          phases: workflow?.phases || {
            planning: { completed: false, progress: 0 },
            implementation: { completed: false, progress: 0 }
          },
          ...workflow
        };
      },
      'Workflow state fetch',
      ERROR_TYPES.WORKFLOW_FETCH_FAILED
    );
  }
  
  /**
   * Get both states in parallel for efficiency
   */
  static async getAllStates() {
    const [projectState, workflowState] = await Promise.all([
      StateManager.getProjectState(),
      StateManager.getWorkflowState()
    ]);
    
    return { projectState, workflowState };
  }
  
  /**
   * Validate that project is properly initialized
   */
  static async validateProject() {
    try {
      const state = await StateManager.getProjectState();
      
      // Check for basic project structure
      if (!state.config?.name || state.config.name === 'Unnamed Project') {
        throw createDashboardError(
          ERROR_TYPES.PROJECT_NOT_INITIALIZED,
          'Project appears to be uninitialized'
        );
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'DashboardError') {
        throw error;
      }
      throw createDashboardError(
        ERROR_TYPES.PROJECT_NOT_INITIALIZED,
        'Project validation failed',
        error
      );
    }
  }
}
