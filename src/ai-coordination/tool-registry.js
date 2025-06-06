/**
 * Universal Tool Registry for TaskMaster Evolution
 * Defines capabilities and requirements for any AI tool across all platforms
 */

/**
 * Comprehensive tool registry with capabilities, categories, and requirements
 */
export const UNIVERSAL_TOOL_REGISTRY = {
  // File Management Tools
  "create_file": {
    category: "file_management",
    capabilities: ["code_generation", "documentation", "configuration", "scripting"],
    description: "Create new files with content",
    required_for: ["development", "design", "documentation"],
    alternatives: ["write_file", "save_file", "file_create"],
    confidence_boost: 0.3
  },
  
  "edit_file": {
    category: "file_management", 
    capabilities: ["code_modification", "refactoring", "bug_fixing", "content_update"],
    description: "Modify existing files",
    required_for: ["development", "maintenance", "iteration"],
    alternatives: ["modify_file", "update_file", "file_edit"],
    confidence_boost: 0.4
  },
  
  "read_file": {
    category: "file_management",
    capabilities: ["code_analysis", "documentation_review", "debugging", "understanding"],
    description: "Read and analyze file contents",
    required_for: ["development", "research", "debugging"],
    alternatives: ["get_file", "file_read", "cat"],
    confidence_boost: 0.2
  },

  "list_directory": {
    category: "file_management",
    capabilities: ["project_exploration", "structure_analysis", "file_discovery"],
    description: "List files and directories",
    required_for: ["project_analysis", "navigation"],
    alternatives: ["ls", "dir", "list_files"],
    confidence_boost: 0.1
  },

  // Research & Documentation Tools
  "web_search": {
    category: "research",
    capabilities: ["market_research", "trend_analysis", "general_research"],
    description: "Search the web for information",
    required_for: ["research", "trend_analysis"],
    alternatives: ["search", "google_search", "bing_search"],
    confidence_boost: 0.2
  },

  "tavily-search": {
    category: "research",
    capabilities: ["real_time_research", "comprehensive_search", "fact_verification"],
    description: "Advanced AI-powered web search",
    required_for: ["research", "market_analysis", "competitive_analysis"],
    alternatives: ["perplexity_search", "ai_search"],
    confidence_boost: 0.4
  },

  "get-library-docs": {
    category: "research",
    capabilities: ["technical_documentation", "api_reference", "implementation_guidance"],
    description: "Fetch library documentation",
    required_for: ["technical_research", "implementation_planning"],
    alternatives: ["fetch_docs", "library_docs", "api_docs"],
    confidence_boost: 0.3
  },

  "resolve-library-id": {
    category: "research", 
    capabilities: ["dependency_resolution", "library_discovery", "version_management"],
    description: "Resolve library identifiers",
    required_for: ["dependency_management", "library_selection"],
    alternatives: ["find_library", "resolve_package"],
    confidence_boost: 0.2
  },

  // Development Tools
  "git": {
    category: "version_control",
    capabilities: ["version_control", "collaboration", "branch_management", "deployment"],
    description: "Git version control system",
    required_for: ["development", "collaboration", "deployment"],
    alternatives: ["github", "gitlab", "version_control"],
    confidence_boost: 0.5
  },

  "bash": {
    category: "execution",
    capabilities: ["script_execution", "build_management", "system_interaction", "automation"],
    description: "Command line execution",
    required_for: ["development", "testing", "deployment", "automation"],
    alternatives: ["shell", "cmd", "terminal", "command_line"],
    confidence_boost: 0.4
  },

  "get_diagnostics": {
    category: "debugging",
    capabilities: ["error_analysis", "code_quality", "debugging", "health_monitoring"],
    description: "Get system and code diagnostics",
    required_for: ["debugging", "quality_assurance"],
    alternatives: ["lint", "check", "diagnose"],
    confidence_boost: 0.3
  },

  // Testing Tools
  "playwright": {
    category: "testing",
    capabilities: ["e2e_testing", "browser_automation", "ui_testing", "integration_testing"],
    description: "Browser automation and testing",
    required_for: ["testing", "qa", "browser_testing"],
    alternatives: ["selenium", "cypress", "puppeteer"],
    confidence_boost: 0.6
  },

  "jest": {
    category: "testing",
    capabilities: ["unit_testing", "test_framework", "mock_testing", "coverage"],
    description: "JavaScript testing framework",
    required_for: ["testing", "quality_assurance"],
    alternatives: ["mocha", "vitest", "ava", "tap"],
    confidence_boost: 0.4
  },

  // Design & Visualization
  "mermaid": {
    category: "visualization",
    capabilities: ["diagram_creation", "system_design", "workflow_visualization", "architecture"],
    description: "Create diagrams and flowcharts",
    required_for: ["design", "documentation", "architecture"],
    alternatives: ["plantuml", "draw_io", "lucidchart"],
    confidence_boost: 0.5
  },

  // AI & Research Enhancement
  "anthropic_claude": {
    category: "ai_integration",
    capabilities: ["code_analysis", "intelligent_assistance", "content_generation"],
    description: "Claude AI integration",
    required_for: ["ai_assistance", "intelligent_automation"],
    alternatives: ["openai_gpt", "github_copilot"],
    confidence_boost: 0.3
  },

  // Database Tools
  "database_query": {
    category: "database",
    capabilities: ["data_management", "query_execution", "schema_design"],
    description: "Database operations",
    required_for: ["data_management", "backend_development"],
    alternatives: ["sql", "mongodb", "postgres", "mysql"],
    confidence_boost: 0.4
  },

  // Deployment Tools  
  "docker": {
    category: "deployment",
    capabilities: ["containerization", "deployment", "environment_management"],
    description: "Container management",
    required_for: ["deployment", "environment_setup"],
    alternatives: ["podman", "kubernetes"],
    confidence_boost: 0.5
  },

  "aws_cli": {
    category: "deployment",
    capabilities: ["cloud_deployment", "infrastructure_management", "scaling"],
    description: "AWS cloud operations",
    required_for: ["cloud_deployment", "infrastructure"],
    alternatives: ["gcp_cli", "azure_cli", "terraform"],
    confidence_boost: 0.4
  }
};

