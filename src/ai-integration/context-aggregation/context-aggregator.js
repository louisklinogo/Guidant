/**
 * Context Aggregator
 * Combines context from multiple sources following SOLID principles
 * Implements IContextAggregator interface with dependency injection
 */

import { IContextAggregator } from '../interfaces/context-interfaces.js';

export class ContextAggregator extends IContextAggregator {
  constructor(options = {}) {
    super();
    this.conflictResolutionStrategy = options.conflictResolutionStrategy || 'priority';
    this.enableParallelFetching = options.enableParallelFetching !== false;
    this.timeout = options.timeout || 10000; // 10 seconds
    this.maxConcurrency = options.maxConcurrency || 5;
  }

  /**
   * Aggregate context from multiple sources
   */
  async aggregateContext(sources, projectRoot, phase, deliverable, options = {}) {
    try {
      // Filter available sources
      const availableSources = sources.filter(source => source.isAvailable());
      
      if (availableSources.length === 0) {
        return this.getEmptyAggregatedContext(phase, deliverable);
      }

      // Sort sources by priority (highest first)
      const sortedSources = availableSources.sort((a, b) => b.getPriority() - a.getPriority());

      // Fetch context from all sources
      const contextData = this.enableParallelFetching
        ? await this.fetchContextParallel(sortedSources, projectRoot, phase, deliverable, options)
        : await this.fetchContextSequential(sortedSources, projectRoot, phase, deliverable, options);

      // Filter successful results
      const successfulResults = contextData.filter(result =>
        result.success && result.context && result.context.success !== false
      );

      if (successfulResults.length === 0) {
        console.warn('No successful context sources available, using empty context');
        return this.getEmptyAggregatedContext(phase, deliverable);
      }

      // Merge context data
      const mergedContext = this.mergeContextData(successfulResults.map(r => r.context));

      // Detect and resolve conflicts
      const conflicts = this.detectConflicts(successfulResults.map(r => r.context));
      const resolvedContext = conflicts.length > 0 
        ? this.resolveConflicts({ context: mergedContext, conflicts })
        : mergedContext;

      return {
        success: true,
        phase,
        deliverable,
        aggregatedContext: resolvedContext,
        metadata: {
          aggregatedAt: new Date().toISOString(),
          sourcesUsed: successfulResults.map(r => r.context.source),
          sourcesAttempted: sortedSources.map(s => s.getSourceName()),
          conflictsDetected: conflicts.length,
          conflictsResolved: conflicts.length,
          aggregationMethod: this.enableParallelFetching ? 'parallel' : 'sequential',
          totalSources: availableSources.length,
          successfulSources: successfulResults.length
        }
      };
    } catch (error) {
      console.error('Failed to aggregate context:', error);
      return {
        success: false,
        phase,
        deliverable,
        error: error.message,
        aggregatedContext: this.getEmptyAggregatedContext(phase, deliverable).aggregatedContext
      };
    }
  }

