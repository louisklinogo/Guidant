/**
 * AI-Powered Capability Analysis for Guidant Evolution
 * Intelligently discovers and assesses Claude's capabilities based on available tools
 * Enhanced with environment-based model configuration
 */

import { createProviderConfig, getParametersForRole } from '../config/models.js';

/**
 * AI-powered capability analyzer that understands modern development workflows
 * Now uses Guidant's enhanced model configuration system
 */
class AICapabilityAnalyzer {
  constructor(role = 'analysis', options = {}) {
    try {
      // Use Guidant's model configuration system
      const config = createProviderConfig(role);
      const parameters = getParametersForRole(role);

      this.apiKey = config.key;
      this.model = config.model;
      this.baseUrl = config.baseUrl;
      this.provider = config.provider;
      this.role = role;

      // Use role-specific parameters
      this.maxTokens = parameters.maxTokens;
      this.temperature = parameters.temperature;

      // Allow manual overrides for backward compatibility
      if (options.apiKey) this.apiKey = options.apiKey;
      if (options.model) this.model = options.model;
      if (options.baseUrl) this.baseUrl = options.baseUrl;

    } catch (error) {
      console.warn(`Failed to load model configuration for role '${role}':`, error.message);

      // Fallback to legacy behavior for backward compatibility
      this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
      this.model = options.model || 'google/gemini-2.0-flash-exp:free';
      this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
      this.provider = 'openrouter';
      this.role = role;
      this.maxTokens = 1500;
      this.temperature = 0.3;
    }
  }

