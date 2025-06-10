/**
 * Contextual Feedback Generator
 * Generates improvement suggestions and feedback from quality results
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 * SOLID Principle: Single Responsibility Principle (SRP)
 */

import { IFeedbackGenerator } from '../interfaces/quality-interfaces.js';
import { validateQualityFeedback } from '../schemas/quality-schemas.js';

/**
 * Contextual Feedback Generator - generates contextual improvement feedback
 * Single responsibility: Only generates feedback from quality results
 */
export class ContextualFeedbackGenerator extends IFeedbackGenerator {
  constructor(config = {}) {
    super();
    this.config = {
      feedbackLevel: config.feedbackLevel || 'detailed', // 'basic', 'detailed', 'comprehensive'
      includeExamples: config.includeExamples !== false,
      prioritizeIssues: config.prioritizeIssues !== false,
      maxSuggestions: config.maxSuggestions || 10,
      includePositiveFeedback: config.includePositiveFeedback !== false,
      contextualAdjustments: config.contextualAdjustments !== false,
      ...config
    };
    
    this.generatorId = 'contextual-feedback';
    this.generatorName = 'Contextual Feedback Generator';
    this.version = '1.0.0';

    // Feedback templates by deliverable type
    this.feedbackTemplates = {
      'market_analysis': {
        strengths: ['Comprehensive market research', 'Clear target audience identification', 'Thorough competitive analysis'],
        improvements: ['Add more quantitative data', 'Include market size estimates', 'Expand on growth opportunities'],
        examples: ['Consider adding market sizing data like "TAM of $X billion"', 'Include competitor pricing analysis']
      },
      'user_personas': {
        strengths: ['Well-defined user characteristics', 'Clear pain points identified', 'Realistic user scenarios'],
        improvements: ['Add more demographic details', 'Include user journey mapping', 'Expand on behavioral patterns'],
        examples: ['Add specific age ranges and income levels', 'Include quotes from user interviews']
      },
      'prd_complete': {
        strengths: ['Clear feature specifications', 'Well-defined acceptance criteria', 'Comprehensive requirements'],
        improvements: ['Add more technical details', 'Include edge case handling', 'Expand on non-functional requirements'],
        examples: ['Specify API response times', 'Add error handling scenarios']
      }
    };
  }

  /**
   * Generate improvement feedback from quality results
   * @param {object} qualityResult - Quality evaluation result
   * @param {object} context - Feedback context
   * @returns {Promise<object>} Generated feedback
   */
  async generateFeedback(qualityResult, context) {
    try {
      if (!qualityResult || !qualityResult.ruleResults) {
        throw new Error('Invalid quality result provided');
      }

      const analysis = this.analyzeQualityResult(qualityResult, context);
      const feedback = this.generateContextualFeedback(analysis, context);
      
      const feedbackResult = {
        summary: feedback.summary,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        criticalIssues: feedback.criticalIssues,
        suggestions: feedback.suggestions,
        nextSteps: feedback.nextSteps,
        priority: feedback.priority,
        estimatedEffort: feedback.estimatedEffort,
        generatedAt: new Date().toISOString(),
        confidence: feedback.confidence
      };

      // Validate feedback structure
      const validation = validateQualityFeedback(feedbackResult);
      if (!validation.success) {
        throw new Error(`Invalid feedback result: ${validation.error.message}`);
      }

      return feedbackResult;
      
    } catch (error) {
      return {
        summary: `Feedback generation failed: ${error.message}`,
        strengths: [],
        improvements: [],
        criticalIssues: ['Unable to generate feedback'],
        suggestions: ['Review quality results and try again'],
        nextSteps: ['Fix quality evaluation issues'],
        priority: 'high',
        estimatedEffort: 'Unknown',
        generatedAt: new Date().toISOString(),
        confidence: 0.0
      };
    }
  }

