/**
 * Base Transformer Class
 * Abstract base class for all phase transformation implementations
 * Follows SOLID principles and provides common functionality
 */

import { getProjectTypeConfig, validateTechStack } from '../../config/project-types.js';
import { validateTransformationOutput } from '../schemas/transition-schemas.js';

/**
 * Abstract base class for phase transformers
 * Implements common functionality and enforces interface contracts
 */
export class BaseTransformer {
  constructor(analyzer, options = {}) {
    if (this.constructor === BaseTransformer) {
      throw new Error('BaseTransformer is abstract and cannot be instantiated directly');
    }
    
    this.analyzer = analyzer;
    this.options = {
      enableAIEnhancement: options.enableAIEnhancement ?? true,
      fallbackToRules: options.fallbackToRules ?? true,
      projectType: options.projectType || 'web_app',
      ...options
    };
    
    // Load project configuration
    this.projectConfig = this.loadProjectConfig();
  }

  /**
   * Abstract method that must be implemented by subclasses
   * @param {object} analysis - Deliverable analysis from previous phase
   * @param {string} targetPhase - Target phase for transformation
   * @returns {object} Transformation result
   */
  async transform(analysis, targetPhase) {
    throw new Error('transform() method must be implemented by subclass');
  }

  /**
   * Load project configuration based on project type
   */
  loadProjectConfig() {
    try {
      return getProjectTypeConfig(this.options.projectType);
    } catch (error) {
      console.warn(`Failed to load project config for ${this.options.projectType}, using web_app default`);
      return getProjectTypeConfig('web_app');
    }
  }

  /**
   * Extract common insights from deliverable analysis
   * @param {object} analysis - Deliverable analysis
   * @returns {object} Common insights
   */
  extractCommonInsights(analysis) {
    const insights = {
      requirements: [],
      features: [],
      constraints: [],
      stakeholders: [],
      priorities: [],
      risks: []
    };

    // Extract insights from all deliverables
    Object.values(analysis.insights || {}).forEach(deliverableInsights => {
      if (deliverableInsights.requirements) {
        insights.requirements.push(...deliverableInsights.requirements);
      }
      if (deliverableInsights.features) {
        insights.features.push(...deliverableInsights.features);
      }
      if (deliverableInsights.constraints) {
        insights.constraints.push(...deliverableInsights.constraints);
      }
      if (deliverableInsights.stakeholders) {
        insights.stakeholders.push(...deliverableInsights.stakeholders);
      }
      if (deliverableInsights.priorities) {
        insights.priorities.push(...deliverableInsights.priorities);
      }
      if (deliverableInsights.risks) {
        insights.risks.push(...deliverableInsights.risks);
      }
    });

    // Deduplicate arrays
    Object.keys(insights).forEach(key => {
      insights[key] = [...new Set(insights[key])];
    });

    return insights;
  }

  /**
   * Generate tech stack based on project configuration and requirements
   * @param {object} requirements - Extracted requirements
   * @returns {object} Tech stack configuration
   */
  generateTechStack(requirements = {}) {
    const defaultStack = this.projectConfig.defaultTechStack;
    const availableOptions = this.projectConfig.availableOptions;
    
    // Start with default stack
    const techStack = { ...defaultStack };
    
    // Apply requirement-based modifications
    if (requirements.scalability === 'high') {
      // Prefer cloud-native solutions for high scalability
      if (availableOptions.deployment?.includes('AWS')) {
        techStack.deployment = 'AWS';
      }
      if (availableOptions.database?.includes('PostgreSQL')) {
        techStack.database = 'PostgreSQL';
      }
    }
    
    if (requirements.realtime === true) {
      // Add real-time capabilities
      if (availableOptions.backend?.includes('Node.js/Express')) {
        techStack.backend = 'Node.js/Express';
      }
    }
    
    if (requirements.ai === true) {
      // Add AI-specific stack components
      if (availableOptions.vector_db) {
        techStack.vector_db = availableOptions.vector_db[0];
      }
      if (availableOptions.ai_framework) {
        techStack.ai_framework = availableOptions.ai_framework[0];
      }
    }
    
    // Validate the generated tech stack
    const validation = validateTechStack(this.options.projectType, techStack);
    if (!validation.isValid) {
      console.warn('Generated tech stack validation failed:', validation.errors);
      return defaultStack; // Fallback to default
    }
    
    return techStack;
  }

