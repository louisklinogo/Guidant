/**
 * JSON-based Relationship Storage Implementation
 * Stores and retrieves relationship data using JSON files
 * Following Single Responsibility Principle (SRP)
 */

import fs from 'fs/promises';
import path from 'path';
import { IRelationshipStorage } from '../interfaces/relationship-interfaces.js';
import { 
  validateRelationshipGraph, 
  validateQueryOptions, 
  validateStorageHealth 
} from '../schemas/relationship-schemas.js';
import { 
  writeJSONFile, 
  readJSONFile, 
  updateJSONFile,
  withFileLock 
} from '../../file-management/reliable-file-manager.js';

export class JSONRelationshipStorage extends IRelationshipStorage {
  constructor(options = {}) {
    super();
    this.name = 'JSONRelationshipStorage';
    this.version = '1.0.0';
    
    // Configuration
    this.config = {
      relationshipsFile: options.relationshipsFile || '.guidant/data-processing/relationships.json',
      backupEnabled: options.backupEnabled !== false,
      backupRetention: options.backupRetention || 5,
      compressionEnabled: options.compressionEnabled || false,
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 15 * 60 * 1000, // 15 minutes
      ...options
    };

    // In-memory cache
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Store relationship data
   */
  async storeRelationships(projectRoot, relationshipData) {
    try {
      const filePath = path.join(projectRoot, this.config.relationshipsFile);
      
      // Validate the relationship data
      const validatedData = validateRelationshipGraph(relationshipData);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createBackup(filePath);
      }

      // Store with file locking
      await withFileLock(filePath, async () => {
        await writeJSONFile(filePath, validatedData);
      });

      // Update cache
      if (this.config.cacheEnabled) {
        this.updateCache(projectRoot, validatedData);
      }

      console.log(`✅ Stored ${validatedData.relationships.length} relationships`);
      return true;

    } catch (error) {
      console.error('Error storing relationships:', error);
      return false;
    }
  }

  /**
   * Retrieve relationships for a deliverable
   */
  async getRelationships(projectRoot, deliverableId, options = {}) {
    try {
      const validatedOptions = validateQueryOptions(options);
      const allRelationships = await this.getAllRelationships(projectRoot);
      
      if (!allRelationships || !allRelationships.relationships) {
        return [];
      }

      // Filter relationships for the specific deliverable
      let filteredRelationships = allRelationships.relationships.filter(rel => {
        const sourceMatch = this.matchesDeliverable(rel.source, deliverableId);
        const targetMatch = this.matchesDeliverable(rel.target, deliverableId);
        return sourceMatch || targetMatch;
      });

      // Apply additional filters
      filteredRelationships = this.applyQueryFilters(filteredRelationships, validatedOptions);

      return filteredRelationships;

    } catch (error) {
      console.error('Error retrieving relationships:', error);
      return [];
    }
  }

  /**
   * Retrieve all relationships in project
   */
  async getAllRelationships(projectRoot, options = {}) {
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache(projectRoot);
        if (cached) {
          return cached;
        }
      }

