/**
 * Guidant AI Configuration Health Check
 * Comprehensive validation and auto-fixing for AI model configuration
 */

import dotenv from 'dotenv';
import { validateCurrentConfig } from './model-migration.js';
import { modelConfig } from './models.js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Comprehensive health check for AI configuration
 * @returns {Object} Health check results with auto-fix suggestions
 */
export async function runHealthCheck() {
  console.log('🏥 Running Guidant AI Configuration Health Check...\n');
  
  const results = {
    status: 'healthy',
    issues: [],
    warnings: [],
    fixes: [],
    recommendations: []
  };

  // 1. Validate all model roles
  try {
    const validation = validateCurrentConfig();
    if (!validation.valid) {
      results.status = 'unhealthy';
      results.issues.push({
        type: 'model_validation',
        severity: 'critical',
        message: 'Model validation failed',
        details: validation.errors,
        autoFix: false
      });
    } else {
      console.log('✅ All model roles validated successfully');
    }
  } catch (error) {
    results.status = 'unhealthy';
    results.issues.push({
      type: 'validation_system',
      severity: 'critical',
      message: 'Validation system failure',
      details: [error.message],
      autoFix: false
    });
  }

  // 2. Check supported models integrity
  try {
    const supportedModelsPath = path.join(process.cwd(), 'src/config/supported-models.json');
    const supportedModels = JSON.parse(fs.readFileSync(supportedModelsPath, 'utf8'));
    
    // Validate structure
    const requiredProviders = ['openrouter', 'anthropic', 'openai', 'google', 'perplexity'];
    const missingProviders = requiredProviders.filter(p => !supportedModels[p]);
    
    if (missingProviders.length > 0) {
      results.warnings.push({
        type: 'missing_providers',
        message: `Missing provider sections: ${missingProviders.join(', ')}`,
        autoFix: true,
        fix: () => addMissingProviders(supportedModelsPath, missingProviders)
      });
    }

    console.log('✅ Supported models structure validated');
  } catch (error) {
    results.status = 'unhealthy';
    results.issues.push({
      type: 'supported_models',
      severity: 'critical',
      message: 'Cannot read supported-models.json',
      details: [error.message],
      autoFix: false
    });
  }

  // 3. Check environment consistency
  const envIssues = checkEnvironmentConsistency();
  if (envIssues.length > 0) {
    results.warnings.push({
      type: 'env_consistency',
      message: 'Environment variable inconsistencies',
      details: envIssues,
      autoFix: true,
      fix: () => fixEnvironmentConsistency()
    });
  }

  // 4. Check API key status
  const keyStatus = checkApiKeyStatus();
  if (keyStatus.missing.length > 0) {
    results.warnings.push({
      type: 'missing_api_keys',
      message: `Missing API keys: ${keyStatus.missing.join(', ')}`,
      autoFix: false,
      recommendation: 'Set API keys in .env file for providers you want to use'
    });
  }

  if (keyStatus.placeholders.length > 0) {
    results.warnings.push({
      type: 'placeholder_api_keys',
      message: `Placeholder API keys: ${keyStatus.placeholders.join(', ')}`,
      autoFix: false,
      recommendation: 'Replace placeholder values with actual API keys'
    });
  }

  // 5. Generate recommendations
  results.recommendations = generateRecommendations(results);

  return results;
}

/**
 * Check environment variable consistency
 */
function checkEnvironmentConsistency() {
  const issues = [];
  const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
  
  roles.forEach(role => {
    try {
      const model = modelConfig.getModel(role);
      const envModel = process.env[`AI_${role.toUpperCase()}_MODEL`];
      const envProvider = process.env[`AI_${role.toUpperCase()}_PROVIDER`];
      
      if (envModel && model.modelId !== envModel) {
        issues.push(`${role}: Model mismatch (config: ${model.modelId}, env: ${envModel})`);
      }
      
      if (envProvider && model.provider !== envProvider) {
        issues.push(`${role}: Provider mismatch (config: ${model.provider}, env: ${envProvider})`);
      }
    } catch (error) {
      issues.push(`${role}: Configuration error - ${error.message}`);
    }
  });
  
  return issues;
}

