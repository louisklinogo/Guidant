/**
 * Quality System Index
 * Main exports for Guidant's SOLID-compliant quality validation system
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 */

// Main orchestrator
export { QualityOrchestrator, createQualityOrchestrator, validateDeliverableQuality } from './quality-orchestrator.js';

// Interfaces (for dependency injection and extension)
export {
  IQualityRule,
  IQualityScorer,
  IFeedbackGenerator,
  IQualityStorage,
  IQualityConfig
} from './interfaces/quality-interfaces.js';

// Validation schemas
export {
  QualitySchemas,
  validateQualityRuleResult,
  validateQualityScoreResult,
  validateQualityFeedback,
  validateQualityContext,
  validateQualityConfig
} from './schemas/quality-schemas.js';

// Quality rules (extensible via Open/Closed Principle)
export { ContentLengthRule } from './rules/content-length-rule.js';
export { StructureCompletenessRule } from './rules/structure-completeness-rule.js';

// Quality scorers (pluggable algorithms)
export { WeightedQualityScorer } from './scorers/weighted-quality-scorer.js';

// Feedback generators (configurable feedback strategies)
export { ContextualFeedbackGenerator } from './feedback/contextual-feedback-generator.js';

/**
 * Quality system factory function
 * Creates a fully configured quality orchestrator with default components
 * 
 * @param {string} projectRoot - Project root directory
 * @param {object} options - Configuration options
 * @returns {QualityOrchestrator} Configured quality orchestrator
 */
export function createQualitySystem(projectRoot = process.cwd(), options = {}) {
  const {
    enabledRules = ['content-length', 'structure-completeness'],
    scoringAlgorithm = 'weighted_average',
    feedbackLevel = 'detailed',
    cacheEnabled = true,
    cacheTTL = 600000, // 10 minutes
    timeout = 30000, // 30 seconds
    customRules = [],
    customScorer = null,
    customFeedbackGenerator = null,
    qualityStorage = null,
    qualityConfig = null,
    ...otherOptions
  } = options;

  return new QualityOrchestrator(projectRoot, {
    enabledRules,
    scoringAlgorithm,
    feedbackLevel,
    cacheEnabled,
    cacheTTL,
    timeout,
    qualityRules: customRules,
    qualityScorer: customScorer,
    feedbackGenerator: customFeedbackGenerator,
    qualityStorage,
    qualityConfig,
    ...otherOptions
  });
}

/**
 * Quality rule registry for dynamic rule management
 */
export class QualityRuleRegistry {
  constructor() {
    this.rules = new Map();
    this.registerDefaultRules();
  }

  /**
   * Register default quality rules
   */
  registerDefaultRules() {
    this.register('content-length', ContentLengthRule);
    this.register('structure-completeness', StructureCompletenessRule);
  }

  /**
   * Register a quality rule class
   * @param {string} ruleId - Rule identifier
   * @param {class} RuleClass - Rule class constructor
   * @param {object} defaultConfig - Default configuration
   */
  register(ruleId, RuleClass, defaultConfig = {}) {
    this.rules.set(ruleId, {
      RuleClass,
      defaultConfig,
      metadata: new RuleClass(defaultConfig).getMetadata()
    });
  }

  /**
   * Create rule instance
   * @param {string} ruleId - Rule identifier
   * @param {object} config - Rule configuration
   * @returns {IQualityRule} Rule instance
   */
  createRule(ruleId, config = {}) {
    const ruleInfo = this.rules.get(ruleId);
    if (!ruleInfo) {
      throw new Error(`Unknown quality rule: ${ruleId}`);
    }

    const mergedConfig = { ...ruleInfo.defaultConfig, ...config };
    return new ruleInfo.RuleClass(mergedConfig);
  }

  /**
   * Get available rule IDs
   * @returns {Array} Array of rule IDs
   */
  getAvailableRules() {
    return Array.from(this.rules.keys());
  }

  /**
   * Get rule metadata
   * @param {string} ruleId - Rule identifier
   * @returns {object} Rule metadata
   */
  getRuleMetadata(ruleId) {
    const ruleInfo = this.rules.get(ruleId);
    return ruleInfo ? ruleInfo.metadata : null;
  }

  /**
   * Get all rules metadata
   * @returns {Array} Array of rule metadata
   */
  getAllRulesMetadata() {
    return Array.from(this.rules.values()).map(info => info.metadata);
  }
}

/**
 * Global quality rule registry instance
 */
export const qualityRuleRegistry = new QualityRuleRegistry();

/**
 * Quality system configuration presets
 */
