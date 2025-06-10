/**
 * Impact Analyzer Implementation
 * Analyzes impact of changes on related deliverables using graph traversal
 * Following Single Responsibility Principle (SRP)
 */

import { IImpactAnalyzer, RELATIONSHIP_TYPES, IMPACT_SEVERITY } from '../interfaces/relationship-interfaces.js';
import { validateImpactAnalysis } from '../schemas/relationship-schemas.js';

export class ImpactAnalyzer extends IImpactAnalyzer {
  constructor(options = {}) {
    super();
    this.name = 'ImpactAnalyzer';
    this.version = '1.0.0';
    
    // Configuration
    this.config = {
      maxTraversalDepth: options.maxTraversalDepth || 5,
      minImpactThreshold: options.minImpactThreshold || 0.1,
      enableCascadingAnalysis: options.enableCascadingAnalysis !== false,
      impactWeights: {
        [RELATIONSHIP_TYPES.DEPENDS_ON]: 0.9,
        [RELATIONSHIP_TYPES.DERIVES_FROM]: 0.8,
        [RELATIONSHIP_TYPES.INFLUENCES]: 0.7,
        [RELATIONSHIP_TYPES.REFERENCES]: 0.5,
        [RELATIONSHIP_TYPES.MENTIONS]: 0.3,
        [RELATIONSHIP_TYPES.VALIDATES]: 0.8,
        [RELATIONSHIP_TYPES.CONFLICTS_WITH]: 0.9,
        [RELATIONSHIP_TYPES.SUPPORTS]: 0.6,
        ...options.impactWeights
      },
      severityThresholds: {
        minimal: 0.1,
        low: 0.3,
        medium: 0.5,
        high: 0.7,
        critical: 0.9,
        ...options.severityThresholds
      },
      ...options
    };
  }

  /**
   * Analyze impact of changes to a deliverable
   */
  async analyzeImpact(projectRoot, deliverableId, changeData, relationshipGraph) {
    try {
      const analysisId = this.generateAnalysisId(deliverableId, changeData);
      const sourceDeliverable = this.findDeliverable(relationshipGraph, deliverableId);
      
      if (!sourceDeliverable) {
        throw new Error(`Deliverable ${deliverableId} not found in relationship graph`);
      }

      // Get impact propagation paths
      const impactPaths = await this.getImpactPaths(
        relationshipGraph, 
        deliverableId, 
        this.config.maxTraversalDepth
      );

      // Calculate impact for each affected deliverable
      const impactedDeliverables = [];
      const processedDeliverables = new Set();

      for (const path of impactPaths) {
        const targetDeliverable = path[path.length - 1];
        const deliverableKey = this.getDeliverableKey(targetDeliverable);
        
        if (processedDeliverables.has(deliverableKey)) {
          continue; // Skip already processed deliverables
        }
        
        const impact = await this.calculateDeliverableImpact(
          sourceDeliverable,
          targetDeliverable,
          path,
          changeData,
          relationshipGraph
        );

        if (impact.severity !== IMPACT_SEVERITY.MINIMAL) {
          impactedDeliverables.push(impact);
          processedDeliverables.add(deliverableKey);
        }
      }

      // Generate summary
      const summary = this.generateImpactSummary(impactedDeliverables, impactPaths);

      // Create analysis result
      const analysisResult = {
        analysisId,
        sourceDeliverable,
        changeDescription: changeData.description || 'Unspecified change',
        analyzedAt: new Date().toISOString(),
        impactedDeliverables,
        summary,
        metadata: {
          analyzer: this.name,
          analysisVersion: this.version,
          qualityScore: this.calculateAnalysisQuality(impactedDeliverables, impactPaths)
        }
      };

      return validateImpactAnalysis(analysisResult);

    } catch (error) {
      console.error('Error in impact analysis:', error);
      throw error;
    }
  }

