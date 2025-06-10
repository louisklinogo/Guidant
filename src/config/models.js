/**
 * Enhanced AI Model Configuration for Guidant
 * Built on proven TaskMaster patterns with Guidant-specific enhancements
 * Provides environment-based model selection and comprehensive configuration management
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load supported models registry from JSON file
 * Following TaskMaster's proven pattern of external model definitions
 */
let SUPPORTED_MODELS = {};
try {
  const modelsPath = path.join(__dirname, 'supported-models.json');
  if (fs.existsSync(modelsPath)) {
    const modelsData = fs.readFileSync(modelsPath, 'utf-8');
    SUPPORTED_MODELS = JSON.parse(modelsData);
  } else {
    console.warn(`Warning: supported-models.json not found at ${modelsPath}`);
  }
} catch (error) {
  console.warn('Warning: Could not load supported-models.json, using built-in defaults:', error.message);
}

// Ensure SUPPORTED_MODELS is never undefined
if (!SUPPORTED_MODELS || Object.keys(SUPPORTED_MODELS).length === 0) {
  SUPPORTED_MODELS = {
    openrouter: [],
    perplexity: [],
    anthropic: [],
    openai: [],
    google: [],
    mistral: []
  };
}

/**
 * Default model configurations by role
 * Enhanced from TaskMaster's main/research/fallback pattern
 */
const DEFAULT_MODELS = {
  // Core roles from TaskMaster
  main: {
    provider: 'openrouter',
    modelId: 'google/gemini-2.0-flash-exp:free',
    temperature: 0.7,
    maxTokens: 4000,
    description: 'Primary model for general AI tasks'
  },
  research: {
    provider: 'perplexity',
    modelId: 'sonar-pro',
    temperature: 0.1,
    maxTokens: 8000,
    description: 'Model optimized for research and web search tasks'
  },
  fallback: {
    provider: 'openrouter',
    modelId: 'google/gemini-2.0-flash-exp:free',
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Fallback model when primary models fail'
  },
  // Guidant-specific enhanced roles
  analysis: {
    provider: 'openrouter',
    modelId: 'google/gemini-2.0-flash-exp:free',
    temperature: 0.2,
    maxTokens: 80000,
    description: 'Model optimized for code analysis and reasoning tasks'
  },
  generation: {
    provider: 'openrouter',
    modelId: 'google/gemini-2.0-flash-exp:free',
    temperature: 0.8,
    maxTokens: 20000,
    description: 'Model optimized for creative generation tasks'
  }
};

/**
 * Provider configurations with enhanced metadata
 * Following TaskMaster's provider abstraction pattern with Guidant enhancements
 */
const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    description: 'Multi-model API gateway with competitive pricing'
  },
  perplexity: {
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    description: 'Research-focused models with web search capabilities'
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    description: 'Direct access to Claude models'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    description: 'Direct access to GPT models'
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    apiKeyEnv: 'GOOGLE_API_KEY',
    description: 'Direct access to Gemini models'
  },
  mistral: {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    description: 'Direct access to Mistral models'
  },
  xai: {
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyEnv: 'XAI_API_KEY',
    description: 'Direct access to Grok models'
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/api',
    apiKeyEnv: 'OLLAMA_API_KEY',
    description: 'Local model hosting with Ollama'
  }
};

/**
 * Valid providers list (dynamically generated from SUPPORTED_MODELS)
 */
const VALID_PROVIDERS = Object.keys(SUPPORTED_MODELS).length > 0
  ? Object.keys(SUPPORTED_MODELS)
  : Object.keys(PROVIDERS);

/**
 * Enhanced Model Configuration Class
 * Inspired by TaskMaster's config-manager.js with Guidant enhancements
 */
export class ModelConfig {
  constructor(projectRoot = null) {
    this.projectRoot = projectRoot;
    this.models = this.loadModelConfiguration();
    this.providers = PROVIDERS;
    this.supportedModels = SUPPORTED_MODELS;
    this.validProviders = VALID_PROVIDERS;
  }

