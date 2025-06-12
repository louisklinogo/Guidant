/**
 * Environment Validation System
 * Ensures critical configuration is present and valid for production deployment
 */

import fs from 'fs';
import path from 'path';
import { ModelConfig } from './models.js';

/**
 * Environment validation levels
 */
export const VALIDATION_LEVELS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging', 
  PRODUCTION: 'production'
};

/**
 * Critical environment variables required for each level
 */
const REQUIRED_ENV_VARS = {
  [VALIDATION_LEVELS.DEVELOPMENT]: {
    // Minimal requirements for development
    optional: [
      'OPENROUTER_API_KEY',
      'PERPLEXITY_API_KEY',
      'ANTHROPIC_API_KEY'
    ]
  },
  [VALIDATION_LEVELS.STAGING]: {
    // At least one AI provider required
    oneOf: [
      ['OPENROUTER_API_KEY'],
      ['ANTHROPIC_API_KEY'],
      ['OPENAI_API_KEY']
    ],
    optional: [
      'PERPLEXITY_API_KEY',
      'GOOGLE_API_KEY'
    ]
  },
  [VALIDATION_LEVELS.PRODUCTION]: {
    // Production requires primary and fallback providers
    required: [
      'OPENROUTER_API_KEY'
    ],
    oneOf: [
      ['PERPLEXITY_API_KEY'],
      ['ANTHROPIC_API_KEY'],
      ['OPENAI_API_KEY']
    ],
    recommended: [
      'GOOGLE_API_KEY',
      'MISTRAL_API_KEY'
    ]
  }
};

/**
 * Environment Validator Class
 */
export class EnvironmentValidator {
  constructor(level = VALIDATION_LEVELS.DEVELOPMENT) {
    this.level = level;
    this.modelConfig = new ModelConfig();
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Validate environment for the specified level
   * @returns {Object} Validation result
   */
  validate() {
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];

    // Validate environment variables
    this.validateEnvironmentVariables();
    
    // Validate AI model configuration
    this.validateAIModels();
    
    // Validate project configuration
    this.validateProjectConfiguration();
    
    // Validate MCP configuration
    this.validateMCPConfiguration();

    return {
      valid: this.errors.length === 0,
      level: this.level,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.recommendations,
      summary: this.generateSummary()
    };
  }

  /**
   * Validate environment variables based on level
   */
  validateEnvironmentVariables() {
    const requirements = REQUIRED_ENV_VARS[this.level];
    
    // Check required variables
    if (requirements.required) {
      requirements.required.forEach(envVar => {
        if (!this.isValidApiKey(envVar)) {
          this.errors.push(`Missing required environment variable: ${envVar}`);
        }
      });
    }

    // Check oneOf requirements (at least one must be present)
    if (requirements.oneOf) {
      requirements.oneOf.forEach(group => {
        const hasAny = group.some(envVar => this.isValidApiKey(envVar));
        if (!hasAny) {
          this.errors.push(`At least one of these environment variables must be set: ${group.join(', ')}`);
        }
      });
    }

    // Check recommended variables
    if (requirements.recommended) {
      requirements.recommended.forEach(envVar => {
        if (!this.isValidApiKey(envVar)) {
          this.recommendations.push(`Consider setting ${envVar} for enhanced functionality`);
        }
      });
    }

    // Check optional variables
    if (requirements.optional) {
      requirements.optional.forEach(envVar => {
        if (!this.isValidApiKey(envVar)) {
          this.warnings.push(`Optional environment variable not set: ${envVar}`);
        }
      });
    }
  }

  /**
   * Validate AI model configuration
   */
  validateAIModels() {
    const roles = ['main', 'research', 'analysis', 'generation', 'fallback'];
    
    roles.forEach(role => {
      const validation = this.modelConfig.validateModel(role);
      if (!validation.valid) {
        if (role === 'main' || role === 'fallback') {
          this.errors.push(`Critical AI model validation failed for ${role}: ${validation.error}`);
        } else {
          this.warnings.push(`AI model validation failed for ${role}: ${validation.error}`);
        }
      }
    });

    // Ensure at least one working model
    const workingModels = roles.filter(role => this.modelConfig.validateModel(role).valid);
    if (workingModels.length === 0) {
      this.errors.push('No working AI models found. At least one AI provider must be configured.');
    }
  }

