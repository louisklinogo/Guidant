/**
 * Structure Completeness Quality Rule
 * Validates that deliverables have required structural elements
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 * SOLID Principle: Single Responsibility Principle (SRP)
 */

import { IQualityRule } from '../interfaces/quality-interfaces.js';
import { validateQualityRuleResult } from '../schemas/quality-schemas.js';

/**
 * Structure Completeness Rule - validates required structural elements
 * Single responsibility: Only validates structural completeness
 */
export class StructureCompletenessRule extends IQualityRule {
  constructor(config = {}) {
    super();
    this.config = {
      requireTitle: config.requireTitle !== false,
      requireSections: config.requireSections !== false,
      minSections: config.minSections || 3,
      requireHeadings: config.requireHeadings !== false,
      minHeadings: config.minHeadings || 2,
      strictMode: config.strictMode || false,
      weight: config.weight || 1.0,
      ...config
    };
    
    this.ruleId = 'structure-completeness';
    this.ruleName = 'Structure Completeness Validation';
    this.category = 'structure';
    this.version = '1.0.0';

    // Define required sections by deliverable type
    this.requiredSections = {
      'market_analysis': ['executive summary', 'market overview', 'target audience', 'competitive analysis', 'opportunities'],
      'user_personas': ['persona overview', 'demographics', 'goals', 'pain points', 'behaviors'],
      'prd_complete': ['overview', 'objectives', 'features', 'requirements', 'acceptance criteria'],
      'user_stories': ['story overview', 'acceptance criteria', 'priority', 'effort estimation'],
      'wireframes': ['overview', 'user flows', 'screen layouts', 'interactions'],
      'system_design': ['architecture overview', 'components', 'data flow', 'technology stack', 'scalability']
    };
  }

  /**
   * Evaluate structural completeness
   * @param {object} content - Parsed deliverable content
   * @param {object} context - Evaluation context
   * @returns {Promise<object>} Rule evaluation result
   */
  async evaluate(content, context) {
    try {
      const analysis = this.analyzeStructure(content, context);
      const result = this.evaluateCompleteness(analysis, context);
      
      const ruleResult = {
        ruleId: this.ruleId,
        ruleName: this.ruleName,
        passed: result.passed,
        score: result.score,
        weight: this.config.weight,
        message: result.message,
        details: {
          analysis,
          requirements: this.getRequirements(context),
          missing: result.missing,
          recommendations: result.recommendations
        },
        suggestions: result.suggestions,
        evaluatedAt: new Date().toISOString(),
        confidence: 0.90, // High confidence for structural validation
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
        message: `Structure completeness evaluation failed: ${error.message}`,
        details: { error: error.message },
        suggestions: ['Review content structure and try again'],
        evaluatedAt: new Date().toISOString(),
        confidence: 0.0
      };
    }
  }

  /**
   * Analyze structural elements
   * @param {object} content - Parsed content
   * @param {object} context - Evaluation context
   * @returns {object} Structure analysis
   */
  analyzeStructure(content, context) {
    const analysis = {
      hasTitle: false,
      titleText: '',
      headings: [],
      sections: [],
      sectionCount: 0,
      headingCount: 0,
      contentType: content.type || 'unknown',
      structure: {}
    };

    if (content.type === 'markdown') {
      // Analyze markdown structure
      analysis.hasTitle = !!(content.title && content.title.trim());
      analysis.titleText = content.title || '';
      analysis.headings = content.headings || [];
      analysis.sections = content.sections || [];
      analysis.sectionCount = analysis.sections.length;
      analysis.headingCount = analysis.headings.length;
      
      // Extract section names for matching
      analysis.sectionNames = analysis.sections.map(section => 
        section.heading?.toLowerCase().trim() || ''
      ).filter(name => name);
      
    } else if (content.type === 'json') {
      // Analyze JSON structure
      const data = content.data || {};
      analysis.hasTitle = !!(data.title || data.name || data.overview);
      analysis.titleText = data.title || data.name || data.overview || '';
      analysis.sectionCount = Object.keys(data).length;
      analysis.sections = Object.keys(data);
      analysis.sectionNames = analysis.sections.map(s => s.toLowerCase());
      
    } else if (content.type === 'text') {
      // Analyze text structure
      analysis.hasTitle = content.lines && content.lines.length > 0;
      analysis.titleText = content.lines?.[0] || '';
      analysis.sectionCount = content.paragraphs?.length || 0;
      analysis.sections = content.paragraphs || [];
    }

    return analysis;
  }

