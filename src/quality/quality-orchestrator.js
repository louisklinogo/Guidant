/**
 * Quality Orchestrator for Guidant Evolution
 * SOLID-compliant quality validation system coordinator
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 * SOLID Principle: Dependency Inversion Principle (DIP)
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Import interfaces (depend on abstractions, not concrete implementations)
import { 
  IQualityRule, 
  IQualityScorer, 
  IFeedbackGenerator,
  IQualityStorage,
  IQualityConfig 
} from './interfaces/quality-interfaces.js';

// Import schemas for validation
import { 
  validateQualityContext,
  validateQualityValidationOptions,
  QualityOrchestratorResultSchema
} from './schemas/quality-schemas.js';

// Import concrete implementations (injected via constructor)
import { ContentLengthRule } from './rules/content-length-rule.js';
import { StructureCompletenessRule } from './rules/structure-completeness-rule.js';
import { WeightedQualityScorer } from './scorers/weighted-quality-scorer.js';
import { ContextualFeedbackGenerator } from './feedback/contextual-feedback-generator.js';

// Import existing Guidant components
import { DeliverableContentAnalyzer } from '../data-processing/deliverable-analyzer.js';

/**
 * Quality Orchestrator - coordinates quality validation process
 * Follows Dependency Inversion Principle by depending on interfaces
 */
export class QualityOrchestrator {
  constructor(projectRoot = process.cwd(), options = {}) {
    this.projectRoot = projectRoot;
    this.options = {
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 600000, // 10 minutes
      timeout: options.timeout || 30000, // 30 seconds
      retryAttempts: options.retryAttempts || 2,
      enabledRules: options.enabledRules || ['content-length', 'structure-completeness'],
      scoringAlgorithm: options.scoringAlgorithm || 'weighted_average',
      feedbackLevel: options.feedbackLevel || 'detailed',
      ...options
    };

    // Initialize cache with Map for performance
    this.cache = new Map();
    this.cacheTimestamps = new Map();

    // Initialize components (dependency injection)
    this.contentAnalyzer = options.contentAnalyzer || new DeliverableContentAnalyzer(projectRoot);
    this.qualityRules = this.initializeQualityRules(options.qualityRules);
    this.qualityScorer = options.qualityScorer || new WeightedQualityScorer({
      algorithm: this.options.scoringAlgorithm
    });
    this.feedbackGenerator = options.feedbackGenerator || new ContextualFeedbackGenerator({
      feedbackLevel: this.options.feedbackLevel
    });
    this.qualityStorage = options.qualityStorage || null; // Optional storage
    this.qualityConfig = options.qualityConfig || null; // Optional config manager

    // Performance tracking
    this.metrics = {
      totalValidations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      lastValidation: null
    };
  }

  /**
   * Initialize quality rules with dependency injection
   * @param {Array|Map} customRules - Custom rule implementations
   * @returns {Map} Map of rule instances
   */
  initializeQualityRules(customRules) {
    const rules = new Map();

    // Add default rules if enabled
    if (this.options.enabledRules.includes('content-length')) {
      rules.set('content-length', new ContentLengthRule());
    }
    
    if (this.options.enabledRules.includes('structure-completeness')) {
      rules.set('structure-completeness', new StructureCompletenessRule());
    }

    // Add custom rules if provided
    if (customRules) {
      if (customRules instanceof Map) {
        for (const [ruleId, rule] of customRules) {
          if (rule instanceof IQualityRule) {
            rules.set(ruleId, rule);
          } else {
            console.warn(`Custom rule ${ruleId} does not implement IQualityRule interface`);
          }
        }
      } else if (Array.isArray(customRules)) {
        for (const rule of customRules) {
          if (rule instanceof IQualityRule) {
            const metadata = rule.getMetadata();
            rules.set(metadata.ruleId, rule);
          } else {
            console.warn('Custom rule does not implement IQualityRule interface');
          }
        }
      }
    }

    return rules;
  }

