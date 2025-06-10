/**
 * Weighted Quality Scorer
 * Calculates overall quality scores using weighted rule results
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 * SOLID Principle: Single Responsibility Principle (SRP)
 */

import { IQualityScorer } from '../interfaces/quality-interfaces.js';
import { validateQualityScoreResult } from '../schemas/quality-schemas.js';

/**
 * Weighted Quality Scorer - calculates weighted quality scores
 * Single responsibility: Only calculates quality scores from rule results
 */
export class WeightedQualityScorer extends IQualityScorer {
  constructor(config = {}) {
    super();
    this.config = {
      defaultWeight: config.defaultWeight || 1.0,
      passThreshold: config.passThreshold || 75,
      algorithm: config.algorithm || 'weighted_average',
      normalizeWeights: config.normalizeWeights !== false,
      penalizeFailures: config.penalizeFailures !== false,
      failurePenalty: config.failurePenalty || 0.1,
      confidenceWeighting: config.confidenceWeighting || false,
      ...config
    };
    
    this.scorerId = 'weighted-scorer';
    this.scorerName = 'Weighted Quality Scorer';
    this.version = '1.0.0';
  }

  /**
   * Calculate overall quality score from rule results
   * @param {Array} ruleResults - Array of rule evaluation results
   * @param {object} context - Scoring context
   * @returns {Promise<object>} Quality score result
   */
  async calculateScore(ruleResults, context) {
    try {
      if (!Array.isArray(ruleResults) || ruleResults.length === 0) {
        throw new Error('No rule results provided for scoring');
      }

      const analysis = this.analyzeRuleResults(ruleResults);
      const scores = this.calculateScores(analysis, context);
      const metadata = this.generateMetadata(analysis, context);
      
      const scoreResult = {
        overallScore: scores.overall,
        weightedScore: scores.weighted,
        passThreshold: this.getPassThreshold(context),
        passed: scores.overall >= this.getPassThreshold(context),
        ruleResults: ruleResults,
        metadata,
        calculatedAt: new Date().toISOString()
      };

      // Validate result structure
      const validation = validateQualityScoreResult(scoreResult);
      if (!validation.success) {
        throw new Error(`Invalid score result: ${validation.error.message}`);
      }

      return scoreResult;
      
    } catch (error) {
      return {
        overallScore: 0,
        weightedScore: 0,
        passThreshold: this.getPassThreshold(context),
        passed: false,
        ruleResults: ruleResults || [],
        metadata: {
          totalRules: 0,
          passedRules: 0,
          failedRules: 0,
          error: error.message,
          scoringAlgorithm: this.config.algorithm,
          projectType: context?.projectType || 'unknown',
          phase: context?.phase || 'unknown'
        },
        calculatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze rule results for scoring
   * @param {Array} ruleResults - Rule evaluation results
   * @returns {object} Analysis of rule results
   */
  analyzeRuleResults(ruleResults) {
    const analysis = {
      totalRules: ruleResults.length,
      passedRules: 0,
      failedRules: 0,
      totalWeight: 0,
      weightedScore: 0,
      averageScore: 0,
      averageConfidence: 0,
      rulesByCategory: {},
      scoreDistribution: {
        excellent: 0, // 90-100
        good: 0,      // 75-89
        fair: 0,      // 60-74
        poor: 0       // 0-59
      }
    };

    let totalScore = 0;
    let totalConfidence = 0;
    let validConfidenceCount = 0;

    for (const result of ruleResults) {
      const score = result.score || 0;
      const weight = result.weight || this.config.defaultWeight;
      const confidence = result.confidence || 1.0;

      // Count passed/failed
      if (result.passed) {
        analysis.passedRules++;
      } else {
        analysis.failedRules++;
      }

      // Accumulate scores and weights
      totalScore += score;
      analysis.totalWeight += weight;
      analysis.weightedScore += score * weight;

      // Track confidence
      if (result.confidence !== undefined) {
        totalConfidence += confidence;
        validConfidenceCount++;
      }

      // Categorize by score
      if (score >= 90) analysis.scoreDistribution.excellent++;
      else if (score >= 75) analysis.scoreDistribution.good++;
      else if (score >= 60) analysis.scoreDistribution.fair++;
      else analysis.scoreDistribution.poor++;

      // Group by category
      const category = result.metadata?.category || 'uncategorized';
      if (!analysis.rulesByCategory[category]) {
        analysis.rulesByCategory[category] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
          passed: 0,
          failed: 0
        };
      }
      
      const categoryData = analysis.rulesByCategory[category];
      categoryData.count++;
      categoryData.totalScore += score;
      categoryData.averageScore = categoryData.totalScore / categoryData.count;
      if (result.passed) categoryData.passed++;
      else categoryData.failed++;
    }

    // Calculate averages
    analysis.averageScore = totalScore / analysis.totalRules;
    analysis.averageConfidence = validConfidenceCount > 0 
      ? totalConfidence / validConfidenceCount 
      : 1.0;

    return analysis;
  }

  /**
   * Calculate different scoring metrics
   * @param {object} analysis - Rule results analysis
   * @param {object} context - Scoring context
   * @returns {object} Calculated scores
   */
  calculateScores(analysis, context) {
    let overallScore = 0;
    let weightedScore = 0;

    switch (this.config.algorithm) {
      case 'weighted_average':
        overallScore = this.calculateWeightedAverage(analysis);
        break;
      case 'simple_average':
        overallScore = analysis.averageScore;
        break;
      case 'minimum_score':
        overallScore = this.calculateMinimumScore(analysis);
        break;
      case 'confidence_weighted':
        overallScore = this.calculateConfidenceWeighted(analysis);
        break;
      default:
        overallScore = this.calculateWeightedAverage(analysis);
    }

    // Apply failure penalties if configured
    if (this.config.penalizeFailures && analysis.failedRules > 0) {
      const penalty = analysis.failedRules * this.config.failurePenalty * 100;
      overallScore = Math.max(0, overallScore - penalty);
    }

    // Calculate weighted score (same as overall for weighted algorithms)
    weightedScore = overallScore;

    // Ensure scores are within valid range
    overallScore = Math.max(0, Math.min(100, overallScore));
    weightedScore = Math.max(0, Math.min(100, weightedScore));

    return {
      overall: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
      weighted: Math.round(weightedScore * 100) / 100
    };
  }

  /**
   * Calculate weighted average score
   * @param {object} analysis - Rule results analysis
   * @returns {number} Weighted average score
   */
  calculateWeightedAverage(analysis) {
    if (analysis.totalWeight === 0) {
      return analysis.averageScore;
    }

    let normalizedScore = analysis.weightedScore / analysis.totalWeight;

    // Apply confidence weighting if enabled
    if (this.config.confidenceWeighting) {
      normalizedScore *= analysis.averageConfidence;
    }

    return normalizedScore;
  }

  /**
   * Calculate minimum score (most conservative)
   * @param {object} analysis - Rule results analysis
   * @returns {number} Minimum score
   */
  calculateMinimumScore(analysis) {
    // Find the lowest score among all rules
    let minScore = 100;
    for (const result of analysis.ruleResults || []) {
      minScore = Math.min(minScore, result.score || 0);
    }
    return minScore;
  }

  /**
   * Calculate confidence-weighted score
   * @param {object} analysis - Rule results analysis
   * @returns {number} Confidence-weighted score
   */
  calculateConfidenceWeighted(analysis) {
    const weightedScore = this.calculateWeightedAverage(analysis);
    return weightedScore * analysis.averageConfidence;
  }

  /**
   * Generate scoring metadata
   * @param {object} analysis - Rule results analysis
   * @param {object} context - Scoring context
   * @returns {object} Scoring metadata
   */
  generateMetadata(analysis, context) {
    return {
      totalRules: analysis.totalRules,
      passedRules: analysis.passedRules,
      failedRules: analysis.failedRules,
      averageConfidence: Math.round(analysis.averageConfidence * 100) / 100,
      scoringAlgorithm: this.config.algorithm,
      projectType: context?.projectType || 'unknown',
      phase: context?.phase || 'unknown',
      scoreDistribution: analysis.scoreDistribution,
      rulesByCategory: analysis.rulesByCategory,
      passRate: Math.round((analysis.passedRules / analysis.totalRules) * 100) / 100,
      weightingApplied: this.config.normalizeWeights,
      failurePenaltyApplied: this.config.penalizeFailures,
      confidenceWeightingApplied: this.config.confidenceWeighting
    };
  }

  /**
   * Get pass threshold for context
   * @param {object} context - Scoring context
   * @returns {number} Pass threshold
   */
  getPassThreshold(context) {
    // Check for context-specific threshold
    if (context?.configuration?.passThreshold) {
      return context.configuration.passThreshold;
    }

    // Adjust threshold based on project type
    const projectType = context?.projectType || 'standard';
    const thresholdAdjustments = {
      'simple': 65,
      'standard': 75,
      'enterprise': 85
    };

    return thresholdAdjustments[projectType] || this.config.passThreshold;
  }

  /**
   * Get scorer metadata
   * @returns {object} Scorer metadata
   */
  getMetadata() {
    return {
      scorerId: this.scorerId,
      name: this.scorerName,
      description: 'Calculates quality scores using weighted averages of rule results',
      version: this.version,
      author: 'Guidant Quality System',
      algorithms: ['weighted_average', 'simple_average', 'minimum_score', 'confidence_weighted'],
      defaultAlgorithm: 'weighted_average',
      configurable: true,
      performance: {
        averageExecutionTime: 25, // milliseconds
        complexity: 'low'
      }
    };
  }

  /**
   * Configure scoring parameters
   * @param {object} config - Scoring configuration
   * @returns {boolean} True if configuration was applied successfully
   */
  configure(config) {
    try {
      const validAlgorithms = ['weighted_average', 'simple_average', 'minimum_score', 'confidence_weighted'];
      
      if (config.algorithm && !validAlgorithms.includes(config.algorithm)) {
        console.warn(`Invalid algorithm: ${config.algorithm}. Using default.`);
        return false;
      }

      if (config.passThreshold !== undefined && (config.passThreshold < 0 || config.passThreshold > 100)) {
        console.warn('Pass threshold must be between 0 and 100');
        return false;
      }

      // Apply valid configuration
      this.config = { ...this.config, ...config };
      return true;
      
    } catch (error) {
      console.error('Failed to configure WeightedQualityScorer:', error.message);
      return false;
    }
  }
}