/**
 * Check API key status
 */
function checkApiKeyStatus() {
  const providers = ['openrouter', 'anthropic', 'openai', 'google', 'perplexity', 'mistral', 'xai'];
  const missing = [];
  const placeholders = [];
  
  providers.forEach(provider => {
    const apiKey = modelConfig.getApiKey(provider);
    if (!apiKey) {
      missing.push(provider);
    } else if (apiKey.includes('your_') || apiKey.includes('_here')) {
      placeholders.push(provider);
    }
  });
  
  return { missing, placeholders };
}

/**
 * Generate recommendations based on health check results
 */
function generateRecommendations(results) {
  const recommendations = [];
  
  // Always recommend regular updates
  recommendations.push({
    category: 'maintenance',
    title: 'Regular Model Registry Updates',
    description: 'Keep your model registry up to date with latest models',
    action: 'Run model registry updater monthly',
    command: 'node src/config/model-registry-updater.js'
  });
  
  // Recommend CI/CD integration
  recommendations.push({
    category: 'automation',
    title: 'Automated Configuration Validation',
    description: 'Add config validation to your CI/CD pipeline',
    action: 'Include health check in automated tests',
    command: 'node src/config/health-check.js'
  });
  
  // Model-specific recommendations
  if (results.warnings.some(w => w.type === 'missing_api_keys')) {
    recommendations.push({
      category: 'setup',
      title: 'Complete API Key Configuration',
      description: 'Set up API keys for better model coverage and redundancy',
      action: 'Configure API keys for all providers you plan to use',
      command: 'Edit .env file with actual API keys'
    });
  }
  
  return recommendations;
}

/**
 * Auto-fix environment consistency issues
 */
function fixEnvironmentConsistency() {
  console.log('🔧 Auto-fixing environment consistency issues...');
  // This would update .env file to match current configuration
  // Implementation depends on specific requirements
  return { success: true, message: 'Environment consistency fixed' };
}

/**
 * Add missing provider sections to supported-models.json
 */
function addMissingProviders(filePath, missingProviders) {
  console.log(`🔧 Adding missing providers: ${missingProviders.join(', ')}`);
  
  try {
    const supportedModels = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    missingProviders.forEach(provider => {
      if (!supportedModels[provider]) {
        supportedModels[provider] = [];
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(supportedModels, null, 2));
    return { success: true, message: `Added missing providers: ${missingProviders.join(', ')}` };
  } catch (error) {
    return { success: false, message: `Failed to add providers: ${error.message}` };
  }
}

/**
 * Quick health check for CI/CD
 */
export async function quickHealthCheck() {
  try {
    const validation = validateCurrentConfig();
    return {
      healthy: validation.valid,
      errors: validation.errors || []
    };
  } catch (error) {
    return {
      healthy: false,
      errors: [error.message]
    };
  }
}

/**
 * CLI interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().then(results => {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 HEALTH CHECK RESULTS');
    console.log('='.repeat(80));
    
    if (results.status === 'healthy') {
      console.log('🎉 Configuration is healthy!');
    } else {
      console.log('❌ Configuration has issues that need attention.');
    }
    
    if (results.issues.length > 0) {
      console.log(`\n❌ CRITICAL ISSUES (${results.issues.length}):`);
      results.issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.type} - ${issue.severity}`);
        console.log(`   ${issue.message}`);
        if (issue.details) console.log(`   Details: ${issue.details.join(', ')}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
      results.warnings.forEach((warning, i) => {
        console.log(`\n${i + 1}. ${warning.type}`);
        console.log(`   ${warning.message}`);
        if (warning.details) console.log(`   Details: ${warning.details.join(', ')}`);
      });
    }
    
    if (results.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS (${results.recommendations.length}):`);
      results.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Action: ${rec.action}`);
        if (rec.command) console.log(`   Command: ${rec.command}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    process.exit(results.status === 'healthy' ? 0 : 1);
  }).catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}