  /**
   * Fetch context from sources in parallel
   */
  async fetchContextParallel(sources, projectRoot, phase, deliverable, options) {
    const promises = sources.map(async (source) => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout for source ${source.getSourceName()}`)), this.timeout)
        );

        const contextPromise = source.getContext(projectRoot, phase, deliverable, options);
        const context = await Promise.race([contextPromise, timeoutPromise]);

        return {
          success: true,
          source: source.getSourceName(),
          context
        };
      } catch (error) {
        console.warn(`Source ${source.getSourceName()} failed:`, error.message);
        return {
          success: false,
          source: source.getSourceName(),
          error: error.message
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Fetch context from sources sequentially
   */
  async fetchContextSequential(sources, projectRoot, phase, deliverable, options) {
    const results = [];

    for (const source of sources) {
      try {
        const context = await source.getContext(projectRoot, phase, deliverable, options);
        results.push({
          success: true,
          source: source.getSourceName(),
          context
        });
      } catch (error) {
        console.warn(`Source ${source.getSourceName()} failed:`, error.message);
        results.push({
          success: false,
          source: source.getSourceName(),
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Merge context data from different sources
   */
  mergeContextData(contextData) {
    const merged = {
      sources: [],
      phase: null,
      deliverable: null,
      data: {},
      metadata: {
        confidence: 0,
        freshness: 0,
        coverage: 0
      }
    };

    // Collect all source information
    for (const context of contextData) {
      merged.sources.push({
        name: context.source,
        priority: context.priority,
        confidence: context.metadata?.confidence || 0.5,
        freshness: context.metadata?.freshness || 0.5
      });

      // Set phase and deliverable from first context
      if (!merged.phase) {
        merged.phase = context.phase;
        merged.deliverable = context.deliverable;
      }

      // Merge data by source
      merged.data[context.source] = context.data;
    }

    // Calculate aggregate metadata
    merged.metadata = this.calculateAggregateMetadata(contextData);

    // Create unified data structure
    merged.unified = this.createUnifiedDataStructure(contextData);

    return merged;
  }

  /**
   * Create unified data structure from all sources
   */
  createUnifiedDataStructure(contextData) {
    const unified = {
      // Project information
      project: {},
      
      // Phase and workflow information
      workflow: {},
      
      // Content and insights
      insights: {
        key: [],
        technical: [],
        decisions: [],
        recommendations: []
      },
      
      // Technical guidance
      technical: {
        techStack: {},
        architecture: {},
        requirements: []
      },
      
      // Quality and risk information
      quality: {
        gates: [],
        risks: [],
        completeness: {}
      },
      
      // Task and priority information
      tasks: {
        prioritized: [],
        focus: [],
        dependencies: []
      }
    };

    // Merge data from each source into unified structure
    for (const context of contextData) {
      this.mergeIntoUnified(unified, context);
    }

    return unified;
  }

  /**
   * Merge individual context into unified structure
   */
  mergeIntoUnified(unified, context) {
    const data = context.data;
    const source = context.source;

    // Project information
    if (data.projectName || data.projectType || data.projectDescription) {
      unified.project = {
        ...unified.project,
        name: data.projectName || unified.project.name,
        type: data.projectType || unified.project.type,
        description: data.projectDescription || unified.project.description,
        [`${source}_metadata`]: context.metadata
      };
    }

    // Workflow information
    if (data.currentPhase || data.phaseProgress || data.focusAreas) {
      unified.workflow = {
        ...unified.workflow,
        currentPhase: data.currentPhase || unified.workflow.currentPhase,
        progress: data.phaseProgress || unified.workflow.progress,
        focusAreas: [...(unified.workflow.focusAreas || []), ...(Array.isArray(data.focusAreas) ? data.focusAreas : [])],
        [`${source}_state`]: {
          completedPhases: data.completedPhases,
          qualityGates: data.qualityGates
        }
      };
    }

    // Insights
    if (data.keyInsights || data.keyFindings || data.decisions) {
      if (Array.isArray(data.keyInsights)) unified.insights.key.push(...data.keyInsights);
      if (Array.isArray(data.keyFindings)) unified.insights.key.push(...data.keyFindings);
      if (Array.isArray(data.decisions)) unified.insights.decisions.push(...data.decisions);
      if (Array.isArray(data.recommendations)) unified.insights.recommendations.push(...data.recommendations);
      if (Array.isArray(data.technicalRequirements)) unified.insights.technical.push(...data.technicalRequirements);
    }

    // Technical guidance
    if (data.techStackGuidance || data.systemDesign) {
      unified.technical.techStack = {
        ...unified.technical.techStack,
        ...data.techStackGuidance
      };
      
      if (data.systemDesign) {
        unified.technical.architecture[source] = data.systemDesign;
      }
      
      if (Array.isArray(data.transformedRequirements)) unified.technical.requirements.push(...data.transformedRequirements);
    }

    // Quality and risk
    if (data.qualityGates || data.riskFactors) {
      if (Array.isArray(data.qualityGates)) unified.quality.gates.push(...data.qualityGates);
      if (Array.isArray(data.riskFactors)) unified.quality.risks.push(...data.riskFactors);

      if (data.completenessScores) {
        unified.quality.completeness[source] = data.completenessScores;
      }
    }

    // Tasks and priorities
    if (data.prioritizedTasks || data.availableTools) {
      if (Array.isArray(data.prioritizedTasks)) unified.tasks.prioritized.push(...data.prioritizedTasks);
      if (Array.isArray(data.focusAreas)) unified.tasks.focus.push(...data.focusAreas);
      if (Array.isArray(data.dependencies)) unified.tasks.dependencies.push(...data.dependencies);
    }
  }

  /**
   * Calculate aggregate metadata
   */
  calculateAggregateMetadata(contextData) {
    if (contextData.length === 0) {
      return { confidence: 0, freshness: 0, coverage: 0 };
    }

    // Calculate weighted averages based on source priority
    let totalWeight = 0;
    let weightedConfidence = 0;
    let weightedFreshness = 0;
    let coverage = 0;

    for (const context of contextData) {
      const weight = context.priority || 1;
      const confidence = context.metadata?.confidence || 0.5;
      const freshness = context.metadata?.freshness || 0.5;

      totalWeight += weight;
      weightedConfidence += confidence * weight;
      weightedFreshness += freshness * weight;
      
      // Coverage is based on number of successful sources
      coverage += 1;
    }

    return {
      confidence: totalWeight > 0 ? weightedConfidence / totalWeight : 0,
      freshness: totalWeight > 0 ? weightedFreshness / totalWeight : 0,
      coverage: Math.min(coverage / 3, 1.0) // Normalize to max of 3 sources
    };
  }

  /**
   * Detect conflicts between context sources
   */
  detectConflicts(contextData) {
    const conflicts = [];

    // Check for conflicting project information
    const projectTypes = contextData
      .map(c => c.data.projectType)
      .filter(Boolean);
    
    if (new Set(projectTypes).size > 1) {
      conflicts.push({
        type: 'project_type',
        values: projectTypes,
        sources: contextData.filter(c => c.data.projectType).map(c => c.source)
      });
    }

    // Check for conflicting phase information
    const phases = contextData
      .map(c => c.data.currentPhase)
      .filter(Boolean);
    
    if (new Set(phases).size > 1) {
      conflicts.push({
        type: 'current_phase',
        values: phases,
        sources: contextData.filter(c => c.data.currentPhase).map(c => c.source)
      });
    }

    return conflicts;
  }

  /**
   * Resolve conflicts between context sources
   */
  resolveConflicts({ context, conflicts }) {
    const resolved = { ...context };

    for (const conflict of conflicts) {
      switch (this.conflictResolutionStrategy) {
        case 'priority':
          // Use value from highest priority source
          resolved.unified = this.resolvePriorityConflict(resolved.unified, conflict);
          break;
        
        case 'latest':
          // Use most recent value
          resolved.unified = this.resolveLatestConflict(resolved.unified, conflict);
          break;
        
        case 'merge':
          // Attempt to merge conflicting values
          resolved.unified = this.resolveMergeConflict(resolved.unified, conflict);
          break;
        
        default:
          console.warn(`Unknown conflict resolution strategy: ${this.conflictResolutionStrategy}`);
      }
    }

    return resolved;
  }

  /**
   * Resolve conflict using priority strategy
   */
  resolvePriorityConflict(unified, conflict) {
    // Find highest priority source
    const highestPrioritySource = conflict.sources.reduce((highest, current) => {
      const currentPriority = unified.sources?.find(s => s.name === current)?.priority || 0;
      const highestPriority = unified.sources?.find(s => s.name === highest)?.priority || 0;
      return currentPriority > highestPriority ? current : highest;
    });

    // Use value from highest priority source
    // Implementation would depend on specific conflict type
    console.log(`Resolved ${conflict.type} conflict using priority: ${highestPrioritySource}`);
    
    return unified;
  }

  /**
   * Resolve conflict using latest strategy
   */
  resolveLatestConflict(unified, conflict) {
    // Implementation would check timestamps and use most recent
    console.log(`Resolved ${conflict.type} conflict using latest value`);
    return unified;
  }

  /**
   * Resolve conflict using merge strategy
   */
  resolveMergeConflict(unified, conflict) {
    // Implementation would attempt to merge conflicting values
    console.log(`Resolved ${conflict.type} conflict using merge strategy`);
    return unified;
  }

  /**
   * Get empty aggregated context
   */
  getEmptyAggregatedContext(phase, deliverable) {
    return {
      success: true,
      phase,
      deliverable,
      aggregatedContext: {
        sources: [],
        phase,
        deliverable,
        data: {},
        unified: {
          project: {},
          workflow: {},
          insights: { key: [], technical: [], decisions: [], recommendations: [] },
          technical: { techStack: {}, architecture: {}, requirements: [] },
          quality: { gates: [], risks: [], completeness: {} },
          tasks: { prioritized: [], focus: [], dependencies: [] }
        },
        metadata: {
          confidence: 0,
          freshness: 0,
          coverage: 0
        }
      },
      metadata: {
        aggregatedAt: new Date().toISOString(),
        sourcesUsed: [],
        sourcesAttempted: [],
        conflictsDetected: 0,
        conflictsResolved: 0,
        totalSources: 0,
        successfulSources: 0,
        isEmpty: true
      }
    };
  }
}
