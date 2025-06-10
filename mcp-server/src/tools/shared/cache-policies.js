/**
 * Cache Policies for MCP Tools
 * Configurable caching strategies for different tool types and operations
 * 
 * MCP-008: Tool Caching System Implementation
 */

/**
 * Cache Policy Types
 */
export const CachePolicyType = {
  TTL: 'ttl',                    // Time-based expiration
  FILE_BASED: 'file_based',      // Invalidate when files change
  PROJECT_BASED: 'project_based', // Invalidate when project changes
  MANUAL: 'manual',              // Manual invalidation only
  HYBRID: 'hybrid'               // Combination of strategies
};

/**
 * Default cache policies for different tool categories
 */
export const DEFAULT_CACHE_POLICIES = {
  // Agent discovery - cache for 30 minutes (external API calls)
  agent_discovery: {
    type: CachePolicyType.TTL,
    ttl: 30 * 60 * 1000, // 30 minutes
    maxEntries: 50,
    enabled: true,
    description: 'Cache agent discovery results to reduce external API calls'
  },
  
  // Project classification - cache until project structure changes
  project_classification: {
    type: CachePolicyType.HYBRID,
    ttl: 24 * 60 * 60 * 1000, // 24 hours max
    watchFiles: ['.guidant/project.json', 'package.json', 'README.md'],
    maxEntries: 20,
    enabled: true,
    description: 'Cache project classification until project structure changes'
  },
  
  // Deliverable analysis - cache until file changes
  deliverable_analysis: {
    type: CachePolicyType.FILE_BASED,
    ttl: 60 * 60 * 1000, // 1 hour fallback
    maxEntries: 100,
    enabled: true,
    description: 'Cache deliverable analysis until source files change'
  },
  
  // Quality validation - cache until file or rules change
  quality_validation: {
    type: CachePolicyType.HYBRID,
    ttl: 30 * 60 * 1000, // 30 minutes
    watchFiles: [], // Will be set dynamically based on deliverable
    maxEntries: 200,
    enabled: true,
    description: 'Cache quality validation results until files or rules change'
  },
  
  // Workflow intelligence - cache for moderate duration
  workflow_intelligence: {
    type: CachePolicyType.TTL,
    ttl: 15 * 60 * 1000, // 15 minutes
    maxEntries: 30,
    enabled: true,
    description: 'Cache workflow intelligence for moderate duration'
  },
  
  // File operations - short cache for recent operations
  file_operations: {
    type: CachePolicyType.TTL,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    enabled: true,
    description: 'Short-term cache for file operation results'
  },
  
  // External API calls - longer cache with fallback
  external_api: {
    type: CachePolicyType.TTL,
    ttl: 60 * 60 * 1000, // 1 hour
    maxEntries: 100,
    enabled: true,
    staleWhileRevalidate: true,
    description: 'Cache external API calls with stale-while-revalidate strategy'
  }
};

/**
 * Tool-specific cache policies
 * Override category defaults for specific tools
 */
