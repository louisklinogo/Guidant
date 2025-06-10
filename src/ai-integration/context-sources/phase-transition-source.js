/**
 * Phase Transition Context Source
 * Provides enhanced context from PhaseTransitionEngine results
 * Implements IContextSource interface following Single Responsibility Principle
 */

import { IContextSource } from '../interfaces/context-interfaces.js';
import fs from 'fs/promises';
import path from 'path';

export class PhaseTransitionContextSource extends IContextSource {
  constructor(options = {}) {
    super();
    this.priority = options.priority || 10; // Highest priority
    this.enabled = options.enabled !== false;
    this.cacheTTL = options.cacheTTL || 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get enhanced context from phase transition results
   */
  async getContext(projectRoot, phase, deliverable, options = {}) {
    try {
      // Load transformation results from PhaseTransitionEngine
      const transformationPath = path.join(projectRoot, '.guidant', 'data-processing', 'transformations.json');
      
      let transformationData = null;
      try {
        const transformationContent = await fs.readFile(transformationPath, 'utf-8');
        transformationData = JSON.parse(transformationContent);
      } catch (error) {
        // No transformation data available yet
        console.log('No phase transition data available yet');
        return this.getEmptyContext(phase, deliverable);
      }

      // Find the most recent transformation to the current phase
      const relevantTransformation = this.findRelevantTransformation(transformationData, phase);
      
      if (!relevantTransformation) {
        return this.getEmptyContext(phase, deliverable);
      }

      // Extract enhanced context from transformation
      const enhancedContext = relevantTransformation.enhancedContext || {};
      const transformation = relevantTransformation.transformation || {};

      return {
        success: true,
        source: 'phase_transition',
        priority: this.priority,
        phase,
        deliverable,
        data: {
          // Enhanced context from PhaseTransitionEngine
          focusAreas: enhancedContext.focusAreas || [],
          keyInsights: enhancedContext.keyInsights || [],
          techStackGuidance: enhancedContext.techStackGuidance || {},
          prioritizedTasks: enhancedContext.prioritizedTasks || [],
          riskFactors: enhancedContext.riskFactors || [],
          qualityGates: enhancedContext.qualityGates || [],
          
          // Transformation insights
          previousPhaseInsights: enhancedContext.previousPhaseInsights || {},
          transformedRequirements: enhancedContext.transformedRequirements || [],
          keyDecisions: enhancedContext.keyDecisions || [],
          recommendations: enhancedContext.recommendations || [],
          
          // Technical guidance
          systemDesign: transformation.systemDesign || {},
          databaseSchema: transformation.databaseSchema || {},
          apiSpecs: transformation.apiSpecs || {},
          deploymentPlan: transformation.deploymentPlan || {},
          
          // Metadata
          projectType: enhancedContext.projectType || 'web_app',
          phaseRequirements: enhancedContext.phaseRequirements || [],
          generatedAt: enhancedContext.generatedAt || new Date().toISOString(),
          transformedAt: transformation.transformedAt || new Date().toISOString()
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          transformationId: relevantTransformation.id || 'unknown',
          confidence: this.calculateConfidence(relevantTransformation),
          freshness: this.calculateFreshness(relevantTransformation)
        }
      };
    } catch (error) {
      console.error('Failed to get phase transition context:', error);
      return this.getEmptyContext(phase, deliverable);
    }
  }

  /**
   * Find the most relevant transformation for the current phase
   */
  findRelevantTransformation(transformationData, targetPhase) {
    if (!transformationData || !transformationData.transformations) {
      return null;
    }

    // Find transformations that resulted in the target phase
    const relevantTransformations = transformationData.transformations.filter(t => 
      t.toPhase === targetPhase || t.enhancedContext?.phase === targetPhase
    );

    if (relevantTransformations.length === 0) {
      // Fallback: find the most recent transformation
      return transformationData.transformations[transformationData.transformations.length - 1] || null;
    }

    // Return the most recent relevant transformation
    return relevantTransformations.sort((a, b) => 
      new Date(b.transformedAt || 0) - new Date(a.transformedAt || 0)
    )[0];
  }

  /**
   * Calculate confidence score for transformation data
   */
  calculateConfidence(transformation) {
    let confidence = 0.5; // Base confidence

    // Higher confidence if transformation was successful
    if (transformation.success) {
      confidence += 0.3;
    }

    // Higher confidence if enhanced context is available
    if (transformation.enhancedContext) {
      confidence += 0.2;
    }

    // Higher confidence if transformation has insights
    if (transformation.transformation?.insights) {
      confidence += 0.1;
    }

    // Higher confidence if recent (within last hour)
    const transformedAt = new Date(transformation.transformedAt || 0);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (transformedAt > hourAgo) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate freshness score (0-1, 1 = very fresh)
   */
  calculateFreshness(transformation) {
    const transformedAt = new Date(transformation.transformedAt || 0);
    const now = new Date();
    const ageMs = now - transformedAt;
    
    // Fresh if less than 30 minutes old
    const thirtyMinutes = 30 * 60 * 1000;
    if (ageMs < thirtyMinutes) {
      return 1.0;
    }
    
    // Decay over 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (ageMs > twentyFourHours) {
      return 0.1;
    }
    
    // Linear decay between 30 minutes and 24 hours
    return 1.0 - ((ageMs - thirtyMinutes) / (twentyFourHours - thirtyMinutes)) * 0.9;
  }

  /**
   * Get empty context when no transformation data is available
   */
  getEmptyContext(phase, deliverable) {
    return {
      success: true,
      source: 'phase_transition',
      priority: this.priority,
      phase,
      deliverable,
      data: {
        focusAreas: [],
        keyInsights: [],
        techStackGuidance: {},
        prioritizedTasks: [],
        riskFactors: [],
        qualityGates: [],
        previousPhaseInsights: {},
        transformedRequirements: [],
        keyDecisions: [],
        recommendations: [],
        projectType: 'web_app',
        phaseRequirements: []
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
        confidence: 0.1,
        freshness: 0.0,
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
    return 'phase_transition';
  }
}