  /**
   * Validate project configuration
   */
  validateProjectConfiguration() {
    // Check for .guidant directory structure
    const guidantDir = path.join(process.cwd(), '.guidant');
    if (!fs.existsSync(guidantDir)) {
      if (this.level === VALIDATION_LEVELS.PRODUCTION) {
        this.errors.push('Guidant project not initialized. Run "guidant init" first.');
      } else {
        this.warnings.push('Guidant project not initialized. Some features may be limited.');
      }
    }

    // Check for configuration file
    const configPath = this.modelConfig.findConfigurationFile();
    if (!configPath) {
      this.recommendations.push('Consider creating a .guidant/config.json file for project-specific configuration');
    }
  }

  /**
   * Validate MCP configuration
   */
  validateMCPConfiguration() {
    // Check for hardcoded paths in MCP configuration
    const mcpConfigPaths = [
      path.join(process.cwd(), '.archived', 'claude_mcp_config.json'),
      path.join(process.cwd(), 'claude_mcp_config.json')
    ];

    mcpConfigPaths.forEach(configPath => {
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config.mcpServers) {
            Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
              if (serverConfig.args && serverConfig.args.some(arg => path.isAbsolute(arg))) {
                this.warnings.push(`MCP server "${name}" uses absolute paths. Consider using relative paths for portability.`);
              }
            });
          }
        } catch (error) {
          this.warnings.push(`Invalid MCP configuration file: ${configPath}`);
        }
      }
    });
  }

  /**
   * Check if an API key is valid (not empty, not placeholder)
   */
  isValidApiKey(envVar) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      return false;
    }

    // Check for placeholder values
    const placeholderPatterns = [
      /your_.*_api_key_here/i,
      /your_.*_key_here/i,
      /replace_with_your/i,
      /add_your_key/i,
      /key_here/i
    ];

    return !placeholderPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Generate validation summary
   */
  generateSummary() {
    const total = this.errors.length + this.warnings.length + this.recommendations.length;
    
    if (this.errors.length === 0) {
      return `✅ Environment validation passed for ${this.level} level (${this.warnings.length} warnings, ${this.recommendations.length} recommendations)`;
    } else {
      return `❌ Environment validation failed for ${this.level} level (${this.errors.length} errors, ${this.warnings.length} warnings)`;
    }
  }

  /**
   * Get current environment level based on NODE_ENV
   */
  static detectEnvironmentLevel() {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    
    if (nodeEnv === 'production') {
      return VALIDATION_LEVELS.PRODUCTION;
    } else if (nodeEnv === 'staging' || nodeEnv === 'test') {
      return VALIDATION_LEVELS.STAGING;
    } else {
      return VALIDATION_LEVELS.DEVELOPMENT;
    }
  }

  /**
   * Validate environment and exit if critical errors found
   */
  static validateAndExit(level = null) {
    const detectedLevel = level || EnvironmentValidator.detectEnvironmentLevel();
    const validator = new EnvironmentValidator(detectedLevel);
    const result = validator.validate();

    console.log(`🔍 Validating environment for ${detectedLevel} level...`);
    console.log(result.summary);

    if (result.errors.length > 0) {
      console.error('\n❌ Critical errors found:');
      result.errors.forEach(error => console.error(`  • ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.warn(`  • ${warning}`));
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    if (!result.valid && detectedLevel === VALIDATION_LEVELS.PRODUCTION) {
      console.error('\n🚫 Cannot start in production mode with critical errors. Please fix the issues above.');
      process.exit(1);
    }

    return result;
  }
}

/**
 * Quick validation function for use in other modules
 */
export function validateEnvironment(level = null) {
  const validator = new EnvironmentValidator(level || EnvironmentValidator.detectEnvironmentLevel());
  return validator.validate();
}

export default EnvironmentValidator;
