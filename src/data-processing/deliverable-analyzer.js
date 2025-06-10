/**
 * Deliverable Content Analyzer for Guidant Evolution
 * Parses and extracts insights from completed deliverables to enable
 * content-aware task generation and phase transitions.
 * 
 * BACKEND-001: Core component for enhanced workflow orchestration
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { getModel, createProviderConfig, getParametersForRole } from '../config/models.js';

/**
 * Main class for analyzing deliverable content with hybrid AI enhancement
 */
export class DeliverableContentAnalyzer {
  constructor(projectRoot = process.cwd(), options = {}) {
    this.projectRoot = projectRoot;
    this.options = {
      aiEnhancementEnabled: options.aiEnhancementEnabled ?? true,
      aiProvider: options.aiProvider || 'auto', // 'auto', 'analysis', 'main', 'disabled'
      fallbackToRules: options.fallbackToRules ?? true,
      maxAIRetries: options.maxAIRetries || 2,
      aiTimeout: options.aiTimeout || 10000, // 10 seconds
      // Legacy model configuration options (for backward compatibility)
      openrouterModel: options.openrouterModel,
      perplexityModel: options.perplexityModel,
      customProviders: options.customProviders || [],
      ...options
    };

    this.contentParsers = new Map([
      ['.md', this.parseMarkdown.bind(this)],
      ['.json', this.parseJSON.bind(this)],
      ['.txt', this.parseText.bind(this)]
    ]);

    this.ruleBasedExtractors = new Map([
      ['market_analysis', this.extractMarketInsights.bind(this)],
      ['user_personas', this.extractPersonaInsights.bind(this)],
      ['competitor_research', this.extractCompetitorInsights.bind(this)],
      ['prd_complete', this.extractPRDInsights.bind(this)],
      ['user_stories', this.extractUserStoryInsights.bind(this)],
      ['wireframes', this.extractDesignInsights.bind(this)],
      ['system_design', this.extractArchitectureInsights.bind(this)]
    ]);

    // AI providers configuration - now flexible and configurable
    this.aiProviders = this.buildAIProviders();
  }

  /**
   * Build AI providers configuration using Guidant's model configuration system
   * @returns {Array} Array of AI provider configurations
   */
  buildAIProviders() {
    const providers = [];

    // Try to build providers from Guidant's model configuration
    try {
      // Determine which roles to try based on options
      const rolesToTry = this.options.aiProvider === 'auto'
        ? ['analysis', 'main', 'fallback']
        : [this.options.aiProvider];

      for (const role of rolesToTry) {
        try {
          const config = createProviderConfig(role);
          const parameters = getParametersForRole(role);

          providers.push({
            name: `${config.name} (${role})`,
            key: config.key,
            model: config.model,
            endpoint: config.endpoint,
            role: role,
            provider: config.provider,
            temperature: parameters.temperature,
            maxTokens: parameters.maxTokens
          });
        } catch (error) {
          console.warn(`Failed to configure '${role}' role:`, error.message);
          continue;
        }
      }
    } catch (error) {
      console.warn('Failed to use Guidant model configuration, falling back to legacy:', error.message);
    }

    // Legacy fallback: Build providers the old way if no Guidant config available
    if (providers.length === 0) {
      // OpenRouter provider (if API key available)
      if (process.env.OPENROUTER_API_KEY) {
        providers.push({
          name: 'OpenRouter (Legacy)',
          key: process.env.OPENROUTER_API_KEY,
          model: this.options.openrouterModel || 'google/gemini-2.5-flash-preview-05-20',
          endpoint: 'https://openrouter.ai/api/v1/chat/completions',
          temperature: 0.1,
          maxTokens: 2000
        });
      }

      // Perplexity provider (if API key available)
      if (process.env.PERPLEXITY_API_KEY) {
        providers.push({
          name: 'Perplexity (Legacy)',
          key: process.env.PERPLEXITY_API_KEY,
          model: this.options.perplexityModel || 'llama-3.1-sonar-large-128k-online',
          endpoint: 'https://api.perplexity.ai/chat/completions',
          temperature: 0.1,
          maxTokens: 2000
        });
      }
    }

    // Add custom providers from options
    if (this.options.customProviders && this.options.customProviders.length > 0) {
      providers.push(...this.options.customProviders);
    }

    return providers;
  }

