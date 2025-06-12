/**
 * Project State Context Source
 * Provides context from current project state and configuration
 * Implements IContextSource interface following Single Responsibility Principle
 */

import { IContextSource } from '../interfaces/context-interfaces.js';
import { getProjectState } from '../../file-management/project-structure.js';
import { glob } from 'glob';

export class ProjectStateContextSource extends IContextSource {
  constructor(options = {}) {
    super();
    this.priority = options.priority || 8; // Medium-high priority
    this.enabled = options.enabled !== false;
    this.includeFileStructure = options.includeFileStructure !== false;
    this.maxFiles = options.maxFiles || 20;
  }

  /**
   * Get context from project state and structure
   */
  async getContext(projectRoot, phase, deliverable, options = {}) {
    try {
      // Get project state
      const projectState = await getProjectState(projectRoot);

      // Check if project is initialized
      if (!projectState.isInitialized) {
        return this.getEmptyContext(phase, deliverable);
      }

      // Get project file structure
      const fileStructure = this.includeFileStructure
        ? await this.getProjectFileStructure(projectRoot)
        : { files: [], directories: [] };

      // Get phase progress information
      const phaseProgress = this.analyzePhaseProgress(projectState, phase);

      // Get capability information
      const capabilities = this.extractCapabilities(projectState);

      // Get project configuration insights
      const configInsights = this.analyzeProjectConfig(projectState);

      return {
        success: true,
        source: 'project_state',
        priority: this.priority,
        phase,
        deliverable,
        data: {
          // Project configuration
          projectName: projectState.config?.name || 'Unknown Project',
          projectDescription: projectState.config?.description || '',
          projectType: projectState.config?.type || 'web_app',
          
          // Phase information
          currentPhase: projectState.phases?.current || phase,
          phaseProgress: phaseProgress,
          completedPhases: this.getCompletedPhases(projectState),
          
          // Project structure
          fileStructure: fileStructure,
          hasPackageJson: fileStructure.files.includes('package.json'),
          hasReadme: fileStructure.files.some(f => f.toLowerCase().includes('readme')),
          hasTests: fileStructure.files.some(f => f.includes('test') || f.includes('spec')),
          hasDocs: fileStructure.files.some(f => f.endsWith('.md')),
          
          // Capabilities and tools
          availableTools: capabilities.tools || [],
          detectedCapabilities: capabilities.detected || [],
          toolCategories: capabilities.categories || {},
          
          // Configuration insights
          configurationHealth: configInsights.health,
          missingConfiguration: configInsights.missing,
          recommendations: configInsights.recommendations,
          
          // Workflow state
          workflowState: projectState.workflow || {},
          qualityGates: projectState.qualityGates || {},
          
          // Metadata
          projectInitialized: !!projectState.config,
          lastUpdated: projectState.lastUpdated || new Date().toISOString(),
          guidantVersion: projectState.version || 'unknown'
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          projectHealth: this.calculateProjectHealth(projectState, fileStructure),
          maturity: this.calculateProjectMaturity(projectState, fileStructure),
          complexity: this.estimateProjectComplexity(fileStructure)
        }
      };
    } catch (error) {
      console.error('Failed to get project state context:', error);
      return this.getEmptyContext(phase, deliverable);
    }
  }

  /**
   * Get project file structure
   */
  async getProjectFileStructure(projectRoot) {
    try {
      const files = await glob('**/*.{js,ts,json,md,yml,yaml,txt}', {
        cwd: projectRoot,
        ignore: ['node_modules/**', '.git/**', '.guidant/**', 'dist/**', 'build/**'],
        maxDepth: 3 // Limit depth to avoid too much data
      });

      const directories = await glob('*/', {
        cwd: projectRoot,
        ignore: ['node_modules/', '.git/', '.guidant/', 'dist/', 'build/']
      });

      return {
        files: files.slice(0, this.maxFiles), // Limit number of files
        directories: directories.slice(0, 10), // Limit directories
        totalFiles: files.length,
        totalDirectories: directories.length
      };
    } catch (error) {
      console.warn('Failed to get project file structure:', error);
      return { files: [], directories: [], totalFiles: 0, totalDirectories: 0 };
    }
  }

  /**
   * Analyze phase progress
   */
  analyzePhaseProgress(projectState, currentPhase) {
    const phases = projectState.phases?.phases || {};
    const phaseOrder = ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'];
    
    const progress = {
      currentPhase,
      completedCount: 0,
      totalPhases: phaseOrder.length,
      nextPhase: null,
      progressPercentage: 0
    };

    // Count completed phases
    for (const phaseName of phaseOrder) {
      if (phases[phaseName]?.status === 'completed') {
        progress.completedCount++;
      }
    }

    // Calculate progress percentage
    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex >= 0) {
      progress.progressPercentage = Math.round((currentIndex / phaseOrder.length) * 100);
      
      // Determine next phase
      if (currentIndex < phaseOrder.length - 1) {
        progress.nextPhase = phaseOrder[currentIndex + 1];
      }
    }

