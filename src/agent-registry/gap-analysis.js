/**
 * Gap Analysis System for TaskMaster Evolution
 * Analyzes missing capabilities and suggests optimal tool configurations
 */

import { UNIVERSAL_TOOL_REGISTRY, ROLE_REQUIREMENTS, identifyOptimalTools } from '../ai-coordination/tool-registry.js';

/**
 * Comprehensive gap analysis for AI agents
 */
export class GapAnalyzer {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Perform comprehensive gap analysis for an agent
   */
  async analyzeCapabilityGaps(agentInfo, targetProjects = []) {
    const cacheKey = `${agentInfo.id}_${JSON.stringify(targetProjects)}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const analysis = {
      agentId: agentInfo.id,
      analyzedAt: new Date().toISOString(),
      currentTools: agentInfo.normalizedTools || agentInfo.tools || [],
      roleGaps: {},
      projectGaps: {},
      prioritizedRecommendations: [],
      totalGapScore: 0
    };

    // Analyze gaps for each role
    const roles = Object.keys(ROLE_REQUIREMENTS);
    roles.forEach(role => {
      analysis.roleGaps[role] = this.analyzeRoleGap(analysis.currentTools, role);
    });

    // Analyze gaps for specific projects
    if (targetProjects.length > 0) {
      targetProjects.forEach(project => {
        analysis.projectGaps[project.name] = this.analyzeProjectGap(analysis.currentTools, project);
      });
    }

    // Generate prioritized recommendations
    analysis.prioritizedRecommendations = this.generatePrioritizedRecommendations(analysis);

    // Calculate total gap score
    analysis.totalGapScore = this.calculateGapScore(analysis);

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analyze gaps for a specific role
   */
  analyzeRoleGap(currentTools, role) {
    const requirements = ROLE_REQUIREMENTS[role];
    if (!requirements) {
      return { error: `Unknown role: ${role}` };
    }

    const gap = {
      role,
      canCurrentlyFulfill: false,
      currentConfidence: 0,
      maxPossibleConfidence: 1.0,
      missingEssentialCategories: [],
      missingImportantCategories: [],
      missingOptionalCategories: [],
      recommendedTools: [],
      confidenceImpact: {}
    };

    // Check current coverage
    const coverage = this.analyzeCategoryCoverage(currentTools, requirements);
    gap.canCurrentlyFulfill = coverage.canFulfill;
    gap.currentConfidence = coverage.confidence;

    // Identify missing categories
    gap.missingEssentialCategories = requirements.essential.filter(
      cat => !coverage.coveredCategories.includes(cat)
    );
    gap.missingImportantCategories = requirements.important.filter(
      cat => !coverage.coveredCategories.includes(cat)
    );
    gap.missingOptionalCategories = requirements.optional.filter(
      cat => !coverage.coveredCategories.includes(cat)
    );

    // Generate recommendations for missing categories
    gap.recommendedTools = this.getRecommendationsForMissingCategories([
      ...gap.missingEssentialCategories.map(cat => ({ category: cat, priority: 'essential' })),
      ...gap.missingImportantCategories.map(cat => ({ category: cat, priority: 'important' })),
      ...gap.missingOptionalCategories.map(cat => ({ category: cat, priority: 'optional' }))
    ]);

    // Calculate confidence impact for each recommendation
    gap.recommendedTools.forEach(tool => {
      const newConfidence = this.calculateConfidenceWithTool(currentTools, tool.name, role);
      gap.confidenceImpact[tool.name] = newConfidence - gap.currentConfidence;
    });

    return gap;
  }

  /**
   * Analyze gaps for a specific project
   */
  analyzeProjectGap(currentTools, project) {
    const gap = {
      project: project.name,
      requiredRoles: project.phases || ['research', 'design', 'development', 'testing', 'deployment'],
      roleReadiness: {},
      blockingGaps: [],
      recommendedTools: [],
      timelineImpact: 'unknown'
    };

    // Analyze readiness for each required role
    gap.requiredRoles.forEach(role => {
      const roleGap = this.analyzeRoleGap(currentTools, role);
      gap.roleReadiness[role] = {
        ready: roleGap.canCurrentlyFulfill,
        confidence: roleGap.currentConfidence,
        blockers: roleGap.missingEssentialCategories
      };

      // Identify blocking gaps
      if (!roleGap.canCurrentlyFulfill) {
        gap.blockingGaps.push({
          role,
          blockers: roleGap.missingEssentialCategories,
          impact: 'Cannot proceed with this phase'
        });
      }
    });

    // Generate project-specific recommendations
    gap.recommendedTools = this.getProjectSpecificRecommendations(gap, project);

    // Estimate timeline impact
    gap.timelineImpact = this.estimateTimelineImpact(gap);

    return gap;
  }

  /**
   * Analyze category coverage for requirements
   */
  analyzeCategoryCoverage(currentTools, requirements) {
    const toolsByCategory = {};
    let totalConfidenceBoost = 0;

    // Categorize current tools
    currentTools.forEach(toolName => {
      const toolInfo = UNIVERSAL_TOOL_REGISTRY[toolName] || { category: 'unknown', confidence_boost: 0 };
      const category = toolInfo.category;

      if (!toolsByCategory[category]) {
        toolsByCategory[category] = [];
      }
      toolsByCategory[category].push(toolName);
      totalConfidenceBoost += toolInfo.confidence_boost || 0;
    });

    const coveredCategories = Object.keys(toolsByCategory);

    // Check essential requirements
    const missingEssential = requirements.essential.filter(
      cat => !coveredCategories.includes(cat)
    );

    const canFulfill = missingEssential.length === 0;

    // Calculate confidence
    let confidence = canFulfill ? 0.4 : Math.min(0.3, totalConfidenceBoost / 10);

    // Boost for important categories
    requirements.important.forEach(cat => {
      if (coveredCategories.includes(cat)) {
        confidence += 0.15;
      }
    });

    // Boost for optional categories
    requirements.optional.forEach(cat => {
      if (coveredCategories.includes(cat)) {
        confidence += 0.1;
      }
    });

    confidence += Math.min(0.3, totalConfidenceBoost / 5);
    confidence = Math.min(1.0, confidence);

    return {
      canFulfill,
      confidence,
      coveredCategories,
      toolsByCategory,
      missingEssential
    };
  }

  /**
   * Get tool recommendations for missing categories
   */
  getRecommendationsForMissingCategories(missingCategories) {
    const recommendations = [];

    missingCategories.forEach(({ category, priority }) => {
      const bestTools = this.findBestToolsForCategory(category, 3); // Top 3 tools per category
      
      bestTools.forEach((tool, index) => {
        recommendations.push({
          name: tool.name,
          category,
          priority,
          rank: index + 1,
          description: tool.description,
          confidenceBoost: tool.confidence_boost,
          alternatives: tool.alternatives || []
        });
      });
    });

    return recommendations.sort((a, b) => {
      // Sort by priority, then by confidence boost
      const priorityOrder = { essential: 3, important: 2, optional: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.confidenceBoost - a.confidenceBoost;
    });
  }

  /**
   * Find best tools for a category
   */
  findBestToolsForCategory(category, limit = 5) {
    const toolsInCategory = Object.entries(UNIVERSAL_TOOL_REGISTRY)
      .filter(([_, info]) => info.category === category)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => (b.confidence_boost || 0) - (a.confidence_boost || 0))
      .slice(0, limit);

    return toolsInCategory;
  }

  /**
   * Generate project-specific recommendations
   */
  getProjectSpecificRecommendations(gap, project) {
    const recommendations = new Map();

    // Collect all recommendations from role gaps
    Object.values(gap.roleReadiness).forEach(roleInfo => {
      if (!roleInfo.ready) {
        // Get recommendations for this role's blockers
        const roleRecommendations = this.getRecommendationsForMissingCategories(
          roleInfo.blockers.map(cat => ({ category: cat, priority: 'essential' }))
        );

        roleRecommendations.forEach(rec => {
          if (!recommendations.has(rec.name)) {
            recommendations.set(rec.name, { ...rec, benefitsRoles: [] });
          }
          recommendations.get(rec.name).benefitsRoles.push(roleInfo.role);
        });
      }
    });

    // Prioritize tools that benefit multiple roles
    return Array.from(recommendations.values()).sort((a, b) => {
      const aRoleCount = a.benefitsRoles?.length || 0;
      const bRoleCount = b.benefitsRoles?.length || 0;

      if (aRoleCount !== bRoleCount) {
        return bRoleCount - aRoleCount;
      }

      return b.confidenceBoost - a.confidenceBoost;
    });
  }

  /**
   * Calculate confidence with a hypothetical tool added
   */
  calculateConfidenceWithTool(currentTools, newTool, role) {
    const toolsWithNew = [...currentTools, newTool];
    const coverage = this.analyzeCategoryCoverage(toolsWithNew, ROLE_REQUIREMENTS[role]);
    return coverage.confidence;
  }

  /**
   * Generate prioritized recommendations across all roles/projects
   */
  generatePrioritizedRecommendations(analysis) {
    const allRecommendations = new Map();

    // Collect recommendations from all role gaps
    Object.values(analysis.roleGaps).forEach(roleGap => {
      roleGap.recommendedTools?.forEach(tool => {
        const key = tool.name;
        if (!allRecommendations.has(key)) {
          allRecommendations.set(key, {
            ...tool,
            benefitsRoles: [],
            totalConfidenceImpact: 0,
            urgency: 0
          });
        }

        const existing = allRecommendations.get(key);
        existing.benefitsRoles.push(roleGap.role);
        existing.totalConfidenceImpact += roleGap.confidenceImpact[tool.name] || 0;
        
        // Increase urgency for essential tools
        if (tool.priority === 'essential') {
          existing.urgency += 10;
        } else if (tool.priority === 'important') {
          existing.urgency += 5;
        } else {
          existing.urgency += 1;
        }
      });
    });

    // Sort by impact and urgency
    return Array.from(allRecommendations.values()).sort((a, b) => {
      const aScore = a.urgency * 10 + a.totalConfidenceImpact * 100 + a.benefitsRoles.length * 5;
      const bScore = b.urgency * 10 + b.totalConfidenceImpact * 100 + b.benefitsRoles.length * 5;
      return bScore - aScore;
    });
  }

  /**
   * Calculate overall gap score
   */
  calculateGapScore(analysis) {
    let totalGap = 0;
    const roleCount = Object.keys(analysis.roleGaps).length;

    Object.values(analysis.roleGaps).forEach(roleGap => {
      const maxConfidence = 1.0;
      const currentConfidence = roleGap.currentConfidence || 0;
      const gap = maxConfidence - currentConfidence;
      totalGap += gap;
    });

    // Normalize to 0-100 scale (lower is better)
    return Math.round((totalGap / roleCount) * 100);
  }

  /**
   * Estimate timeline impact of gaps
   */
  estimateTimelineImpact(projectGap) {
    const blockingCount = projectGap.blockingGaps.length;
    const totalRoles = projectGap.requiredRoles.length;
    const blockingRatio = blockingCount / totalRoles;

    if (blockingRatio >= 0.5) {
      return 'severe_delay';
    } else if (blockingRatio >= 0.25) {
      return 'moderate_delay';
    } else if (blockingRatio > 0) {
      return 'minor_delay';
    } else {
      return 'no_delay';
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

/**
 * Global gap analyzer instance
 */
export const globalGapAnalyzer = new GapAnalyzer();

/**
 * Convenience function for gap analysis
 */
export async function analyzeAgentGaps(agentInfo, targetProjects = []) {
  return await globalGapAnalyzer.analyzeCapabilityGaps(agentInfo, targetProjects);
}

/**
 * Quick gap check for a specific role
 */
export function quickRoleGapCheck(currentTools, role) {
  return globalGapAnalyzer.analyzeRoleGap(currentTools, role);
}