  /**
   * Get impact propagation paths using graph traversal
   */
  async getImpactPaths(relationshipGraph, sourceDeliverable, maxDepth = 5) {
    const paths = [];
    const visited = new Set();
    const sourceKey = typeof sourceDeliverable === 'string' 
      ? sourceDeliverable 
      : this.getDeliverableKey(sourceDeliverable);

    // Find the source deliverable in the graph
    const sourceNode = this.findDeliverable(relationshipGraph, sourceDeliverable);
    if (!sourceNode) {
      return paths;
    }

    // Perform depth-first search to find all impact paths
    await this.traverseImpactPaths(
      relationshipGraph,
      sourceNode,
      [sourceNode],
      paths,
      visited,
      maxDepth,
      0
    );

    return paths;
  }

  /**
   * Recursive graph traversal for impact path discovery
   */
  async traverseImpactPaths(relationshipGraph, currentNode, currentPath, allPaths, visited, maxDepth, currentDepth) {
    if (currentDepth >= maxDepth) {
      return;
    }

    const currentKey = this.getDeliverableKey(currentNode);
    
    // Find outgoing relationships from current node
    const outgoingRelationships = relationshipGraph.relationships.filter(rel => 
      this.getDeliverableKey(rel.source) === currentKey
    );

    for (const relationship of outgoingRelationships) {
      const targetKey = this.getDeliverableKey(relationship.target);
      
      // Avoid cycles
      if (visited.has(targetKey)) {
        continue;
      }

      // Check if this relationship type can propagate impact
      if (!this.canPropagateImpact(relationship)) {
        continue;
      }

      const targetNode = relationship.target;
      const newPath = [...currentPath, targetNode];
      
      // Add this path to results
      allPaths.push(newPath);
      
      // Continue traversal
      const newVisited = new Set(visited);
      newVisited.add(currentKey);
      
      await this.traverseImpactPaths(
        relationshipGraph,
        targetNode,
        newPath,
        allPaths,
        newVisited,
        maxDepth,
        currentDepth + 1
      );
    }
  }

  /**
   * Calculate impact severity scores
   */
  async calculateImpactSeverity(impactPaths, changeData) {
    const severityAnalysis = {
      overallSeverity: IMPACT_SEVERITY.MINIMAL,
      pathSeverities: [],
      factors: {
        changeType: this.analyzeChangeType(changeData),
        relationshipStrength: 0,
        pathLength: 0,
        cascadingEffects: 0
      }
    };

    for (const path of impactPaths) {
      const pathSeverity = this.calculatePathSeverity(path, changeData);
      severityAnalysis.pathSeverities.push({
        path: path.map(node => this.getDeliverableKey(node)),
        severity: pathSeverity.severity,
        score: pathSeverity.score,
        factors: pathSeverity.factors
      });

      // Update overall severity
      if (this.compareSeverity(pathSeverity.severity, severityAnalysis.overallSeverity) > 0) {
        severityAnalysis.overallSeverity = pathSeverity.severity;
      }
    }

    return severityAnalysis;
  }

  /**
   * Calculate impact for a specific deliverable
   */
  async calculateDeliverableImpact(sourceDeliverable, targetDeliverable, propagationPath, changeData, relationshipGraph) {
    // Calculate base impact score
    const pathScore = this.calculatePathImpactScore(propagationPath, relationshipGraph);
    const changeScore = this.calculateChangeImpactScore(changeData);
    const relationshipScore = this.calculateRelationshipImpactScore(propagationPath, relationshipGraph);
    
    // Combine scores
    const combinedScore = (pathScore * 0.4) + (changeScore * 0.3) + (relationshipScore * 0.3);
    
    // Determine impact type
    const impactType = propagationPath.length === 2 ? 'direct' : 
                      propagationPath.length === 3 ? 'indirect' : 'cascading';
    
    // Determine severity
    const severity = this.scoreToSeverity(combinedScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      targetDeliverable, 
      severity, 
      impactType, 
      propagationPath
    );

    return {
      deliverable: targetDeliverable,
      impactType,
      severity,
      confidence: Math.min(combinedScore, 0.95), // Cap confidence at 95%
      propagationPath,
      estimatedEffort: this.estimateEffort(severity, impactType),
      recommendations
    };
  }

  /**
   * Helper methods
   */
  findDeliverable(relationshipGraph, deliverableId) {
    const key = typeof deliverableId === 'string' ? deliverableId : this.getDeliverableKey(deliverableId);
    
    // Check in deliverables array
    const found = relationshipGraph.deliverables?.find(d => this.getDeliverableKey(d) === key);
    if (found) return found;
    
    // Check in relationships
    for (const rel of relationshipGraph.relationships) {
      if (this.getDeliverableKey(rel.source) === key) return rel.source;
      if (this.getDeliverableKey(rel.target) === key) return rel.target;
    }
    
    return null;
  }

