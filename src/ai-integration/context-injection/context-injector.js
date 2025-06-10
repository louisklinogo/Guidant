/**
 * Context Injector
 * Injects optimized context into AI prompt templates
 * Implements IContextInjector interface following Single Responsibility Principle
 */

import { IContextInjector } from '../interfaces/context-interfaces.js';

export class ContextInjector extends IContextInjector {
  constructor(options = {}) {
    super();
    this.templateEngine = options.templateEngine || 'simple';
    this.includeMetadata = options.includeMetadata !== false;
    this.formatStyle = options.formatStyle || 'structured';
  }

  /**
   * Inject context into task generation template
   */
  async injectContext(optimizedContext, templateType, templateOptions = {}) {
    try {
      // Validate template type
      if (!this.getSupportedTemplateTypes().includes(templateType)) {
        throw new Error(`Unsupported template type: ${templateType}`);
      }

      // Validate template options
      if (!this.validateTemplateOptions(templateType, templateOptions)) {
        throw new Error(`Invalid template options for type: ${templateType}`);
      }

      // Generate context injection based on template type
      const injectedTemplate = await this.generateInjectedTemplate(
        optimizedContext, 
        templateType, 
        templateOptions
      );

      return {
        success: true,
        injectedTemplate,
        metadata: {
          injectedAt: new Date().toISOString(),
          templateType,
          formatStyle: this.formatStyle,
          contextSections: this.getContextSections(optimizedContext),
          estimatedTokens: this.estimateTemplateTokens(injectedTemplate)
        }
      };
    } catch (error) {
      console.error('Failed to inject context:', error);
      return {
        success: false,
        error: error.message,
        injectedTemplate: this.getFallbackTemplate(templateType, templateOptions)
      };
    }
  }

  /**
   * Generate injected template based on type
   */
  async generateInjectedTemplate(context, templateType, options) {
    switch (templateType) {
      case 'task_generation':
        return this.generateTaskGenerationTemplate(context, options);
      
      case 'analysis':
        return this.generateAnalysisTemplate(context, options);
      
      case 'implementation':
        return this.generateImplementationTemplate(context, options);
      
      case 'review':
        return this.generateReviewTemplate(context, options);
      
      default:
        return this.generateGenericTemplate(context, options);
    }
  }

  /**
   * Generate task generation template
   */
  generateTaskGenerationTemplate(context, options) {
    const sections = [];

    // Project context section
    sections.push(this.generateProjectContextSection(context));

    // Phase and workflow context
    sections.push(this.generateWorkflowContextSection(context));

    // Insights and guidance
    sections.push(this.generateInsightsSection(context));

    // Technical guidance
    sections.push(this.generateTechnicalGuidanceSection(context));

    // Quality and risk factors
    sections.push(this.generateQualityRiskSection(context));

    // Task priorities and focus
    sections.push(this.generateTaskPrioritySection(context));

    // Metadata (if enabled)
    if (this.includeMetadata) {
      sections.push(this.generateMetadataSection(context));
    }

    return this.combineTemplateSections(sections, 'task_generation', options);
  }

  /**
   * Generate project context section
   */
  generateProjectContextSection(context) {
    const project = context.unified?.project || {};
    
    return {
      title: 'PROJECT CONTEXT',
      content: `
Project: ${project.name || 'Unknown Project'}
Type: ${project.type || 'web_app'}
Description: ${project.description || 'No description available'}
      `.trim()
    };
  }

  /**
   * Generate workflow context section
   */
  generateWorkflowContextSection(context) {
    const workflow = context.unified?.workflow || {};
    const phase = context.phase || workflow.currentPhase || 'unknown';
    const deliverable = context.deliverable || 'unknown';

    let content = `
Current Phase: ${phase}
Target Deliverable: ${deliverable}
    `.trim();

    if (workflow.progress) {
      content += `\nProgress: ${workflow.progress.progressPercentage || 0}% (${workflow.progress.completedCount || 0}/${workflow.progress.totalPhases || 6} phases)`;
    }

    if (workflow.focusAreas && workflow.focusAreas.length > 0) {
      content += `\nFocus Areas: ${workflow.focusAreas.slice(0, 5).join(', ')}`;
    }

    return {
      title: 'WORKFLOW CONTEXT',
      content
    };
  }