    return progress;
  }

  /**
   * Extract capabilities from project state
   */
  extractCapabilities(projectState) {
    const capabilities = projectState.capabilities || {};
    
    return {
      tools: capabilities.tools || [],
      detected: capabilities.detected || [],
      categories: this.categorizeTools(capabilities.tools || []),
      gaps: capabilities.gaps || [],
      recommendations: capabilities.recommendations || []
    };
  }

  /**
   * Categorize tools by type
   */
  categorizeTools(tools) {
    const categories = {
      research: [],
      development: [],
      design: [],
      testing: [],
      deployment: [],
      other: []
    };

    for (const tool of tools) {
      const toolName = typeof tool === 'string' ? tool : tool.name;
      
      if (toolName.includes('search') || toolName.includes('web') || toolName.includes('tavily')) {
        categories.research.push(toolName);
      } else if (toolName.includes('code') || toolName.includes('file') || toolName.includes('edit')) {
        categories.development.push(toolName);
      } else if (toolName.includes('render') || toolName.includes('diagram') || toolName.includes('mermaid')) {
        categories.design.push(toolName);
      } else if (toolName.includes('test') || toolName.includes('validate')) {
        categories.testing.push(toolName);
      } else if (toolName.includes('deploy') || toolName.includes('launch') || toolName.includes('process')) {
        categories.deployment.push(toolName);
      } else {
        categories.other.push(toolName);
      }
    }

    return categories;
  }

  /**
   * Analyze project configuration
   */
  analyzeProjectConfig(projectState) {
    const config = projectState.config || {};
    const insights = {
      health: 'good',
      missing: [],
      recommendations: []
    };

    // Check for essential configuration
    if (!config.name) {
      insights.missing.push('project name');
      insights.health = 'warning';
    }

    if (!config.description) {
      insights.missing.push('project description');
      insights.recommendations.push('Add a clear project description');
    }

    if (!config.type) {
      insights.missing.push('project type');
      insights.health = 'warning';
    }

    // Check workflow configuration
    if (!projectState.workflow) {
      insights.missing.push('workflow configuration');
      insights.recommendations.push('Initialize workflow configuration');
    }

    // Determine overall health
    if (insights.missing.length > 2) {
      insights.health = 'poor';
    } else if (insights.missing.length > 0) {
      insights.health = 'warning';
    }

    return insights;
  }

  /**
   * Get completed phases
   */
  getCompletedPhases(projectState) {
    const phases = projectState.phases?.phases || {};
    return Object.entries(phases)
      .filter(([_, phase]) => phase.status === 'completed')
      .map(([name]) => name);
  }

  /**
   * Calculate project health score
   */
  calculateProjectHealth(projectState, fileStructure) {
    let score = 0.5; // Base score

    // Configuration health
    if (projectState.config?.name) score += 0.1;
    if (projectState.config?.description) score += 0.1;
    if (projectState.config?.type) score += 0.1;

    // File structure health
    if (fileStructure.files.length > 0) score += 0.1;
    if (fileStructure.files.includes('package.json')) score += 0.1;
    if (fileStructure.files.some(f => f.toLowerCase().includes('readme'))) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate project maturity
   */
  calculateProjectMaturity(projectState, fileStructure) {
    const completedPhases = this.getCompletedPhases(projectState).length;
    const hasTests = fileStructure.files.some(f => f.includes('test'));
    const hasDocs = fileStructure.files.some(f => f.endsWith('.md'));
    
    if (completedPhases >= 4 && hasTests && hasDocs) {
      return 'mature';
    } else if (completedPhases >= 2) {
      return 'developing';
    } else {
      return 'early';
    }
  }

  /**
   * Estimate project complexity
   */
  estimateProjectComplexity(fileStructure) {
    const fileCount = fileStructure.totalFiles || fileStructure.files.length;
    const dirCount = fileStructure.totalDirectories || fileStructure.directories.length;
    
    if (fileCount > 50 || dirCount > 10) {
      return 'high';
    } else if (fileCount > 20 || dirCount > 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get empty context when project state is unavailable
   * In production, this should indicate missing configuration rather than providing defaults
   */
  getEmptyContext(phase, deliverable) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // In production, return error state instead of placeholder data
      return {
        success: false,
        source: 'project_state',
        priority: this.priority,
        phase,
        deliverable,
        error: 'Project not initialized. Run "guidant init" to set up the project.',
        data: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          isEmpty: true,
          requiresInitialization: true
        }
      };
    }

    // In development, provide minimal context with clear indicators
    return {
      success: true,
      source: 'project_state',
      priority: this.priority,
      phase,
      deliverable,
      data: {
        projectName: null, // Explicitly null instead of placeholder
        projectDescription: null,
        projectType: null, // Will be determined during initialization
        currentPhase: phase,
        phaseProgress: { currentPhase: phase, completedCount: 0, totalPhases: 6, progressPercentage: 0 },
        completedPhases: [],
        fileStructure: { files: [], directories: [], totalFiles: 0, totalDirectories: 0 },
        hasPackageJson: false,
        hasReadme: false,
        hasTests: false,
        hasDocs: false,
        availableTools: [],
        detectedCapabilities: [],
        toolCategories: {},
        configurationHealth: 'uninitialized',
        missingConfiguration: ['project initialization', 'project configuration'],
        recommendations: ['Run "guidant init" to initialize the project'],
        workflowState: {},
        qualityGates: {},
        projectInitialized: false,
        lastUpdated: new Date().toISOString(),
        guidantVersion: 'unknown',
        _isPlaceholder: true // Flag to indicate this is placeholder data
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
        projectHealth: 0.0, // Zero health for uninitialized project
        maturity: 'uninitialized',
        complexity: 'unknown',
        isEmpty: true,
        isPlaceholder: true
      }
    };
  }

  getPriority() {
    return this.priority;
  }

  isAvailable() {
    return this.enabled;
  }

  getSourceName() {
    return 'project_state';
  }
}
