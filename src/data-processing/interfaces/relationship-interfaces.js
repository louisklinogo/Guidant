/**
 * Interface definitions for Cross-Phase Relationship Tracking System
 * Following Interface Segregation Principle (ISP) - focused, specific interfaces
 */

/**
 * Interface for relationship detection algorithms
 * Single responsibility: Detect relationships between deliverables
 */
export class IRelationshipDetector {
  /**
   * Detect relationships between deliverables
   * @param {object} sourceDeliverable - Source deliverable analysis
   * @param {object[]} targetDeliverables - Target deliverables to check against
   * @param {object} options - Detection options
   * @returns {Promise<object[]>} Array of detected relationships
   */
  async detectRelationships(sourceDeliverable, targetDeliverables, options = {}) {
    throw new Error('IRelationshipDetector.detectRelationships() must be implemented');
  }

  /**
   * Get detector name and capabilities
   * @returns {object} Detector metadata
   */
  getDetectorInfo() {
    throw new Error('IRelationshipDetector.getDetectorInfo() must be implemented');
  }

  /**
   * Check if detector is available and configured
   * @returns {boolean} Availability status
   */
  isAvailable() {
    throw new Error('IRelationshipDetector.isAvailable() must be implemented');
  }

  /**
   * Get detector priority (higher = more important)
   * @returns {number} Priority score
   */
  getPriority() {
    throw new Error('IRelationshipDetector.getPriority() must be implemented');
  }
}

/**
 * Interface for relationship storage and retrieval
 * Single responsibility: Store and retrieve relationship data
 */
export class IRelationshipStorage {
  /**
   * Store relationship data
   * @param {string} projectRoot - Project root directory
   * @param {object} relationshipData - Relationship data to store
   * @returns {Promise<boolean>} Success status
   */
  async storeRelationships(projectRoot, relationshipData) {
    throw new Error('IRelationshipStorage.storeRelationships() must be implemented');
  }

  /**
   * Retrieve relationships for a deliverable
   * @param {string} projectRoot - Project root directory
   * @param {string} deliverableId - Deliverable identifier
   * @param {object} options - Query options
   * @returns {Promise<object[]>} Array of relationships
   */
  async getRelationships(projectRoot, deliverableId, options = {}) {
    throw new Error('IRelationshipStorage.getRelationships() must be implemented');
  }

  /**
   * Retrieve all relationships in project
   * @param {string} projectRoot - Project root directory
   * @param {object} options - Query options
   * @returns {Promise<object>} Complete relationship graph
   */
  async getAllRelationships(projectRoot, options = {}) {
    throw new Error('IRelationshipStorage.getAllRelationships() must be implemented');
  }

  /**
   * Update existing relationship
   * @param {string} projectRoot - Project root directory
   * @param {string} relationshipId - Relationship identifier
   * @param {object} updateData - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateRelationship(projectRoot, relationshipId, updateData) {
    throw new Error('IRelationshipStorage.updateRelationship() must be implemented');
  }

  /**
   * Delete relationship
   * @param {string} projectRoot - Project root directory
   * @param {string} relationshipId - Relationship identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteRelationship(projectRoot, relationshipId) {
    throw new Error('IRelationshipStorage.deleteRelationship() must be implemented');
  }

  /**
   * Check storage health and availability
   * @returns {Promise<object>} Health status
   */
  async getStorageHealth() {
    throw new Error('IRelationshipStorage.getStorageHealth() must be implemented');
  }
}

/**
 * Interface for impact analysis
 * Single responsibility: Analyze impact of changes on related deliverables
 */
export class IImpactAnalyzer {
  /**
   * Analyze impact of changes to a deliverable
   * @param {string} projectRoot - Project root directory
   * @param {string} deliverableId - Changed deliverable
   * @param {object} changeData - Description of changes
   * @param {object} relationshipGraph - Current relationship graph
   * @returns {Promise<object>} Impact analysis results
   */
  async analyzeImpact(projectRoot, deliverableId, changeData, relationshipGraph) {
    throw new Error('IImpactAnalyzer.analyzeImpact() must be implemented');
  }

  /**
   * Get impact propagation paths
   * @param {object} relationshipGraph - Relationship graph
   * @param {string} sourceDeliverable - Starting point
   * @param {number} maxDepth - Maximum traversal depth
   * @returns {Promise<object[]>} Impact propagation paths
   */
  async getImpactPaths(relationshipGraph, sourceDeliverable, maxDepth = 5) {
    throw new Error('IImpactAnalyzer.getImpactPaths() must be implemented');
  }

  /**
   * Calculate impact severity scores
   * @param {object[]} impactPaths - Impact propagation paths
   * @param {object} changeData - Change description
   * @returns {Promise<object>} Impact severity analysis
   */
  async calculateImpactSeverity(impactPaths, changeData) {
    throw new Error('IImpactAnalyzer.calculateImpactSeverity() must be implemented');
  }

  /**
   * Get analyzer capabilities and configuration
   * @returns {object} Analyzer metadata
   */
  getAnalyzerInfo() {
    throw new Error('IImpactAnalyzer.getAnalyzerInfo() must be implemented');
  }
}

/**
 * Interface for relationship context providers
 * Single responsibility: Provide context for relationship detection
 */
export class IRelationshipContextProvider {
  /**
   * Get context for relationship detection
   * @param {string} projectRoot - Project root directory
   * @param {string} phase - Current phase
   * @param {object} options - Context options
   * @returns {Promise<object>} Relationship context
   */
  async getRelationshipContext(projectRoot, phase, options = {}) {
    throw new Error('IRelationshipContextProvider.getRelationshipContext() must be implemented');
  }

  /**
   * Get historical relationship patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<object[]>} Historical patterns
   */
  async getHistoricalPatterns(projectRoot) {
    throw new Error('IRelationshipContextProvider.getHistoricalPatterns() must be implemented');
  }

  /**
   * Check if context provider is available
   * @returns {boolean} Availability status
   */
  isAvailable() {
    throw new Error('IRelationshipContextProvider.isAvailable() must be implemented');
  }
}

/**
 * Standard relationship types used across the system
 */
export const RELATIONSHIP_TYPES = {
  // Direct content references
  REFERENCES: 'references',
  MENTIONS: 'mentions',
  QUOTES: 'quotes',
  
  // Logical dependencies
  DEPENDS_ON: 'depends_on',
  INFLUENCES: 'influences',
  DERIVES_FROM: 'derives_from',
  
  // Structural relationships
  PART_OF: 'part_of',
  CONTAINS: 'contains',
  EXTENDS: 'extends',
  
  // Temporal relationships
  PRECEDES: 'precedes',
  FOLLOWS: 'follows',
  CONCURRENT: 'concurrent',
  
  // Quality relationships
  VALIDATES: 'validates',
  CONFLICTS_WITH: 'conflicts_with',
  SUPPORTS: 'supports'
};

/**
 * Standard relationship strength levels
 */
export const RELATIONSHIP_STRENGTH = {
  WEAK: 0.1,
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
  STRONG: 0.9
};

/**
 * Standard impact severity levels
 */
export const IMPACT_SEVERITY = {
  MINIMAL: 'minimal',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};