  /**
   * Analyze quality result for feedback generation
   * @param {object} qualityResult - Quality evaluation result
   * @param {object} context - Feedback context
   * @returns {object} Analysis for feedback generation
   */
  analyzeQualityResult(qualityResult, context) {
    const analysis = {
      overallScore: qualityResult.overallScore || 0,
      passed: qualityResult.passed || false,
      passThreshold: qualityResult.passThreshold || 75,
      totalRules: qualityResult.ruleResults.length,
      passedRules: 0,
      failedRules: 0,
      criticalFailures: [],
      majorIssues: [],
      minorIssues: [],
      strengths: [],
      rulesByCategory: {},
      scoreGap: 0
    };

    // Analyze individual rule results
    for (const ruleResult of qualityResult.ruleResults) {
      const score = ruleResult.score || 0;
      const category = ruleResult.metadata?.category || 'general';

      // Count passed/failed
      if (ruleResult.passed) {
        analysis.passedRules++;
        if (score >= 90) {
          analysis.strengths.push({
            rule: ruleResult.ruleName,
            score: score,
            message: ruleResult.message
          });
        }
      } else {
        analysis.failedRules++;
        
        // Categorize failures by severity
        if (score < 30) {
          analysis.criticalFailures.push({
            rule: ruleResult.ruleName,
            score: score,
            message: ruleResult.message,
            suggestions: ruleResult.suggestions || []
          });
        } else if (score < 60) {
          analysis.majorIssues.push({
            rule: ruleResult.ruleName,
            score: score,
            message: ruleResult.message,
            suggestions: ruleResult.suggestions || []
          });
        } else {
          analysis.minorIssues.push({
            rule: ruleResult.ruleName,
            score: score,
            message: ruleResult.message,
            suggestions: ruleResult.suggestions || []
          });
        }
      }

      // Group by category
      if (!analysis.rulesByCategory[category]) {
        analysis.rulesByCategory[category] = {
          passed: 0,
          failed: 0,
          averageScore: 0,
          totalScore: 0,
          count: 0
        };
      }
      
      const categoryData = analysis.rulesByCategory[category];
      categoryData.count++;
      categoryData.totalScore += score;
      categoryData.averageScore = categoryData.totalScore / categoryData.count;
      if (ruleResult.passed) categoryData.passed++;
      else categoryData.failed++;
    }

    // Calculate score gap
    analysis.scoreGap = Math.max(0, analysis.passThreshold - analysis.overallScore);

    return analysis;
  }

  /**
   * Generate contextual feedback based on analysis
   * @param {object} analysis - Quality result analysis
   * @param {object} context - Feedback context
   * @returns {object} Generated feedback
   */
  generateContextualFeedback(analysis, context) {
    const feedback = {
      summary: this.generateSummary(analysis, context),
      strengths: this.generateStrengths(analysis, context),
      improvements: this.generateImprovements(analysis, context),
      criticalIssues: this.generateCriticalIssues(analysis, context),
      suggestions: this.generateSuggestions(analysis, context),
      nextSteps: this.generateNextSteps(analysis, context),
      priority: this.determinePriority(analysis),
      estimatedEffort: this.estimateEffort(analysis, context),
      confidence: this.calculateConfidence(analysis)
    };

    return feedback;
  }

  /**
   * Generate feedback summary
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {string} Feedback summary
   */
  generateSummary(analysis, context) {
    const deliverableType = context.deliverableType || 'deliverable';
    const score = analysis.overallScore;
    const passThreshold = analysis.passThreshold;

    if (analysis.passed) {
      if (score >= 90) {
        return `Excellent ${deliverableType} quality (${score}/100). All requirements met with high standards.`;
      } else if (score >= 80) {
        return `Good ${deliverableType} quality (${score}/100). Meets requirements with room for enhancement.`;
      } else {
        return `Acceptable ${deliverableType} quality (${score}/100). Meets minimum requirements.`;
      }
    } else {
      const gap = analysis.scoreGap;
      return `${deliverableType} quality below threshold (${score}/${passThreshold}). Needs ${gap} point improvement to pass.`;
    }
  }

  /**
   * Generate strengths feedback
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {Array} Strengths list
   */
  generateStrengths(analysis, context) {
    const strengths = [];

    // Add rule-based strengths
    for (const strength of analysis.strengths) {
      strengths.push(`${strength.rule}: ${strength.message}`);
    }

    // Add contextual strengths
    if (this.config.includePositiveFeedback && context.deliverableType) {
      const template = this.feedbackTemplates[context.deliverableType];
      if (template && template.strengths) {
        // Add relevant template strengths based on passed rules
        const relevantStrengths = template.strengths.filter((_, index) => 
          index < analysis.passedRules && strengths.length < 5
        );
        strengths.push(...relevantStrengths);
      }
    }

    return strengths.slice(0, 5); // Limit to top 5 strengths
  }

  /**
   * Generate improvements feedback
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {Array} Improvements list
   */
  generateImprovements(analysis, context) {
    const improvements = [];

    // Add major and minor issues as improvements
    const allIssues = [...analysis.majorIssues, ...analysis.minorIssues];
    
    for (const issue of allIssues) {
      const priority = issue.score < 60 ? 'high' : 'medium';
      const estimatedEffort = issue.score < 30 ? 'High' : issue.score < 60 ? 'Medium' : 'Low';
      
      improvements.push({
        issue: issue.message,
        suggestion: issue.suggestions[0] || 'Review and improve this area',
        priority: priority,
        estimatedEffort: estimatedEffort,
        category: 'quality'
      });
    }

    // Add contextual improvements
    if (this.config.contextualAdjustments && context.deliverableType) {
      const template = this.feedbackTemplates[context.deliverableType];
      if (template && template.improvements && improvements.length < 3) {
        const contextualImprovements = template.improvements.slice(0, 3 - improvements.length);
        for (const improvement of contextualImprovements) {
          improvements.push({
            issue: `Consider enhancing: ${improvement}`,
            suggestion: improvement,
            priority: 'medium',
            estimatedEffort: 'Medium',
            category: 'enhancement'
          });
        }
      }
    }

    return improvements.slice(0, this.config.maxSuggestions);
  }

