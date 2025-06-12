/**
 * AI Capability Discovery System
 * Discovers what tools AI assistant has available and maps them to appropriate tasks
 */

import { readProjectFile, writeProjectFile } from '../file-management/project-structure.js';
import { AI_CAPABILITIES } from '../constants/paths.js';

/**
 * Standard tool categories and their requirements
 */
export const TOOL_CATEGORIES = {
  research: {
    required: ['tavily-search', 'tavily-extract', 'tavily-crawl', 'get-library-docs', 'resolve-library-id', 'web_search', 'read_web_page'],
    optional: [],
    capabilities: ['market_research', 'competitor_analysis', 'user_research', 'technical_research', 'library_documentation']
  },
  
  design: {
    required: ['create_file', 'edit_file', 'mermaid'],
    optional: ['read_file', 'tavily-search'],
    capabilities: ['wireframing', 'user_flows', 'component_specs', 'system_diagrams', 'architecture_design']
  },
  
  development: {
    required: ['create_file', 'edit_file', 'read_file', 'Bash'],
    optional: ['git', 'get_diagnostics', 'format_file'],
    capabilities: ['code_generation', 'testing', 'debugging', 'build_management', 'version_control', 'code_quality']
  },
  
  testing: {
    required: ['create_file', 'edit_file', 'Bash'],
    optional: ['playwright', 'get_diagnostics', 'git'],
    capabilities: ['unit_testing', 'e2e_testing', 'browser_automation', 'test_frameworks', 'quality_assurance']
  },
  
  deployment: {
    required: ['create_file', 'edit_file', 'Bash'],
    optional: ['git', 'web_search', 'get_diagnostics'],
    capabilities: ['environment_setup', 'hosting_configuration', 'monitoring_setup', 'ci_cd', 'deployment_automation']
  }
};

import { discoverCapabilitiesWithAI } from '../ai-integration/capability-analyzer.js';

/**
 * Discover and analyze AI assistant capabilities with AI enhancement
 */
export async function discoverCapabilities(availableTools, projectRoot = process.cwd(), options = {}) {
  const toolNames = availableTools.map(tool => typeof tool === 'string' ? tool : tool.name);

  // Only skip AI analysis in explicit test environments or when explicitly disabled
  const skipAI = options.skipAI || (
    (process.env.NODE_ENV === 'test' ||
     process.env.GUIDANT_TEST_MODE === 'true' ||
     process.env.CI === 'true') &&
    process.env.GUIDANT_FORCE_AI !== 'true'
  );

  if (!skipAI) {
    // Try AI-enhanced capability discovery first
    const aiResult = await discoverCapabilitiesWithAI(toolNames, projectRoot);

    if (aiResult.success) {
      // Convert AI format to legacy format for compatibility
      const enhancedCapabilities = convertAICapabilitiesToLegacyFormat(aiResult.capabilities, toolNames);

      // Store capabilities for future reference
      await writeProjectFile(AI_CAPABILITIES, enhancedCapabilities, projectRoot);

      return enhancedCapabilities;
    }
  }

  // Fallback to original logic (used in tests or when AI fails)
  const capabilities = {
    tools: availableTools,
    toolNames,
    roles: analyzeRoleCapabilities(toolNames),
    limitations: identifyLimitations(toolNames),
    discoveredAt: new Date().toISOString(),
    aiEnhanced: false
  };

  // Store capabilities for future reference
  await writeProjectFile(AI_CAPABILITIES, capabilities, projectRoot);

  return capabilities;
}

/**
 * Convert AI-discovered capabilities to legacy format for compatibility
 */
function convertAICapabilitiesToLegacyFormat(aiCapabilities, toolNames) {
  const roles = {};
  
  Object.entries(aiCapabilities.roleCapabilities).forEach(([roleName, roleData]) => {
    roles[roleName] = {
      canFulfill: roleData.canFulfill,
      confidence: roleData.confidence,
      missingRequired: [], // AI analysis doesn't use this concept
      availableOptional: roleData.coreTools || [],
      capabilities: roleData.capabilities,
      reasoning: roleData.reasoning
    };
  });

  return {
    tools: toolNames,
    toolNames,
    roles,
    limitations: aiCapabilities.overallCapability.limitations,
    discoveredAt: new Date().toISOString(),
    aiEnhanced: true,
    overallCapability: aiCapabilities.overallCapability,
    recommendations: aiCapabilities.recommendations
  };
}

/**
 * Analyze which roles the AI can fulfill based on available tools
 */
