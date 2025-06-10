/**
 * Deliverable Analysis Context Source
 * Provides context from DeliverableContentAnalyzer results
 * Implements IContextSource interface following Single Responsibility Principle
 */

import { IContextSource } from '../interfaces/context-interfaces.js';
import { DeliverableContentAnalyzer } from '../../data-processing/deliverable-analyzer.js';
import fs from 'fs/promises';
import path from 'path';

export class DeliverableAnalysisContextSource extends IContextSource {
  constructor(options = {}) {
    super();
    this.priority = options.priority || 9; // High priority
    this.enabled = options.enabled !== false;
    this.analyzer = new DeliverableContentAnalyzer(options.analyzerOptions);
    this.includeAIInsights = options.includeAIInsights !== false;
  }

  /**
   * Get context from deliverable content analysis
   */
  async getContext(projectRoot, phase, deliverable, options = {}) {
    try {
      // Get deliverables from current and previous phases
      const currentPhaseDeliverables = await this.getPhaseDeliverables(projectRoot, phase);
      const previousPhaseDeliverables = await this.getPreviousPhaseDeliverables(projectRoot, phase);
      
      // Analyze deliverables for insights
      const currentAnalysis = await this.analyzeDeliverables(currentPhaseDeliverables, projectRoot);
      const previousAnalysis = await this.analyzeDeliverables(previousPhaseDeliverables, projectRoot);

      // Extract relevant insights for the target deliverable
      const relevantInsights = this.extractRelevantInsights(
        currentAnalysis, 
        previousAnalysis, 
        deliverable, 
        phase
      );

      return {
        success: true,
        source: 'deliverable_analysis',
        priority: this.priority,
        phase,
        deliverable,
        data: {
          // Current phase insights
          currentPhaseInsights: this.summarizeAnalysis(currentAnalysis),
          previousPhaseInsights: this.summarizeAnalysis(previousAnalysis),
          
          // Deliverable-specific insights
          relevantContent: relevantInsights.content || [],
          keyFindings: relevantInsights.findings || [],
          identifiedPatterns: relevantInsights.patterns || [],
          contentSummaries: relevantInsights.summaries || [],
          
          // Cross-deliverable relationships
          relationships: relevantInsights.relationships || {},
          dependencies: relevantInsights.dependencies || [],
          
          // Quality indicators
          completenessScores: relevantInsights.completeness || {},
          contentQuality: relevantInsights.quality || {},
          
          // Extracted entities and concepts
          keyEntities: relevantInsights.entities || [],
          concepts: relevantInsights.concepts || [],
          decisions: relevantInsights.decisions || [],
          
          // Technical insights
          technicalRequirements: relevantInsights.technical || [],
          constraints: relevantInsights.constraints || [],
          assumptions: relevantInsights.assumptions || []
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          analyzedDeliverables: currentPhaseDeliverables.length + previousPhaseDeliverables.length,
          analysisMethod: this.includeAIInsights ? 'hybrid' : 'rule-based',
          confidence: this.calculateAnalysisConfidence(currentAnalysis, previousAnalysis),
          coverage: this.calculateCoverage(currentAnalysis, previousAnalysis, phase)
        }
      };
    } catch (error) {
      console.error('Failed to get deliverable analysis context:', error);
      return this.getEmptyContext(phase, deliverable);
    }
  }

  /**
   * Get deliverables for a specific phase
   */
  async getPhaseDeliverables(projectRoot, phase) {
    const deliverablesPath = path.join(projectRoot, '.guidant', 'deliverables', phase);
    
    try {
      const files = await fs.readdir(deliverablesPath, { withFileTypes: true });
      return files
        .filter(file => file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.json')))
        .map(file => ({
          name: file.name,
          path: path.join(deliverablesPath, file.name),
          phase
        }));
    } catch (error) {
      // Phase directory doesn't exist or is empty
      return [];
    }
  }

  /**
   * Get deliverables from previous phases
   */
  async getPreviousPhaseDeliverables(projectRoot, currentPhase) {
    const phaseOrder = ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex <= 0) {
      return [];
    }

    const previousPhases = phaseOrder.slice(0, currentIndex);
    const allDeliverables = [];

    for (const phase of previousPhases) {
      const phaseDeliverables = await this.getPhaseDeliverables(projectRoot, phase);
      allDeliverables.push(...phaseDeliverables);
    }

    return allDeliverables;
  }

