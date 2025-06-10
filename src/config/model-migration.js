/**
 * Model Configuration Migration Utility
 * Helps migrate from hardcoded models to environment-based configuration
 */

import { modelConfig } from './models.js';

/**
 * Legacy model patterns to detect and replace
 */
const LEGACY_PATTERNS = [
  {
    pattern: /model\s*=\s*['"`]anthropic\/claude-3\.5-sonnet['"`]/g,
    role: 'main',
    description: 'Hardcoded Claude 3.5 Sonnet model'
  },
  {
    pattern: /model\s*:\s*['"`]anthropic\/claude-3\.5-sonnet['"`]/g,
    role: 'main',
    description: 'Hardcoded Claude 3.5 Sonnet in object'
  },
  {
    pattern: /['"`]llama-3\.1-sonar-large-128k-online['"`]/g,
    role: 'research',
    description: 'Hardcoded Perplexity research model'
  },
  {
    pattern: /constructor\([^)]*,\s*model\s*=\s*['"`][^'"`]+['"`]/g,
    role: 'main',
    description: 'Constructor with hardcoded default model'
  }
];

/**
 * Provider configuration patterns for multi-provider arrays
 */
const PROVIDER_ARRAY_PATTERNS = [
  {
    pattern: /const\s+providers\s*=\s*\[\s*{[^}]*name:\s*['"`]OpenRouter['"`][^}]*model:\s*['"`][^'"`]+['"`][^}]*}/g,
    description: 'OpenRouter provider in array'
  },
  {
    pattern: /const\s+providers\s*=\s*\[\s*{[^}]*name:\s*['"`]Perplexity['"`][^}]*model:\s*['"`][^'"`]+['"`][^}]*}/g,
    description: 'Perplexity provider in array'
  }
];

/**
 * Migration helper class
 */
export class ModelMigration {
  constructor() {
    this.detectedIssues = [];
    this.migrationSuggestions = [];
  }

  /**
   * Analyze file content for hardcoded model references
   * @param {string} content - File content to analyze
   * @param {string} filePath - Path to the file being analyzed
   * @returns {Object} Analysis results
   */
  analyzeFile(content, filePath) {
    const issues = [];
    const suggestions = [];

    // Check for legacy patterns
    LEGACY_PATTERNS.forEach(({ pattern, role, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'hardcoded_model',
            pattern: match,
            role,
            description,
            file: filePath,
            suggestion: this.generateModelConfigSuggestion(role)
          });
        });
      }
    });

    // Check for provider arrays
    PROVIDER_ARRAY_PATTERNS.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'provider_array',
            pattern: match,
            description,
            file: filePath,
            suggestion: this.generateProviderArraySuggestion()
          });
        });
      }
    });

    // Check for direct process.env model access
    const envModelPattern = /process\.env\.(AI_MODEL|OPENROUTER_MODEL|PERPLEXITY_MODEL)/g;
    const envMatches = content.match(envModelPattern);
    if (envMatches) {
      envMatches.forEach(match => {
        issues.push({
          type: 'direct_env_access',
          pattern: match,
          description: 'Direct environment variable access',
          file: filePath,
          suggestion: 'Use modelConfig.getModel() instead'
        });
      });
    }

    return {
      file: filePath,
      issues,
      hasIssues: issues.length > 0,
      issueCount: issues.length
    };
  }

  /**
   * Generate suggestion for model configuration replacement
   * @param {string} role - Model role
   * @returns {string} Suggested replacement code
   */
  generateModelConfigSuggestion(role) {
    return `
// Replace hardcoded model with:
import { createProviderConfig } from '../config/models.js';

// Get configured model for ${role} role
const providerConfig = createProviderConfig('${role}');
const model = providerConfig.model;
const apiKey = providerConfig.key;
const baseUrl = providerConfig.baseUrl;
`;
  }

  /**
   * Generate suggestion for provider array replacement
   * @returns {string} Suggested replacement code
   */
  generateProviderArraySuggestion() {
    return `
// Replace hardcoded provider array with:
import { modelConfig } from '../config/models.js';

// Build providers from configuration
const providers = [];

// Add OpenRouter if configured
try {
  const openrouterConfig = modelConfig.createProviderConfig('main');
  providers.push({
    name: 'OpenRouter',
    key: openrouterConfig.key,
    model: openrouterConfig.model,
    endpoint: openrouterConfig.endpoint
  });
} catch (error) {
  console.warn('OpenRouter not configured:', error.message);
}

// Add Perplexity if configured
try {
  const perplexityConfig = modelConfig.createProviderConfig('research');
  providers.push({
    name: 'Perplexity', 
    key: perplexityConfig.key,
    model: perplexityConfig.model,
    endpoint: perplexityConfig.endpoint
  });
} catch (error) {
  console.warn('Perplexity not configured:', error.message);
}
`;
  }

  /**
   * Generate migration report
   * @param {Array} analysisResults - Results from analyzing multiple files
   * @returns {string} Migration report
   */
  generateMigrationReport(analysisResults) {
    const totalFiles = analysisResults.length;
    const filesWithIssues = analysisResults.filter(r => r.hasIssues).length;
    const totalIssues = analysisResults.reduce((sum, r) => sum + r.issueCount, 0);

    let report = `
# AI Model Configuration Migration Report

## Summary
- **Total Files Analyzed**: ${totalFiles}
- **Files with Issues**: ${filesWithIssues}
- **Total Issues Found**: ${totalIssues}

## Issues by Type
`;

    // Group issues by type
    const issuesByType = {};
    analysisResults.forEach(result => {
      result.issues.forEach(issue => {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue);
      });
    });

    Object.entries(issuesByType).forEach(([type, issues]) => {
      report += `\n### ${type.replace(/_/g, ' ').toUpperCase()}\n`;
      report += `Found ${issues.length} instances:\n\n`;
      
      issues.forEach(issue => {
        report += `- **File**: \`${issue.file}\`\n`;
        report += `  - **Pattern**: \`${issue.pattern}\`\n`;
        report += `  - **Description**: ${issue.description}\n`;
        if (issue.role) {
          report += `  - **Suggested Role**: ${issue.role}\n`;
        }
        report += '\n';
      });
    });

    report += `
## Migration Priority

### High Priority (Breaking Changes)
1. **Constructor defaults** - Update class constructors to use model config
2. **Provider arrays** - Replace hardcoded provider configurations
3. **Direct API calls** - Update model references in API calls

### Medium Priority (Compatibility)
1. **Environment variable access** - Replace direct process.env access
2. **Configuration objects** - Update configuration object patterns

### Low Priority (Cleanup)
1. **Comments and documentation** - Update references in comments
2. **Test files** - Update test configurations

## Next Steps

1. **Install Dependencies**: Ensure model configuration is properly imported
2. **Update High Priority Files**: Start with constructor and provider array changes
3. **Test Configuration**: Verify environment variables are properly set
4. **Gradual Migration**: Update files incrementally to avoid breaking changes
5. **Validation**: Use \`modelConfig.validateModel()\` to verify configurations

## Environment Setup Required

Make sure your \`.env\` file includes the new model configuration variables:

\`\`\`bash
# Copy from .env.example and configure:
cp .env.example .env
# Edit .env with your actual API keys and model preferences
\`\`\`
`;

    return report;
  }
}

/**
 * Convenience function to create migration instance
 */
export const createMigration = () => new ModelMigration();

/**
 * Quick validation of current model configuration
 */
export function validateCurrentConfig() {
  const results = {
    main: modelConfig.validateModel('main'),
    analysis: modelConfig.validateModel('analysis'), 
    research: modelConfig.validateModel('research'),
    generation: modelConfig.validateModel('generation'),
    fallback: modelConfig.validateModel('fallback')
  };

  const valid = Object.values(results).every(r => r.valid);
  const errors = Object.entries(results)
    .filter(([_, r]) => !r.valid)
    .map(([role, r]) => `${role}: ${r.error}`);

  return {
    valid,
    errors,
    results
  };
}
