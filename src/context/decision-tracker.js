/**
 * Decision Tracking System for Guidant Evolution
 * Captures and manages business decisions during workflow execution
 */

import { readProjectFile, writeProjectFile } from '../file-management/project-structure.js';
import { DECISIONS } from '../constants/paths.js';

/**
 * Decision types for categorization
 */
export const DECISION_TYPES = {
  TECHNICAL: 'technical',
  BUSINESS: 'business', 
  DESIGN: 'design',
  ARCHITECTURE: 'architecture',
  PROCESS: 'process',
  SCOPE: 'scope',
  TIMELINE: 'timeline',
  RESOURCE: 'resource'
};

/**
 * Decision impact levels
 */
export const IMPACT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Record a new decision
 */
export async function recordDecision(decisionData, projectRoot = process.cwd()) {
  try {
    const decisions = await readProjectFile(DECISIONS, projectRoot);
    
    const decision = {
      id: `decision-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: decisionData.type || DECISION_TYPES.BUSINESS,
      title: decisionData.title,
      description: decisionData.description,
      rationale: decisionData.rationale,
      impact: decisionData.impact || IMPACT_LEVELS.MEDIUM,
      phase: decisionData.phase,
      stakeholders: decisionData.stakeholders || [],
      alternatives: decisionData.alternatives || [],
      consequences: decisionData.consequences || [],
      reviewDate: decisionData.reviewDate,
      status: 'active',
      metadata: {
        recordedBy: decisionData.recordedBy || 'system',
        context: decisionData.context || {},
        tags: decisionData.tags || []
      }
    };
    
    decisions.push(decision);
    await writeProjectFile(DECISIONS, decisions, projectRoot);
    
    return {
      success: true,
      decision,
      message: 'Decision recorded successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update an existing decision
 */
export async function updateDecision(decisionId, updates, projectRoot = process.cwd()) {
  try {
    const decisions = await readProjectFile(DECISIONS, projectRoot);
    const decisionIndex = decisions.findIndex(d => d.id === decisionId);
    
    if (decisionIndex === -1) {
      return {
        success: false,
        error: 'Decision not found'
      };
    }
    
    const decision = decisions[decisionIndex];
    const updatedDecision = {
      ...decision,
      ...updates,
      lastModified: new Date().toISOString(),
      metadata: {
        ...decision.metadata,
        ...updates.metadata
      }
    };
    
    decisions[decisionIndex] = updatedDecision;
    await writeProjectFile(DECISIONS, decisions, projectRoot);
    
    return {
      success: true,
      decision: updatedDecision,
      message: 'Decision updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get decisions by criteria
 */
export async function getDecisions(criteria = {}, projectRoot = process.cwd()) {
  try {
    const decisions = await readProjectFile(DECISIONS, projectRoot);
    
    let filtered = decisions;
    
    // Filter by type
    if (criteria.type) {
      filtered = filtered.filter(d => d.type === criteria.type);
    }
    
    // Filter by phase
    if (criteria.phase) {
      filtered = filtered.filter(d => d.phase === criteria.phase);
    }
    
    // Filter by impact
    if (criteria.impact) {
      filtered = filtered.filter(d => d.impact === criteria.impact);
    }
    
    // Filter by status
    if (criteria.status) {
      filtered = filtered.filter(d => d.status === criteria.status);
    }
    
    // Filter by date range
    if (criteria.fromDate) {
      const fromDate = new Date(criteria.fromDate);
      filtered = filtered.filter(d => new Date(d.timestamp) >= fromDate);
    }
    
    if (criteria.toDate) {
      const toDate = new Date(criteria.toDate);
      filtered = filtered.filter(d => new Date(d.timestamp) <= toDate);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    if (criteria.limit) {
      filtered = filtered.slice(0, criteria.limit);
    }
    
    return {
      success: true,
      decisions: filtered,
      total: filtered.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get decision by ID
 */
export async function getDecision(decisionId, projectRoot = process.cwd()) {
  try {
    const decisions = await readProjectFile(DECISIONS, projectRoot);
    const decision = decisions.find(d => d.id === decisionId);
    
    if (!decision) {
      return {
        success: false,
        error: 'Decision not found'
      };
    }
    
    return {
      success: true,
      decision
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mark decision as reviewed
 */
export async function reviewDecision(decisionId, reviewData, projectRoot = process.cwd()) {
  try {
    const updateResult = await updateDecision(decisionId, {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewData.reviewedBy,
      reviewNotes: reviewData.notes,
      reviewOutcome: reviewData.outcome
    }, projectRoot);
    
    return updateResult;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Archive old decisions
 */
export async function archiveDecision(decisionId, projectRoot = process.cwd()) {
  try {
    const updateResult = await updateDecision(decisionId, {
      status: 'archived',
      archivedAt: new Date().toISOString()
    }, projectRoot);
    
    return updateResult;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get decision statistics
 */
export async function getDecisionStats(projectRoot = process.cwd()) {
  try {
    const decisions = await readProjectFile(DECISIONS, projectRoot);
    
    const stats = {
      total: decisions.length,
      byType: {},
      byImpact: {},
      byPhase: {},
      byStatus: {},
      recentCount: 0
    };
    
    // Count recent decisions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    decisions.forEach(decision => {
      // Count by type
      stats.byType[decision.type] = (stats.byType[decision.type] || 0) + 1;
      
      // Count by impact
      stats.byImpact[decision.impact] = (stats.byImpact[decision.impact] || 0) + 1;
      
      // Count by phase
      if (decision.phase) {
        stats.byPhase[decision.phase] = (stats.byPhase[decision.phase] || 0) + 1;
      }
      
      // Count by status
      stats.byStatus[decision.status] = (stats.byStatus[decision.status] || 0) + 1;
      
      // Count recent decisions
      if (new Date(decision.timestamp) > thirtyDaysAgo) {
        stats.recentCount++;
      }
    });
    
    return {
      success: true,
      stats
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Auto-capture decision from workflow context
 */
export async function captureWorkflowDecision(workflowContext, projectRoot = process.cwd()) {
  try {
    // Extract decision information from workflow context
    const decision = {
      title: `${workflowContext.action} - ${workflowContext.phase}`,
      description: workflowContext.description || `Decision made during ${workflowContext.phase} phase`,
      type: inferDecisionType(workflowContext),
      impact: inferImpactLevel(workflowContext),
      phase: workflowContext.phase,
      rationale: workflowContext.rationale || 'Automated workflow decision',
      context: workflowContext,
      recordedBy: 'workflow-system',
      tags: ['automated', workflowContext.phase]
    };
    
    return await recordDecision(decision, projectRoot);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Infer decision type from workflow context
 */
function inferDecisionType(context) {
  if (context.action?.includes('advance') || context.action?.includes('phase')) {
    return DECISION_TYPES.PROCESS;
  }
  if (context.phase === 'architecture') {
    return DECISION_TYPES.ARCHITECTURE;
  }
  if (context.phase === 'design') {
    return DECISION_TYPES.DESIGN;
  }
  if (context.deliverable?.includes('technical')) {
    return DECISION_TYPES.TECHNICAL;
  }
  return DECISION_TYPES.BUSINESS;
}

/**
 * Infer impact level from workflow context
 */
function inferImpactLevel(context) {
  if (context.action?.includes('advance') || context.action?.includes('phase')) {
    return IMPACT_LEVELS.HIGH;
  }
  if (context.phase === 'architecture' || context.phase === 'requirements') {
    return IMPACT_LEVELS.HIGH;
  }
  if (context.deliverable?.includes('critical')) {
    return IMPACT_LEVELS.CRITICAL;
  }
  return IMPACT_LEVELS.MEDIUM;
}
