/**
 * Content Length Quality Rule
 * Validates minimum and maximum content length requirements
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 * SOLID Principle: Single Responsibility Principle (SRP)
 */

import { IQualityRule } from '../interfaces/quality-interfaces.js';
import { validateQualityRuleResult } from '../schemas/quality-schemas.js';

/**
 * Content Length Rule - validates deliverable content length
 * Single responsibility: Only validates content length requirements
 */
export class ContentLengthRule extends IQualityRule {
  constructor(config = {}) {
    super();
    this.config = {
      minWords: config.minWords || 100,
      maxWords: config.maxWords || 10000,
      minCharacters: config.minCharacters || 500,
      maxCharacters: config.maxCharacters || 50000,
      strictMode: config.strictMode || false,
      weight: config.weight || 1.0,
      ...config
    };
    
    this.ruleId = 'content-length';
    this.ruleName = 'Content Length Validation';
    this.category = 'completeness';
    this.version = '1.0.0';
  }

  /**
   * Evaluate content length against configured thresholds
   * @param {object} content - Parsed deliverable content
   * @param {object} context - Evaluation context
   * @returns {Promise<object>} Rule evaluation result
   */
  async evaluate(content, context) {
    try {
      const analysis = this.analyzeContentLength(content);
      const result = this.evaluateLength(analysis, context);
      
      const ruleResult = {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: result.passed,
        score: result.score,
        weight: this.config.weight,
        message: result.message,
        details: {
          analysis,
          thresholds: this.getThresholds(context),
          recommendations: result.recommendations
        },
        suggestions: result.suggestions,
        evaluatedAt: new Date().toISOString(),
        confidence: 0.95, // High confidence for rule-based validation
        metadata: {
          category: this.category,
          version: this.version,
          strictMode: this.config.strictMode
        }
      };

      // Validate result structure
      const validation = validateQualityRuleResult(ruleResult);
      if (!validation.success) {
        throw new Error(`Invalid rule result: ${validation.error.message}`);
      }

      return ruleResult;
      
    } catch (error) {
      return {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: false,
        score: 0,
        weight: this.config.weight,
        message: `Content length evaluation failed: ${error.message}`,
        details: { error: error.message },
        suggestions: ['Review content structure and try again'],
        evaluatedAt: new Date().toISOString(),
        confidence: 0.0
      };
    }
  }

  /**
   * Analyze content length metrics
   * @param {object} content - Parsed content
   * @returns {object} Length analysis
   */
  analyzeContentLength(content) {
    const analysis = {
      wordCount: 0,
      characterCount: 0,
      lineCount: 0,
      sectionCount: 0,
      contentType: content.type || 'unknown'
    };

    // Extract metrics based on content type
    if (content.type === 'markdown') {
      analysis.wordCount = content.wordCount || 0;
      analysis.characterCount = content.rawContent?.length || 0;
      analysis.lineCount = content.lineCount || 0;
      analysis.sectionCount = content.sections?.length || 0;
    } else if (content.type === 'json') {
      const jsonString = JSON.stringify(content.data || {}, null, 2);
      analysis.characterCount = jsonString.length;
      analysis.wordCount = jsonString.split(/\s+/).length;
      analysis.sectionCount = Object.keys(content.data || {}).length;
    } else if (content.type === 'text') {
      analysis.wordCount = content.wordCount || 0;
      analysis.characterCount = content.rawContent?.length || 0;
      analysis.lineCount = content.lineCount || 0;
    }

    return analysis;
  }