  /**
   * Generate decisions based on analysis and transformation
   * @param {object} analysis - Input analysis
   * @param {object} transformation - Transformation results
   * @returns {array} List of decisions made
   */
  generateDecisions(analysis, transformation) {
    const decisions = [];
    
    // Add phase-specific decisions
    decisions.push(`Transformed ${analysis.phase} deliverables for next phase`);
    
    if (transformation.techStack) {
      decisions.push(`Selected tech stack: ${Object.entries(transformation.techStack).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    }
    
    if (transformation.systemDesign) {
      decisions.push('System architecture defined based on requirements');
    }
    
    if (transformation.databaseSchema) {
      decisions.push('Database schema designed for data relationships');
    }
    
    return decisions;
  }

  /**
   * Generate recommendations for next phase
   * @param {object} analysis - Input analysis
   * @param {string} targetPhase - Target phase
   * @returns {array} List of recommendations
   */
  generateRecommendations(analysis, targetPhase) {
    const recommendations = [];
    const insights = this.extractCommonInsights(analysis);
    
    // General recommendations based on insights
    if (insights.risks.length > 0) {
      recommendations.push('Address identified risks early in development');
    }
    
    if (insights.constraints.length > 0) {
      recommendations.push('Consider constraints when making technical decisions');
    }
    
    // Phase-specific recommendations
    switch (targetPhase) {
      case 'requirements':
        recommendations.push('Validate requirements with stakeholders');
        recommendations.push('Prioritize features based on business value');
        break;
      case 'design':
        recommendations.push('Create user-centered design solutions');
        recommendations.push('Ensure accessibility compliance');
        break;
      case 'architecture':
        recommendations.push('Design for scalability and maintainability');
        recommendations.push('Consider security from the ground up');
        break;
      case 'implementation':
        recommendations.push('Follow coding best practices and standards');
        recommendations.push('Implement comprehensive testing strategy');
        break;
      case 'deployment':
        recommendations.push('Set up monitoring and alerting');
        recommendations.push('Plan for rollback scenarios');
        break;
    }
    
    return recommendations;
  }

  /**
   * Validate transformation output before returning
   * @param {object} output - Transformation output
   * @returns {object} Validated output or error
   */
  validateOutput(output) {
    const validation = validateTransformationOutput(output);
    
    if (!validation.success) {
      throw new Error(`Transformation output validation failed: ${validation.error}`);
    }
    
    return validation.data;
  }

  /**
   * Extract entities from requirements for database design
   * @param {array} requirements - List of requirements
   * @returns {array} List of identified entities
   */
  extractEntities(requirements) {
    const entities = new Set();
    const commonEntities = ['User', 'Session', 'Log', 'Setting'];
    
    // Add common entities
    commonEntities.forEach(entity => entities.add(entity));
    
    // Extract entities from requirements text
    requirements.forEach(req => {
      if (typeof req === 'string') {
        // Simple entity extraction based on common patterns
        const words = req.split(' ');
        words.forEach(word => {
          if (word.length > 3 && /^[A-Z]/.test(word)) {
            entities.add(word);
          }
        });
      }
    });
    
    return Array.from(entities);
  }

  /**
   * Generate API endpoints based on entities and operations
   * @param {array} entities - List of entities
   * @param {array} operations - List of operations
   * @returns {array} List of API endpoints
   */
  generateAPIEndpoints(entities, operations = ['GET', 'POST', 'PUT', 'DELETE']) {
    const endpoints = [];
    
    entities.forEach(entity => {
      const entityLower = entity.toLowerCase();
      operations.forEach(method => {
        endpoints.push({
          path: `/api/${entityLower}${method === 'GET' ? 's' : ''}`,
          method,
          description: `${method} operation for ${entity}`,
          entity
        });
      });
    });
    
    return endpoints;
  }
}
