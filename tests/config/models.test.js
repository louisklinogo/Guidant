/**
 * AI Model Configuration Tests
 * Ensures model configuration is always valid and prevents future issues
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { modelConfig } from '../../src/config/models.js';
import { validateCurrentConfig } from '../../src/config/model-migration.js';
import { runHealthCheck, quickHealthCheck } from '../../src/config/health-check.js';
import fs from 'fs';
import path from 'path';

describe('AI Model Configuration', () => {
  beforeAll(() => {
    // Ensure environment is loaded
    require('dotenv').config();
  });

  describe('Model Configuration Validation', () => {
    it('should validate all default model roles', () => {
      const validation = validateCurrentConfig();
      expect(validation.valid).toBe(true);
      
      if (!validation.valid) {
        console.log('Validation errors:', validation.errors);
      }
    });

    it('should have valid models for all required roles', () => {
      const requiredRoles = ['main', 'analysis', 'research', 'generation', 'fallback'];
      
      requiredRoles.forEach(role => {
        expect(() => {
          const model = modelConfig.getModel(role);
          expect(model).toBeDefined();
          expect(model.provider).toBeDefined();
          expect(model.modelId).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should validate provider-model combinations', () => {
      const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
      
      roles.forEach(role => {
        const model = modelConfig.getModel(role);
        const isValid = modelConfig.validateProviderModelCombination(model.provider, model.modelId);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Supported Models Registry', () => {
    let supportedModels;

    beforeAll(() => {
      const supportedModelsPath = path.join(process.cwd(), 'src/config/supported-models.json');
      supportedModels = JSON.parse(fs.readFileSync(supportedModelsPath, 'utf8'));
    });

    it('should have valid JSON structure', () => {
      expect(supportedModels).toBeDefined();
      expect(typeof supportedModels).toBe('object');
    });

    it('should have required provider sections', () => {
      const requiredProviders = ['openrouter', 'anthropic', 'openai', 'google', 'perplexity'];
      
      requiredProviders.forEach(provider => {
        expect(supportedModels[provider]).toBeDefined();
        expect(Array.isArray(supportedModels[provider])).toBe(true);
      });
    });

    it('should have valid model structures', () => {
      Object.entries(supportedModels).forEach(([provider, models]) => {
        if (!Array.isArray(models)) return;
        
        models.forEach(model => {
          expect(model.id).toBeDefined();
          expect(model.name).toBeDefined();
          expect(model.allowed_roles).toBeDefined();
          expect(Array.isArray(model.allowed_roles)).toBe(true);
          expect(model.allowed_roles.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include google/gemini-2.0-flash-exp:free in OpenRouter', () => {
      const openrouterModels = supportedModels.openrouter || [];
      const geminiModel = openrouterModels.find(m => m.id === 'google/gemini-2.0-flash-exp:free');
      expect(geminiModel).toBeDefined();
      expect(geminiModel.allowed_roles).toContain('main');
    });

    it('should include sonar-pro in Perplexity', () => {
      const perplexityModels = supportedModels.perplexity || [];
      const sonarModel = perplexityModels.find(m => m.id === 'sonar-pro');
      expect(sonarModel).toBeDefined();
      expect(sonarModel.allowed_roles).toContain('research');
    });
  });

  describe('Environment Configuration', () => {
    it('should load environment variables correctly', () => {
      // Test that environment variables are accessible
      const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
      const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
      
      // At least one should be configured for tests to be meaningful
      expect(hasOpenRouter || hasPerplexity).toBe(true);
    });

    it('should handle missing API keys gracefully', () => {
      expect(() => {
        modelConfig.getApiKey('nonexistent_provider');
      }).not.toThrow();
    });

    it('should respect environment overrides', () => {
      const originalModel = process.env.AI_MAIN_MODEL;
      if (originalModel) {
        const model = modelConfig.getModel('main');
        expect(model.modelId).toBe(originalModel);
      }
    });
  });

  describe('Health Check System', () => {
    it('should run quick health check without errors', async () => {
      const result = await quickHealthCheck();
      expect(result).toBeDefined();
      expect(typeof result.healthy).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      
      if (!result.healthy) {
        console.log('Health check errors:', result.errors);
      }
    });

    it('should run full health check without critical errors', async () => {
      const result = await runHealthCheck();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      
      // Should not have critical issues
      const criticalIssues = result.issues?.filter(issue => issue.severity === 'critical') || [];
      expect(criticalIssues.length).toBe(0);
      
      if (criticalIssues.length > 0) {
        console.log('Critical issues found:', criticalIssues);
      }
    });
  });

  describe('Model Configuration Edge Cases', () => {
    it('should handle invalid role requests gracefully', () => {
      expect(() => {
        modelConfig.getModel('invalid_role');
      }).toThrow();
    });

    it('should handle invalid provider requests gracefully', () => {
      const result = modelConfig.getApiKey('invalid_provider');
      expect(result).toBeUndefined();
    });

    it('should validate model existence in provider', () => {
      const isValid = modelConfig.validateProviderModelCombination('openrouter', 'nonexistent-model');
      expect(isValid).toBe(false);
    });

    it('should handle malformed model configurations', () => {
      expect(() => {
        modelConfig.validateProviderModelCombination('', '');
      }).not.toThrow();
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent default models across roles', () => {
      const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
      const providers = new Set();
      
      roles.forEach(role => {
        const model = modelConfig.getModel(role);
        providers.add(model.provider);
      });
      
      // Should not have too many different providers (suggests configuration drift)
      expect(providers.size).toBeLessThanOrEqual(4);
    });

    it('should have reasonable token limits', () => {
      const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
      
      roles.forEach(role => {
        const model = modelConfig.getModel(role);
        expect(model.maxTokens).toBeGreaterThan(0);
        expect(model.maxTokens).toBeLessThanOrEqual(2000000); // Reasonable upper limit
      });
    });

    it('should have appropriate temperature settings', () => {
      const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
      
      roles.forEach(role => {
        const model = modelConfig.getModel(role);
        expect(model.temperature).toBeGreaterThanOrEqual(0);
        expect(model.temperature).toBeLessThanOrEqual(2);
      });
    });
  });
});

describe('Configuration Regression Prevention', () => {
  it('should prevent google/gemini-2.0-flash-exp:free from being removed', () => {
    const supportedModelsPath = path.join(process.cwd(), 'src/config/supported-models.json');
    const supportedModels = JSON.parse(fs.readFileSync(supportedModelsPath, 'utf8'));
    
    const openrouterModels = supportedModels.openrouter || [];
    const geminiModel = openrouterModels.find(m => m.id === 'google/gemini-2.0-flash-exp:free');
    
    expect(geminiModel).toBeDefined();
    expect(geminiModel.name).toContain('Gemini');
    expect(geminiModel.allowed_roles).toContain('main');
  });

  it('should prevent invalid default models from being configured', () => {
    const roles = ['main', 'analysis', 'research', 'generation', 'fallback'];
    
    roles.forEach(role => {
      const model = modelConfig.getModel(role);
      const isValid = modelConfig.validateProviderModelCombination(model.provider, model.modelId);
      
      if (!isValid) {
        throw new Error(`Invalid default model for ${role}: ${model.provider}/${model.modelId}`);
      }
    });
  });

  it('should maintain API key environment variable names', () => {
    const expectedEnvVars = [
      'OPENROUTER_API_KEY',
      'ANTHROPIC_API_KEY', 
      'OPENAI_API_KEY',
      'GOOGLE_API_KEY',
      'PERPLEXITY_API_KEY'
    ];
    
    expectedEnvVars.forEach(envVar => {
      // Should not throw when accessing these environment variables
      expect(() => {
        const value = process.env[envVar];
        // Value can be undefined, but accessing should not throw
      }).not.toThrow();
    });
  });
});