  /**
   * Generate insights section
   */
  generateInsightsSection(context) {
    const insights = context.unified?.insights || {};
    let content = '';

    if (insights.key && insights.key.length > 0) {
      content += `\nKey Insights:\n${insights.key.slice(0, 5).map(insight => `- ${insight}`).join('\n')}`;
    }

    if (insights.decisions && insights.decisions.length > 0) {
      content += `\n\nKey Decisions:\n${insights.decisions.slice(0, 3).map(decision => `- ${decision}`).join('\n')}`;
    }

    if (insights.recommendations && insights.recommendations.length > 0) {
      content += `\n\nRecommendations:\n${insights.recommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n')}`;
    }

    return {
      title: 'INSIGHTS & DECISIONS',
      content: content || 'No specific insights available'
    };
  }

  /**
   * Generate technical guidance section
   */
  generateTechnicalGuidanceSection(context) {
    const technical = context.unified?.technical || {};
    let content = '';

    if (technical.techStack && Object.keys(technical.techStack).length > 0) {
      content += '\nTech Stack Guidance:';
      for (const [category, technology] of Object.entries(technical.techStack)) {
        if (technology) {
          content += `\n- ${category}: ${technology}`;
        }
      }
    }

    if (technical.requirements && technical.requirements.length > 0) {
      content += `\n\nTechnical Requirements:\n${technical.requirements.slice(0, 3).map(req => `- ${req}`).join('\n')}`;
    }

    if (technical.architecture && Object.keys(technical.architecture).length > 0) {
      content += '\n\nArchitecture Notes: Available from previous phases';
    }

    return {
      title: 'TECHNICAL GUIDANCE',
      content: content || 'No specific technical guidance available'
    };
  }

  /**
   * Generate quality and risk section
   */
  generateQualityRiskSection(context) {
    const quality = context.unified?.quality || {};
    let content = '';

    if (quality.gates && quality.gates.length > 0) {
      content += `\nQuality Gates:\n${quality.gates.slice(0, 3).map(gate => `- ${gate}`).join('\n')}`;
    }

    if (quality.risks && quality.risks.length > 0) {
      content += '\n\nRisk Factors:';
      for (const risk of quality.risks.slice(0, 3)) {
        if (typeof risk === 'object' && risk.risk) {
          content += `\n- ${risk.risk} (${risk.impact || 'unknown'} impact)`;
          if (risk.mitigation) {
            content += ` - Mitigation: ${risk.mitigation}`;
          }
        } else {
          content += `\n- ${risk}`;
        }
      }
    }

    return {
      title: 'QUALITY & RISK FACTORS',
      content: content || 'No specific quality or risk information available'
    };
  }

  /**
   * Generate task priority section
   */
  generateTaskPrioritySection(context) {
    const tasks = context.unified?.tasks || {};
    let content = '';

    if (tasks.prioritized && tasks.prioritized.length > 0) {
      content += '\nPrioritized Tasks:';
      for (const task of tasks.prioritized.slice(0, 5)) {
        if (typeof task === 'object' && task.task) {
          content += `\n- ${task.task} (${task.priority || 'medium'} priority)`;
          if (task.rationale) {
            content += ` - ${task.rationale}`;
          }
        } else {
          content += `\n- ${task}`;
        }
      }
    }

    if (tasks.focus && tasks.focus.length > 0) {
      content += `\n\nFocus Areas: ${tasks.focus.slice(0, 3).join(', ')}`;
    }

    if (tasks.dependencies && tasks.dependencies.length > 0) {
      content += `\n\nDependencies: ${tasks.dependencies.slice(0, 3).join(', ')}`;
    }

    return {
      title: 'TASK PRIORITIES & FOCUS',
      content: content || 'No specific task priorities available'
    };
  }