  /**
   * Get available AI models for a specific provider
   * @param {string} providerName - Name of the provider ('OpenRouter', 'Perplexity')
   * @returns {Array} Array of supported model names
   */
  getAvailableModels(providerName) {
    const provider = this.aiProviders.find(p => p.name === providerName);
    return provider ? provider.supportedModels || [] : [];
  }

  /**
   * Set AI model for a specific provider
   * @param {string} providerName - Name of the provider
   * @param {string} modelName - Model to use
   * @returns {boolean} True if model was set successfully
   */
  setAIModel(providerName, modelName) {
    const provider = this.aiProviders.find(p => p.name === providerName);
    if (!provider) {
      console.warn(`Provider ${providerName} not found`);
      return false;
    }

    if (provider.supportedModels && !provider.supportedModels.includes(modelName)) {
      console.warn(`Model ${modelName} not supported by ${providerName}`);
      console.log(`Supported models: ${provider.supportedModels.join(', ')}`);
      return false;
    }

    provider.model = modelName;
    console.log(`✅ Set ${providerName} model to: ${modelName}`);
    return true;
  }

  /**
   * Get current AI model configuration
   * @returns {object} Current model configuration for all providers
   */
  getCurrentModels() {
    return this.aiProviders.reduce((models, provider) => {
      models[provider.name] = {
        current: provider.model,
        supported: provider.supportedModels || []
      };
      return models;
    }, {});
  }

  /**
   * Add custom AI provider
   * @param {object} providerConfig - Custom provider configuration
   * @returns {boolean} True if provider was added successfully
   */
  addCustomProvider(providerConfig) {
    const required = ['name', 'key', 'model', 'endpoint'];
    const missing = required.filter(field => !providerConfig[field]);

    if (missing.length > 0) {
      console.error(`Missing required fields for custom provider: ${missing.join(', ')}`);
      return false;
    }

    // Check if provider already exists
    if (this.aiProviders.find(p => p.name === providerConfig.name)) {
      console.warn(`Provider ${providerConfig.name} already exists`);
      return false;
    }

    this.aiProviders.push(providerConfig);
    console.log(`✅ Added custom provider: ${providerConfig.name}`);
    return true;
  }

