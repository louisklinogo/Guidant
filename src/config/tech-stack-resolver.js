/**
 * Technology Stack Resolver
 * Replaces hardcoded technology choices with configuration-driven selection
 */

import { getProjectTypeConfig } from './project-types.js';
import fs from 'fs';
import path from 'path';

/**
 * Technology selection strategies
 */
export const SELECTION_STRATEGIES = {
  DEFAULT: 'default',           // Use project type defaults
  REQUIREMENTS: 'requirements', // Select based on requirements analysis
  USER_PREFERENCE: 'user_preference', // Use user-specified preferences
  HYBRID: 'hybrid'             // Combine requirements + preferences + defaults
};

/**
 * Technology Stack Resolver Class
 */
export class TechStackResolver {
  constructor(projectRoot = process.cwd(), options = {}) {
    this.projectRoot = projectRoot;
    this.strategy = options.strategy || SELECTION_STRATEGIES.HYBRID;
    this.userPreferences = this.loadUserPreferences();
    this.projectConfig = null;
  }

  /**
   * Resolve technology stack based on project type and requirements
   * @param {string} projectType - Project type (web_app, mobile_app, etc.)
   * @param {Object} requirements - Analyzed requirements
   * @param {Object} context - Additional context (user flows, components, etc.)
   * @returns {Object} Resolved technology stack
   */
  resolveTechStack(projectType, requirements = {}, context = {}) {
    this.projectConfig = getProjectTypeConfig(projectType);
    
    switch (this.strategy) {
      case SELECTION_STRATEGIES.DEFAULT:
        return this.getDefaultStack();
      case SELECTION_STRATEGIES.REQUIREMENTS:
        return this.getRequirementsBasedStack(requirements, context);
      case SELECTION_STRATEGIES.USER_PREFERENCE:
        return this.getUserPreferenceStack();
      case SELECTION_STRATEGIES.HYBRID:
      default:
        return this.getHybridStack(requirements, context);
    }
  }

  /**
   * Get default technology stack from project configuration
   */
  getDefaultStack() {
    return { ...this.projectConfig.defaultTechStack };
  }

  /**
   * Get technology stack based on requirements analysis
   */
  getRequirementsBasedStack(requirements, context) {
    const stack = { ...this.projectConfig.defaultTechStack };
    const options = this.projectConfig.availableOptions;

    // Frontend selection based on complexity
    if (this.hasComplexUI(requirements, context)) {
      stack.frontend = this.selectBestOption(options.frontend, ['React', 'Vue.js', 'Angular']);
    } else if (this.isSimpleUI(requirements, context)) {
      stack.frontend = this.selectBestOption(options.frontend, ['HTML/CSS/JS', 'Svelte']);
    }

    // Backend selection based on performance and scalability
    if (requirements.scalability === 'high' || requirements.performance === 'high') {
      stack.backend = this.selectBestOption(options.backend, ['Go/Gin', 'Node.js/Express', 'Python/FastAPI']);
    } else if (requirements.rapid_development === true) {
      stack.backend = this.selectBestOption(options.backend, ['Node.js/Express', 'Python/Django']);
    }

    // Database selection based on data requirements
    if (requirements.data_complexity === 'high' || requirements.transactions === true) {
      stack.database = this.selectBestOption(options.database, ['PostgreSQL', 'MySQL']);
    } else if (requirements.simple_data === true) {
      stack.database = this.selectBestOption(options.database, ['SQLite', 'MongoDB']);
    }

    // Deployment selection based on scalability
    if (requirements.scalability === 'high') {
      stack.deployment = this.selectBestOption(options.deployment, ['AWS', 'Google Cloud', 'Azure']);
    } else if (requirements.simple_deployment === true) {
      stack.deployment = this.selectBestOption(options.deployment, ['Vercel', 'Netlify']);
    }

    // AI-specific additions
    if (requirements.ai === true || this.hasAIFeatures(context)) {
      if (options.vector_db) {
        stack.vector_db = this.selectBestOption(options.vector_db, ['Pinecone', 'Weaviate']);
      }
      if (options.ai_framework) {
        stack.ai_framework = this.selectBestOption(options.ai_framework, ['OpenAI', 'Anthropic']);
      }
    }

    return stack;
  }

  /**
   * Get technology stack based on user preferences
   */
  getUserPreferenceStack() {
    const stack = { ...this.projectConfig.defaultTechStack };
    const preferences = this.userPreferences;

    // Apply user preferences where available
    Object.keys(stack).forEach(category => {
      if (preferences[category]) {
        const options = this.projectConfig.availableOptions[category];
        if (options && options.includes(preferences[category])) {
          stack[category] = preferences[category];
        }
      }
    });

    return stack;
  }