export const TOOL_SPECIFIC_POLICIES = {
  // Project classification - very important to cache
  'guidant_classify_project': {
    type: CachePolicyType.HYBRID,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    watchFiles: ['.guidant/project.json', 'package.json', 'README.md', 'src/**/*'],
    maxEntries: 10,
    enabled: true,
    priority: 'high',
    description: 'Cache project classification with file watching'
  },
  
  // Agent discovery - external API calls
  'guidant_discover_agent': {
    type: CachePolicyType.TTL,
    ttl: 45 * 60 * 1000, // 45 minutes
    maxEntries: 30,
    enabled: true,
    staleWhileRevalidate: true,
    description: 'Cache agent discovery with longer TTL'
  },
  
  // Quality validation - file-based invalidation
  'guidant_validate_content': {
    type: CachePolicyType.HYBRID,
    ttl: 60 * 60 * 1000, // 1 hour fallback
    maxEntries: 150,
    enabled: true,
    dynamicFileWatching: true,
    description: 'Cache validation with dynamic file watching'
  },
  
  // Workflow management - moderate caching
  'guidant_manage_adaptive_workflow': {
    type: CachePolicyType.TTL,
    ttl: 20 * 60 * 1000, // 20 minutes
    maxEntries: 25,
    enabled: true,
    description: 'Cache workflow management operations'
  },
  
  // Quality management - short-term caching
  'guidant_quality_management': {
    type: CachePolicyType.TTL,
    ttl: 10 * 60 * 1000, // 10 minutes
    maxEntries: 40,
    enabled: true,
    description: 'Short-term cache for quality management'
  },
  
  // File operations - very short cache
  'guidant_save_deliverable': {
    type: CachePolicyType.TTL,
    ttl: 2 * 60 * 1000, // 2 minutes
    maxEntries: 20,
    enabled: false, // Disabled by default for write operations
    description: 'Very short cache for file save operations'
  },
  
  // Project state - cache until project changes
  'guidant_get_project_state': {
    type: CachePolicyType.HYBRID,
    ttl: 30 * 60 * 1000, // 30 minutes
    watchFiles: ['.guidant/**/*'],
    maxEntries: 15,
    enabled: true,
    description: 'Cache project state with Guidant file watching'
  }
};

/**
 * Cache invalidation triggers
 * Define what events should invalidate specific caches
 */
export const INVALIDATION_TRIGGERS = {
  // Project structure changes
  project_structure: {
    patterns: ['guidant_classify_project', 'guidant_get_project_state'],
    files: ['package.json', 'README.md', '.guidant/project.json'],
    description: 'Invalidate when project structure changes'
  },
  
  // Source code changes
  source_code: {
    patterns: ['guidant_validate_content', 'deliverable_analysis'],
    files: ['src/**/*', 'lib/**/*', '*.js', '*.ts', '*.py'],
    description: 'Invalidate when source code changes'
  },
  
  // Configuration changes
  configuration: {
    patterns: ['guidant_quality_management', 'workflow_intelligence'],
    files: ['.guidant/**/*', 'config/**/*', '*.config.js'],
    description: 'Invalidate when configuration changes'
  },
  
  // Deliverable changes
  deliverables: {
    patterns: ['guidant_validate_content', 'deliverable_analysis'],
    files: ['deliverables/**/*', 'docs/**/*', '*.md'],
    description: 'Invalidate when deliverables change'
  }
};

/**
 * Cache Policy Manager
 * Manages cache policies and provides policy resolution for tools
 */
export class CachePolicyManager {
  constructor() {
    this.policies = new Map();
    this.customPolicies = new Map();
    this.loadDefaultPolicies();
  }

  /**
   * Load default cache policies
   */
  loadDefaultPolicies() {
    // Load category defaults
    Object.entries(DEFAULT_CACHE_POLICIES).forEach(([category, policy]) => {
      this.policies.set(`category:${category}`, policy);
    });
    
    // Load tool-specific policies
    Object.entries(TOOL_SPECIFIC_POLICIES).forEach(([toolName, policy]) => {
      this.policies.set(`tool:${toolName}`, policy);
    });
  }

  /**
   * Get cache policy for a specific tool
   * @param {string} toolName - Name of the tool
   * @param {string} category - Tool category
   * @returns {object} Cache policy configuration
   */
  getPolicyForTool(toolName, category = 'deliverable_analysis') {
    // Check for tool-specific policy first
    const toolPolicy = this.policies.get(`tool:${toolName}`);
    if (toolPolicy) {
      return { ...toolPolicy, toolName };
    }
    
    // Check for custom policy
    const customPolicy = this.customPolicies.get(toolName);
    if (customPolicy) {
      return { ...customPolicy, toolName };
    }
    
    // Fall back to category policy
    const categoryPolicy = this.policies.get(`category:${category}`);
    if (categoryPolicy) {
      return { ...categoryPolicy, toolName };
    }
    
    // Ultimate fallback
    return {
      ...DEFAULT_CACHE_POLICIES.deliverable_analysis,
      toolName
    };
  }

