/**
 * Model Registry Auto-Update System for Guidant
 * Provides mechanisms to keep the model database current with the rapidly evolving AI landscape
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Model Registry Updater Class
 * Handles automatic updates of the supported models database
 */
export class ModelRegistryUpdater {
  constructor() {
    this.registryPath = path.join(__dirname, 'supported-models.json');
    this.versionPath = path.join(__dirname, 'model-registry-version.json');
    this.backupPath = path.join(__dirname, 'supported-models.backup.json');
  }

  /**
   * Get current registry version information
   * @returns {Object} Version information
   */
  getCurrentVersion() {
    try {
      if (fs.existsSync(this.versionPath)) {
        const versionData = fs.readFileSync(this.versionPath, 'utf-8');
        return JSON.parse(versionData);
      }
    } catch (error) {
      console.warn('Could not read version file:', error.message);
    }

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      source: 'initial',
      modelCount: 0
    };
  }

  /**
   * Update version information
   * @param {Object} versionInfo - Version information to save
   */
  updateVersion(versionInfo) {
    try {
      fs.writeFileSync(this.versionPath, JSON.stringify(versionInfo, null, 2));
    } catch (error) {
      console.error('Failed to update version file:', error.message);
    }
  }

  /**
   * Create backup of current model registry
   * @returns {boolean} Success status
   */
  createBackup() {
    try {
      if (fs.existsSync(this.registryPath)) {
        fs.copyFileSync(this.registryPath, this.backupPath);
        console.log('✅ Model registry backup created');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
    }
    return false;
  }

  /**
   * Restore from backup
   * @returns {boolean} Success status
   */
  restoreFromBackup() {
    try {
      if (fs.existsSync(this.backupPath)) {
        fs.copyFileSync(this.backupPath, this.registryPath);
        console.log('✅ Model registry restored from backup');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error.message);
    }
    return false;
  }

  /**
   * Validate model registry structure
   * @param {Object} registry - Model registry to validate
   * @returns {Object} Validation result
   */
  validateRegistry(registry) {
    const errors = [];
    const warnings = [];
    let modelCount = 0;

    if (!registry || typeof registry !== 'object') {
      errors.push('Registry must be an object');
      return { valid: false, errors, warnings, modelCount };
    }

    // Validate each provider
    Object.entries(registry).forEach(([provider, models]) => {
      if (!Array.isArray(models)) {
        errors.push(`Provider '${provider}' must have an array of models`);
        return;
      }

      models.forEach((model, index) => {
        modelCount++;
        const modelPath = `${provider}[${index}]`;

        // Required fields
        if (!model.id) {
          errors.push(`${modelPath}: Missing required field 'id'`);
        }

        // Validate allowed_roles
        if (model.allowed_roles && !Array.isArray(model.allowed_roles)) {
          errors.push(`${modelPath}: 'allowed_roles' must be an array`);
        }

        // Validate cost structure
        if (model.cost_per_1m_tokens && typeof model.cost_per_1m_tokens !== 'object') {
          errors.push(`${modelPath}: 'cost_per_1m_tokens' must be an object`);
        }

        // Validate SWE score
        if (model.swe_score !== null && model.swe_score !== undefined) {
          if (typeof model.swe_score !== 'number' || model.swe_score < 0 || model.swe_score > 1) {
            warnings.push(`${modelPath}: 'swe_score' should be a number between 0 and 1`);
          }
        }

        // Validate max_tokens
        if (model.max_tokens && (typeof model.max_tokens !== 'number' || model.max_tokens <= 0)) {
          warnings.push(`${modelPath}: 'max_tokens' should be a positive number`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      modelCount
    };
  }

  /**
   * Enhance registry with Guidant-specific role mappings
   * @param {Object} registry - Model registry to enhance
   * @returns {Object} Enhanced registry
   */
  enhanceWithGuidantRoles(registry) {
    const enhanced = JSON.parse(JSON.stringify(registry)); // Deep clone

    Object.entries(enhanced).forEach(([provider, models]) => {
      models.forEach(model => {
        if (!model.allowed_roles) {
          // Default role assignment based on model characteristics
          model.allowed_roles = ['main', 'fallback'];
        }

        // Enhance with Guidant-specific roles
        const originalRoles = [...model.allowed_roles];
        
        // Add analysis role for high-performing models
        if (model.swe_score && model.swe_score > 0.3 && !originalRoles.includes('analysis')) {
          model.allowed_roles.push('analysis');
        }

        // Add generation role for creative models or those with high temperature tolerance
        if (!originalRoles.includes('generation') && 
            (model.id.includes('creative') || model.id.includes('instruct') || originalRoles.includes('main'))) {
          model.allowed_roles.push('generation');
        }

        // Ensure research models keep research role
        if (originalRoles.includes('research') && !model.allowed_roles.includes('research')) {
          model.allowed_roles.push('research');
        }

        // Add name if missing
        if (!model.name) {
          model.name = this.generateModelName(model.id);
        }
      });
    });

    return enhanced;
  }

  /**
   * Generate human-readable model name from ID
   * @param {string} modelId - Model ID
   * @returns {string} Human-readable name
   */
  generateModelName(modelId) {
    // Handle provider prefixes
    const cleanId = modelId.replace(/^(openai\/|anthropic\/|google\/|meta-llama\/|mistralai\/|qwen\/|deepseek\/|thudm\/)/, '');
    
    // Convert to title case and handle common patterns
    return cleanId
      .split(/[-_:]/)
      .map(part => {
        // Handle special cases
        if (part === 'gpt') return 'GPT';
        if (part === 'claude') return 'Claude';
        if (part === 'gemini') return 'Gemini';
        if (part === 'llama') return 'Llama';
        if (part === 'qwen') return 'Qwen';
        if (part === 'mistral') return 'Mistral';
        if (part === 'sonar') return 'Sonar';
        if (part === 'grok') return 'Grok';
        if (part.match(/^\d/)) return part; // Keep version numbers as-is
        
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  /**
   * Update model registry from external source
   * @param {string} source - Source identifier
   * @param {Object} newRegistry - New registry data
   * @returns {Promise<Object>} Update result
   */
  async updateRegistry(source, newRegistry) {
    console.log(`🔄 Updating model registry from ${source}...`);

    // Create backup
    if (!this.createBackup()) {
      return { success: false, error: 'Failed to create backup' };
    }

    try {
      // Validate new registry
      const validation = this.validateRegistry(newRegistry);
      if (!validation.valid) {
        console.error('❌ Registry validation failed:', validation.errors);
        return { success: false, error: 'Validation failed', details: validation };
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️  Registry warnings:', validation.warnings);
      }

      // Enhance with Guidant-specific features
      const enhancedRegistry = this.enhanceWithGuidantRoles(newRegistry);

      // Write updated registry
      fs.writeFileSync(this.registryPath, JSON.stringify(enhancedRegistry, null, 2));

      // Update version info
      const currentVersion = this.getCurrentVersion();
      const newVersion = {
        version: this.incrementVersion(currentVersion.version),
        lastUpdated: new Date().toISOString(),
        source,
        modelCount: validation.modelCount,
        previousVersion: currentVersion.version
      };
      this.updateVersion(newVersion);

      console.log(`✅ Model registry updated successfully`);
      console.log(`   Models: ${validation.modelCount}`);
      console.log(`   Version: ${newVersion.version}`);
      console.log(`   Source: ${source}`);

      return {
        success: true,
        version: newVersion,
        validation,
        modelCount: validation.modelCount
      };

    } catch (error) {
      console.error('❌ Failed to update registry:', error.message);
      
      // Restore from backup on failure
      this.restoreFromBackup();
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment version number
   * @param {string} version - Current version
   * @returns {string} New version
   */
  incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1; // Increment patch version
    return parts.join('.');
  }

  /**
   * Check if update is needed (placeholder for future implementation)
   * @returns {Promise<boolean>} Whether update is needed
   */
  async checkForUpdates() {
    // Future implementation could check:
    // - Remote registry versions
    // - Last update timestamp
    // - Model availability changes
    console.log('🔍 Checking for model registry updates...');
    console.log('ℹ️  Automatic update checking not yet implemented');
    return false;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getRegistryStats() {
    try {
      const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
      const version = this.getCurrentVersion();
      
      const stats = {
        version: version.version,
        lastUpdated: version.lastUpdated,
        providers: Object.keys(registry).length,
        totalModels: 0,
        modelsByProvider: {},
        roleDistribution: {}
      };

      Object.entries(registry).forEach(([provider, models]) => {
        stats.totalModels += models.length;
        stats.modelsByProvider[provider] = models.length;

        models.forEach(model => {
          if (model.allowed_roles) {
            model.allowed_roles.forEach(role => {
              stats.roleDistribution[role] = (stats.roleDistribution[role] || 0) + 1;
            });
          }
        });
      });

      return stats;
    } catch (error) {
      console.error('Failed to get registry stats:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export const modelRegistryUpdater = new ModelRegistryUpdater();