  /**
   * Generate metadata section
   */
  generateMetadataSection(context) {
    const metadata = context.metadata || {};
    
    let content = `
Context Quality: ${Math.round((metadata.confidence || 0) * 100)}% confidence
Data Freshness: ${Math.round((metadata.freshness || 0) * 100)}% fresh
Coverage: ${Math.round((metadata.coverage || 0) * 100)}% coverage
    `.trim();

    if (context.sources && context.sources.length > 0) {
      content += `\nSources Used: ${context.sources.map(s => s.name).join(', ')}`;
    }

    return {
      title: 'CONTEXT METADATA',
      content
    };
  }

  /**
   * Combine template sections
   */
  combineTemplateSections(sections, templateType, options) {
    const header = this.generateTemplateHeader(templateType, options);
    const footer = this.generateTemplateFooter(templateType, options);

    const sectionContent = sections
      .filter(section => section.content && section.content.trim())
      .map(section => `${section.title}:\n${section.content}`)
      .join('\n\n');

    return `${header}\n\n${sectionContent}\n\n${footer}`.trim();
  }

  /**
   * Generate template header
   */
  generateTemplateHeader(templateType, options) {
    const role = options.role || 'AI Assistant';
    const phase = options.phase || 'current phase';
    const deliverable = options.deliverable || 'target deliverable';

    return `You are a ${role} working on ${deliverable} for the ${phase} phase. Use the following enhanced context to generate high-quality, relevant tasks:`;
  }

  /**
   * Generate template footer
   */
  generateTemplateFooter(templateType, options) {
    return `
Based on this enhanced context, generate specific, actionable tasks that:
1. Align with the current phase objectives
2. Consider the technical guidance and constraints
3. Address identified risks and quality requirements
4. Build upon previous phase insights and decisions
5. Follow the prioritized focus areas

Provide detailed, implementable tasks with clear acceptance criteria.`;
  }

  /**
   * Generate analysis template (simplified for space)
   */
  generateAnalysisTemplate(context, options) {
    return this.generateTaskGenerationTemplate(context, { ...options, templateType: 'analysis' });
  }

  /**
   * Generate implementation template (simplified for space)
   */
  generateImplementationTemplate(context, options) {
    return this.generateTaskGenerationTemplate(context, { ...options, templateType: 'implementation' });
  }

  /**
   * Generate review template (simplified for space)
   */
  generateReviewTemplate(context, options) {
    return this.generateTaskGenerationTemplate(context, { ...options, templateType: 'review' });
  }

  /**
   * Generate generic template
   */
  generateGenericTemplate(context, options) {
    return this.generateTaskGenerationTemplate(context, options);
  }

  /**
   * Get context sections for metadata
   */
  getContextSections(context) {
    const sections = [];
    
    if (context.unified?.project) sections.push('project');
    if (context.unified?.workflow) sections.push('workflow');
    if (context.unified?.insights) sections.push('insights');
    if (context.unified?.technical) sections.push('technical');
    if (context.unified?.quality) sections.push('quality');
    if (context.unified?.tasks) sections.push('tasks');
    
    return sections;
  }

  /**
   * Estimate template tokens
   */
  estimateTemplateTokens(template) {
    return Math.ceil(template.length / 4);
  }

  /**
   * Get fallback template
   */
  getFallbackTemplate(templateType, options) {
    const role = options.role || 'AI Assistant';
    const phase = options.phase || 'current phase';
    const deliverable = options.deliverable || 'target deliverable';

    return `You are a ${role} working on ${deliverable} for the ${phase} phase. 

Context injection failed - using minimal context. Please generate appropriate tasks based on the phase and deliverable information provided.`;
  }

  /**
   * Get supported template types
   */
  getSupportedTemplateTypes() {
    return ['task_generation', 'analysis', 'implementation', 'review'];
  }

  /**
   * Validate template options
   */
  validateTemplateOptions(templateType, options) {
    // Basic validation - can be extended
    return typeof options === 'object' && options !== null;
  }
}
