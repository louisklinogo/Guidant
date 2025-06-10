/**
 * Dashboard Renderer Factory
 * Single source of truth for renderer selection and creation
 */

import { createDashboardError, ERROR_TYPES, withErrorHandling } from './error-handler.js';

/**
 * Available render modes
 */
export const RENDER_MODES = {
  STATIC: 'static',
  LIVE: 'live',
  INTERACTIVE: 'interactive'
};

/**
 * Renderer Factory - Single source of truth for renderer selection
 */
export class DashboardRendererFactory {
  /**
   * Create appropriate renderer based on mode
   */
  static async createRenderer(mode = RENDER_MODES.STATIC) {
    // Validate mode
    if (!Object.values(RENDER_MODES).includes(mode)) {
      throw createDashboardError(
        ERROR_TYPES.INVALID_MODE,
        `Unknown renderer mode: ${mode}. Valid modes: ${Object.values(RENDER_MODES).join(', ')}`
      );
    }
    
    // Renderer module mapping
    const rendererModules = {
      [RENDER_MODES.STATIC]: () => import('../../../ui/ink/renderers/static-renderer.tsx'),
      [RENDER_MODES.LIVE]: () => import('../../../ui/ink/renderers/live-renderer.tsx'),
      [RENDER_MODES.INTERACTIVE]: () => import('../../../ui/ink/renderers/interactive-renderer.tsx')
    };
    
    return withErrorHandling(
      async () => {
        const module = await rendererModules[mode]();
        
        // Validate that the module has the expected render function
        const expectedFunction = `render${mode.charAt(0).toUpperCase() + mode.slice(1)}Dashboard`;
        if (!module[expectedFunction]) {
          throw new Error(`Renderer module missing expected function: ${expectedFunction}`);
        }
        
        return module;
      },
      `${mode} renderer load`,
      ERROR_TYPES.RENDERER_LOAD_FAILED
    );
  }
  
  /**
   * Get render function from module based on mode
   */
  static getRenderFunction(rendererModule, mode) {
    const functionMap = {
      [RENDER_MODES.STATIC]: 'renderStaticDashboard',
      [RENDER_MODES.LIVE]: 'renderLiveDashboard',
      [RENDER_MODES.INTERACTIVE]: 'renderInteractiveDashboard'
    };
    
    const functionName = functionMap[mode];
    if (!functionName || !rendererModule[functionName]) {
      throw createDashboardError(
        ERROR_TYPES.RENDERER_LOAD_FAILED,
        `Renderer function ${functionName} not found in ${mode} renderer module`
      );
    }
    
    return rendererModule[functionName];
  }
  
  /**
   * Execute renderer with proper error handling
   */
  static async executeRenderer(renderFunction, projectState, workflowState, options) {
    return withErrorHandling(
      async () => {
        const result = await renderFunction(projectState, workflowState, options);
        
        // Validate result
        if (!result || typeof result !== 'object' || result.success === undefined) {
          throw new Error('Renderer returned invalid result format');
        }
        
        if (!result.success) {
          throw new Error(result.error || 'Renderer execution failed');
        }
        
        return result;
      },
      'Renderer execution',
      ERROR_TYPES.RENDERER_EXECUTION_FAILED
    );
  }
}

/**
 * Determine render mode from command options
 */
export function determineRenderMode(options) {
  if (options.interactive) return RENDER_MODES.INTERACTIVE;
  if (options.live) return RENDER_MODES.LIVE;
  return RENDER_MODES.STATIC;
}

/**
 * Validate render options
 */
export function validateRenderOptions(options) {
  const validOptions = {
    compact: 'boolean',
    refreshInterval: 'number',
    interactive: 'boolean',
    live: 'boolean'
  };
  
  for (const [key, expectedType] of Object.entries(validOptions)) {
    if (options[key] !== undefined && typeof options[key] !== expectedType) {
      throw createDashboardError(
        ERROR_TYPES.INVALID_MODE,
        `Invalid option ${key}: expected ${expectedType}, got ${typeof options[key]}`
      );
    }
  }
  
  // Validate refresh interval range
  if (options.refreshInterval !== undefined) {
    if (options.refreshInterval < 1000 || options.refreshInterval > 60000) {
      throw createDashboardError(
        ERROR_TYPES.INVALID_MODE,
        'Refresh interval must be between 1000ms and 60000ms'
      );
    }
  }
  
  return true;
}
