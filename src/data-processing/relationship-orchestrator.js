/**
 * Cross-Phase Relationship Orchestrator
 * Main coordinator for relationship detection, storage, and impact analysis
 * Following SOLID principles with Dependency Inversion (DIP)
 */

import path from 'path';
import { DeliverableContentAnalyzer } from './deliverable-analyzer.js';
import { StructuralRelationshipDetector } from './detectors/structural-relationship-detector.js';
import { JSONRelationshipStorage } from './storage/json-relationship-storage.js';
import { ImpactAnalyzer } from './analyzers/impact-analyzer.js';
import {
  validateDetectionOptions,
  validateQueryOptions,
  validateRelationshipGraph
} from './schemas/relationship-schemas.js';
import { readProjectFile } from '../file-management/project-structure.js';
import { PROJECT_PHASES } from '../constants/paths.js';

export class RelationshipOrchestrator {
  constructor(options = {}) {
    this.name = 'RelationshipOrchestrator';
    this.version = '1.0.0';
    
    // Configuration
    this.config = {
      enableCaching: options.enableCaching !== false,
      cacheTTL: options.cacheTTL || 30 * 60 * 1000, // 30 minutes
      maxRetries: options.maxRetries || 2,
      timeoutMs: options.timeoutMs || 15000, // 15 seconds
      enableParallelDetection: options.enableParallelDetection !== false,
      ...options
    };

    // Dependency injection - following DIP principle
    this.detectors = options.detectors || [
      new StructuralRelationshipDetector(options.structuralDetectorOptions)
    ];
    
    this.storage = options.storage || new JSONRelationshipStorage(options.storageOptions);
    this.impactAnalyzer = options.impactAnalyzer || new ImpactAnalyzer(options.impactAnalyzerOptions);
    this.deliverableAnalyzer = options.deliverableAnalyzer || new DeliverableContentAnalyzer();

    // Caching
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Performance tracking
    this.metrics = {
      detectionsPerformed: 0,
      averageDetectionTime: 0,
      cacheHitRate: 0,
      lastAnalysisTime: null
    };
  }

