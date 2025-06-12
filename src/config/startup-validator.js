/**
 * Startup Validation System
 * Validates critical configuration and environment before system startup
 */

import { EnvironmentValidator } from './environment-validator.js';
import { MCPConfigGenerator } from './mcp-config-generator.js';
import { ModelConfig } from './models.js';
import fs from 'fs';
import path from 'path';

/**
 * Startup Validator Class
 */
export class StartupValidator {
  constructor(options = {}) {
    this.options = {
      exitOnError: options.exitOnError ?? true,
      skipAIValidation: options.skipAIValidation ?? false,
      skipMCPValidation: options.skipMCPValidation ?? false,
      environment: options.environment || this.detectEnvironment(),
      ...options
    };
    
    this.results = {
      environment: null,
      ai: null,
      mcp: null,
      project: null,
      overall: null
    };
  }

  /**
   * Run complete startup validation
   */
  async validate() {
    console.log('🔍 Running Guidant startup validation...\n');

    try {
      // 1. Environment validation
      await this.validateEnvironment();
      
      // 2. AI configuration validation
      if (!this.options.skipAIValidation) {
        await this.validateAIConfiguration();
      }
      
      // 3. MCP configuration validation
      if (!this.options.skipMCPValidation) {
        await this.validateMCPConfiguration();
      }
      
      // 4. Project structure validation
      await this.validateProjectStructure();
      
      // 5. Generate overall result
      this.generateOverallResult();
      
      // 6. Handle results
      this.handleResults();
      
      return this.results;
      
    } catch (error) {
      console.error(`❌ Startup validation failed: ${error.message}`);
      if (this.options.exitOnError) {
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Validate environment variables and configuration
   */
  async validateEnvironment() {
    console.log('🌍 Validating environment...');
    
    const validator = new EnvironmentValidator(this.options.environment);
    this.results.environment = validator.validate();
    
    if (this.results.environment.valid) {
      console.log('✅ Environment validation passed');
    } else {
      console.log('❌ Environment validation failed');
      this.results.environment.errors.forEach(error => {
        console.error(`  • ${error}`);
      });
    }
    
    if (this.results.environment.warnings.length > 0) {
      console.log('⚠️  Environment warnings:');
      this.results.environment.warnings.forEach(warning => {
        console.warn(`  • ${warning}`);
      });
    }
  }

  /**
   * Validate AI model configuration
   */
  async validateAIConfiguration() {
    console.log('\n🤖 Validating AI configuration...');
    
    try {
      const modelConfig = new ModelConfig();
      const roles = ['main', 'research', 'analysis', 'generation', 'fallback'];
      
      const validations = roles.map(role => ({
        role,
        ...modelConfig.validateModel(role)
      }));
      
      const validModels = validations.filter(v => v.valid);
      const invalidModels = validations.filter(v => !v.valid);
      
      this.results.ai = {
        valid: validModels.length > 0,
        validModels: validModels.length,
        totalModels: validations.length,
        workingRoles: validModels.map(v => v.role),
        failedRoles: invalidModels.map(v => ({ role: v.role, error: v.error })),
        errors: invalidModels.length > 0 ? [`${invalidModels.length} AI models failed validation`] : [],
        warnings: validModels.length < validations.length ? ['Some AI models are not configured'] : []
      };
      
      if (this.results.ai.valid) {
        console.log(`✅ AI configuration valid (${validModels.length}/${validations.length} models working)`);
      } else {
        console.log('❌ AI configuration failed - no working models found');
      }
      
      if (invalidModels.length > 0) {
        console.log('⚠️  Failed AI models:');
        invalidModels.forEach(model => {
          console.warn(`  • ${model.role}: ${model.error}`);
        });
      }
      
    } catch (error) {
      this.results.ai = {
        valid: false,
        errors: [`AI validation error: ${error.message}`],
        warnings: []
      };
      console.error(`❌ AI validation error: ${error.message}`);
    }
  }

  /**
   * Validate MCP server configuration
   */
  async validateMCPConfiguration() {
    console.log('\n🔌 Validating MCP configuration...');
    
    try {
      const generator = new MCPConfigGenerator();
      
      // Check if server file exists
      const serverExists = fs.existsSync(generator.serverPath);
      
      // Test connection if server exists
      let connectionTest = null;
      if (serverExists) {
        connectionTest = await generator.testConnection();
      }
      
      this.results.mcp = {
        valid: serverExists && (connectionTest?.success ?? false),
        serverExists,
        serverPath: generator.serverPath,
        connectionTest,
        errors: [],
        warnings: []
      };
      
      if (!serverExists) {
        this.results.mcp.errors.push(`MCP server not found at: ${generator.serverPath}`);
      }
      
      if (connectionTest && !connectionTest.success) {
        this.results.mcp.errors.push(`MCP server connection failed: ${connectionTest.error}`);
      }
      
      if (this.results.mcp.valid) {
        console.log('✅ MCP configuration valid');
      } else {
        console.log('❌ MCP configuration failed');
        this.results.mcp.errors.forEach(error => {
          console.error(`  • ${error}`);
        });
      }
      
    } catch (error) {
      this.results.mcp = {
        valid: false,
        errors: [`MCP validation error: ${error.message}`],
        warnings: []
      };
      console.error(`❌ MCP validation error: ${error.message}`);
    }
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure() {
    console.log('\n📁 Validating project structure...');
    
    try {
      const projectRoot = process.cwd();
      const guidantDir = path.join(projectRoot, '.guidant');
      const packageJson = path.join(projectRoot, 'package.json');
      
      const checks = {
        hasGuidantDir: fs.existsSync(guidantDir),
        hasPackageJson: fs.existsSync(packageJson),
        hasConfig: fs.existsSync(path.join(guidantDir, 'config.json')),
        hasMCPServer: fs.existsSync(path.join(projectRoot, 'mcp-server')),
        isGuidantProject: false
      };
      
      // Check if this is a Guidant project
      if (checks.hasPackageJson) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
          checks.isGuidantProject = pkg.name === 'guidant' || 
                                   pkg.dependencies?.['@guidant/core'] ||
                                   pkg.devDependencies?.['@guidant/core'];
        } catch (error) {
          // Ignore JSON parse errors
        }
      }
      
      const errors = [];
      const warnings = [];
      
      if (!checks.hasGuidantDir && this.options.environment === 'production') {
        errors.push('Guidant project not initialized. Run "guidant init" first.');
      } else if (!checks.hasGuidantDir) {
        warnings.push('Guidant project not initialized. Some features may be limited.');
      }
      
      if (!checks.hasPackageJson) {
        warnings.push('No package.json found. This may not be a Node.js project.');
      }
      
      if (!checks.hasMCPServer) {
        warnings.push('MCP server directory not found. MCP integration may not work.');
      }
      
      this.results.project = {
        valid: errors.length === 0,
        checks,
        errors,
        warnings
      };
      
      if (this.results.project.valid) {
        console.log('✅ Project structure valid');
      } else {
        console.log('❌ Project structure validation failed');
        errors.forEach(error => console.error(`  • ${error}`));
      }
      
      if (warnings.length > 0) {
        console.log('⚠️  Project warnings:');
        warnings.forEach(warning => console.warn(`  • ${warning}`));
      }
      
    } catch (error) {
      this.results.project = {
        valid: false,
        errors: [`Project validation error: ${error.message}`],
        warnings: []
      };
      console.error(`❌ Project validation error: ${error.message}`);
    }
  }

  /**
   * Generate overall validation result
   */
  generateOverallResult() {
    const allResults = [
      this.results.environment,
      this.results.ai,
      this.results.mcp,
      this.results.project
    ].filter(Boolean);
    
    const allValid = allResults.every(result => result.valid);
    const criticalErrors = allResults.filter(result => 
      !result.valid && this.isCriticalError(result)
    );
    
    const totalErrors = allResults.reduce((sum, result) => 
      sum + (result.errors?.length || 0), 0
    );
    
    const totalWarnings = allResults.reduce((sum, result) => 
      sum + (result.warnings?.length || 0), 0
    );
    
    this.results.overall = {
      valid: allValid && criticalErrors.length === 0,
      criticalErrors: criticalErrors.length,
      totalErrors,
      totalWarnings,
      canStart: criticalErrors.length === 0,
      environment: this.options.environment
    };
  }

  /**
   * Check if a validation result contains critical errors
   */
  isCriticalError(result) {
    if (this.options.environment !== 'production') {
      return false; // Non-critical in development
    }
    
    // In production, AI and environment failures are critical
    return result === this.results.environment || result === this.results.ai;
  }

  /**
   * Handle validation results
   */
  handleResults() {
    console.log('\n📊 Validation Summary:');
    console.log(`Environment: ${this.options.environment}`);
    console.log(`Overall Status: ${this.results.overall.valid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Errors: ${this.results.overall.totalErrors}`);
    console.log(`Warnings: ${this.results.overall.totalWarnings}`);
    
    if (!this.results.overall.canStart) {
      console.error('\n🚫 Cannot start Guidant due to critical errors.');
      
      if (this.options.exitOnError) {
        console.error('Fix the errors above and try again.');
        process.exit(1);
      }
    } else if (this.results.overall.totalWarnings > 0) {
      console.log('\n⚠️  Guidant can start but has warnings. Consider addressing them for optimal performance.');
    } else {
      console.log('\n🎉 All validations passed! Guidant is ready to start.');
    }
  }

  /**
   * Detect current environment
   */
  detectEnvironment() {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    
    if (nodeEnv === 'production') {
      return 'production';
    } else if (nodeEnv === 'staging' || nodeEnv === 'test') {
      return 'staging';
    } else {
      return 'development';
    }
  }

  /**
   * Quick validation for CLI usage
   */
  static async quickValidate(options = {}) {
    const validator = new StartupValidator({
      exitOnError: false,
      ...options
    });
    
    return await validator.validate();
  }
}

/**
 * Run startup validation
 */
export async function validateStartup(options = {}) {
  const validator = new StartupValidator(options);
  return await validator.validate();
}

export default StartupValidator;
