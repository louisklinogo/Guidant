/**
 * Structural Relationship Detector
 * Detects explicit references and structural patterns between deliverables
 * Following Single Responsibility Principle (SRP)
 */

import { IRelationshipDetector, RELATIONSHIP_TYPES, RELATIONSHIP_STRENGTH } from '../interfaces/relationship-interfaces.js';
import { validateDetectionOptions, validateDetectorInfo } from '../schemas/relationship-schemas.js';

export class StructuralRelationshipDetector extends IRelationshipDetector {
  constructor(options = {}) {
    super();
    this.name = 'StructuralRelationshipDetector';
    this.version = '1.0.0';
    this.type = 'structural';
    this.priority = 80; // High priority for explicit references
    
    // Configuration
    this.config = {
      minConfidence: options.minConfidence || 0.7,
      enableFileReferences: options.enableFileReferences !== false,
      enablePhaseReferences: options.enablePhaseReferences !== false,
      enableExplicitMentions: options.enableExplicitMentions !== false,
      caseSensitive: options.caseSensitive || false,
      ...options
    };

    // Deliverable keywords and patterns
    this.deliverablePatterns = this.initializePatterns();
  }

  /**
   * Initialize detection patterns for different deliverable types
   */
  initializePatterns() {
    return {
      // File reference patterns
      fileReferences: [
        /(?:see|refer to|check|view|from)\s+([a-zA-Z0-9_-]+\.[a-zA-Z]{2,4})/gi,
        /(?:file|document|report):\s*([a-zA-Z0-9_/-]+\.[a-zA-Z]{2,4})/gi,
        /\[([^\]]+)\]\([^)]*\.(?:md|json|txt|pdf|doc|docx)\)/gi
      ],

      // Phase reference patterns
      phaseReferences: [
        /(?:from|in|during|after|before)\s+(concept|requirements|design|architecture|implementation|deployment)\s+phase/gi,
        /(?:concept|requirements|design|architecture|implementation|deployment)\s+(?:phase|stage|step)/gi
      ],

      // Explicit deliverable mentions
      deliverableMentions: [
        /(?:market\s+analysis|user\s+personas|competitor\s+research)/gi,
        /(?:prd|product\s+requirements|user\s+stories)/gi,
        /(?:wireframes|user\s+flows|mockups|prototypes)/gi,
        /(?:system\s+design|architecture|database\s+schema|api\s+spec)/gi,
        /(?:implementation|code|features|testing)/gi,
        /(?:deployment|production|monitoring|release)/gi
      ],

      // Cross-reference patterns
      crossReferences: [
        /(?:as\s+(?:mentioned|described|outlined|specified)\s+in)\s+([^.]+)/gi,
        /(?:according\s+to|based\s+on|derived\s+from)\s+([^.]+)/gi,
        /(?:see\s+(?:section|chapter|part|appendix))\s+([^.]+)/gi
      ],

