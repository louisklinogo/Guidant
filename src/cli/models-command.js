#!/usr/bin/env node

/**
 * Guidant Models CLI Command
 * Provides command-line interface for model registry management
 */

import { modelRegistryUpdater } from '../config/model-registry-updater.js';
import { modelConfig } from '../config/models.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Display help information
 */
function showHelp() {
  console.log(`
🤖 Guidant Models CLI

USAGE:
  guidant models <command> [options]

COMMANDS:
  list                    List all available models
  stats                   Show model registry statistics
  validate                Validate current model registry
  update <source>         Update model registry from source
  backup                  Create backup of current registry
  restore                 Restore from backup
  check                   Check for available updates
  roles <role>            List models available for specific role
  providers               List all providers and their status

EXAMPLES:
  guidant models list
  guidant models stats
  guidant models roles analysis
  guidant models update taskmaster
  guidant models validate

OPTIONS:
  --help, -h              Show this help message
  --verbose, -v           Show detailed output
  --format <format>       Output format (table, json, yaml)
`);
}

/**
 * List all available models
 * @param {Object} options - Command options
 */
function listModels(options = {}) {
  console.log('📋 Available Models\n');
  
  const models = modelConfig.getAvailableModels();
  
  if (options.format === 'json') {
    console.log(JSON.stringify(models, null, 2));
    return;
  }

  // Group by provider
  const byProvider = {};
  models.forEach(model => {
    if (!byProvider[model.provider]) {
      byProvider[model.provider] = [];
    }
    byProvider[model.provider].push(model);
  });

  Object.entries(byProvider).forEach(([provider, providerModels]) => {
    console.log(`\n🔧 ${provider.toUpperCase()}`);
    console.log('─'.repeat(50));
    
    providerModels.forEach(model => {
      const apiStatus = model.hasApiKey ? '✅' : '❌';
      const sweScore = model.swe_score ? `SWE: ${model.swe_score}` : 'SWE: N/A';
      const roles = model.allowed_roles.join(', ');
      
      console.log(`${apiStatus} ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   ${sweScore} | Roles: ${roles}`);
      
      if (model.cost_per_1m_tokens) {
        const cost = model.cost_per_1m_tokens;
        console.log(`   Cost: $${cost.input}/$${cost.output} per 1M tokens`);
      }
      console.log();
    });
  });

  console.log(`\n📊 Total: ${models.length} models across ${Object.keys(byProvider).length} providers`);
}

/**
 * Show model registry statistics
 */
function showStats() {
  console.log('📊 Model Registry Statistics\n');
  
  const stats = modelRegistryUpdater.getRegistryStats();
  if (!stats) {
    console.error('❌ Failed to get registry statistics');
    return;
  }

  console.log(`Version: ${stats.version}`);
  console.log(`Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
  console.log(`Total Models: ${stats.totalModels}`);
  console.log(`Providers: ${stats.providers}`);
  
  console.log('\n🔧 Models by Provider:');
  Object.entries(stats.modelsByProvider).forEach(([provider, count]) => {
    console.log(`  ${provider}: ${count} models`);
  });
  
  console.log('\n🎯 Models by Role:');
  Object.entries(stats.roleDistribution).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} models`);
  });
}

/**
 * Validate model registry
 */