export const QualityPresets = {
  /**
   * Basic quality configuration for simple projects
   */
  basic: {
    enabledRules: ['content-length'],
    scoringAlgorithm: 'simple_average',
    feedbackLevel: 'basic',
    passThreshold: 65,
    timeout: 15000
  },

  /**
   * Standard quality configuration for most projects
   */
  standard: {
    enabledRules: ['content-length', 'structure-completeness'],
    scoringAlgorithm: 'weighted_average',
    feedbackLevel: 'detailed',
    passThreshold: 75,
    timeout: 30000
  },

  /**
   * Enterprise quality configuration for high-quality projects
   */
  enterprise: {
    enabledRules: ['content-length', 'structure-completeness'],
    scoringAlgorithm: 'weighted_average',
    feedbackLevel: 'comprehensive',
    passThreshold: 85,
    timeout: 45000,
    penalizeFailures: true,
    confidenceWeighting: true
  },

  /**
   * Fast quality configuration for quick validation
   */
  fast: {
    enabledRules: ['content-length'],
    scoringAlgorithm: 'simple_average',
    feedbackLevel: 'basic',
    passThreshold: 70,
    timeout: 10000,
    cacheEnabled: true,
    cacheTTL: 300000 // 5 minutes
  }
};

/**
 * Create quality system with preset configuration
 * @param {string} preset - Preset name ('basic', 'standard', 'enterprise', 'fast')
 * @param {string} projectRoot - Project root directory
 * @param {object} overrides - Configuration overrides
 * @returns {QualityOrchestrator} Configured quality orchestrator
 */
export function createQualitySystemWithPreset(preset, projectRoot = process.cwd(), overrides = {}) {
  const presetConfig = QualityPresets[preset];
  if (!presetConfig) {
    throw new Error(`Unknown quality preset: ${preset}. Available: ${Object.keys(QualityPresets).join(', ')}`);
  }

  const config = { ...presetConfig, ...overrides };
  return createQualitySystem(projectRoot, config);
}

/**
 * Quality system utilities
 */
export const QualityUtils = {
  /**
   * Validate quality configuration
   * @param {object} config - Configuration to validate
   * @returns {object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check timeout
    if (config.timeout !== undefined) {
      if (config.timeout < 5000) errors.push('Timeout must be at least 5 seconds');
      if (config.timeout > 300000) warnings.push('Timeout over 5 minutes may cause performance issues');
    }

    // Check cache TTL
    if (config.cacheTTL !== undefined) {
      if (config.cacheTTL < 60000) warnings.push('Cache TTL under 1 minute may reduce cache effectiveness');
      if (config.cacheTTL > 3600000) warnings.push('Cache TTL over 1 hour may use excessive memory');
    }

    // Check pass threshold
    if (config.passThreshold !== undefined) {
      if (config.passThreshold < 0 || config.passThreshold > 100) {
        errors.push('Pass threshold must be between 0 and 100');
      }
    }

    // Check enabled rules
    if (config.enabledRules !== undefined) {
      if (!Array.isArray(config.enabledRules)) {
        errors.push('enabledRules must be an array');
      } else if (config.enabledRules.length === 0) {
        warnings.push('No quality rules enabled - validation will not be meaningful');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Get recommended configuration for project type
   * @param {string} projectType - Project type
   * @param {string} phase - Project phase
   * @returns {object} Recommended configuration
   */
  getRecommendedConfig(projectType, phase) {
    const baseConfig = QualityPresets.standard;
    
    // Adjust for project type
    if (projectType === 'enterprise') {
      return { ...baseConfig, ...QualityPresets.enterprise };
    } else if (projectType === 'simple') {
      return { ...baseConfig, ...QualityPresets.basic };
    }

    // Adjust for phase
    const phaseAdjustments = {
      'concept': { passThreshold: 70 },
      'requirements': { passThreshold: 80 },
      'design': { passThreshold: 75 },
      'architecture': { passThreshold: 85 },
      'implementation': { passThreshold: 75 },
      'deployment': { passThreshold: 80 }
    };

    const adjustment = phaseAdjustments[phase] || {};
    return { ...baseConfig, ...adjustment };
  }
};

// Export everything for convenience
export default {
  QualityOrchestrator,
  createQualityOrchestrator,
  validateDeliverableQuality,
  createQualitySystem,
  createQualitySystemWithPreset,
  QualityRuleRegistry,
  qualityRuleRegistry,
  QualityPresets,
  QualityUtils,
  // Rules
  ContentLengthRule,
  StructureCompletenessRule,
  // Scorers
  WeightedQualityScorer,
  // Feedback
  ContextualFeedbackGenerator,
  // Schemas
  QualitySchemas
};