  /**
   * Set custom policy for a tool
   * @param {string} toolName - Tool name
   * @param {object} policy - Cache policy
   */
  setToolPolicy(toolName, policy) {
    this.customPolicies.set(toolName, policy);
  }

  /**
   * Check if caching is enabled for a tool
   * @param {string} toolName - Tool name
   * @param {string} category - Tool category
   * @returns {boolean} True if caching is enabled
   */
  isCachingEnabled(toolName, category) {
    const policy = this.getPolicyForTool(toolName, category);
    return policy.enabled !== false;
  }

  /**
   * Get cache TTL for a tool
   * @param {string} toolName - Tool name
   * @param {string} category - Tool category
   * @returns {number} TTL in milliseconds
   */
  getTTL(toolName, category) {
    const policy = this.getPolicyForTool(toolName, category);
    return policy.ttl || 30 * 60 * 1000; // 30 minutes default
  }

  /**
   * Get files to watch for a tool
   * @param {string} toolName - Tool name
   * @param {string} category - Tool category
   * @param {object} params - Tool parameters (may contain file paths)
   * @returns {Array} Array of file paths to watch
   */
  getWatchFiles(toolName, category, params = {}) {
    const policy = this.getPolicyForTool(toolName, category);
    let watchFiles = policy.watchFiles || [];
    
    // Add dynamic file watching based on parameters
    if (policy.dynamicFileWatching && params.deliverablePath) {
      watchFiles = [...watchFiles, params.deliverablePath];
    }
    
    if (params.projectRoot) {
      watchFiles = watchFiles.map(file => 
        file.startsWith('/') ? file : `${params.projectRoot}/${file}`
      );
    }
    
    return watchFiles;
  }

  /**
   * Determine cache options for a tool operation
   * @param {string} toolName - Tool name
   * @param {object} params - Tool parameters
   * @param {string} category - Tool category
   * @returns {object} Cache options
   */
  getCacheOptions(toolName, params = {}, category) {
    const policy = this.getPolicyForTool(toolName, category);
    
    if (!policy.enabled) {
      return { enabled: false };
    }
    
    const watchFiles = this.getWatchFiles(toolName, category, params);
    
    return {
      enabled: true,
      ttl: policy.ttl,
      watchFiles,
      metadata: {
        policy: policy.type,
        priority: policy.priority || 'normal',
        description: policy.description
      },
      staleWhileRevalidate: policy.staleWhileRevalidate || false
    };
  }

  /**
   * Get invalidation patterns for file changes
   * @param {string} filePath - Changed file path
   * @returns {Array} Array of tool patterns to invalidate
   */
  getInvalidationPatterns(filePath) {
    const patterns = [];
    
    Object.entries(INVALIDATION_TRIGGERS).forEach(([trigger, config]) => {
      const matches = config.files.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(filePath);
        }
        return filePath.includes(pattern);
      });
      
      if (matches) {
        patterns.push(...config.patterns);
      }
    });
    
    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Get all policies (for debugging/monitoring)
   * @returns {object} All policies and configurations
   */
  getAllPolicies() {
    return {
      defaultPolicies: DEFAULT_CACHE_POLICIES,
      toolSpecificPolicies: TOOL_SPECIFIC_POLICIES,
      customPolicies: Object.fromEntries(this.customPolicies),
      invalidationTriggers: INVALIDATION_TRIGGERS
    };
  }

  /**
   * Reset all policies to defaults
   */
  reset() {
    this.policies.clear();
    this.customPolicies.clear();
    this.loadDefaultPolicies();
  }
}

// Export singleton instance
export const cachePolicyManager = new CachePolicyManager();