  /**
   * Analyze Claude's capabilities intelligently based on available tools
   */
  async analyzeCapabilities(availableTools, projectContext) {
    const prompt = this.buildCapabilityPrompt(availableTools, projectContext);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/louisklinogo/Guidant',
          'X-Title': 'Guidant Evolution Capability Analysis'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert system architect analyzing AI agent capabilities. Your job is to assess what a Claude AI agent can accomplish given specific tools, considering modern development workflows and tool synergies.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseCapabilityResponse(data.choices[0].message.content);
      
    } catch (error) {
      console.error('AI capability analysis failed:', error);
      return this.fallbackCapabilityAnalysis(availableTools);
    }
  }

  /**
   * Build intelligent prompt for capability analysis
   */
  buildCapabilityPrompt(availableTools, projectContext) {
    return `
CLAUDE AI AGENT CAPABILITY ANALYSIS

Claude has access to these tools:
${availableTools.map(tool => `- ${tool}`).join('\n')}

PROJECT CONTEXT:
- Type: ${projectContext.projectType || 'AI Workflow Framework'}
- Phase: ${projectContext.currentPhase || 'concept'}
- Files: ${projectContext.existingFiles?.slice(0, 10).join(', ') || 'New project'}

ANALYSIS REQUIREMENTS:
Assess Claude's capabilities across these roles, considering MODERN development workflows:

1. **RESEARCH CAPABILITIES**
   - Context7 (get-library-docs, resolve-library-id) should be CORE for technical research
   - Tavily should be REQUIRED, not optional, for real-time research
   - Web search combinations for comprehensive analysis
   - Confidence based on tool synergies

2. **DESIGN CAPABILITIES** 
   - Mermaid for system diagrams, workflows, architecture
   - File tools for wireframe creation and documentation
   - Integration with research findings

3. **DEVELOPMENT CAPABILITIES**
   - Git tools are ESSENTIAL for any real development (version control, collaboration)
   - Code generation, testing, debugging capabilities
   - File management and project organization

4. **TESTING CAPABILITIES**
   - Playwright should be included for E2E testing and browser automation
   - Testing frameworks and quality assurance
   - Integration testing capabilities

5. **DEPLOYMENT CAPABILITIES**
   - Environment setup and configuration
   - CI/CD considerations with Git integration
   - Monitoring and maintenance

IMPORTANT: Assess TOOL COMBINATIONS and SYNERGIES. For example:
- Context7 + Tavily = powerful research capabilities
- Git + file tools = complete development workflow
- Playwright + development tools = comprehensive testing

RESPONSE FORMAT (JSON):
{
  "overallCapability": {
    "canHandleModernWorkflow": true/false,
    "missingCriticalTools": ["tool1", "tool2"],
    "strengths": ["area1", "area2"],
    "limitations": ["limitation1"]
  },
  "roleCapabilities": {
    "research": {
      "canFulfill": true/false,
      "confidence": 0.0-1.0,
      "coreTools": ["tool1", "tool2"],
      "capabilities": ["specific_capability1", "specific_capability2"],
      "reasoning": "Why this confidence level"
    },
    "design": {
      "canFulfill": true/false,
      "confidence": 0.0-1.0,
      "coreTools": ["tool1", "tool2"],
      "capabilities": ["specific_capability1", "specific_capability2"],
      "reasoning": "Why this confidence level"
    },
    "development": {
      "canFulfill": true/false,
      "confidence": 0.0-1.0,
      "coreTools": ["tool1", "tool2"],
      "capabilities": ["specific_capability1", "specific_capability2"],
      "reasoning": "Why this confidence level"
    },
    "testing": {
      "canFulfill": true/false,
      "confidence": 0.0-1.0,
      "coreTools": ["tool1", "tool2"],
      "capabilities": ["specific_capability1", "specific_capability2"],
      "reasoning": "Why this confidence level"
    },
    "deployment": {
      "canFulfill": true/false,
      "confidence": 0.0-1.0,
      "coreTools": ["tool1", "tool2"],
      "capabilities": ["specific_capability1", "specific_capability2"],
      "reasoning": "Why this confidence level"
    }
  },
  "recommendations": {
    "strongSuits": ["What Claude excels at with these tools"],
    "cautions": ["What might be challenging"],
    "optimalWorkflow": ["Suggested approach for best results"]
  }
}`;
  }

  /**
   * Parse AI response into structured capability assessment
   */
  parseCapabilityResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const capabilities = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          aiGenerated: true,
          capabilities,
          discoveredAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to parse AI capability response:', error);
    }

    // Fallback parsing
    return {
      success: true,
      aiGenerated: true,
      capabilities: this.extractCapabilitiesFromText(content),
      discoveredAt: new Date().toISOString()
    };
  }

  /**
   * Extract capabilities from text when JSON parsing fails
   */
  extractCapabilitiesFromText(content) {
    return {
      overallCapability: {
        canHandleModernWorkflow: content.includes('modern') || content.includes('capable'),
        missingCriticalTools: [],
        strengths: ['AI-analyzed capabilities'],
        limitations: ['Parsed from text response']
      },
      roleCapabilities: {
        research: { canFulfill: true, confidence: 0.7, coreTools: [], capabilities: [], reasoning: 'Extracted from AI analysis' },
        design: { canFulfill: true, confidence: 0.7, coreTools: [], capabilities: [], reasoning: 'Extracted from AI analysis' },
        development: { canFulfill: true, confidence: 0.7, coreTools: [], capabilities: [], reasoning: 'Extracted from AI analysis' },
        testing: { canFulfill: true, confidence: 0.6, coreTools: [], capabilities: [], reasoning: 'Extracted from AI analysis' },
        deployment: { canFulfill: true, confidence: 0.6, coreTools: [], capabilities: [], reasoning: 'Extracted from AI analysis' }
      },
      recommendations: {
        strongSuits: ['Context-aware analysis'],
        cautions: ['Response parsing limitations'],
        optimalWorkflow: ['Use AI-generated insights']
      }
    };
  }

  /**
   * Fallback capability analysis when AI fails
   */
  fallbackCapabilityAnalysis(availableTools) {
    const hasGit = availableTools.some(tool => tool.toLowerCase().includes('git'));
    const hasTavily = availableTools.includes('tavily-search');
    const hasContext7 = availableTools.some(tool => tool.includes('library-docs') || tool.includes('resolve-library'));
    const hasPlaywright = availableTools.some(tool => tool.toLowerCase().includes('playwright'));
    const hasFileTools = availableTools.some(tool => ['create_file', 'edit_file', 'read_file'].includes(tool));
    const hasMermaid = availableTools.includes('mermaid');

    return {
      success: false,
      aiGenerated: false,
      capabilities: {
        overallCapability: {
          canHandleModernWorkflow: hasGit && hasTavily && hasFileTools,
          missingCriticalTools: [
            ...(!hasGit ? ['git'] : []),
            ...(!hasTavily ? ['tavily-search'] : []),
            ...(!hasContext7 ? ['get-library-docs'] : []),
            ...(!hasPlaywright ? ['playwright'] : [])
          ],
          strengths: [
            ...(hasFileTools ? ['File manipulation'] : []),
            ...(hasTavily ? ['Web research'] : []),
            ...(hasMermaid ? ['Diagram creation'] : [])
          ],
          limitations: ['Static analysis fallback']
        },
        roleCapabilities: {
          research: {
            canFulfill: hasTavily && hasContext7,
            confidence: (hasTavily ? 0.4 : 0) + (hasContext7 ? 0.4 : 0) + 0.2,
            coreTools: ['tavily-search', 'get-library-docs', 'web_search'],
            capabilities: ['market_research', 'technical_research', 'competitor_analysis'],
            reasoning: 'Based on research tool availability'
          },
          design: {
            canFulfill: hasMermaid && hasFileTools,
            confidence: (hasMermaid ? 0.5 : 0.2) + (hasFileTools ? 0.3 : 0) + 0.2,
            coreTools: ['mermaid', 'create_file', 'edit_file'],
            capabilities: ['wireframing', 'system_diagrams', 'documentation'],
            reasoning: 'Based on design tool availability'
          },
          development: {
            canFulfill: hasFileTools && hasGit,
            confidence: (hasFileTools ? 0.4 : 0.1) + (hasGit ? 0.4 : 0) + 0.2,
            coreTools: ['create_file', 'edit_file', 'git', 'Bash'],
            capabilities: ['code_generation', 'debugging', 'version_control'],
            reasoning: 'Based on development tool availability'
          },
          testing: {
            canFulfill: hasFileTools && hasPlaywright,
            confidence: (hasFileTools ? 0.3 : 0.1) + (hasPlaywright ? 0.4 : 0) + 0.2,
            coreTools: ['playwright', 'create_file', 'Bash'],
            capabilities: ['e2e_testing', 'browser_automation', 'test_creation'],
            reasoning: 'Based on testing tool availability'
          },
          deployment: {
            canFulfill: hasGit && hasFileTools,
            confidence: (hasGit ? 0.3 : 0.1) + (hasFileTools ? 0.3 : 0.1) + 0.2,
            coreTools: ['git', 'Bash', 'create_file'],
            capabilities: ['environment_setup', 'deployment_scripts', 'configuration'],
            reasoning: 'Based on deployment tool availability'
          }
        },
        recommendations: {
          strongSuits: hasFileTools ? ['File-based development'] : ['Limited capabilities'],
          cautions: ['Missing modern tools may limit effectiveness'],
          optimalWorkflow: ['Focus on available tool strengths']
        }
      },
      discoveredAt: new Date().toISOString()
    };
  }
}