  getDeliverableKey(deliverable) {
    if (typeof deliverable === 'string') return deliverable;
    return `${deliverable.phase}_${deliverable.name}`;
  }

  canPropagateImpact(relationship) {
    const impactWeight = this.config.impactWeights[relationship.type] || 0;
    return impactWeight >= this.config.minImpactThreshold;
  }

  calculatePathImpactScore(path, relationshipGraph) {
    if (path.length < 2) return 0;
    
    let totalScore = 0;
    let relationshipCount = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const sourceKey = this.getDeliverableKey(path[i]);
      const targetKey = this.getDeliverableKey(path[i + 1]);
      
      const relationship = relationshipGraph.relationships.find(rel =>
        this.getDeliverableKey(rel.source) === sourceKey &&
        this.getDeliverableKey(rel.target) === targetKey
      );
      
      if (relationship) {
        const weight = this.config.impactWeights[relationship.type] || 0.5;
        const strength = relationship.strength || 0.5;
        totalScore += weight * strength;
        relationshipCount++;
      }
    }
    
    return relationshipCount > 0 ? totalScore / relationshipCount : 0;
  }

  calculateChangeImpactScore(changeData) {
    const changeType = changeData.type || 'modification';
    const changeScope = changeData.scope || 'minor';
    
    const typeScores = {
      'creation': 0.3,
      'modification': 0.5,
      'deletion': 0.8,
      'restructure': 0.9
    };
    
    const scopeScores = {
      'trivial': 0.1,
      'minor': 0.3,
      'moderate': 0.5,
      'major': 0.7,
      'critical': 0.9
    };
    
    return (typeScores[changeType] || 0.5) * (scopeScores[changeScope] || 0.5);
  }

  calculateRelationshipImpactScore(path, relationshipGraph) {
    // Consider the strength of relationships in the path
    let minStrength = 1.0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const sourceKey = this.getDeliverableKey(path[i]);
      const targetKey = this.getDeliverableKey(path[i + 1]);
      
      const relationship = relationshipGraph.relationships.find(rel =>
        this.getDeliverableKey(rel.source) === sourceKey &&
        this.getDeliverableKey(rel.target) === targetKey
      );
      
      if (relationship && relationship.strength < minStrength) {
        minStrength = relationship.strength;
      }
    }
    
    return minStrength;
  }

  scoreToSeverity(score) {
    const thresholds = this.config.severityThresholds;
    
    if (score >= thresholds.critical) return IMPACT_SEVERITY.CRITICAL;
    if (score >= thresholds.high) return IMPACT_SEVERITY.HIGH;
    if (score >= thresholds.medium) return IMPACT_SEVERITY.MEDIUM;
    if (score >= thresholds.low) return IMPACT_SEVERITY.LOW;
    return IMPACT_SEVERITY.MINIMAL;
  }

  estimateEffort(severity, impactType) {
    const baseHours = {
      [IMPACT_SEVERITY.MINIMAL]: 0.5,
      [IMPACT_SEVERITY.LOW]: 2,
      [IMPACT_SEVERITY.MEDIUM]: 8,
      [IMPACT_SEVERITY.HIGH]: 24,
      [IMPACT_SEVERITY.CRITICAL]: 72
    };
    
    const typeMultipliers = {
      'direct': 1.0,
      'indirect': 1.5,
      'cascading': 2.0
    };
    
    const hours = baseHours[severity] * (typeMultipliers[impactType] || 1.0);
    
    return {
      hours,
      complexity: severity === IMPACT_SEVERITY.CRITICAL ? 'major' :
                 severity === IMPACT_SEVERITY.HIGH ? 'complex' :
                 severity === IMPACT_SEVERITY.MEDIUM ? 'moderate' :
                 severity === IMPACT_SEVERITY.LOW ? 'simple' : 'trivial'
    };
  }

  generateRecommendations(deliverable, severity, impactType, path) {
    const recommendations = [];
    
    if (severity === IMPACT_SEVERITY.CRITICAL) {
      recommendations.push('Immediate review and update required');
      recommendations.push('Consider blocking deployment until resolved');
    } else if (severity === IMPACT_SEVERITY.HIGH) {
      recommendations.push('Schedule update in current sprint');
      recommendations.push('Review dependencies and test thoroughly');
    } else if (severity === IMPACT_SEVERITY.MEDIUM) {
      recommendations.push('Plan update in next sprint');
      recommendations.push('Monitor for consistency issues');
    }
    
    if (impactType === 'cascading') {
      recommendations.push('Review entire dependency chain');
    }
    
    return recommendations;
  }

  generateImpactSummary(impactedDeliverables, impactPaths) {
    const severityCounts = {};
    let totalConfidence = 0;
    let highestSeverity = IMPACT_SEVERITY.MINIMAL;
    
    impactedDeliverables.forEach(impact => {
      severityCounts[impact.severity] = (severityCounts[impact.severity] || 0) + 1;
      totalConfidence += impact.confidence;
      
      if (this.compareSeverity(impact.severity, highestSeverity) > 0) {
        highestSeverity = impact.severity;
      }
    });
    
    return {
      totalImpacted: impactedDeliverables.length,
      highestSeverity,
      averageConfidence: impactedDeliverables.length > 0 ? totalConfidence / impactedDeliverables.length : 0,
      criticalPath: this.findCriticalPath(impactPaths, impactedDeliverables)
    };
  }

  findCriticalPath(impactPaths, impactedDeliverables) {
    // Find the path with the highest severity impact
    let criticalPath = null;
    let highestSeverity = IMPACT_SEVERITY.MINIMAL;
    
    for (const impact of impactedDeliverables) {
      if (this.compareSeverity(impact.severity, highestSeverity) > 0) {
        highestSeverity = impact.severity;
        criticalPath = impact.propagationPath;
      }
    }
    
    return criticalPath;
  }

  compareSeverity(severity1, severity2) {
    const severityOrder = [
      IMPACT_SEVERITY.MINIMAL,
      IMPACT_SEVERITY.LOW,
      IMPACT_SEVERITY.MEDIUM,
      IMPACT_SEVERITY.HIGH,
      IMPACT_SEVERITY.CRITICAL
    ];
    
    const index1 = severityOrder.indexOf(severity1);
    const index2 = severityOrder.indexOf(severity2);
    
    return index1 - index2;
  }

  calculateAnalysisQuality(impactedDeliverables, impactPaths) {
    // Simple quality score based on confidence and coverage
    const avgConfidence = impactedDeliverables.length > 0 
      ? impactedDeliverables.reduce((sum, impact) => sum + impact.confidence, 0) / impactedDeliverables.length
      : 0;
    
    const pathCoverage = Math.min(impactPaths.length / 10, 1); // Normalize to max 10 paths
    
    return (avgConfidence * 0.7) + (pathCoverage * 0.3);
  }

  generateAnalysisId(deliverableId, changeData) {
    const timestamp = Date.now();
    const deliverableKey = typeof deliverableId === 'string' ? deliverableId : this.getDeliverableKey(deliverableId);
    return `impact_${deliverableKey}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  analyzeChangeType(changeData) {
    return {
      type: changeData.type || 'modification',
      scope: changeData.scope || 'minor',
      confidence: changeData.confidence || 0.8
    };
  }

  calculatePathSeverity(path, changeData) {
    const pathLength = path.length;
    const changeScore = this.calculateChangeImpactScore(changeData);
    
    // Longer paths generally have lower impact due to attenuation
    const attenuationFactor = Math.pow(0.8, pathLength - 1);
    const score = changeScore * attenuationFactor;
    
    return {
      severity: this.scoreToSeverity(score),
      score,
      factors: {
        pathLength,
        changeScore,
        attenuationFactor
      }
    };
  }

  /**
   * Interface implementation methods
   */
  getAnalyzerInfo() {
    return {
      name: this.name,
      version: this.version,
      type: 'graph_traversal',
      capabilities: [
        'impact_propagation',
        'severity_analysis',
        'effort_estimation',
        'recommendation_generation'
      ],
      configuration: this.config
    };
  }
}
