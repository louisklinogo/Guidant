/**
 * Quality System Interfaces for Guidant Evolution
 * SOLID-compliant interface definitions following Interface Segregation Principle (ISP)
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 */

/**
 * Interface for quality rule evaluation
 * Single responsibility: Only rule evaluation methods
 */
export class IQualityRule {
  /**
   * Evaluate a quality rule against deliverable content
   * @param {object} content - Parsed deliverable content
   * @param {object} context - Evaluation context (project type, phase, etc.)
   * @returns {Promise<object>} Rule evaluation result
   */
  async evaluate(content, context) {
    throw new Error('IQualityRule.evaluate() must be implemented');
  }

  /**
   * Get rule metadata and configuration
   * @returns {object} Rule metadata
   */
  getMetadata() {
    throw new Error('IQualityRule.getMetadata() must be implemented');
  }

  /**
   * Validate rule configuration
   * @param {object} config - Rule configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    throw new Error('IQualityRule.validateConfig() must be implemented');
  }
}

/**
 * Interface for quality scoring algorithms
 * Single responsibility: Only scoring calculation methods
 */
export class IQualityScorer {
  /**
   * Calculate overall quality score from rule results
   * @param {Array} ruleResults - Array of rule evaluation results
   * @param {object} context - Scoring context
   * @returns {Promise<object>} Quality score result
   */
  async calculateScore(ruleResults, context) {
    throw new Error('IQualityScorer.calculateScore() must be implemented');
  }

  /**
   * Get scoring algorithm metadata
   * @returns {object} Scorer metadata
   */
  getMetadata() {
    throw new Error('IQualityScorer.getMetadata() must be implemented');
  }

  /**
   * Configure scoring weights and thresholds
   * @param {object} config - Scoring configuration
   * @returns {boolean} True if configuration was applied successfully
   */
  configure(config) {
    throw new Error('IQualityScorer.configure() must be implemented');
  }
}

/**
 * Interface for feedback generation
 * Single responsibility: Only feedback generation methods
 */
export class IFeedbackGenerator {
  /**
   * Generate improvement feedback from quality results
   * @param {object} qualityResult - Quality evaluation result
   * @param {object} context - Feedback context
   * @returns {Promise<object>} Generated feedback
   */
  async generateFeedback(qualityResult, context) {
    throw new Error('IFeedbackGenerator.generateFeedback() must be implemented');
  }

  /**
   * Get feedback generator metadata
   * @returns {object} Generator metadata
   */
  getMetadata() {
    throw new Error('IFeedbackGenerator.getMetadata() must be implemented');
  }

  /**
   * Configure feedback generation parameters
   * @param {object} config - Feedback configuration
   * @returns {boolean} True if configuration was applied successfully
   */
  configure(config) {
    throw new Error('IFeedbackGenerator.configure() must be implemented');
  }
}

/**
 * Interface for quality validation storage
 * Single responsibility: Only storage and retrieval methods
 */
export class IQualityStorage {
  /**
   * Store quality validation result
   * @param {string} deliverableId - Deliverable identifier
   * @param {object} qualityResult - Quality validation result
   * @returns {Promise<boolean>} True if stored successfully
   */
  async storeResult(deliverableId, qualityResult) {
    throw new Error('IQualityStorage.storeResult() must be implemented');
  }

  /**
   * Retrieve quality validation result
   * @param {string} deliverableId - Deliverable identifier
   * @returns {Promise<object|null>} Quality result or null if not found
   */
  async getResult(deliverableId) {
    throw new Error('IQualityStorage.getResult() must be implemented');
  }

  /**
   * Get quality history for a deliverable
   * @param {string} deliverableId - Deliverable identifier
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} Array of quality results
   */
  async getHistory(deliverableId, limit = 10) {
    throw new Error('IQualityStorage.getHistory() must be implemented');
  }

  /**
   * Get quality statistics for a phase or project
   * @param {object} filter - Filter criteria
   * @returns {Promise<object>} Quality statistics
   */
  async getStatistics(filter) {
    throw new Error('IQualityStorage.getStatistics() must be implemented');
  }

  /**
   * Clean up old quality results
   * @param {number} retentionDays - Number of days to retain results
   * @returns {Promise<number>} Number of results cleaned up
   */
  async cleanup(retentionDays = 30) {
    throw new Error('IQualityStorage.cleanup() must be implemented');
  }
}

/**
 * Interface for quality configuration management
 * Single responsibility: Only configuration methods
 */
export class IQualityConfig {
  /**
   * Get quality configuration for project type and phase
   * @param {string} projectType - Project type identifier
   * @param {string} phase - Phase identifier
   * @returns {Promise<object>} Quality configuration
   */
  async getConfig(projectType, phase) {
    throw new Error('IQualityConfig.getConfig() must be implemented');
  }

  /**
   * Update quality configuration
   * @param {string} projectType - Project type identifier
   * @param {string} phase - Phase identifier
   * @param {object} config - Configuration to update
   * @returns {Promise<boolean>} True if updated successfully
   */
  async updateConfig(projectType, phase, config) {
    throw new Error('IQualityConfig.updateConfig() must be implemented');
  }

  /**
   * Get available quality rules for project type
   * @param {string} projectType - Project type identifier
   * @returns {Promise<Array>} Array of available rule names
   */
  async getAvailableRules(projectType) {
    throw new Error('IQualityConfig.getAvailableRules() must be implemented');
  }

  /**
   * Validate quality configuration
   * @param {object} config - Configuration to validate
   * @returns {Promise<object>} Validation result
   */
  async validateConfig(config) {
    throw new Error('IQualityConfig.validateConfig() must be implemented');
  }
}

/**
 * Quality rule evaluation result structure
 */
export const QualityRuleResult = {
  ruleId: 'string',
  ruleName: 'string',
  passed: 'boolean',
  score: 'number', // 0-100
  weight: 'number', // Rule weight in overall score
  message: 'string',
  details: 'object',
  suggestions: 'array',
  evaluatedAt: 'string'
};

/**
 * Quality score result structure
 */
export const QualityScoreResult = {
  overallScore: 'number', // 0-100
  weightedScore: 'number', // 0-100
  passThreshold: 'number', // Minimum score to pass
  passed: 'boolean',
  ruleResults: 'array', // Array of QualityRuleResult
  metadata: 'object',
  calculatedAt: 'string'
};

/**
 * Quality feedback structure
 */
export const QualityFeedback = {
  summary: 'string',
  strengths: 'array',
  improvements: 'array',
  criticalIssues: 'array',
  suggestions: 'array',
  nextSteps: 'array',
  priority: 'string', // 'low', 'medium', 'high', 'critical'
  estimatedEffort: 'string',
  generatedAt: 'string'
};

/**
 * Quality validation context structure
 */
export const QualityContext = {
  projectType: 'string',
  phase: 'string',
  deliverableType: 'string',
  deliverablePath: 'string',
  projectRoot: 'string',
  configuration: 'object',
  metadata: 'object'
};