function validateRegistry() {
  console.log('✅ Validating Model Registry\n');
  
  try {
    const registryPath = path.join(__dirname, '../config/supported-models.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    
    const validation = modelRegistryUpdater.validateRegistry(registry);
    
    if (validation.valid) {
      console.log('✅ Registry validation passed');
      console.log(`   Models: ${validation.modelCount}`);
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`   ${warning}`));
      }
    } else {
      console.log('❌ Registry validation failed');
      console.log('\nErrors:');
      validation.errors.forEach(error => console.log(`   ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Failed to validate registry:', error.message);
  }
}

/**
 * List models for specific role
 * @param {string} role - Role to filter by
 */
function listModelsForRole(role) {
  console.log(`🎯 Models Available for Role: ${role}\n`);
  
  const models = modelConfig.getAvailableModelsForRole(role);
  
  if (models.length === 0) {
    console.log(`❌ No models found for role '${role}'`);
    console.log('\nAvailable roles: main, analysis, research, generation, fallback');
    return;
  }

  models.forEach(model => {
    const apiStatus = model.hasApiKey ? '✅' : '❌';
    const sweScore = model.swe_score ? `SWE: ${model.swe_score}` : 'SWE: N/A';
    
    console.log(`${apiStatus} ${model.name} (${model.provider})`);
    console.log(`   ID: ${model.id}`);
    console.log(`   ${sweScore}`);
    
    if (model.cost_per_1m_tokens) {
      const cost = model.cost_per_1m_tokens;
      console.log(`   Cost: $${cost.input}/$${cost.output} per 1M tokens`);
    }
    console.log();
  });

  console.log(`📊 Total: ${models.length} models available for '${role}' role`);
}

/**
 * List providers and their status
 */
function listProviders() {
  console.log('🔧 AI Providers Status\n');
  
  const providers = Object.entries(modelConfig.providers);
  
  providers.forEach(([key, provider]) => {
    const hasApiKey = modelConfig.isApiKeySet(key);
    const status = hasApiKey ? '✅ Configured' : '❌ Not configured';
    
    console.log(`${status} ${provider.name}`);
    console.log(`   Key: ${key}`);
    console.log(`   Environment: ${provider.apiKeyEnv}`);
    console.log(`   Base URL: ${provider.baseUrl}`);
    console.log(`   Description: ${provider.description}`);
    console.log();
  });
}

/**
 * Update model registry from source
 * @param {string} source - Source to update from
 */
async function updateRegistry(source) {
  console.log(`🔄 Updating model registry from ${source}...\n`);
  
  if (source === 'taskmaster') {
    try {
      // Load TaskMaster's model registry
      const taskMasterPath = path.join(__dirname, '../../legacy-context/scripts/modules/supported-models.json');
      
      if (!fs.existsSync(taskMasterPath)) {
        console.error('❌ TaskMaster model registry not found');
        console.log('   Expected location:', taskMasterPath);
        return;
      }
      
      const taskMasterRegistry = JSON.parse(fs.readFileSync(taskMasterPath, 'utf-8'));
      
      const result = await modelRegistryUpdater.updateRegistry('taskmaster', taskMasterRegistry);
      
      if (result.success) {
        console.log('✅ Successfully updated from TaskMaster registry');
        console.log(`   Version: ${result.version.version}`);
        console.log(`   Models: ${result.modelCount}`);
      } else {
        console.error('❌ Failed to update registry:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to update from TaskMaster:', error.message);
    }
  } else {
    console.error(`❌ Unknown source: ${source}`);
    console.log('Available sources: taskmaster');
  }
}

/**
 * Main CLI handler
 * @param {Array} args - Command line arguments
 */
export async function handleModelsCommand(args) {
  const command = args[0];
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    format: args.includes('--format') ? args[args.indexOf('--format') + 1] : 'table'
  };

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  switch (command) {
    case 'list':
      listModels(options);
      break;
      
    case 'stats':
      showStats();
      break;
      
    case 'validate':
      validateRegistry();
      break;
      
    case 'update':
      const source = args[1];
      if (!source) {
        console.error('❌ Please specify a source for update');
        console.log('Example: guidant models update taskmaster');
        return;
      }
      await updateRegistry(source);
      break;
      
    case 'backup':
      if (modelRegistryUpdater.createBackup()) {
        console.log('✅ Backup created successfully');
      } else {
        console.error('❌ Failed to create backup');
      }
      break;
      
    case 'restore':
      if (modelRegistryUpdater.restoreFromBackup()) {
        console.log('✅ Registry restored from backup');
      } else {
        console.error('❌ Failed to restore from backup');
      }
      break;
      
    case 'check':
      const hasUpdates = await modelRegistryUpdater.checkForUpdates();
      if (hasUpdates) {
        console.log('🔄 Updates available');
      } else {
        console.log('✅ Registry is up to date');
      }
      break;
      
    case 'roles':
      const role = args[1];
      if (!role) {
        console.error('❌ Please specify a role');
        console.log('Example: guidant models roles analysis');
        return;
      }
      listModelsForRole(role);
      break;
      
    case 'providers':
      listProviders();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  handleModelsCommand(args);
}