  /**
   * Detect and store relationships for all deliverables in a project
   */
  async analyzeProjectRelationships(projectRoot, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Starting comprehensive relationship analysis...');
      
      // Validate options
      const validatedOptions = validateDetectionOptions(options);
      
      // Get all deliverables from project
      const deliverables = await this.getAllProjectDeliverables(projectRoot);
      
      if (deliverables.length === 0) {
        console.log('ℹ️ No deliverables found for relationship analysis');
        return this.createEmptyRelationshipGraph(projectRoot);
      }

      console.log(`📊 Analyzing relationships for ${deliverables.length} deliverables...`);

      // Detect relationships
      const relationships = await this.detectAllRelationships(
        deliverables, 
        validatedOptions
      );

      // Create relationship graph
      const relationshipGraph = this.createRelationshipGraph(
        projectRoot,
        deliverables,
        relationships
      );

      // Store the results
      const stored = await this.storage.storeRelationships(projectRoot, relationshipGraph);
      
      if (!stored) {
        throw new Error('Failed to store relationship analysis results');
      }

      // Update metrics
      this.updateMetrics(startTime, relationships.length);

      console.log(`✅ Relationship analysis complete: ${relationships.length} relationships detected`);
      
      return relationshipGraph;

    } catch (error) {
      console.error('❌ Error in project relationship analysis:', error);
      throw error;
    }
  }

  /**
   * Get relationships for a specific deliverable
   */
  async getDeliverableRelationships(projectRoot, deliverableId, options = {}) {
    try {
      const validatedOptions = validateQueryOptions(options);
      
      // Check cache first
      const cacheKey = `relationships_${deliverableId}`;
      if (this.config.enableCaching) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.metrics.cacheHitRate++;
          return cached;
        }
      }

      // Get from storage
      const relationships = await this.storage.getRelationships(
        projectRoot, 
        deliverableId, 
        validatedOptions
      );

      // Update cache
      if (this.config.enableCaching) {
        this.updateCache(cacheKey, relationships);
      }

      return relationships;

    } catch (error) {
      console.error('Error getting deliverable relationships:', error);
      return [];
    }
  }

  /**
   * Analyze impact of changes to a deliverable
   */
  async analyzeChangeImpact(projectRoot, deliverableId, changeData, options = {}) {
    try {
      console.log(`🔍 Analyzing impact of changes to ${deliverableId}...`);

      // Get current relationship graph
      const relationshipGraph = await this.storage.getAllRelationships(projectRoot);
      
      if (!relationshipGraph || relationshipGraph.relationships.length === 0) {
        console.log('ℹ️ No relationships found, performing fresh analysis...');
        await this.analyzeProjectRelationships(projectRoot);
        const updatedGraph = await this.storage.getAllRelationships(projectRoot);
        return await this.impactAnalyzer.analyzeImpact(
          projectRoot, 
          deliverableId, 
          changeData, 
          updatedGraph
        );
      }

      // Perform impact analysis
      const impactAnalysis = await this.impactAnalyzer.analyzeImpact(
        projectRoot,
        deliverableId,
        changeData,
        relationshipGraph
      );

      console.log(`✅ Impact analysis complete: ${impactAnalysis.impactedDeliverables.length} deliverables affected`);
      
      return impactAnalysis;

    } catch (error) {
      console.error('Error in change impact analysis:', error);
      throw error;
    }
  }

  /**
   * Get all deliverables from project structure
   */
  async getAllProjectDeliverables(projectRoot) {
    const deliverables = [];
    
    try {
      // Get project phases
      const phases = await readProjectFile(projectRoot, PROJECT_PHASES);
      
      if (!phases || !phases.phases) {
        console.warn('No project phases found');
        return deliverables;
      }

      // Scan each phase for deliverables
      for (const [phaseName, phaseData] of Object.entries(phases.phases)) {
        if (phaseData.status === 'complete' || phaseData.deliverables) {
          const phaseDeliverables = await this.getPhaseDeliverables(projectRoot, phaseName);
          deliverables.push(...phaseDeliverables);
        }
      }

      return deliverables;

    } catch (error) {
      console.error('Error getting project deliverables:', error);
      return deliverables;
    }
  }

  /**
   * Get deliverables for a specific phase
   */
  async getPhaseDeliverables(projectRoot, phase) {
    const deliverables = [];
    
    try {
      const phaseDir = `.guidant/deliverables/${phase}`;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const phasePath = path.join(projectRoot, phaseDir);
      
      try {
        const files = await fs.readdir(phasePath);
        
        for (const file of files) {
          if (file.startsWith('.') || file === 'metadata') continue;
          
          const filePath = path.join(phasePath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            // Analyze the deliverable content
            const analysis = await this.deliverableAnalyzer.analyzeDeliverable(
              filePath,
              this.getDeliverableType(file)
            );
            
            deliverables.push({
              phase,
              name: file.replace(/\.[^/.]+$/, ''), // Remove extension
              type: this.getDeliverableType(file),
              path: filePath,
              content: analysis.content,
              analysis: analysis.insights,
              metadata: {
                size: stats.size,
                modified: stats.mtime.toISOString(),
                analyzed: new Date().toISOString()
              }
            });
          }
        }
      } catch (dirError) {
        // Phase directory doesn't exist or is empty
        console.log(`Phase ${phase} has no deliverables directory`);
      }

    } catch (error) {
      console.error(`Error getting deliverables for phase ${phase}:`, error);
    }
    
    return deliverables;
  }

  /**
   * Detect relationships between all deliverable pairs
   */
  async detectAllRelationships(deliverables, options) {
    const allRelationships = [];
    const detectionPromises = [];

    // Get available detectors
    const availableDetectors = this.detectors.filter(detector => detector.isAvailable());
    
    if (availableDetectors.length === 0) {
      console.warn('⚠️ No relationship detectors available');
      return allRelationships;
    }

    console.log(`🔍 Using ${availableDetectors.length} detection algorithms`);

    // Detect relationships for each deliverable pair
    for (let i = 0; i < deliverables.length; i++) {
      const sourceDeliverable = deliverables[i];
      const targetDeliverables = deliverables.filter((_, index) => index !== i);

      if (this.config.enableParallelDetection) {
        // Parallel detection
        const promise = this.detectRelationshipsForDeliverable(
          sourceDeliverable,
          targetDeliverables,
          availableDetectors,
          options
        );
        detectionPromises.push(promise);
      } else {
        // Sequential detection
        const relationships = await this.detectRelationshipsForDeliverable(
          sourceDeliverable,
          targetDeliverables,
          availableDetectors,
          options
        );
        allRelationships.push(...relationships);
      }
    }

    // Wait for parallel detection to complete
    if (this.config.enableParallelDetection) {
      const results = await Promise.allSettled(detectionPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allRelationships.push(...result.value);
        } else {
          console.warn(`Detection failed for deliverable ${index}:`, result.reason);
        }
      });
    }

    // Remove duplicates and merge similar relationships
    return this.deduplicateRelationships(allRelationships);
  }

  /**
   * Detect relationships for a single deliverable against targets
   */
  async detectRelationshipsForDeliverable(sourceDeliverable, targetDeliverables, detectors, options) {
    const relationships = [];

    for (const detector of detectors) {
      try {
        const detectorRelationships = await this.executeWithTimeout(
          () => detector.detectRelationships(sourceDeliverable, targetDeliverables, options),
          this.config.timeoutMs,
          `${detector.constructor.name} detection timeout`
        );

        relationships.push(...detectorRelationships);
        
      } catch (error) {
        console.warn(`Detector ${detector.constructor.name} failed:`, error.message);
        // Continue with other detectors
      }
    }

    return relationships;
  }

  /**
   * Helper methods
   */
  getDeliverableType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const name = filename.toLowerCase();

    if (name.includes('market') || name.includes('analysis')) return 'market_analysis';
    if (name.includes('persona') || name.includes('user')) return 'user_personas';
    if (name.includes('competitor')) return 'competitor_research';
    if (name.includes('prd') || name.includes('requirements')) return 'prd_complete';
    if (name.includes('stories')) return 'user_stories';
    if (name.includes('wireframe')) return 'wireframes';
    if (name.includes('flow')) return 'user_flows';
    if (name.includes('system') || name.includes('design')) return 'system_design';
    if (name.includes('architecture')) return 'architecture';
    if (name.includes('database') || name.includes('schema')) return 'database_schema';
    if (name.includes('api')) return 'api_specification';

    return ext === 'json' ? 'structured_data' :
           ext === 'md' ? 'documentation' : 'unknown';
  }

  createRelationshipGraph(projectRoot, deliverables, relationships) {
    return {
      projectId: path.basename(projectRoot),
      version: '1.0',
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      relationships,
      deliverables: deliverables.map(d => ({
        phase: d.phase,
        name: d.name,
        type: d.type,
        path: d.path
      })),
      statistics: this.calculateStatistics(relationships),
      metadata: {
        generatedBy: this.name,
        detectionAlgorithms: this.detectors.map(d => d.constructor.name),
        validationRules: ['confidence_threshold', 'duplicate_removal'],
        qualityScore: this.calculateQualityScore(relationships)
      }
    };
  }

  createEmptyRelationshipGraph(projectRoot) {
    return {
      projectId: path.basename(projectRoot),
      version: '1.0',
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      relationships: [],
      deliverables: [],
      statistics: {
        totalRelationships: 0,
        relationshipsByType: {},
        relationshipsByPhase: {},
        averageStrength: 0,
        averageConfidence: 0
      },
      metadata: {
        generatedBy: this.name,
        detectionAlgorithms: [],
        validationRules: []
      }
    };
  }

  calculateStatistics(relationships) {
    const stats = {
      totalRelationships: relationships.length,
      relationshipsByType: {},
      relationshipsByPhase: {},
      averageStrength: 0,
      averageConfidence: 0
    };

    if (relationships.length === 0) {
      return stats;
    }

    let totalStrength = 0;
    let totalConfidence = 0;

    relationships.forEach(rel => {
      // Count by type
      stats.relationshipsByType[rel.type] = (stats.relationshipsByType[rel.type] || 0) + 1;

      // Count by phase
      const phaseKey = `${rel.source.phase}->${rel.target.phase}`;
      stats.relationshipsByPhase[phaseKey] = (stats.relationshipsByPhase[phaseKey] || 0) + 1;

      // Sum for averages
      totalStrength += rel.strength || 0;
      totalConfidence += rel.confidence || 0;
    });

    stats.averageStrength = totalStrength / relationships.length;
    stats.averageConfidence = totalConfidence / relationships.length;

    return stats;
  }

  calculateQualityScore(relationships) {
    if (relationships.length === 0) return 0;

    const avgConfidence = relationships.reduce((sum, rel) => sum + (rel.confidence || 0), 0) / relationships.length;
    const evidenceQuality = relationships.reduce((sum, rel) => {
      const evidenceCount = rel.evidence ? rel.evidence.length : 0;
      return sum + Math.min(evidenceCount / 3, 1); // Normalize to max 3 pieces of evidence
    }, 0) / relationships.length;

    return (avgConfidence * 0.7) + (evidenceQuality * 0.3);
  }

  deduplicateRelationships(relationships) {
    const seen = new Map();
    const deduplicated = [];

    relationships.forEach(rel => {
      const key = `${rel.source.phase}_${rel.source.name}_${rel.target.phase}_${rel.target.name}_${rel.type}`;

      if (seen.has(key)) {
        // Merge with existing relationship (keep higher confidence)
        const existing = seen.get(key);
        if (rel.confidence > existing.confidence) {
          // Replace with higher confidence relationship
          const index = deduplicated.findIndex(r => r.id === existing.id);
          if (index !== -1) {
            deduplicated[index] = rel;
            seen.set(key, rel);
          }
        }
      } else {
        seen.set(key, rel);
        deduplicated.push(rel);
      }
    });

    return deduplicated;
  }

  async executeWithTimeout(fn, timeoutMs, errorMessage) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);

      fn().then(result => {
        clearTimeout(timeout);
        resolve(result);
      }).catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  updateMetrics(startTime, relationshipCount) {
    const duration = Date.now() - startTime;
    this.metrics.detectionsPerformed++;
    this.metrics.averageDetectionTime =
      (this.metrics.averageDetectionTime + duration) / this.metrics.detectionsPerformed;
    this.metrics.lastAnalysisTime = new Date().toISOString();

    console.log(`📊 Analysis metrics: ${relationshipCount} relationships in ${duration}ms`);
  }

  // Cache management
  updateCache(key, data) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  getFromCache(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.config.cacheTTL) {
      this.clearCache(key);
      return null;
    }
    return this.cache.get(key);
  }

  clearCache(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  /**
   * Public API methods
   */
  async getStorageHealth() {
    return await this.storage.getStorageHealth();
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getDetectorInfo() {
    return this.detectors.map(detector => detector.getDetectorInfo());
  }

  getAnalyzerInfo() {
    return this.impactAnalyzer.getAnalyzerInfo();
  }
}