  /**
   * Get hybrid technology stack (combines all strategies)
   */
  getHybridStack(requirements, context) {
    // Start with requirements-based selection
    const stack = this.getRequirementsBasedStack(requirements, context);
    
    // Apply user preferences where they don't conflict with requirements
    const preferences = this.userPreferences;
    Object.keys(stack).forEach(category => {
      if (preferences[category]) {
        const options = this.projectConfig.availableOptions[category];
        if (options && options.includes(preferences[category])) {
          // Only override if it doesn't conflict with critical requirements
          if (!this.conflictsWithRequirements(category, preferences[category], requirements)) {
            stack[category] = preferences[category];
          }
        }
      }
    });

    return stack;
  }

  /**
   * Select the best available option from a preference list
   */
  selectBestOption(availableOptions, preferenceOrder) {
    if (!availableOptions || !Array.isArray(availableOptions)) {
      return preferenceOrder[0];
    }

    for (const preferred of preferenceOrder) {
      if (availableOptions.includes(preferred)) {
        return preferred;
      }
    }

    return availableOptions[0];
  }

  /**
   * Load user preferences from configuration
   */
  loadUserPreferences() {
    const preferencePaths = [
      path.join(this.projectRoot, '.guidant', 'preferences.json'),
      path.join(this.projectRoot, '.guidant', 'config.json'),
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.guidant', 'preferences.json')
    ];

    for (const prefPath of preferencePaths) {
      try {
        if (fs.existsSync(prefPath)) {
          const data = JSON.parse(fs.readFileSync(prefPath, 'utf-8'));
          return data.techStackPreferences || data.preferences?.techStack || {};
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return {};
  }

  /**
   * Check if requirements indicate complex UI needs
   */
  hasComplexUI(requirements, context) {
    return (
      requirements.ui_complexity === 'high' ||
      requirements.interactive === true ||
      requirements.realtime === true ||
      (context.componentSpecs && context.componentSpecs.length > 10) ||
      (context.userFlows && context.userFlows.length > 5)
    );
  }

  /**
   * Check if requirements indicate simple UI needs
   */
  isSimpleUI(requirements, context) {
    return (
      requirements.ui_complexity === 'low' ||
      requirements.prototype === true ||
      (context.componentSpecs && context.componentSpecs.length <= 3)
    );
  }

  /**
   * Check if context indicates AI features
   */
  hasAIFeatures(context) {
    if (!context.componentSpecs) return false;
    
    return context.componentSpecs.some(spec => 
      spec.name && (
        spec.name.toLowerCase().includes('ai') ||
        spec.name.toLowerCase().includes('chat') ||
        spec.name.toLowerCase().includes('recommendation') ||
        spec.name.toLowerCase().includes('search')
      )
    );
  }

  /**
   * Check if a preference conflicts with critical requirements
   */
  conflictsWithRequirements(category, preference, requirements) {
    // Define critical conflicts
    const conflicts = {
      database: {
        'SQLite': requirements.scalability === 'high' || requirements.concurrent_users > 100,
        'MongoDB': requirements.transactions === true || requirements.acid_compliance === true
      },
      deployment: {
        'Netlify': requirements.backend_required === true,
        'GitHub Pages': requirements.backend_required === true
      },
      backend: {
        'Python/Django': requirements.performance === 'critical',
        'Ruby/Rails': requirements.performance === 'critical'
      }
    };

    return conflicts[category] && conflicts[category][preference];
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(preferences) {
    const prefPath = path.join(this.projectRoot, '.guidant', 'preferences.json');
    const prefDir = path.dirname(prefPath);

    try {
      if (!fs.existsSync(prefDir)) {
        fs.mkdirSync(prefDir, { recursive: true });
      }

      const existingPrefs = this.loadUserPreferences();
      const updatedPrefs = {
        ...existingPrefs,
        techStackPreferences: {
          ...existingPrefs.techStackPreferences,
          ...preferences
        },
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(prefPath, JSON.stringify(updatedPrefs, null, 2));
      this.userPreferences = updatedPrefs.techStackPreferences;
      
      return true;
    } catch (error) {
      console.warn('Failed to save user preferences:', error.message);
      return false;
    }
  }

  /**
   * Get available options for a technology category
   */
  getAvailableOptions(category) {
    return this.projectConfig?.availableOptions?.[category] || [];
  }

  /**
   * Validate a technology stack against project requirements
   */
  validateTechStack(stack, requirements = {}) {
    const errors = [];
    const warnings = [];

    // Check for critical conflicts
    if (stack.database === 'SQLite' && requirements.scalability === 'high') {
      errors.push('SQLite is not suitable for high scalability requirements');
    }

    if (stack.deployment === 'Netlify' && stack.backend && stack.backend !== 'Serverless') {
      warnings.push('Netlify deployment may not support the selected backend framework');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Quick resolver function for use in transformers
 */
export function resolveTechStack(projectType, requirements = {}, context = {}, options = {}) {
  const resolver = new TechStackResolver(process.cwd(), options);
  return resolver.resolveTechStack(projectType, requirements, context);
}

export default TechStackResolver;