      const filePath = path.join(projectRoot, this.config.relationshipsFile);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, return empty structure
        return this.createEmptyRelationshipGraph(projectRoot);
      }

      // Read with file locking
      let relationshipData;
      await withFileLock(filePath, async () => {
        relationshipData = await readJSONFile(filePath);
      });

      // Validate the data
      const validatedData = validateRelationshipGraph(relationshipData);

      // Update cache
      if (this.config.cacheEnabled) {
        this.updateCache(projectRoot, validatedData);
      }

      return validatedData;

    } catch (error) {
      console.error('Error retrieving all relationships:', error);
      return this.createEmptyRelationshipGraph(projectRoot);
    }
  }

  /**
   * Update existing relationship
   */
  async updateRelationship(projectRoot, relationshipId, updateData) {
    try {
      const filePath = path.join(projectRoot, this.config.relationshipsFile);
      
      // Update with file locking
      let success = false;
      await withFileLock(filePath, async () => {
        const currentData = await readJSONFile(filePath);
        const relationshipIndex = currentData.relationships.findIndex(
          rel => rel.id === relationshipId
        );

        if (relationshipIndex === -1) {
          throw new Error(`Relationship ${relationshipId} not found`);
        }

        // Update the relationship
        currentData.relationships[relationshipIndex] = {
          ...currentData.relationships[relationshipIndex],
          ...updateData,
          metadata: {
            ...currentData.relationships[relationshipIndex].metadata,
            lastUpdated: new Date().toISOString()
          }
        };

        // Update graph metadata
        currentData.lastUpdated = new Date().toISOString();
        currentData.statistics = this.calculateStatistics(currentData.relationships);

        // Validate and save
        const validatedData = validateRelationshipGraph(currentData);
        await writeJSONFile(filePath, validatedData);
        
        success = true;
      });

      // Clear cache
      if (this.config.cacheEnabled) {
        this.clearCache(projectRoot);
      }

      return success;

    } catch (error) {
      console.error('Error updating relationship:', error);
      return false;
    }
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(projectRoot, relationshipId) {
    try {
      const filePath = path.join(projectRoot, this.config.relationshipsFile);
      
      let success = false;
      await withFileLock(filePath, async () => {
        const currentData = await readJSONFile(filePath);
        const initialCount = currentData.relationships.length;
        
        // Filter out the relationship to delete
        currentData.relationships = currentData.relationships.filter(
          rel => rel.id !== relationshipId
        );

        if (currentData.relationships.length === initialCount) {
          throw new Error(`Relationship ${relationshipId} not found`);
        }

        // Update graph metadata
        currentData.lastUpdated = new Date().toISOString();
        currentData.statistics = this.calculateStatistics(currentData.relationships);

        // Validate and save
        const validatedData = validateRelationshipGraph(currentData);
        await writeJSONFile(filePath, validatedData);
        
        success = true;
      });

      // Clear cache
      if (this.config.cacheEnabled) {
        this.clearCache(projectRoot);
      }

      return success;

    } catch (error) {
      console.error('Error deleting relationship:', error);
      return false;
    }
  }

  /**
   * Check storage health and availability
   */
  async getStorageHealth() {
    try {
      const health = {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        metrics: {
          totalRelationships: 0,
          storageSize: 0,
          corruptedRecords: 0
        },
        issues: []
      };

      // Check if we can write to the storage directory
      try {
        const testDir = path.join(process.cwd(), '.guidant/data-processing');
        await fs.mkdir(testDir, { recursive: true });
        
        const testFile = path.join(testDir, 'health-check.json');
        await fs.writeFile(testFile, JSON.stringify({ test: true }));
        await fs.unlink(testFile);
      } catch (error) {
        health.status = 'unhealthy';
        health.issues.push({
          type: 'access',
          severity: 'critical',
          description: 'Cannot write to storage directory',
          recommendation: 'Check file permissions'
        });
      }

      return validateStorageHealth(health);

    } catch (error) {
      return validateStorageHealth({
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        metrics: { totalRelationships: 0, storageSize: 0, corruptedRecords: 0 },
        issues: [{
          type: 'corruption',
          severity: 'critical',
          description: error.message,
          recommendation: 'Check storage configuration'
        }]
      });
    }
  }

  /**
   * Helper methods
   */
  matchesDeliverable(deliverableRef, deliverableId) {
    if (typeof deliverableId === 'string') {
      return deliverableRef.name === deliverableId || 
             deliverableRef.id === deliverableId ||
             `${deliverableRef.phase}_${deliverableRef.name}` === deliverableId;
    }
    
    if (typeof deliverableId === 'object') {
      return deliverableRef.phase === deliverableId.phase && 
             deliverableRef.name === deliverableId.name;
    }
    
    return false;
  }

  applyQueryFilters(relationships, options) {
    let filtered = relationships;

    // Filter by relationship types
    if (options.relationshipTypes && options.relationshipTypes.length > 0) {
      filtered = filtered.filter(rel => options.relationshipTypes.includes(rel.type));
    }

    // Filter by minimum strength
    if (options.minStrength !== undefined) {
      filtered = filtered.filter(rel => rel.strength >= options.minStrength);
    }

    // Sort relationships
    filtered.sort((a, b) => {
      const aVal = a[options.sortBy] || 0;
      const bVal = b[options.sortBy] || 0;
      
      if (options.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
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

  async createBackup(filePath) {
    try {
      const backupDir = path.join(path.dirname(filePath), 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `relationships-${timestamp}.json`);
      
      await fs.copyFile(filePath, backupPath);
      
      // Clean old backups
      await this.cleanOldBackups(backupDir);
    } catch (error) {
      console.warn('Failed to create backup:', error.message);
    }
  }

  async cleanOldBackups(backupDir) {
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('relationships-') && f.endsWith('.json'))
        .map(f => ({ name: f, path: path.join(backupDir, f) }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort by name (timestamp) descending

      // Keep only the configured number of backups
      if (backupFiles.length > this.config.backupRetention) {
        const filesToDelete = backupFiles.slice(this.config.backupRetention);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.warn('Failed to clean old backups:', error.message);
    }
  }

  // Cache management methods
  updateCache(projectRoot, data) {
    this.cache.set(projectRoot, data);
    this.cacheTimestamps.set(projectRoot, Date.now());
  }

  getFromCache(projectRoot) {
    const timestamp = this.cacheTimestamps.get(projectRoot);
    if (!timestamp || Date.now() - timestamp > this.config.cacheTTL) {
      this.clearCache(projectRoot);
      return null;
    }
    return this.cache.get(projectRoot);
  }

  clearCache(projectRoot) {
    this.cache.delete(projectRoot);
    this.cacheTimestamps.delete(projectRoot);
  }
}