      // Dependency patterns
      dependencyPatterns: [
        /(?:depends\s+on|requires|needs|prerequisite)\s+([^.]+)/gi,
        /(?:after|once|when)\s+([^.]+)\s+(?:is\s+)?(?:complete|done|finished)/gi,
        /(?:blocked\s+by|waiting\s+for)\s+([^.]+)/gi
      ]
    };
  }

  /**
   * Detect relationships between deliverables
   */
  async detectRelationships(sourceDeliverable, targetDeliverables, options = {}) {
    try {
      const validatedOptions = validateDetectionOptions(options);
      const relationships = [];

      if (!sourceDeliverable || !targetDeliverables || targetDeliverables.length === 0) {
        return relationships;
      }

      // Get source content
      const sourceContent = this.extractContent(sourceDeliverable);
      if (!sourceContent) {
        return relationships;
      }

      // Detect relationships with each target deliverable
      for (const targetDeliverable of targetDeliverables) {
        const detectedRelationships = await this.detectRelationshipPair(
          sourceDeliverable,
          targetDeliverable,
          sourceContent,
          validatedOptions
        );
        relationships.push(...detectedRelationships);
      }

      // Filter by confidence threshold
      return relationships.filter(rel => rel.confidence >= validatedOptions.minConfidence);

    } catch (error) {
      console.error('Error in structural relationship detection:', error);
      return [];
    }
  }

  /**
   * Detect relationships between a specific pair of deliverables
   */
  async detectRelationshipPair(sourceDeliverable, targetDeliverable, sourceContent, options) {
    const relationships = [];
    const targetName = this.getDeliverableName(targetDeliverable);
    const targetPhase = targetDeliverable.phase;

    // Skip self-references
    if (this.isSameDeliverable(sourceDeliverable, targetDeliverable)) {
      return relationships;
    }

    // 1. File reference detection
    if (this.config.enableFileReferences) {
      const fileRefs = this.detectFileReferences(sourceContent, targetDeliverable);
      relationships.push(...fileRefs.map(ref => this.createRelationship(
        sourceDeliverable,
        targetDeliverable,
        RELATIONSHIP_TYPES.REFERENCES,
        ref.confidence,
        ref.evidence,
        'file_reference'
      )));
    }

    // 2. Phase reference detection
    if (this.config.enablePhaseReferences) {
      const phaseRefs = this.detectPhaseReferences(sourceContent, targetPhase);
      relationships.push(...phaseRefs.map(ref => this.createRelationship(
        sourceDeliverable,
        targetDeliverable,
        RELATIONSHIP_TYPES.REFERENCES,
        ref.confidence,
        ref.evidence,
        'phase_reference'
      )));
    }

    // 3. Explicit mention detection
    if (this.config.enableExplicitMentions) {
      const mentions = this.detectExplicitMentions(sourceContent, targetName, targetDeliverable);
      relationships.push(...mentions.map(mention => this.createRelationship(
        sourceDeliverable,
        targetDeliverable,
        RELATIONSHIP_TYPES.MENTIONS,
        mention.confidence,
        mention.evidence,
        'explicit_mention'
      )));
    }

    // 4. Cross-reference detection
    const crossRefs = this.detectCrossReferences(sourceContent, targetName);
    relationships.push(...crossRefs.map(ref => this.createRelationship(
      sourceDeliverable,
      targetDeliverable,
      RELATIONSHIP_TYPES.REFERENCES,
      ref.confidence,
      ref.evidence,
      'cross_reference'
    )));

    // 5. Dependency detection
    const dependencies = this.detectDependencies(sourceContent, targetName);
    relationships.push(...dependencies.map(dep => this.createRelationship(
      sourceDeliverable,
      targetDeliverable,
      RELATIONSHIP_TYPES.DEPENDS_ON,
      dep.confidence,
      dep.evidence,
      'dependency'
    )));

    return relationships;
  }

  /**
   * Detect file references in content
   */
  detectFileReferences(content, targetDeliverable) {
    const references = [];
    const targetPath = targetDeliverable.path || this.getDeliverableName(targetDeliverable);

    for (const pattern of this.deliverablePatterns.fileReferences) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const referencedFile = match[1];
        if (this.isFileMatch(referencedFile, targetPath)) {
          references.push({
            confidence: RELATIONSHIP_STRENGTH.HIGH,
            evidence: [{
              type: 'structural_reference',
              description: `File reference: "${match[0]}"`,
              location: `Position ${match.index}`,
              score: RELATIONSHIP_STRENGTH.HIGH
            }]
          });
        }
      }
    }

    return references;
  }

  /**
   * Detect phase references in content
   */
  detectPhaseReferences(content, targetPhase) {
    const references = [];

    for (const pattern of this.deliverablePatterns.phaseReferences) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const referencedPhase = match[1] || match[0];
        if (referencedPhase.toLowerCase().includes(targetPhase.toLowerCase())) {
          references.push({
            confidence: RELATIONSHIP_STRENGTH.MEDIUM,
            evidence: [{
              type: 'structural_reference',
              description: `Phase reference: "${match[0]}"`,
              location: `Position ${match.index}`,
              score: RELATIONSHIP_STRENGTH.MEDIUM
            }]
          });
        }
      }
    }

    return references;
  }

  /**
   * Detect explicit mentions of deliverable names
   */
  detectExplicitMentions(content, targetName, targetDeliverable) {
    const mentions = [];
    const searchTerms = this.generateSearchTerms(targetName, targetDeliverable);

    for (const term of searchTerms) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(term)}\\b`,
        this.config.caseSensitive ? 'g' : 'gi'
      );

      let match;
      while ((match = regex.exec(content)) !== null) {
        mentions.push({
          confidence: RELATIONSHIP_STRENGTH.MEDIUM,
          evidence: [{
            type: 'explicit_mention',
            description: `Explicit mention: "${match[0]}"`,
            location: `Position ${match.index}`,
            score: RELATIONSHIP_STRENGTH.MEDIUM
          }]
        });
      }
    }

    return mentions;
  }

  /**
   * Detect cross-references in content
   */
  detectCrossReferences(content, targetName) {
    const references = [];

    for (const pattern of this.deliverablePatterns.crossReferences) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const referencedContent = match[1];
        if (referencedContent.toLowerCase().includes(targetName.toLowerCase())) {
          references.push({
            confidence: RELATIONSHIP_STRENGTH.HIGH,
            evidence: [{
              type: 'structural_reference',
              description: `Cross-reference: "${match[0]}"`,
              location: `Position ${match.index}`,
              score: RELATIONSHIP_STRENGTH.HIGH
            }]
          });
        }
      }
    }

    return references;
  }

  /**
   * Detect dependency relationships
   */
  detectDependencies(content, targetName) {
    const dependencies = [];

    for (const pattern of this.deliverablePatterns.dependencyPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dependencyContent = match[1];
        if (dependencyContent.toLowerCase().includes(targetName.toLowerCase())) {
          dependencies.push({
            confidence: RELATIONSHIP_STRENGTH.HIGH,
            evidence: [{
              type: 'structural_reference',
              description: `Dependency: "${match[0]}"`,
              location: `Position ${match.index}`,
              score: RELATIONSHIP_STRENGTH.HIGH
            }]
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Helper methods
   */
  extractContent(deliverable) {
    return deliverable.content || 
           deliverable.rawContent || 
           (deliverable.analysis && deliverable.analysis.content) ||
           JSON.stringify(deliverable.data || deliverable);
  }

  getDeliverableName(deliverable) {
    return deliverable.name || 
           deliverable.deliverable || 
           deliverable.id || 
           'unknown';
  }

  isSameDeliverable(source, target) {
    return source.name === target.name && 
           source.phase === target.phase;
  }

  isFileMatch(referencedFile, targetPath) {
    if (!targetPath) return false;
    return targetPath.toLowerCase().includes(referencedFile.toLowerCase()) ||
           referencedFile.toLowerCase().includes(targetPath.toLowerCase());
  }

  generateSearchTerms(targetName, targetDeliverable) {
    const terms = [targetName];
    
    // Add variations
    terms.push(targetName.replace(/[_-]/g, ' '));
    terms.push(targetName.replace(/\s+/g, '_'));
    terms.push(targetName.replace(/\s+/g, '-'));
    
    // Add type-specific terms
    if (targetDeliverable.type) {
      terms.push(targetDeliverable.type);
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  createRelationship(source, target, type, confidence, evidence, detectionMethod) {
    return {
      id: `${source.phase}_${source.name}_${target.phase}_${target.name}_${type}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      source: {
        phase: source.phase,
        name: source.name,
        type: source.type,
        path: source.path
      },
      target: {
        phase: target.phase,
        name: target.name,
        type: target.type,
        path: target.path
      },
      type,
      strength: confidence,
      confidence,
      evidence,
      metadata: {
        detectedBy: this.name,
        detectedAt: new Date().toISOString(),
        detectionMethod,
        validationStatus: 'pending'
      }
    };
  }

  /**
   * Interface implementation methods
   */
  getDetectorInfo() {
    return validateDetectorInfo({
      name: this.name,
      version: this.version,
      type: this.type,
      capabilities: [
        'file_references',
        'phase_references', 
        'explicit_mentions',
        'cross_references',
        'dependencies'
      ],
      supportedTypes: [
        RELATIONSHIP_TYPES.REFERENCES,
        RELATIONSHIP_TYPES.MENTIONS,
        RELATIONSHIP_TYPES.DEPENDS_ON
      ],
      priority: this.priority,
      performance: {
        averageTime: 50, // milliseconds
        accuracy: 0.85
      },
      configuration: this.config
    });
  }

  isAvailable() {
    return true; // Structural detection is always available
  }

  getPriority() {
    return this.priority;
  }
}