  /**
   * Load model configuration with TaskMaster-inspired precedence
   * 1. Environment variables (highest priority)
   * 2. Configuration file (.guidant/config.json)
   * 3. Default configuration (lowest priority)
   * @returns {Object} Model configuration object
   */
  loadModelConfiguration() {
    // Start with defaults
    let config = this.deepClone(DEFAULT_MODELS);

    // Try to load from configuration file
    const fileConfig = this.loadConfigurationFile();
    if (fileConfig && fileConfig.models) {
      config = this.deepMerge(config, fileConfig.models);
    }

    // Apply environment variable overrides
    config = this.applyEnvironmentOverrides(config);

    // Apply model-specific parameter limits from supported models
    config = this.applyModelLimits(config);

    return config;
  }

  /**
   * Load configuration from .guidant/config.json file
   * Following TaskMaster's file-based configuration pattern
   * @returns {Object|null} Configuration object or null if not found
   */
  loadConfigurationFile() {
    try {
      const configPath = this.findConfigurationFile();
      if (!configPath || !fs.existsSync(configPath)) {
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn(`Warning: Could not load configuration file: ${error.message}`);
      return null;
    }
  }

  /**
   * Find configuration file path
   * @returns {string|null} Path to configuration file or null
   */
  findConfigurationFile() {
    const searchPaths = [
      this.projectRoot && path.join(this.projectRoot, '.guidant', 'config.json'),
      path.join(process.cwd(), '.guidant', 'config.json'),
      path.join(process.cwd(), 'guidant.config.json')
    ].filter(Boolean);

    for (const configPath of searchPaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  /**
   * Apply environment variable overrides
   * @param {Object} config - Base configuration
   * @returns {Object} Configuration with environment overrides
   */
  applyEnvironmentOverrides(config) {
    Object.keys(config).forEach(role => {
      const envPrefix = `AI_${role.toUpperCase()}`;

      // Check for role-specific overrides
      const modelEnv = process.env[`${envPrefix}_MODEL`];
      if (modelEnv) {
        config[role].modelId = modelEnv;
      }

      const providerEnv = process.env[`${envPrefix}_PROVIDER`];
      if (providerEnv) {
        config[role].provider = providerEnv;
      }

      const tempEnv = process.env[`${envPrefix}_TEMPERATURE`];
      if (tempEnv && !isNaN(parseFloat(tempEnv))) {
        config[role].temperature = parseFloat(tempEnv);
      }

      const tokensEnv = process.env[`${envPrefix}_MAX_TOKENS`];
      if (tokensEnv && !isNaN(parseInt(tokensEnv))) {
        config[role].maxTokens = parseInt(tokensEnv);
      }
    });

    // Legacy environment variable support
    if (process.env.AI_MODEL) {
      config.main.modelId = process.env.AI_MODEL;
    }
    if (process.env.AI_TEMPERATURE) {
      config.main.temperature = parseFloat(process.env.AI_TEMPERATURE) || config.main.temperature;
    }
    if (process.env.AI_MAX_TOKENS) {
      config.main.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || config.main.maxTokens;
    }

    return config;
  }

  /**
   * Apply model-specific limits from supported models registry
   * Following TaskMaster's pattern of model-specific parameter enforcement
   * @param {Object} config - Configuration to apply limits to
   * @returns {Object} Configuration with applied limits
   */
  applyModelLimits(config) {
    if (!this.supportedModels || Object.keys(this.supportedModels).length === 0) {
      return config; // Skip if no supported models data available
    }

    Object.keys(config).forEach(role => {
      const roleConfig = config[role];
      const modelData = this.getModelData(roleConfig.provider, roleConfig.modelId);

      if (modelData && modelData.max_tokens) {
        // Apply model-specific max tokens limit (minimum of configured and model limit)
        roleConfig.maxTokens = Math.min(roleConfig.maxTokens, modelData.max_tokens);
      }
    });

    return config;
  }

  /**
   * Get model configuration for a specific role
   * @param {string} role - Model role (main, analysis, research, generation, fallback)
   * @returns {Object} Model configuration
   */
  getModel(role = 'main') {
    if (!this.models[role]) {
      console.warn(`Unknown model role '${role}', falling back to 'main'`);
      role = 'main';
    }
    return this.deepClone(this.models[role]);
  }

  /**
   * Get model data from supported models registry
   * @param {string} provider - Provider name
   * @param {string} modelId - Model ID
   * @returns {Object|null} Model data or null if not found
   */
  getModelData(provider, modelId) {
    if (!this.supportedModels || !this.supportedModels[provider]) {
      return null;
    }

    return this.supportedModels[provider].find(model => model.id === modelId) || null;
  }

  /**
   * Deep clone utility
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deep merge utility
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  /**
   * Get provider configuration
   * @param {string} providerName - Provider name
   * @returns {Object} Provider configuration
   */
  getProvider(providerName) {
    return this.providers[providerName] || null;
  }

  /**
   * Get API key for a provider with environment resolution
   * Following TaskMaster's resolveEnvVariable pattern
   * @param {string} providerName - Provider name
   * @returns {string|null} API key or null if not found
   */
  getApiKey(providerName) {
    const provider = this.getProvider(providerName);
    if (!provider) return null;

    const apiKey = process.env[provider.apiKeyEnv];

    // Check for placeholder values (TaskMaster pattern)
    if (apiKey &&
        apiKey.trim() !== '' &&
        !/YOUR_.*_API_KEY_HERE/.test(apiKey) &&
        !apiKey.includes('KEY_HERE')) {
      return apiKey;
    }

    return null;
  }

  /**
   * Validate provider name
   * @param {string} providerName - Provider name to validate
   * @returns {boolean} True if valid provider
   */
  validateProvider(providerName) {
    return this.validProviders.includes(providerName);
  }

  /**
   * Validate provider-model combination
   * Following TaskMaster's validation pattern
   * @param {string} providerName - Provider name
   * @param {string} modelId - Model ID
   * @returns {boolean} True if valid combination
   */
  validateProviderModelCombination(providerName, modelId) {
    if (!this.supportedModels[providerName]) {
      return true; // Allow unknown providers
    }

    const models = this.supportedModels[providerName];
    return models.length === 0 || models.some(model => model.id === modelId);
  }

  /**
   * Validate model configuration for a role
   * Enhanced from TaskMaster's validation with role-specific checks
   * @param {string} role - Model role
   * @returns {Object} Validation result
   */
  validateModel(role = 'main') {
    const model = this.getModel(role);
    const provider = this.getProvider(model.provider);

    // Check if provider exists
    if (!provider) {
      return {
        valid: false,
        error: `Unknown provider: ${model.provider}`,
        role
      };
    }

    // Check if provider is valid
    if (!this.validateProvider(model.provider)) {
      return {
        valid: false,
        error: `Invalid provider: ${model.provider}`,
        role
      };
    }

    // Check provider-model combination
    if (!this.validateProviderModelCombination(model.provider, model.modelId)) {
      return {
        valid: false,
        error: `Model ${model.modelId} not supported by provider ${model.provider}`,
        role
      };
    }

    // Check if model is allowed for this role
    const modelData = this.getModelData(model.provider, model.modelId);
    if (modelData && modelData.allowed_roles && !modelData.allowed_roles.includes(role)) {
      return {
        valid: false,
        error: `Model ${model.modelId} not allowed for role ${role}. Allowed roles: ${modelData.allowed_roles.join(', ')}`,
        role
      };
    }

    // Check API key
    const apiKey = this.getApiKey(model.provider);
    if (!apiKey) {
      return {
        valid: false,
        error: `API key not found for provider ${model.provider} (${provider.apiKeyEnv})`,
        role
      };
    }

    return {
      valid: true,
      role,
      provider: model.provider,
      modelId: model.modelId
    };
  }

  /**
   * Get all available models with enhanced metadata
   * Following TaskMaster's getAvailableModels pattern
   * @returns {Array} Array of available models with metadata
   */
  getAvailableModels() {
    const available = [];

    Object.entries(this.supportedModels).forEach(([provider, models]) => {
      const hasApiKey = !!this.getApiKey(provider);
      const providerConfig = this.getProvider(provider);

      models.forEach(model => {
        available.push({
          id: model.id,
          name: model.name || model.id,
          provider,
          providerName: providerConfig?.name || provider,
          swe_score: model.swe_score,
          cost_per_1m_tokens: model.cost_per_1m_tokens,
          allowed_roles: model.allowed_roles || ['main', 'fallback'],
          max_tokens: model.max_tokens,
          hasApiKey,
          description: providerConfig?.description
        });
      });
    });

    return available.sort((a, b) => (b.swe_score || 0) - (a.swe_score || 0));
  }

  /**
   * Get available models for a specific role
   * @param {string} role - Role to filter by
   * @returns {Array} Available models for the role
   */
  getAvailableModelsForRole(role) {
    return this.getAvailableModels().filter(model =>
      model.allowed_roles.includes(role)
    );
  }

  /**
   * Get model parameters with role-specific overrides
   * Following TaskMaster's getParametersForRole pattern
   * @param {string} role - Model role
   * @returns {Object} Parameters object with maxTokens and temperature
   */
  getParametersForRole(role = 'main') {
    const model = this.getModel(role);
    const modelData = this.getModelData(model.provider, model.modelId);

    let effectiveMaxTokens = model.maxTokens;

    // Apply model-specific limits if available
    if (modelData && modelData.max_tokens) {
      effectiveMaxTokens = Math.min(model.maxTokens, modelData.max_tokens);
    }

    return {
      maxTokens: effectiveMaxTokens,
      temperature: model.temperature
    };
  }

  /**
   * Create provider configuration for AI calls
   * Enhanced from TaskMaster's provider configuration pattern
   * @param {string} role - Model role
   * @returns {Object} Provider configuration object
   */
  createProviderConfig(role = 'main') {
    const validation = this.validateModel(role);
    if (!validation.valid) {
      throw new Error(`Invalid configuration for role '${role}': ${validation.error}`);
    }

    const model = this.getModel(role);
    const provider = this.getProvider(model.provider);
    const apiKey = this.getApiKey(model.provider);
    const parameters = this.getParametersForRole(role);

    return {
      name: provider.name,
      key: apiKey,
      model: model.modelId,
      endpoint: `${provider.baseUrl}/chat/completions`,
      temperature: parameters.temperature,
      maxTokens: parameters.maxTokens,
      baseUrl: provider.baseUrl,
      provider: model.provider,
      role
    };
  }

  /**
   * Get cost information for a model
   * @param {string} provider - Provider name
   * @param {string} modelId - Model ID
   * @returns {Object} Cost information
   */
  getModelCost(provider, modelId) {
    const modelData = this.getModelData(provider, modelId);

    if (!modelData || !modelData.cost_per_1m_tokens) {
      return { inputCost: 0, outputCost: 0, currency: 'USD' };
    }

    return {
      inputCost: modelData.cost_per_1m_tokens.input || 0,
      outputCost: modelData.cost_per_1m_tokens.output || 0,
      currency: modelData.cost_per_1m_tokens.currency || 'USD'
    };
  }

  /**
   * Check if API key is set for a provider
   * Following TaskMaster's isApiKeySet pattern
   * @param {string} providerName - Provider name
   * @returns {boolean} True if API key is set and valid
   */
  isApiKeySet(providerName) {
    return !!this.getApiKey(providerName);
  }

  /**
   * Update models from external source
   * @param {string} source - Source identifier
   * @param {Object} newModels - New model data
   * @returns {Promise<Object>} Update result
   */
  async updateModels(source, newModels) {
    const { modelRegistryUpdater } = await import('./model-registry-updater.js');
    const result = await modelRegistryUpdater.updateRegistry(source, newModels);

    if (result.success) {
      // Reload the configuration with new models
      this.supportedModels = newModels;
      this.validProviders = Object.keys(newModels);

      // Reapply model limits with new data
      this.models = this.applyModelLimits(this.models);
    }

    return result;
  }

  /**
   * Get model registry version information
   * @returns {Object} Version information
   */
  getRegistryVersion() {
    try {
      const { modelRegistryUpdater } = require('./model-registry-updater.js');
      return modelRegistryUpdater.getCurrentVersion();
    } catch (error) {
      return { version: 'unknown', error: error.message };
    }
  }

  /**
   * Check for model registry updates
   * @returns {Promise<boolean>} Whether updates are available
   */
  async checkForUpdates() {
    try {
      const { modelRegistryUpdater } = await import('./model-registry-updater.js');
      return await modelRegistryUpdater.checkForUpdates();
    } catch (error) {
      console.warn('Failed to check for updates:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const modelConfig = new ModelConfig();

/**
 * Convenience functions for common operations
 * Following TaskMaster's functional API pattern
 */

// Core model operations
export const getModel = (role) => modelConfig.getModel(role);
export const getProvider = (providerName) => modelConfig.getProvider(providerName);
export const getApiKey = (providerName) => modelConfig.getApiKey(providerName);

// Validation functions
export const validateModel = (role) => modelConfig.validateModel(role);
export const validateProvider = (providerName) => modelConfig.validateProvider(providerName);
export const validateProviderModelCombination = (provider, modelId) =>
  modelConfig.validateProviderModelCombination(provider, modelId);

// Model discovery and metadata
export const getAvailableModels = () => modelConfig.getAvailableModels();
export const getAvailableModelsForRole = (role) => modelConfig.getAvailableModelsForRole(role);
export const getModelData = (provider, modelId) => modelConfig.getModelData(provider, modelId);
export const getModelCost = (provider, modelId) => modelConfig.getModelCost(provider, modelId);

// Configuration creation
export const createProviderConfig = (role) => modelConfig.createProviderConfig(role);
export const getParametersForRole = (role) => modelConfig.getParametersForRole(role);

// API key management
export const isApiKeySet = (providerName) => modelConfig.isApiKeySet(providerName);

// Role-specific getters (TaskMaster compatibility)
export const getMainProvider = () => modelConfig.getModel('main').provider;
export const getMainModelId = () => modelConfig.getModel('main').modelId;
export const getMainMaxTokens = () => modelConfig.getParametersForRole('main').maxTokens;
export const getMainTemperature = () => modelConfig.getParametersForRole('main').temperature;

export const getResearchProvider = () => modelConfig.getModel('research').provider;
export const getResearchModelId = () => modelConfig.getModel('research').modelId;
export const getResearchMaxTokens = () => modelConfig.getParametersForRole('research').maxTokens;
export const getResearchTemperature = () => modelConfig.getParametersForRole('research').temperature;

export const getFallbackProvider = () => modelConfig.getModel('fallback').provider;
export const getFallbackModelId = () => modelConfig.getModel('fallback').modelId;
export const getFallbackMaxTokens = () => modelConfig.getParametersForRole('fallback').maxTokens;
export const getFallbackTemperature = () => modelConfig.getParametersForRole('fallback').temperature;

// Guidant-specific role getters
export const getAnalysisProvider = () => modelConfig.getModel('analysis').provider;
export const getAnalysisModelId = () => modelConfig.getModel('analysis').modelId;
export const getAnalysisMaxTokens = () => modelConfig.getParametersForRole('analysis').maxTokens;
export const getAnalysisTemperature = () => modelConfig.getParametersForRole('analysis').temperature;

export const getGenerationProvider = () => modelConfig.getModel('generation').provider;
export const getGenerationModelId = () => modelConfig.getModel('generation').modelId;
export const getGenerationMaxTokens = () => modelConfig.getParametersForRole('generation').maxTokens;
export const getGenerationTemperature = () => modelConfig.getParametersForRole('generation').temperature;

// Constants export
export { VALID_PROVIDERS, SUPPORTED_MODELS, PROVIDERS, DEFAULT_MODELS };

/**
 * Factory function to create new ModelConfig instances
 * Useful for testing or project-specific configurations
 * @param {string} projectRoot - Project root directory
 * @returns {ModelConfig} New ModelConfig instance
 */
export const createModelConfig = (projectRoot) => new ModelConfig(projectRoot);