  /**
   * Analyze a single deliverable file
   * @param {string} deliverablePath - Path to the deliverable file
   * @param {string} deliverableType - Type of deliverable (e.g., 'market_analysis')
   * @returns {object} Analysis result with content, insights, and metadata
   */
  async analyzeDeliverable(deliverablePath, deliverableType = null) {
    try {
      // Validate file exists
      await fs.access(deliverablePath);
      
      const extension = path.extname(deliverablePath).toLowerCase();
      const parser = this.contentParsers.get(extension);
      
      if (!parser) {
        throw new Error(`No parser available for ${extension} files`);
      }

      // Read and parse content
      const content = await fs.readFile(deliverablePath, 'utf8');
      const parsed = await parser(content, deliverablePath);
      
      // Extract insights based on deliverable type
      const insights = await this.extractInsights(parsed, deliverableType, deliverablePath);
      
      // Generate metadata
      const metadata = await this.generateMetadata(parsed, deliverablePath);
      
      // Identify relationships
      const relationships = await this.identifyRelationships(parsed, deliverableType);

      return {
        success: true,
        path: deliverablePath,
        type: deliverableType,
        content: parsed,
        insights,
        metadata,
        relationships,
        analyzedAt: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        path: deliverablePath,
        error: error.message,
        analyzedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Parse Markdown content
   * @param {string} content - Raw markdown content
   * @param {string} filePath - File path for context
   * @returns {object} Parsed content structure
   */
  async parseMarkdown(content, filePath) {
    const lines = content.split('\n');
    const structure = {
      type: 'markdown',
      title: this.extractTitle(lines),
      headings: this.extractHeadings(lines),
      sections: this.extractSections(lines),
      lists: this.extractLists(lines),
      keyPoints: this.extractKeyPoints(lines),
      rawContent: content,
      wordCount: content.split(/\s+/).length,
      lineCount: lines.length
    };

    return structure;
  }

  /**
   * Parse JSON content
   * @param {string} content - Raw JSON content
   * @param {string} filePath - File path for context
   * @returns {object} Parsed JSON structure
   */
  async parseJSON(content, filePath) {
    try {
      const data = JSON.parse(content);
      return {
        type: 'json',
        data,
        keys: Object.keys(data),
        structure: this.analyzeJSONStructure(data),
        rawContent: content,
        size: content.length
      };
    } catch (error) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse plain text content
   * @param {string} content - Raw text content
   * @param {string} filePath - File path for context
   * @returns {object} Parsed text structure
   */
  async parseText(content, filePath) {
    const lines = content.split('\n').filter(line => line.trim());
    return {
      type: 'text',
      lines,
      paragraphs: content.split('\n\n').filter(p => p.trim()),
      keyPoints: this.extractKeyPoints(lines),
      rawContent: content,
      wordCount: content.split(/\s+/).length,
      lineCount: lines.length
    };
  }

  /**
   * Extract insights from parsed content with hybrid AI enhancement
   * @param {object} parsed - Parsed content structure
   * @param {string} deliverableType - Type of deliverable
   * @param {string} filePath - File path for context
   * @returns {object} Extracted insights
   */
  async extractInsights(parsed, deliverableType, filePath) {
    // Always start with rule-based extraction (fast, reliable)
    const ruleBasedInsights = await this.extractRuleBasedInsights(parsed, deliverableType, filePath);

    // Enhance with AI if enabled and available
    if (this.options.aiEnhancementEnabled && this.hasAvailableAIProvider()) {
      try {
        const aiInsights = await this.extractAIInsights(parsed, deliverableType, filePath);
        return this.mergeInsights(ruleBasedInsights, aiInsights);
      } catch (error) {
        console.warn(`AI insight extraction failed: ${error.message}`);
        if (this.options.fallbackToRules) {
          console.log('Falling back to rule-based insights');
          return ruleBasedInsights;
        }
        throw error;
      }
    }

    return ruleBasedInsights;
  }

  /**
   * Extract insights using rule-based methods (original implementation)
   * @param {object} parsed - Parsed content structure
   * @param {string} deliverableType - Type of deliverable
   * @param {string} filePath - File path for context
   * @returns {object} Rule-based insights
   */
  async extractRuleBasedInsights(parsed, deliverableType, filePath) {
    const extractor = this.ruleBasedExtractors.get(deliverableType);

    if (extractor) {
      return await extractor(parsed, filePath);
    }

    // Generic insight extraction
    return this.extractGenericInsights(parsed);
  }

  /**
   * Check if AI enhancement is available
   * @returns {boolean} True if AI provider is available
   */
  hasAvailableAIProvider() {
    if (this.options.aiProvider === 'disabled') return false;

    return this.aiProviders.some(provider =>
      provider.key && provider.key.trim().length > 0
    );
  }

  /**
   * Extract insights using AI enhancement
   * @param {object} parsed - Parsed content structure
   * @param {string} deliverableType - Type of deliverable
   * @param {string} filePath - File path for context
   * @returns {object} AI-enhanced insights
   */
  async extractAIInsights(parsed, deliverableType, filePath) {
    const availableProviders = this.aiProviders.filter(p => p.key);

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // Try providers in order
    for (const provider of availableProviders) {
      try {
        console.log(`Enhancing insights with ${provider.name}...`);
        return await this.callAIProvider(provider, parsed, deliverableType);
      } catch (error) {
        console.warn(`${provider.name} failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  /**
   * Call AI provider for insight extraction
   * @param {object} provider - AI provider configuration
   * @param {object} parsed - Parsed content
   * @param {string} deliverableType - Type of deliverable
   * @returns {object} AI insights
   */
  async callAIProvider(provider, parsed, deliverableType) {
    const prompt = this.buildAIPrompt(parsed, deliverableType);

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`,
        ...(provider.name === 'OpenRouter' && {
          'HTTP-Referer': 'https://guidant.dev',
          'X-Title': 'Guidant AI Workflow Orchestrator'
        })
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert analyst helping extract insights from project deliverables. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: provider.temperature || 0.1,
        max_tokens: provider.maxTokens || 2000
      }),
      signal: AbortSignal.timeout(this.options.aiTimeout)
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    return this.parseAIResponse(content, deliverableType);
  }

  /**
   * Build AI prompt for insight extraction
   * @param {object} parsed - Parsed content
   * @param {string} deliverableType - Type of deliverable
   * @returns {string} AI prompt
   */
  buildAIPrompt(parsed, deliverableType) {
    const content = parsed.rawContent || JSON.stringify(parsed.data || parsed);
    const contentPreview = content.length > 3000 ? content.substring(0, 3000) + '...' : content;

    return `Analyze this ${deliverableType} deliverable and extract structured insights.

DELIVERABLE TYPE: ${deliverableType}
CONTENT:
${contentPreview}

Extract insights in this JSON format:
{
  "type": "${deliverableType}",
  "keyFindings": ["finding1", "finding2"],
  "painPoints": ["pain1", "pain2"],
  "opportunities": ["opp1", "opp2"],
  "targetAudience": ["audience1", "audience2"],
  "features": ["feature1", "feature2"],
  "requirements": ["req1", "req2"],
  "userStories": ["story1", "story2"],
  "acceptanceCriteria": ["criteria1", "criteria2"],
  "personas": [{"name": "PersonaName", "needs": ["need1"], "painPoints": ["pain1"]}],
  "competitors": ["comp1", "comp2"],
  "technologies": ["tech1", "tech2"],
  "components": ["comp1", "comp2"],
  "confidence": 0.95,
  "aiGenerated": true
}

Focus on extracting meaningful, actionable insights. Include only fields relevant to the deliverable type.
Respond with valid JSON only.`;
  }

  /**
   * Parse AI response into structured insights
   * @param {string} content - AI response content
   * @param {string} deliverableType - Type of deliverable
   * @returns {object} Parsed insights
   */
  parseAIResponse(content, deliverableType) {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return {
          ...insights,
          type: deliverableType,
          aiGenerated: true,
          extractedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON:', error.message);
    }

    // Fallback: extract insights from text response
    return this.extractInsightsFromText(content, deliverableType);
  }

  /**
   * Merge rule-based and AI insights
   * @param {object} ruleBasedInsights - Insights from rule-based extraction
   * @param {object} aiInsights - Insights from AI extraction
   * @returns {object} Merged insights
   */
  mergeInsights(ruleBasedInsights, aiInsights) {
    const merged = {
      ...ruleBasedInsights,
      aiEnhanced: true,
      aiConfidence: aiInsights.confidence || 0.8,
      enhancedAt: new Date().toISOString()
    };

    // Merge arrays, removing duplicates
    const arrayFields = [
      'keyFindings', 'painPoints', 'opportunities', 'targetAudience',
      'features', 'requirements', 'userStories', 'acceptanceCriteria',
      'competitors', 'technologies', 'components'
    ];

    for (const field of arrayFields) {
      if (ruleBasedInsights[field] && aiInsights[field]) {
        const combined = [...ruleBasedInsights[field], ...aiInsights[field]];
        merged[field] = [...new Set(combined)]; // Remove duplicates
      } else if (aiInsights[field]) {
        merged[field] = aiInsights[field];
      }
    }

    // Handle personas specially (objects, not strings)
    if (aiInsights.personas && Array.isArray(aiInsights.personas)) {
      merged.personas = [
        ...(ruleBasedInsights.personas || []),
        ...aiInsights.personas
      ];
    }

    return merged;
  }

  /**
   * Extract insights from AI text response (fallback)
   * @param {string} content - AI text response
   * @param {string} deliverableType - Type of deliverable
   * @returns {object} Extracted insights
   */
  extractInsightsFromText(content, deliverableType) {
    const insights = {
      type: deliverableType,
      aiGenerated: true,
      textExtracted: true,
      keyFindings: [],
      painPoints: [],
      opportunities: []
    };

    // Extract bullet points and key phrases
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const point = trimmed.substring(2);
        if (point.toLowerCase().includes('pain') || point.toLowerCase().includes('problem')) {
          insights.painPoints.push(point);
        } else if (point.toLowerCase().includes('opportunity') || point.toLowerCase().includes('potential')) {
          insights.opportunities.push(point);
        } else {
          insights.keyFindings.push(point);
        }
      }
    }

    return insights;
  }

  /**
   * Extract market analysis insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Market insights
   */
  async extractMarketInsights(parsed, filePath) {
    const insights = {
      type: 'market_analysis',
      keyFindings: [],
      marketSize: null,
      targetAudience: [],
      painPoints: [],
      opportunities: [],
      competitiveAdvantages: []
    };

    if (parsed.type === 'markdown') {
      // Extract key findings from headings and bullet points
      insights.keyFindings = this.findContentByKeywords(parsed, [
        'key findings', 'findings', 'insights', 'conclusions'
      ]);
      
      insights.painPoints = this.findContentByKeywords(parsed, [
        'pain points', 'problems', 'challenges', 'issues'
      ]);
      
      insights.opportunities = this.findContentByKeywords(parsed, [
        'opportunities', 'gaps', 'potential', 'market gap'
      ]);
      
      insights.targetAudience = this.findContentByKeywords(parsed, [
        'target audience', 'users', 'customers', 'personas'
      ]);
    }

    return insights;
  }

  /**
   * Extract user persona insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Persona insights
   */
  async extractPersonaInsights(parsed, filePath) {
    const insights = {
      type: 'user_personas',
      personas: [],
      commonNeeds: [],
      behaviorPatterns: [],
      demographics: {}
    };

    if (parsed.type === 'markdown') {
      // Look for persona sections - exclude main "User Personas" heading
      const personaSections = parsed.sections.filter(section =>
        (section.heading.toLowerCase().includes('persona') && section.level > 1) ||
        section.heading.match(/^[A-Z][a-z]+ \(/)) // Pattern like "Sarah (Product Manager)"

      insights.personas = personaSections.map(section => ({
        name: section.heading,
        content: section.content,
        needs: this.findContentByKeywords({ sections: [section] }, ['needs', 'wants', 'goals']),
        painPoints: this.findContentByKeywords({ sections: [section] }, ['pain', 'frustration', 'problem'])
      }));

      insights.commonNeeds = this.findContentByKeywords(parsed, [
        'common needs', 'shared needs', 'all users need'
      ]);
    }

    return insights;
  }

  /**
   * Extract competitor research insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Competitor insights
   */
  async extractCompetitorInsights(parsed, filePath) {
    const insights = {
      type: 'competitor_research',
      competitors: [],
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      marketPosition: []
    };

    if (parsed.type === 'markdown') {
      insights.competitors = this.findContentByKeywords(parsed, [
        'competitor', 'competition', 'rival', 'alternative'
      ]);

      insights.strengths = this.findContentByKeywords(parsed, [
        'strengths', 'advantages', 'strong points', 'benefits'
      ]);

      insights.weaknesses = this.findContentByKeywords(parsed, [
        'weaknesses', 'disadvantages', 'limitations', 'gaps'
      ]);

      insights.opportunities = this.findContentByKeywords(parsed, [
        'opportunities', 'market gaps', 'potential', 'openings'
      ]);
    }

    return insights;
  }

  /**
   * Extract PRD insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} PRD insights
   */
  async extractPRDInsights(parsed, filePath) {
    const insights = {
      type: 'prd_complete',
      features: [],
      requirements: [],
      userStories: [],
      acceptanceCriteria: [],
      technicalRequirements: []
    };

    if (parsed.type === 'markdown') {
      insights.features = this.findContentByKeywords(parsed, [
        'features', 'functionality', 'capabilities'
      ]);

      insights.requirements = this.findContentByKeywords(parsed, [
        'requirements', 'must have', 'shall', 'should'
      ]);

      insights.userStories = this.findContentByKeywords(parsed, [
        'user story', 'as a user', 'as a', 'user stories'
      ]);

      insights.acceptanceCriteria = this.findContentByKeywords(parsed, [
        'acceptance criteria', 'acceptance', 'criteria', 'definition of done'
      ]);
    }

    return insights;
  }

  /**
   * Extract user story insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} User story insights
   */
  async extractUserStoryInsights(parsed, filePath) {
    const insights = {
      type: 'user_stories',
      stories: [],
      actors: [],
      goals: [],
      acceptanceCriteria: []
    };

    if (parsed.type === 'markdown') {
      insights.stories = this.findContentByKeywords(parsed, [
        'as a', 'i want', 'so that', 'user story'
      ]);

      insights.actors = this.findContentByKeywords(parsed, [
        'as a user', 'as a customer', 'as a admin', 'as a manager'
      ]);

      insights.goals = this.findContentByKeywords(parsed, [
        'i want', 'i need', 'i would like'
      ]);
    }

    return insights;
  }

  /**
   * Extract design insights from wireframes
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Design insights
   */
  async extractDesignInsights(parsed, filePath) {
    const insights = {
      type: 'wireframes',
      components: [],
      userFlows: [],
      interactions: [],
      layouts: []
    };

    if (parsed.type === 'markdown') {
      insights.components = this.findContentByKeywords(parsed, [
        'component', 'button', 'form', 'navigation', 'header', 'footer'
      ]);

      insights.userFlows = this.findContentByKeywords(parsed, [
        'user flow', 'workflow', 'journey', 'navigation flow'
      ]);

      insights.interactions = this.findContentByKeywords(parsed, [
        'click', 'hover', 'interaction', 'behavior', 'action'
      ]);
    }

    return insights;
  }

  /**
   * Extract architecture insights
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Architecture insights
   */
  async extractArchitectureInsights(parsed, filePath) {
    const insights = {
      type: 'system_design',
      components: [],
      technologies: [],
      patterns: [],
      integrations: [],
      performance: []
    };

    if (parsed.type === 'markdown') {
      insights.components = this.findContentByKeywords(parsed, [
        'component', 'service', 'module', 'layer', 'tier'
      ]);

      insights.technologies = this.findContentByKeywords(parsed, [
        'technology', 'framework', 'library', 'database', 'api'
      ]);

      insights.patterns = this.findContentByKeywords(parsed, [
        'pattern', 'architecture', 'design pattern', 'mvc', 'microservice'
      ]);
    }

    return insights;
  }

  /**
   * Generate metadata for the deliverable
   * @param {object} parsed - Parsed content
   * @param {string} filePath - File path
   * @returns {object} Metadata
   */
  async generateMetadata(parsed, filePath) {
    const stats = await fs.stat(filePath);
    const content = parsed.rawContent || JSON.stringify(parsed.data || parsed);
    
    return {
      filePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      lastModified: stats.mtime.toISOString(),
      contentHash: createHash('md5').update(content).digest('hex'),
      contentType: parsed.type,
      wordCount: parsed.wordCount || 0,
      complexity: this.calculateComplexity(parsed),
      completeness: this.assessCompleteness(parsed)
    };
  }

  /**
   * Identify relationships with other deliverables
   * @param {object} parsed - Parsed content
   * @param {string} deliverableType - Type of deliverable
   * @returns {object} Relationships
   */
  async identifyRelationships(parsed, deliverableType) {
    const relationships = {
      references: [],
      influences: [],
      dependencies: []
    };

    // Look for references to other deliverables or phases
    const content = parsed.rawContent || JSON.stringify(parsed.data || parsed);
    const deliverableKeywords = [
      'market analysis', 'user personas', 'competitor research',
      'prd', 'user stories', 'wireframes', 'system design'
    ];

    for (const keyword of deliverableKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        relationships.references.push(keyword);
      }
    }

    return relationships;
  }

  // Helper methods for content extraction and analysis
  extractTitle(lines) {
    const titleLine = lines.find(line => line.startsWith('# '));
    return titleLine ? titleLine.substring(2).trim() : null;
  }

  extractHeadings(lines) {
    return lines
      .filter(line => line.match(/^#{1,6}\s/))
      .map(line => ({
        level: line.match(/^#+/)[0].length,
        text: line.replace(/^#+\s/, '').trim()
      }));
  }

  extractSections(lines) {
    const sections = [];
    let currentSection = null;

    for (const line of lines) {
      if (line.match(/^#{1,6}\s/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: line.replace(/^#+\s/, '').trim(),
          level: line.match(/^#+/)[0].length,
          content: []
        };
      } else if (currentSection && line.trim()) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  extractLists(lines) {
    return lines
      .filter(line => line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/))
      .map(line => line.replace(/^[\s]*[-*+\d.]\s/, '').trim());
  }

  extractKeyPoints(lines) {
    // Extract bullet points, numbered lists, and emphasized text
    const keyPoints = [];
    
    for (const line of lines) {
      if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
        keyPoints.push(line.replace(/^[\s]*[-*+\d.]\s/, '').trim());
      } else if (line.includes('**') || line.includes('*')) {
        // Extract emphasized text
        const emphasized = line.match(/\*\*([^*]+)\*\*/g) || line.match(/\*([^*]+)\*/g);
        if (emphasized) {
          keyPoints.push(...emphasized.map(e => e.replace(/\*/g, '')));
        }
      }
    }
    
    return keyPoints;
  }

  findContentByKeywords(parsed, keywords) {
    const content = [];
    const searchText = parsed.rawContent || JSON.stringify(parsed.data || parsed);
    
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[^\\n]*`, 'gi');
      const matches = searchText.match(regex);
      if (matches) {
        content.push(...matches);
      }
    }
    
    return content;
  }

  analyzeJSONStructure(data) {
    const structure = {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: [],
      depth: 0
    };

    if (typeof data === 'object' && data !== null) {
      structure.keys = Object.keys(data);
      structure.depth = this.calculateObjectDepth(data);
    }

    return structure;
  }

  calculateObjectDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const currentDepth = this.calculateObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  calculateComplexity(parsed) {
    let complexity = 0;
    
    if (parsed.wordCount) complexity += Math.min(parsed.wordCount / 100, 10);
    if (parsed.sections) complexity += parsed.sections.length;
    if (parsed.headings) complexity += parsed.headings.length;
    if (parsed.structure && parsed.structure.depth) complexity += parsed.structure.depth;
    
    return Math.round(complexity);
  }

  assessCompleteness(parsed) {
    let score = 0;
    
    if (parsed.title || (parsed.headings && parsed.headings.length > 0)) score += 25;
    if (parsed.wordCount > 100 || (parsed.data && Object.keys(parsed.data).length > 0)) score += 25;
    if (parsed.sections && parsed.sections.length > 2) score += 25;
    if (parsed.keyPoints && parsed.keyPoints.length > 3) score += 25;
    
    return score;
  }

  /**
   * Extract generic insights when no specific extractor is available
   * @param {object} parsed - Parsed content
   * @returns {object} Generic insights
   */
  extractGenericInsights(parsed) {
    return {
      type: 'generic',
      keyPoints: parsed.keyPoints || [],
      mainTopics: parsed.headings ? parsed.headings.map(h => h.text) : [],
      contentSummary: this.generateContentSummary(parsed),
      actionItems: this.extractActionItems(parsed)
    };
  }

  generateContentSummary(parsed) {
    if (parsed.type === 'markdown' && parsed.sections.length > 0) {
      return parsed.sections.slice(0, 3).map(section => 
        `${section.heading}: ${section.content.slice(0, 2).join(' ')}`
      ).join('; ');
    }
    
    if (parsed.type === 'json' && parsed.data) {
      return `JSON data with ${Object.keys(parsed.data).length} main properties`;
    }
    
    return 'Content analyzed successfully';
  }

  extractActionItems(parsed) {
    const actionKeywords = ['todo', 'action', 'next steps', 'implement', 'build', 'create'];
    const content = parsed.rawContent || JSON.stringify(parsed.data || parsed);
    const actionItems = [];
    
    for (const keyword of actionKeywords) {
      const regex = new RegExp(`${keyword}[^\\n]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        actionItems.push(...matches);
      }
    }
    
    return actionItems;
  }
}

/**
 * Convenience function to analyze a single deliverable
 * @param {string} deliverablePath - Path to deliverable file
 * @param {string} deliverableType - Type of deliverable
 * @param {string} projectRoot - Project root directory
 * @param {object} options - Analysis options (AI enhancement, etc.)
 * @returns {object} Analysis result
 */
export async function analyzeDeliverable(deliverablePath, deliverableType = null, projectRoot = process.cwd(), options = {}) {
  const analyzer = new DeliverableContentAnalyzer(projectRoot, options);
  return await analyzer.analyzeDeliverable(deliverablePath, deliverableType);
}

/**
 * Convenience function to analyze with AI enhancement enabled
 * @param {string} deliverablePath - Path to deliverable file
 * @param {string} deliverableType - Type of deliverable
 * @param {string} projectRoot - Project root directory
 * @returns {object} AI-enhanced analysis result
 */
export async function analyzeDeliverableWithAI(deliverablePath, deliverableType = null, projectRoot = process.cwd()) {
  const analyzer = new DeliverableContentAnalyzer(projectRoot, {
    aiEnhancementEnabled: true,
    fallbackToRules: true
  });
  return await analyzer.analyzeDeliverable(deliverablePath, deliverableType);
}

/**
 * Analyze all deliverables in a phase directory
 * @param {string} phaseDirectory - Path to phase directory
 * @param {string} projectRoot - Project root directory
 * @returns {object} Analysis results for all deliverables
 */
export async function analyzePhaseDeliverables(phaseDirectory, projectRoot = process.cwd()) {
  const analyzer = new DeliverableContentAnalyzer(projectRoot);
  const results = {
    phase: path.basename(phaseDirectory),
    deliverables: [],
    summary: {
      total: 0,
      successful: 0,
      failed: 0
    }
  };

  try {
    const files = await fs.readdir(phaseDirectory);
    
    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files
      
      const filePath = path.join(phaseDirectory, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const deliverableType = path.basename(file, path.extname(file));
        const result = await analyzer.analyzeDeliverable(filePath, deliverableType);
        
        results.deliverables.push(result);
        results.summary.total++;
        
        if (result.success) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      }
    }
    
    return results;
    
  } catch (error) {
    return {
      ...results,
      error: error.message
    };
  }
}