  /**
   * Validate deliverable quality
   * @param {string} deliverablePath - Path to deliverable file
   * @param {object} context - Validation context
   * @param {object} options - Validation options
   * @returns {Promise<object>} Quality validation result
   */
  async validateQuality(deliverablePath, context, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      const contextValidation = validateQualityContext(context);
      if (!contextValidation.success) {
        throw new Error(`Invalid context: ${contextValidation.error.message}`);
      }

      const optionsValidation = validateQualityValidationOptions(options);
      if (!optionsValidation.success) {
        throw new Error(`Invalid options: ${optionsValidation.error.message}`);
      }

      // Check cache if enabled
      const cacheKey = this.generateCacheKey(deliverablePath, context, options);
      if (this.options.cacheEnabled && options.cacheResults !== false) {
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          return cachedResult;
        }
      }

      this.metrics.cacheMisses++;

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.options.timeout);

      try {
        // Step 1: Analyze deliverable content
        const contentAnalysis = await this.analyzeContent(deliverablePath, context, abortController.signal);
        
        // Step 2: Evaluate quality rules
        const ruleResults = await this.evaluateQualityRules(contentAnalysis, context, options, abortController.signal);
        
        // Step 3: Calculate quality score
        const qualityScore = await this.calculateQualityScore(ruleResults, context, abortController.signal);
        
        // Step 4: Generate feedback
        const feedback = await this.generateFeedback(qualityScore, context, abortController.signal);
        
        // Step 5: Determine readiness for transition
        const readyForTransition = this.assessTransitionReadiness(qualityScore, context);
        
        // Step 6: Generate recommendations and blockers
        const recommendations = this.generateRecommendations(qualityScore, feedback, context);
        const blockers = this.identifyBlockers(qualityScore, feedback, context);

        clearTimeout(timeoutId);

        // Build result
        const result = {
          success: true,
          deliverableId: this.generateDeliverableId(deliverablePath),
          deliverablePath,
          qualityScore,
          feedback,
          recommendations,
          blockers,
          readyForTransition,
          warnings: [],
          executionTime: Date.now() - startTime,
          cacheHit: false,
          validatedAt: new Date().toISOString()
        };

        // Validate result structure
        const resultValidation = QualityOrchestratorResultSchema.safeParse(result);
        if (!resultValidation.success) {
          console.warn('Quality result validation failed:', resultValidation.error.message);
          result.warnings.push('Result structure validation failed');
        }

        // Cache result if enabled
        if (this.options.cacheEnabled && options.cacheResults !== false) {
          this.setCachedResult(cacheKey, result);
        }

        // Store result if storage is available
        if (this.qualityStorage) {
          try {
            await this.qualityStorage.storeResult(result.deliverableId, result);
          } catch (error) {
            console.warn('Failed to store quality result:', error.message);
            result.warnings.push('Failed to store result');
          }
        }

        // Update metrics
        this.updateMetrics(Date.now() - startTime);

        return result;

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime);

      return {
        success: false,
        deliverableId: this.generateDeliverableId(deliverablePath),
        deliverablePath,
        error: error.message,
        warnings: [],
        readyForTransition: false,
        executionTime,
        cacheHit: false,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze deliverable content using existing analyzer
   * @param {string} deliverablePath - Path to deliverable file
   * @param {object} context - Validation context
   * @param {AbortSignal} signal - Abort signal for timeout
   * @returns {Promise<object>} Content analysis result
   */
  async analyzeContent(deliverablePath, context, signal) {
    try {
      // Use existing DeliverableContentAnalyzer
      const analysis = await this.contentAnalyzer.analyzeDeliverable(
        deliverablePath, 
        context.deliverableType
      );

      if (!analysis.success) {
        throw new Error(`Content analysis failed: ${analysis.error}`);
      }

      return analysis;
      
    } catch (error) {
      if (signal.aborted) {
        throw new Error('Content analysis timed out');
      }
      throw new Error(`Content analysis failed: ${error.message}`);
    }
  }

  /**
   * Evaluate all quality rules against content
   * @param {object} contentAnalysis - Content analysis result
   * @param {object} context - Validation context
   * @param {object} options - Validation options
   * @param {AbortSignal} signal - Abort signal for timeout
   * @returns {Promise<Array>} Array of rule evaluation results
   */
  async evaluateQualityRules(contentAnalysis, context, options, signal) {
    const ruleResults = [];
    const enabledRules = options.enabledRules || this.options.enabledRules;
    const disabledRules = options.disabledRules || [];

    for (const [ruleId, rule] of this.qualityRules) {
      if (signal.aborted) {
        throw new Error('Quality rule evaluation timed out');
      }

      // Skip disabled rules
      if (disabledRules.includes(ruleId) || !enabledRules.includes(ruleId)) {
        continue;
      }

      try {
        const ruleResult = await rule.evaluate(contentAnalysis.content, context);
        ruleResults.push(ruleResult);
      } catch (error) {
        console.warn(`Rule ${ruleId} evaluation failed:`, error.message);
        ruleResults.push({
          ruleId,
          ruleName: rule.getMetadata().name,
          passed: false,
          score: 0,
          weight: 1.0,
          message: `Rule evaluation failed: ${error.message}`,
          details: { error: error.message },
          suggestions: ['Review rule configuration and try again'],
          evaluatedAt: new Date().toISOString(),
          confidence: 0.0
        });
      }
    }

    if (ruleResults.length === 0) {
      throw new Error('No quality rules were evaluated');
    }

    return ruleResults;
  }

  /**
   * Calculate overall quality score from rule results
   * @param {Array} ruleResults - Rule evaluation results
   * @param {object} context - Validation context
   * @param {AbortSignal} signal - Abort signal for timeout
   * @returns {Promise<object>} Quality score result
   */
  async calculateQualityScore(ruleResults, context, signal) {
    try {
      if (signal.aborted) {
        throw new Error('Quality scoring timed out');
      }

      return await this.qualityScorer.calculateScore(ruleResults, context);
      
    } catch (error) {
      throw new Error(`Quality scoring failed: ${error.message}`);
    }
  }

  /**
   * Generate improvement feedback from quality results
   * @param {object} qualityScore - Quality score result
   * @param {object} context - Validation context
   * @param {AbortSignal} signal - Abort signal for timeout
   * @returns {Promise<object>} Generated feedback
   */
  async generateFeedback(qualityScore, context, signal) {
    try {
      if (signal.aborted) {
        throw new Error('Feedback generation timed out');
      }

      return await this.feedbackGenerator.generateFeedback(qualityScore, context);

    } catch (error) {
      console.warn('Feedback generation failed:', error.message);
      return {
        summary: 'Feedback generation failed',
        strengths: [],
        improvements: [],
        criticalIssues: ['Unable to generate feedback'],
        suggestions: ['Review quality results manually'],
        nextSteps: ['Fix feedback generation issues'],
        priority: 'medium',
        estimatedEffort: 'Unknown',
        generatedAt: new Date().toISOString(),
        confidence: 0.0
      };
    }
  }

  /**
   * Assess if deliverable is ready for phase transition
   * @param {object} qualityScore - Quality score result
   * @param {object} context - Validation context
   * @returns {boolean} True if ready for transition
   */
  assessTransitionReadiness(qualityScore, context) {
    // Basic readiness check
    if (!qualityScore.passed) {
      return false;
    }

    // Check for critical failures
    const criticalFailures = qualityScore.ruleResults.filter(result =>
      !result.passed && result.score < 30
    );

    if (criticalFailures.length > 0) {
      return false;
    }

    // Additional context-specific checks
    const projectType = context.projectType || 'standard';
    const phase = context.phase || 'unknown';

    // Enterprise projects require higher standards
    if (projectType === 'enterprise' && qualityScore.overallScore < 85) {
      return false;
    }

    // Critical phases require higher standards
    const criticalPhases = ['requirements', 'architecture'];
    if (criticalPhases.includes(phase) && qualityScore.overallScore < 80) {
      return false;
    }

    return true;
  }

  /**
   * Generate recommendations based on quality results
   * @param {object} qualityScore - Quality score result
   * @param {object} feedback - Generated feedback
   * @param {object} context - Validation context
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(qualityScore, feedback, context) {
    const recommendations = [];

    // Score-based recommendations
    if (qualityScore.overallScore >= 90) {
      recommendations.push('Excellent quality - consider this as a template for future deliverables');
    } else if (qualityScore.overallScore >= 80) {
      recommendations.push('Good quality - minor improvements could enhance value');
    } else if (qualityScore.overallScore >= 70) {
      recommendations.push('Acceptable quality - focus on key improvement areas');
    } else {
      recommendations.push('Quality below standards - significant improvements needed');
    }

    // Rule-specific recommendations
    const failedRules = qualityScore.ruleResults.filter(result => !result.passed);
    if (failedRules.length > 0) {
      recommendations.push(`Address ${failedRules.length} failed quality rule(s)`);
    }

    // Feedback-based recommendations
    if (feedback.criticalIssues.length > 0) {
      recommendations.push('Resolve critical issues before proceeding');
    }

    if (feedback.priority === 'high' || feedback.priority === 'critical') {
      recommendations.push('High priority improvements required');
    }

    // Context-specific recommendations
    const deliverableType = context.deliverableType;
    if (deliverableType === 'prd_complete' && qualityScore.overallScore < 85) {
      recommendations.push('PRD quality is critical for project success - consider additional review');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Identify blockers that prevent phase transition
   * @param {object} qualityScore - Quality score result
   * @param {object} feedback - Generated feedback
   * @param {object} context - Validation context
   * @returns {Array} Array of blockers
   */
  identifyBlockers(qualityScore, feedback, context) {
    const blockers = [];

    // Score-based blockers
    if (!qualityScore.passed) {
      const gap = qualityScore.passThreshold - qualityScore.overallScore;
      blockers.push(`Quality score ${gap} points below threshold (${qualityScore.overallScore}/${qualityScore.passThreshold})`);
    }

    // Critical rule failures
    const criticalFailures = qualityScore.ruleResults.filter(result =>
      !result.passed && result.score < 30
    );

    for (const failure of criticalFailures) {
      blockers.push(`Critical failure: ${failure.ruleName}`);
    }

    // Critical issues from feedback
    for (const issue of feedback.criticalIssues) {
      blockers.push(`Critical issue: ${issue}`);
    }

    // Context-specific blockers
    const projectType = context.projectType || 'standard';
    if (projectType === 'enterprise' && qualityScore.overallScore < 85) {
      blockers.push('Enterprise project requires minimum 85% quality score');
    }

    return blockers;
  }

  /**
   * Generate cache key for result caching
   * @param {string} deliverablePath - Path to deliverable
   * @param {object} context - Validation context
   * @param {object} options - Validation options
   * @returns {string} Cache key
   */
  generateCacheKey(deliverablePath, context, options) {
    const keyData = {
      path: deliverablePath,
      projectType: context.projectType,
      phase: context.phase,
      deliverableType: context.deliverableType,
      enabledRules: options.enabledRules || this.options.enabledRules,
      scoringAlgorithm: options.scoringAlgorithm || this.options.scoringAlgorithm
    };

    const keyString = JSON.stringify(keyData);
    return createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Get cached result if available and not expired
   * @param {string} cacheKey - Cache key
   * @returns {object|null} Cached result or null
   */
  getCachedResult(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      return null;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp || Date.now() - timestamp > this.options.cacheTTL) {
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      return null;
    }

    const result = this.cache.get(cacheKey);
    result.cacheHit = true;
    return result;
  }

  /**
   * Set cached result with timestamp
   * @param {string} cacheKey - Cache key
   * @param {object} result - Result to cache
   */
  setCachedResult(cacheKey, result) {
    this.cache.set(cacheKey, { ...result });
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Generate unique deliverable ID
   * @param {string} deliverablePath - Path to deliverable
   * @returns {string} Unique deliverable ID
   */
  generateDeliverableId(deliverablePath) {
    const relativePath = path.relative(this.projectRoot, deliverablePath);
    return createHash('md5').update(relativePath).digest('hex').substring(0, 16);
  }

  /**
   * Update performance metrics
   * @param {number} executionTime - Execution time in milliseconds
   */
  updateMetrics(executionTime) {
    this.metrics.totalValidations++;
    this.metrics.lastValidation = new Date().toISOString();

    // Calculate rolling average execution time
    const currentAvg = this.metrics.averageExecutionTime;
    const totalValidations = this.metrics.totalValidations;
    this.metrics.averageExecutionTime =
      ((currentAvg * (totalValidations - 1)) + executionTime) / totalValidations;
  }

  /**
   * Get performance metrics
   * @returns {object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalValidations > 0
        ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
        : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache and reset metrics
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Add custom quality rule
   * @param {string} ruleId - Rule identifier
   * @param {IQualityRule} rule - Rule implementation
   * @returns {boolean} True if rule was added successfully
   */
  addQualityRule(ruleId, rule) {
    if (!(rule instanceof IQualityRule)) {
      console.warn('Rule must implement IQualityRule interface');
      return false;
    }

    if (this.qualityRules.has(ruleId)) {
      console.warn(`Rule ${ruleId} already exists`);
      return false;
    }

    this.qualityRules.set(ruleId, rule);
    return true;
  }

  /**
   * Remove quality rule
   * @param {string} ruleId - Rule identifier
   * @returns {boolean} True if rule was removed
   */
  removeQualityRule(ruleId) {
    return this.qualityRules.delete(ruleId);
  }

  /**
   * Get available quality rules
   * @returns {Array} Array of rule metadata
   */
  getAvailableRules() {
    const rules = [];
    for (const [ruleId, rule] of this.qualityRules) {
      rules.push(rule.getMetadata());
    }
    return rules;
  }

  /**
   * Configure quality orchestrator
   * @param {object} config - Configuration options
   * @returns {boolean} True if configuration was applied successfully
   */
  configure(config) {
    try {
      // Validate configuration
      if (config.timeout !== undefined && (config.timeout < 1000 || config.timeout > 300000)) {
        console.warn('Timeout must be between 1000ms and 300000ms');
        return false;
      }

      if (config.cacheTTL !== undefined && (config.cacheTTL < 60000 || config.cacheTTL > 3600000)) {
        console.warn('Cache TTL must be between 1 minute and 1 hour');
        return false;
      }

      // Apply valid configuration
      this.options = { ...this.options, ...config };

      // Reconfigure components if needed
      if (config.scoringAlgorithm && this.qualityScorer.configure) {
        this.qualityScorer.configure({ algorithm: config.scoringAlgorithm });
      }

      if (config.feedbackLevel && this.feedbackGenerator.configure) {
        this.feedbackGenerator.configure({ feedbackLevel: config.feedbackLevel });
      }

      return true;

    } catch (error) {
      console.error('Failed to configure QualityOrchestrator:', error.message);
      return false;
    }
  }

  /**
   * Get orchestrator metadata
   * @returns {object} Orchestrator metadata
   */
  getMetadata() {
    return {
      orchestratorId: 'quality-orchestrator',
      name: 'Quality Orchestrator',
      description: 'SOLID-compliant quality validation system coordinator',
      version: '1.0.0',
      author: 'Guidant Quality System',
      availableRules: this.getAvailableRules().length,
      scoringAlgorithms: this.qualityScorer.getMetadata().algorithms || [],
      feedbackLevels: this.feedbackGenerator.getMetadata().feedbackLevels || [],
      performance: this.getMetrics(),
      configuration: {
        cacheEnabled: this.options.cacheEnabled,
        cacheTTL: this.options.cacheTTL,
        timeout: this.options.timeout,
        enabledRules: this.options.enabledRules,
        scoringAlgorithm: this.options.scoringAlgorithm,
        feedbackLevel: this.options.feedbackLevel
      }
    };
  }
}

/**
 * Convenience function to create and configure quality orchestrator
 * @param {string} projectRoot - Project root directory
 * @param {object} options - Configuration options
 * @returns {QualityOrchestrator} Configured orchestrator instance
 */
export function createQualityOrchestrator(projectRoot = process.cwd(), options = {}) {
  return new QualityOrchestrator(projectRoot, options);
}

/**
 * Convenience function to validate deliverable quality
 * @param {string} deliverablePath - Path to deliverable file
 * @param {object} context - Validation context
 * @param {string} projectRoot - Project root directory
 * @param {object} options - Validation options
 * @returns {Promise<object>} Quality validation result
 */
export async function validateDeliverableQuality(deliverablePath, context, projectRoot = process.cwd(), options = {}) {
  const orchestrator = new QualityOrchestrator(projectRoot, options);
  return await orchestrator.validateQuality(deliverablePath, context, options);
}