  /**
   * Analyze deliverables using DeliverableContentAnalyzer
   */
  async analyzeDeliverables(deliverables, projectRoot) {
    const analyses = [];

    for (const deliverable of deliverables) {
      try {
        const analysis = await this.analyzer.analyzeDeliverable(
          deliverable.path,
          deliverable.name,
          { 
            aiEnhanced: this.includeAIInsights,
            projectRoot 
          }
        );
        
        if (analysis.success) {
          analyses.push({
            ...analysis,
            deliverable: deliverable.name,
            phase: deliverable.phase
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze deliverable ${deliverable.name}:`, error.message);
      }
    }

    return analyses;
  }

  /**
   * Extract insights relevant to the target deliverable
   */
  extractRelevantInsights(currentAnalysis, previousAnalysis, targetDeliverable, phase) {
    const allAnalyses = [...currentAnalysis, ...previousAnalysis];
    
    // Find direct matches for the target deliverable
    const directMatches = allAnalyses.filter(a => 
      a.deliverable === targetDeliverable || 
      a.deliverable.includes(targetDeliverable) ||
      targetDeliverable.includes(a.deliverable.replace(/\.[^/.]+$/, ''))
    );

    // Extract insights from all analyses
    const insights = {
      content: [],
      findings: [],
      patterns: [],
      summaries: [],
      relationships: {},
      dependencies: [],
      completeness: {},
      quality: {},
      entities: [],
      concepts: [],
      decisions: [],
      technical: [],
      constraints: [],
      assumptions: []
    };

    for (const analysis of allAnalyses) {
      if (analysis.insights) {
        // Merge insights from each analysis
        this.mergeInsights(insights, analysis.insights, analysis.deliverable);
      }
    }

    // Prioritize insights from direct matches
    if (directMatches.length > 0) {
      insights.relevanceScore = 0.9;
      insights.directMatches = directMatches.length;
    } else {
      insights.relevanceScore = 0.6;
      insights.directMatches = 0;
    }

    return insights;
  }

  /**
   * Merge insights from individual analysis into combined insights
   */
  mergeInsights(combined, analysisInsights, deliverableName) {
    // Merge arrays
    const arrayFields = ['content', 'findings', 'patterns', 'entities', 'concepts', 'decisions', 'technical', 'constraints', 'assumptions'];
    
    for (const field of arrayFields) {
      if (analysisInsights[field] && Array.isArray(analysisInsights[field])) {
        combined[field].push(...analysisInsights[field].map(item => ({
          ...item,
          source: deliverableName
        })));
      }
    }

    // Merge objects
    if (analysisInsights.relationships) {
      combined.relationships[deliverableName] = analysisInsights.relationships;
    }

    if (analysisInsights.completeness) {
      combined.completeness[deliverableName] = analysisInsights.completeness;
    }

    if (analysisInsights.quality) {
      combined.quality[deliverableName] = analysisInsights.quality;
    }

    // Add content summaries
    if (analysisInsights.summary) {
      combined.summaries.push({
        deliverable: deliverableName,
        summary: analysisInsights.summary
      });
    }
  }

  /**
   * Summarize analysis results
   */
  summarizeAnalysis(analyses) {
    if (analyses.length === 0) {
      return { deliverableCount: 0, insights: [] };
    }

    return {
      deliverableCount: analyses.length,
      insights: analyses.map(a => ({
        deliverable: a.deliverable,
        phase: a.phase,
        keyInsights: a.insights?.keyFindings?.slice(0, 3) || [],
        completeness: a.insights?.completeness || 0
      }))
    };
  }

  /**
   * Calculate confidence in analysis results
   */
  calculateAnalysisConfidence(currentAnalysis, previousAnalysis) {
    const totalAnalyses = currentAnalysis.length + previousAnalysis.length;
    
    if (totalAnalyses === 0) {
      return 0.1;
    }

    const successfulAnalyses = [...currentAnalysis, ...previousAnalysis]
      .filter(a => a.success && a.insights).length;

    const baseConfidence = successfulAnalyses / totalAnalyses;
    
    // Boost confidence if we have AI-enhanced insights
    const aiEnhancedCount = [...currentAnalysis, ...previousAnalysis]
      .filter(a => a.metadata?.aiEnhanced).length;
    
    const aiBoost = aiEnhancedCount > 0 ? 0.2 : 0;
    
    return Math.min(baseConfidence + aiBoost, 1.0);
  }

  /**
   * Calculate coverage of available deliverables
   */
  calculateCoverage(currentAnalysis, previousAnalysis, phase) {
    // This is a simplified coverage calculation
    // In a real implementation, you'd compare against expected deliverables for the phase
    const totalAnalyzed = currentAnalysis.length + previousAnalysis.length;
    
    if (totalAnalyzed === 0) {
      return 0.0;
    }

    // Assume good coverage if we have multiple deliverables analyzed
    return Math.min(totalAnalyzed / 5, 1.0); // Normalize to max of 5 deliverables
  }

  /**
   * Get empty context when no analysis is available
   */
  getEmptyContext(phase, deliverable) {
    return {
      success: true,
      source: 'deliverable_analysis',
      priority: this.priority,
      phase,
      deliverable,
      data: {
        currentPhaseInsights: { deliverableCount: 0, insights: [] },
        previousPhaseInsights: { deliverableCount: 0, insights: [] },
        relevantContent: [],
        keyFindings: [],
        identifiedPatterns: [],
        contentSummaries: [],
        relationships: {},
        dependencies: [],
        completenessScores: {},
        contentQuality: {},
        keyEntities: [],
        concepts: [],
        decisions: [],
        technicalRequirements: [],
        constraints: [],
        assumptions: []
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
        analyzedDeliverables: 0,
        analysisMethod: 'none',
        confidence: 0.1,
        coverage: 0.0,
        isEmpty: true
      }
    };
  }

  getPriority() {
    return this.priority;
  }

  isAvailable() {
    return this.enabled;
  }

  getSourceName() {
    return 'deliverable_analysis';
  }
}