/**
 * Enhanced capability discovery with multi-provider AI analysis
 * Now uses Guidant's model configuration system
 */
export async function discoverCapabilitiesWithAI(availableTools, projectRoot) {
  // Gather project context
  const projectContext = await gatherProjectContextForCapabilities(projectRoot);

  // Try different roles in order of preference for analysis tasks
  const roles = ['analysis', 'main', 'fallback'];

  // Try each role configuration
  for (const role of roles) {
    try {
      console.log(`Analyzing capabilities using '${role}' role configuration...`);
      const analyzer = new AICapabilityAnalyzer(role);

      // Check if we have a valid API key for this configuration
      if (!analyzer.apiKey) {
        console.warn(`No API key available for '${role}' role (${analyzer.provider}), trying next...`);
        continue;
      }

      const result = await analyzer.analyzeCapabilities(availableTools, projectContext);

      if (result.success) {
        console.log(`✅ Capability analysis completed using '${role}' role (${analyzer.provider})`);
        return result;
      }
    } catch (error) {
      console.warn(`'${role}' role failed for capability analysis:`, error.message);
      continue;
    }
  }

  // Enhanced fallback
  console.warn('All configured providers failed, using enhanced fallback capability analysis');
  const analyzer = new AICapabilityAnalyzer('fallback');
  return analyzer.fallbackCapabilityAnalysis(availableTools);
}

/**
 * Gather project context for capability analysis
 */
async function gatherProjectContextForCapabilities(projectRoot) {
  try {
    const { glob } = await import('glob');
    const { getProjectState } = await import('../file-management/project-structure.js');
    
    const projectFiles = await glob('**/*.{js,ts,json,md}', {
      cwd: projectRoot,
      ignore: ['node_modules/**', '.git/**', '.guidant/**']
    });

    const projectState = await getProjectState(projectRoot);

    return {
      projectType: projectState.config?.description || 'AI Workflow Framework',
      currentPhase: projectState.phases?.current,
      existingFiles: projectFiles.slice(0, 15), // Limit for prompt size
      hasTests: projectFiles.some(f => f.includes('test')),
      hasPackageJson: projectFiles.includes('package.json'),
      hasDocs: projectFiles.some(f => f.endsWith('.md'))
    };
  } catch (error) {
    console.error('Failed to gather project context for capabilities:', error);
    return {
      projectType: 'Unknown',
      currentPhase: 'concept',
      existingFiles: [],
      hasTests: false,
      hasPackageJson: false,
      hasDocs: false
    };
  }
}