  /**
   * Evaluate structural completeness
   * @param {object} analysis - Structure analysis
   * @param {object} context - Evaluation context
   * @returns {object} Evaluation result
   */
  evaluateCompleteness(analysis, context) {
    const requirements = this.getRequirements(context);
    const issues = [];
    const missing = [];
    const recommendations = [];
    let score = 100;

    // Check title requirement
    if (requirements.requireTitle && !analysis.hasTitle) {
      issues.push('Missing title or heading');
      missing.push('title');
      recommendations.push('Add a clear title or main heading to the document');
      score -= this.config.strictMode ? 25 : 15;
    }

    // Check minimum sections
    if (requirements.minSections && analysis.sectionCount < requirements.minSections) {
      const deficit = requirements.minSections - analysis.sectionCount;
      issues.push(`Insufficient sections: ${analysis.sectionCount} (minimum: ${requirements.minSections})`);
      missing.push(`${deficit} additional sections`);
      recommendations.push(`Add ${deficit} more sections to improve structure`);
      score -= this.config.strictMode ? 30 : 20;
    }

    // Check minimum headings
    if (requirements.minHeadings && analysis.headingCount < requirements.minHeadings) {
      const deficit = requirements.minHeadings - analysis.headingCount;
      issues.push(`Insufficient headings: ${analysis.headingCount} (minimum: ${requirements.minHeadings})`);
      missing.push(`${deficit} additional headings`);
      recommendations.push(`Add ${deficit} more headings to organize content`);
      score -= this.config.strictMode ? 20 : 10;
    }

    // Check required sections for specific deliverable types
    if (requirements.requiredSections && requirements.requiredSections.length > 0) {
      const missingSections = this.findMissingSections(analysis.sectionNames, requirements.requiredSections);
      if (missingSections.length > 0) {
        issues.push(`Missing required sections: ${missingSections.join(', ')}`);
        missing.push(...missingSections);
        recommendations.push(`Add the following sections: ${missingSections.join(', ')}`);
        score -= missingSections.length * (this.config.strictMode ? 15 : 10);
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    const passed = issues.length === 0;
    const message = passed 
      ? `Structure meets completeness requirements (${analysis.sectionCount} sections, ${analysis.headingCount} headings)`
      : `Structure completeness issues found: ${issues.join('; ')}`;

    return {
      passed,
      score,
      message,
      issues,
      missing,
      recommendations,
      suggestions: recommendations
    };
  }

  /**
   * Find missing required sections
   * @param {Array} actualSections - Actual section names (lowercase)
   * @param {Array} requiredSections - Required section names
   * @returns {Array} Missing section names
   */
  findMissingSections(actualSections, requiredSections) {
    const missing = [];

    for (const required of requiredSections) {
      const requiredLower = required.toLowerCase();
      const requiredWords = requiredLower.split(/\s+/);

      const found = actualSections.some(actual => {
        const actualLower = actual.toLowerCase();

        // Check for exact match or substring match
        if (actual.includes(requiredLower) || requiredLower.includes(actualLower)) {
          return true;
        }

        // Check for word overlap (at least one word matches)
        const actualWords = actualLower.split(/\s+/);
        return requiredWords.some(reqWord =>
          actualWords.some(actWord =>
            reqWord.includes(actWord) || actWord.includes(reqWord)
          )
        );
      });

      if (!found) {
        missing.push(required);
      }
    }

    return missing;
  }

  /**
   * Get structural requirements based on context
   * @param {object} context - Evaluation context
   * @returns {object} Structural requirements
   */
  getRequirements(context) {
    const requirements = {
      requireTitle: this.config.requireTitle,
      requireSections: this.config.requireSections,
      minSections: this.config.minSections,
      requireHeadings: this.config.requireHeadings,
      minHeadings: this.config.minHeadings,
      requiredSections: []
    };

    // Get deliverable-specific requirements
    if (context.deliverableType && this.requiredSections[context.deliverableType]) {
      requirements.requiredSections = this.requiredSections[context.deliverableType];
    }

    // Adjust based on project complexity
    const projectConfig = context.configuration?.projectType || 'standard';
    const complexityAdjustments = {
      'simple': { sectionMultiplier: 0.7, headingMultiplier: 0.8 },
      'standard': { sectionMultiplier: 1.0, headingMultiplier: 1.0 },
      'enterprise': { sectionMultiplier: 1.3, headingMultiplier: 1.2 }
    };

    const adjustment = complexityAdjustments[projectConfig] || complexityAdjustments.standard;
    requirements.minSections = Math.round(requirements.minSections * adjustment.sectionMultiplier);
    requirements.minHeadings = Math.round(requirements.minHeadings * adjustment.headingMultiplier);

    return requirements;
  }

  /**
   * Get rule metadata and configuration
   * @returns {object} Rule metadata
   */
  getMetadata() {
    return {
      ruleId: this.ruleId,
      name: this.ruleName,
      description: 'Validates that deliverables have required structural elements like titles, sections, and headings',
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
        averageExecutionTime: 75, // milliseconds
        complexity: 'low'
      },
      examples: [
        {
          input: 'Document without proper sections',
          expectedOutput: { passed: false, score: 60 },
          description: 'Document missing required structural elements'
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
    if (config.minSections !== undefined && config.minSections < 0) {
      console.warn('StructureCompletenessRule: minSections must be non-negative');
      return false;
    }

    if (config.minHeadings !== undefined && config.minHeadings < 0) {
      console.warn('StructureCompletenessRule: minHeadings must be non-negative');
      return false;
    }

    return true;
  }
}