  /**
   * Generate critical issues list
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {Array} Critical issues list
   */
  generateCriticalIssues(analysis, context) {
    return analysis.criticalFailures.map(failure => 
      `${failure.rule}: ${failure.message}`
    );
  }

  /**
   * Generate suggestions list
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {Array} Suggestions list
   */
  generateSuggestions(analysis, context) {
    const suggestions = [];

    // Collect suggestions from failed rules
    const allIssues = [...analysis.criticalFailures, ...analysis.majorIssues, ...analysis.minorIssues];
    for (const issue of allIssues) {
      suggestions.push(...(issue.suggestions || []));
    }

    // Add contextual examples if enabled
    if (this.config.includeExamples && context.deliverableType) {
      const template = this.feedbackTemplates[context.deliverableType];
      if (template && template.examples) {
        suggestions.push(...template.examples.slice(0, 3));
      }
    }

    return [...new Set(suggestions)].slice(0, this.config.maxSuggestions); // Remove duplicates and limit
  }

  /**
   * Generate next steps
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {Array} Next steps list
   */
  generateNextSteps(analysis, context) {
    const nextSteps = [];

    if (analysis.criticalFailures.length > 0) {
      nextSteps.push('Address critical quality issues first');
      nextSteps.push('Review and fix structural problems');
    }

    if (analysis.majorIssues.length > 0) {
      nextSteps.push('Improve content completeness and quality');
    }

    if (analysis.minorIssues.length > 0) {
      nextSteps.push('Polish and refine content details');
    }

    if (analysis.passed) {
      nextSteps.push('Consider enhancements for higher quality');
      nextSteps.push('Review for consistency and clarity');
    } else {
      nextSteps.push(`Improve score by ${analysis.scoreGap} points to meet threshold`);
    }

    return nextSteps.slice(0, 5);
  }

  /**
   * Determine feedback priority
   * @param {object} analysis - Quality analysis
   * @returns {string} Priority level
   */
  determinePriority(analysis) {
    if (analysis.criticalFailures.length > 0) return 'critical';
    if (analysis.majorIssues.length > 0) return 'high';
    if (analysis.minorIssues.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort required
   * @param {object} analysis - Quality analysis
   * @param {object} context - Feedback context
   * @returns {string} Effort estimate
   */
  estimateEffort(analysis, context) {
    const totalIssues = analysis.criticalFailures.length + analysis.majorIssues.length + analysis.minorIssues.length;
    const scoreGap = analysis.scoreGap;

    if (scoreGap > 30 || analysis.criticalFailures.length > 2) return 'High (4-8 hours)';
    if (scoreGap > 15 || totalIssues > 3) return 'Medium (2-4 hours)';
    if (scoreGap > 5 || totalIssues > 0) return 'Low (1-2 hours)';
    return 'Minimal (< 1 hour)';
  }

  /**
   * Calculate feedback confidence
   * @param {object} analysis - Quality analysis
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(analysis) {
    // Base confidence on number of rules and score consistency
    const baseConfidence = Math.min(analysis.totalRules / 5, 1.0); // More rules = higher confidence
    const scoreConsistency = 1.0 - (Math.abs(analysis.overallScore - 75) / 75); // Closer to threshold = more confident
    
    return Math.round((baseConfidence * 0.7 + scoreConsistency * 0.3) * 100) / 100;
  }

  /**
   * Get feedback generator metadata
   * @returns {object} Generator metadata
   */
  getMetadata() {
    return {
      generatorId: this.generatorId,
      name: this.generatorName,
      description: 'Generates contextual improvement feedback from quality evaluation results',
      version: this.version,
      author: 'Guidant Quality System',
      feedbackLevels: ['basic', 'detailed', 'comprehensive'],
      defaultLevel: 'detailed',
      configurable: true,
      performance: {
        averageExecutionTime: 100, // milliseconds
        complexity: 'medium'
      }
    };
  }

  /**
   * Configure feedback generation parameters
   * @param {object} config - Feedback configuration
   * @returns {boolean} True if configuration was applied successfully
   */
  configure(config) {
    try {
      const validLevels = ['basic', 'detailed', 'comprehensive'];
      
      if (config.feedbackLevel && !validLevels.includes(config.feedbackLevel)) {
        console.warn(`Invalid feedback level: ${config.feedbackLevel}. Using default.`);
        return false;
      }

      if (config.maxSuggestions !== undefined && (config.maxSuggestions < 1 || config.maxSuggestions > 50)) {
        console.warn('maxSuggestions must be between 1 and 50');
        return false;
      }

      // Apply valid configuration
      this.config = { ...this.config, ...config };
      return true;
      
    } catch (error) {
      console.error('Failed to configure ContextualFeedbackGenerator:', error.message);
      return false;
    }
  }
}