/**
 * Role requirements mapped to tool categories
 */
export const ROLE_REQUIREMENTS = {
  research: {
    essential: ["research"],
    important: ["file_management"],
    optional: ["ai_integration"],
    minimum_confidence: 0.7
  },
  
  design: {
    essential: ["file_management", "visualization"],
    important: ["research"],
    optional: ["ai_integration"],
    minimum_confidence: 0.6
  },
  
  development: {
    essential: ["file_management", "execution"],
    important: ["version_control", "debugging"],
    optional: ["ai_integration", "database"],
    minimum_confidence: 0.7
  },
  
  testing: {
    essential: ["file_management", "testing", "execution"],
    important: ["debugging"],
    optional: ["version_control"],
    minimum_confidence: 0.8
  },
  
  deployment: {
    essential: ["execution", "deployment"],
    important: ["version_control", "file_management"],
    optional: ["debugging"],
    minimum_confidence: 0.8
  }
};

/**
 * Get tool information by name (handles alternatives)
 */
export function getToolInfo(toolName) {
  // Direct match
  if (UNIVERSAL_TOOL_REGISTRY[toolName]) {
    return UNIVERSAL_TOOL_REGISTRY[toolName];
  }
  
  // Search alternatives
  for (const [registryTool, info] of Object.entries(UNIVERSAL_TOOL_REGISTRY)) {
    if (info.alternatives?.includes(toolName)) {
      return { ...info, canonical_name: registryTool, provided_as: toolName };
    }
  }
  
  // Unknown tool
  return {
    category: "unknown",
    capabilities: ["unknown_capability"],
    description: `Unknown tool: ${toolName}`,
    required_for: [],
    alternatives: [],
    confidence_boost: 0.1
  };
}

/**
 * Analyze tool coverage for a specific role
 */