  /**
   * Evaluate length against thresholds
   * @param {object} analysis - Content analysis
   * @param {object} context - Evaluation context
   * @returns {object} Evaluation result
   */
  evaluateLength(analysis, context) {
    const thresholds = this.getThresholds(context);
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check word count
    if (analysis.wordCount < thresholds.minWords) {
      const deficit = thresholds.minWords - analysis.wordCount;
      issues.push(`Content too short: ${analysis.wordCount} words (minimum: ${thresholds.minWords})`);
      recommendations.push(`Add approximately ${deficit} more words to meet minimum requirements`);
      score -= this.config.strictMode ? 50 : 25;
    }

    if (analysis.wordCount > thresholds.maxWords) {
      const excess = analysis.wordCount - thresholds.maxWords;
      issues.push(`Content too long: ${analysis.wordCount} words (maximum: ${thresholds.maxWords})`);
      recommendations.push(`Consider condensing content by approximately ${excess} words`);
      score -= this.config.strictMode ? 30 : 15;
    }

    // Check character count
    if (analysis.characterCount < thresholds.minCharacters) {
      const deficit = thresholds.minCharacters - analysis.characterCount;
      issues.push(`Content too brief: ${analysis.characterCount} characters (minimum: ${thresholds.minCharacters})`);
      recommendations.push(`Expand content by approximately ${deficit} characters`);
      score -= this.config.strictMode ? 30 : 15;
    }

    if (analysis.characterCount > thresholds.maxCharacters) {
      const excess = analysis.characterCount - thresholds.maxCharacters;
      issues.push(`Content too verbose: ${analysis.characterCount} characters (maximum: ${thresholds.maxCharacters})`);
      recommendations.push(`Reduce content by approximately ${excess} characters`);
      score -= this.config.strictMode ? 20 : 10;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    const passed = issues.length === 0;
    const message = passed 
      ? `Content length meets requirements (${analysis.wordCount} words, ${analysis.characterCount} characters)`
      : `Content length issues found: ${issues.join('; ')}`;

    return {
      passed,
      score,
      message,
      issues,
      recommendations,
      suggestions: recommendations
    };
  }

  /**
   * Get length thresholds based on context
   * @param {object} context - Evaluation context
   * @returns {object} Length thresholds
   */
  getThresholds(context) {
    // Base thresholds
    let thresholds = {
      minWords: this.config.minWords,
      maxWords: this.config.maxWords,
      minCharacters: this.config.minCharacters,
      maxCharacters: this.config.maxCharacters
    };

    // Adjust based on deliverable type
    const typeAdjustments = {
      'market_analysis': { minWords: 500, maxWords: 3000 },
      'user_personas': { minWords: 200, maxWords: 1500 },
      'prd_complete': { minWords: 1000, maxWords: 5000 },
      'user_stories': { minWords: 100, maxWords: 2000 },
      'wireframes': { minWords: 50, maxWords: 1000 },
      'system_design': { minWords: 800, maxWords: 4000 }
    };

    if (context.deliverableType && typeAdjustments[context.deliverableType]) {
      thresholds = { ...thresholds, ...typeAdjustments[context.deliverableType] };
    }

    // Adjust based on project type complexity
    const complexityAdjustments = {
      'simple': { multiplier: 0.7 },
      'standard': { multiplier: 1.0 },
      'enterprise': { multiplier: 1.5 }
    };

    const projectConfig = context.configuration?.projectType || 'standard';
    const complexity = complexityAdjustments[projectConfig] || complexityAdjustments.standard;
    
    thresholds.minWords = Math.round(thresholds.minWords * complexity.multiplier);
    thresholds.maxWords = Math.round(thresholds.maxWords * complexity.multiplier);
    thresholds.minCharacters = Math.round(thresholds.minCharacters * complexity.multiplier);
    thresholds.maxCharacters = Math.round(thresholds.maxCharacters * complexity.multiplier);

    return thresholds;
  }

  /**
   * Get rule metadata and configuration
   * @returns {object} Rule metadata
   */
  getMetadata() {
    return {
      ruleId: this.ruleId,
      name: this.ruleName,
      description: 'Validates that deliverable content meets minimum and maximum length requirements',
      category: this.category,
      version: this.version,
      author: 'Guidant Quality System',
      applicablePhases: ['concept', 'requirements', 'design', 'architecture', 'implementation'],
      applicableTypes: ['markdown', 'text', 'json'],
      defaultWeight: 1.0,
      defaultThreshold: 75,
      configurable: true,
      dependencies: [],
      performance: {
        averageExecutionTime: 50, // milliseconds
        complexity: 'low'
      },
      examples: [
        {
          input: 'Short content with only 10 words total here.',
          expectedOutput: { passed: false, score: 50 },
          description: 'Content below minimum word count'
        }
      ]
    };
  }

  /**
   * Validate rule configuration
   * @param {object} config - Rule configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    const required = ['minWords', 'maxWords', 'minCharacters', 'maxCharacters'];
    const missing = required.filter(field => config[field] === undefined);
    
    if (missing.length > 0) {
      console.warn(`ContentLengthRule: Missing configuration fields: ${missing.join(', ')}`);
      return false;
    }

    if (config.minWords >= config.maxWords) {
      console.warn('ContentLengthRule: minWords must be less than maxWords');
      return false;
    }

    if (config.minCharacters >= config.maxCharacters) {
      console.warn('ContentLengthRule: minCharacters must be less than maxCharacters');
      return false;
    }

    return true;
  }
}