function analyzeRoleCapabilities(toolNames) {
  const roleCapabilities = {};
  
  for (const [category, requirements] of Object.entries(TOOL_CATEGORIES)) {
    const hasRequired = requirements.required.every(tool => toolNames.includes(tool));
    const optionalCount = requirements.optional.filter(tool => toolNames.includes(tool)).length;
    
    // Calculate confidence, handling case where there are no optional tools
    const optionalRatio = requirements.optional.length > 0 ?
      (optionalCount / requirements.optional.length) : 1.0;

    roleCapabilities[category] = {
      canFulfill: hasRequired,
      confidence: hasRequired ? (0.5 + optionalRatio * 0.5) : 0,
      missingRequired: requirements.required.filter(tool => !toolNames.includes(tool)),
      availableOptional: requirements.optional.filter(tool => toolNames.includes(tool)),
      capabilities: hasRequired ? requirements.capabilities : []
    };
  }
  
  return roleCapabilities;
}

/**
 * Identify specific limitations based on missing tools
 */
function identifyLimitations(toolNames) {
  const limitations = [];
  
  // Research limitations
  if (!toolNames.includes('tavily-search') && !toolNames.includes('web_search')) {
    limitations.push({
      category: 'research',
      issue: 'No advanced search capabilities',
      impact: 'Limited to basic web research'
    });
  }
  
  // Development limitations  
  if (!toolNames.includes('Bash')) {
    limitations.push({
      category: 'development',
      issue: 'No command line access',
      impact: 'Cannot run build tools or package managers'
    });
  }
  
  // Design limitations
  if (!toolNames.includes('mermaid')) {
    limitations.push({
      category: 'design',
      issue: 'No diagram generation',
      impact: 'Limited to text-based design documentation'
    });
  }
  
  return limitations;
}

/**
 * Generate task recommendations based on capabilities
 */
export function generateTaskRecommendations(capabilities) {
  const recommendations = {
    strongSuits: [],
    possibleWithLimitations: [],
    notRecommended: []
  };
  
  for (const [role, analysis] of Object.entries(capabilities.roles)) {
    if (analysis.confidence >= 0.8) {
      recommendations.strongSuits.push({
        role,
        reason: `High capability with ${analysis.availableOptional.length} optional tools available`
      });
    } else if (analysis.canFulfill && analysis.confidence >= 0.5) {
      recommendations.possibleWithLimitations.push({
        role,
        reason: `Can fulfill basic requirements but missing ${analysis.availableOptional.length - analysis.missingRequired.length} optional tools`
      });
    } else {
      recommendations.notRecommended.push({
        role,
        reason: `Missing required tools: ${analysis.missingRequired.join(', ')}`
      });
    }
  }
  
  return recommendations;
}

/**
 * Create tool-specific task instructions
 */
export function generateToolInstructions(taskType, availableTools) {
  const toolNames = availableTools.map(tool => typeof tool === 'string' ? tool : tool.name);
  
  const instructions = {
    taskType,
    availableTools: toolNames,
    steps: [],
    alternatives: []
  };
  
  // Generate specific instructions based on task type and available tools
  switch (taskType) {
    case 'market_research':
      if (toolNames.includes('tavily-search')) {
        instructions.steps.push('Use tavily-search for comprehensive market analysis');
        instructions.steps.push('Search for competitor analysis and market trends');
      } else if (toolNames.includes('web_search')) {
        instructions.steps.push('Use web_search for basic market research');
        instructions.alternatives.push('Consider upgrading to Tavily for more comprehensive results');
      }
      break;
      
    case 'wireframe_creation':
      instructions.steps.push('Use create_file to generate ASCII wireframes');
      instructions.steps.push('Create detailed component specifications in markdown');
      if (toolNames.includes('mermaid')) {
        instructions.steps.push('Use mermaid for user flow diagrams');
      } else {
        instructions.alternatives.push('User flows will be text-based without diagram tool');
      }
      break;
      
    case 'code_implementation':
      instructions.steps.push('Use create_file and edit_file for code generation');
      if (toolNames.includes('Bash')) {
        instructions.steps.push('Use Bash for package management and build processes');
      } else {
        instructions.alternatives.push('Manual dependency management - provide installation instructions');
      }
      break;
  }
  
  return instructions;
}

/**
 * Validate if AI can handle a specific task
 */
export function validateTaskCapability(taskType, capabilities) {
  const categoryMap = {
    'market_research': 'research',
    'competitor_analysis': 'research', 
    'wireframe_creation': 'design',
    'user_flow_design': 'design',
    'code_implementation': 'development',
    'testing_setup': 'development',
    'deployment_setup': 'deployment'
  };
  
  const category = categoryMap[taskType];
  if (!category) {
    return { canHandle: false, reason: 'Unknown task type' };
  }
  
  const roleCapability = capabilities.roles[category];
  if (!roleCapability) {
    return { canHandle: false, reason: 'Category not analyzed' };
  }
  
  return {
    canHandle: roleCapability.canFulfill,
    confidence: roleCapability.confidence,
    reason: roleCapability.canFulfill 
      ? `Can handle with ${Math.round(roleCapability.confidence * 100)}% confidence`
      : `Missing required tools: ${roleCapability.missingRequired.join(', ')}`
  };
}