export function analyzeRoleCoverage(availableTools, roleName) {
  const requirements = ROLE_REQUIREMENTS[roleName];
  if (!requirements) {
    return { canFulfill: false, confidence: 0, reason: "Unknown role" };
  }

  const toolsByCategory = {};
  let totalConfidenceBoost = 0;
  
  // Categorize available tools
  availableTools.forEach(toolName => {
    const toolInfo = getToolInfo(toolName);
    const category = toolInfo.category;
    
    if (!toolsByCategory[category]) {
      toolsByCategory[category] = [];
    }
    toolsByCategory[category].push({
      name: toolName,
      info: toolInfo
    });
    totalConfidenceBoost += toolInfo.confidence_boost;
  });

  // Check essential requirements
  const missingEssential = requirements.essential.filter(
    category => !toolsByCategory[category] || toolsByCategory[category].length === 0
  );
  
  if (missingEssential.length > 0) {
    return {
      canFulfill: false,
      confidence: Math.min(0.3, totalConfidenceBoost / 10),
      reason: `Missing essential tools for categories: ${missingEssential.join(', ')}`,
      missingEssential,
      availableCategories: Object.keys(toolsByCategory)
    };
  }

  // Calculate confidence based on coverage
  let confidence = 0.4; // Base confidence for meeting essentials
  
  // Boost for important categories
  requirements.important.forEach(category => {
    if (toolsByCategory[category]) {
      confidence += 0.15;
    }
  });
  
  // Boost for optional categories  
  requirements.optional.forEach(category => {
    if (toolsByCategory[category]) {
      confidence += 0.1;
    }
  });
  
  // Tool quality boost
  confidence += Math.min(0.3, totalConfidenceBoost / 5);
  
  confidence = Math.min(1.0, confidence);
  
  return {
    canFulfill: confidence >= requirements.minimum_confidence,
    confidence,
    reason: `Coverage analysis complete`,
    toolsByCategory,
    essentialCovered: requirements.essential.filter(cat => toolsByCategory[cat]),
    importantCovered: requirements.important.filter(cat => toolsByCategory[cat]),
    optionalCovered: requirements.optional.filter(cat => toolsByCategory[cat])
  };
}

/**
 * Identify missing tools for optimal role performance
 */
export function identifyOptimalTools(availableTools, targetRole) {
  const requirements = ROLE_REQUIREMENTS[targetRole];
  if (!requirements) return [];

  const coverage = analyzeRoleCoverage(availableTools, targetRole);
  const suggestions = [];

  // Suggest tools for missing essential categories
  if (coverage.missingEssential) {
    coverage.missingEssential.forEach(category => {
      const bestTool = findBestToolForCategory(category);
      if (bestTool) {
        suggestions.push({
          tool: bestTool.name,
          category,
          priority: "essential",
          reason: `Required for ${targetRole} role`,
          confidence_impact: bestTool.confidence_boost
        });
      }
    });
  }

  // Suggest important tools not covered
  requirements.important.forEach(category => {
    if (!coverage.toolsByCategory?.[category]) {
      const bestTool = findBestToolForCategory(category);
      if (bestTool) {
        suggestions.push({
          tool: bestTool.name,
          category,
          priority: "important", 
          reason: `Significantly improves ${targetRole} capabilities`,
          confidence_impact: bestTool.confidence_boost
        });
      }
    }
  });

  return suggestions.sort((a, b) => {
    if (a.priority === "essential" && b.priority !== "essential") return -1;
    if (b.priority === "essential" && a.priority !== "essential") return 1;
    return b.confidence_impact - a.confidence_impact;
  });
}

/**
 * Find the best tool for a given category
 */
function findBestToolForCategory(category) {
  const toolsInCategory = Object.entries(UNIVERSAL_TOOL_REGISTRY)
    .filter(([_, info]) => info.category === category)
    .sort((a, b) => b[1].confidence_boost - a[1].confidence_boost);
    
  return toolsInCategory.length > 0 ? 
    { name: toolsInCategory[0][0], ...toolsInCategory[0][1] } : 
    null;
}
