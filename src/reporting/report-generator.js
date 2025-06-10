/**
 * Report Generation System for Guidant Evolution
 * Generates progress, quality, and business reports
 */

import fs from 'fs/promises';
import path from 'path';
import { readProjectFile, writeProjectFile } from '../file-management/project-structure.js';
import { 
  PROJECT_CONFIG, 
  PROJECT_PHASES, 
  CURRENT_PHASE, 
  QUALITY_GATES,
  SESSIONS,
  DECISIONS,
  PROGRESS_REPORTS_DIR,
  QUALITY_REPORTS_DIR,
  BUSINESS_REPORTS_DIR,
  TASK_TICKETS
} from '../constants/paths.js';

/**
 * Generate comprehensive progress report
 */
export async function generateProgressReport(projectRoot = process.cwd()) {
  try {
    const timestamp = new Date().toISOString();
    const reportData = await gatherProgressData(projectRoot);
    
    const report = {
      id: `progress-${Date.now()}`,
      type: 'progress',
      generatedAt: timestamp,
      projectName: reportData.config.name,
      summary: {
        currentPhase: reportData.currentPhase.phase,
        overallProgress: calculateOverallProgress(reportData.phases),
        completedDeliverables: countCompletedDeliverables(reportData.qualityGates),
        totalDeliverables: countTotalDeliverables(reportData.qualityGates),
        activeSessions: reportData.sessions.length,
        timeSpent: calculateTimeSpent(reportData.sessions)
      },
      phases: generatePhaseProgress(reportData.phases, reportData.qualityGates),
      recentActivity: getRecentActivity(reportData.sessions, 7), // Last 7 days
      upcomingTasks: await getUpcomingTasks(projectRoot),
      recommendations: generateProgressRecommendations(reportData)
    };
    
    // Save report
    const filename = `progress-report-${timestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(projectRoot, PROGRESS_REPORTS_DIR, filename);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return {
      success: true,
      report,
      filename,
      path: reportPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate quality assessment report
 */
export async function generateQualityReport(projectRoot = process.cwd()) {
  try {
    const timestamp = new Date().toISOString();
    const reportData = await gatherQualityData(projectRoot);
    
    const report = {
      id: `quality-${Date.now()}`,
      type: 'quality',
      generatedAt: timestamp,
      projectName: reportData.config.name,
      qualityScore: calculateQualityScore(reportData),
      assessment: {
        completeness: assessCompleteness(reportData.qualityGates),
        consistency: assessConsistency(reportData.sessions),
        documentation: assessDocumentation(reportData),
        testCoverage: assessTestCoverage(reportData)
      },
      phaseQuality: assessPhaseQuality(reportData.qualityGates),
      issues: identifyQualityIssues(reportData),
      recommendations: generateQualityRecommendations(reportData)
    };
    
    // Save report
    const filename = `quality-report-${timestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(projectRoot, QUALITY_REPORTS_DIR, filename);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return {
      success: true,
      report,
      filename,
      path: reportPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate business insights report
 */
export async function generateBusinessReport(projectRoot = process.cwd()) {
  try {
    const timestamp = new Date().toISOString();
    const reportData = await gatherBusinessData(projectRoot);
    
    const report = {
      id: `business-${Date.now()}`,
      type: 'business',
      generatedAt: timestamp,
      projectName: reportData.config.name,
      executiveSummary: generateExecutiveSummary(reportData),
      milestones: {
        completed: getCompletedMilestones(reportData),
        upcoming: getUpcomingMilestones(reportData),
        delayed: getDelayedMilestones(reportData)
      },
      riskAssessment: assessProjectRisks(reportData),
      resourceUtilization: assessResourceUtilization(reportData),
      businessValue: assessBusinessValue(reportData),
      decisions: getKeyDecisions(reportData.decisions),
      recommendations: generateBusinessRecommendations(reportData)
    };
    
    // Save report
    const filename = `business-report-${timestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(projectRoot, BUSINESS_REPORTS_DIR, filename);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return {
      success: true,
      report,
      filename,
      path: reportPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate all reports at once
 */
export async function generateAllReports(projectRoot = process.cwd()) {
  const results = await Promise.allSettled([
    generateProgressReport(projectRoot),
    generateQualityReport(projectRoot),
    generateBusinessReport(projectRoot)
  ]);
  
  return {
    progress: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason },
    quality: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason },
    business: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason }
  };
}

// Helper functions for data gathering
async function gatherProgressData(projectRoot) {
  const [config, phases, currentPhase, qualityGates, sessions] = await Promise.all([
    readProjectFile(PROJECT_CONFIG, projectRoot),
    readProjectFile(PROJECT_PHASES, projectRoot),
    readProjectFile(CURRENT_PHASE, projectRoot),
    readProjectFile(QUALITY_GATES, projectRoot),
    readProjectFile(SESSIONS, projectRoot)
  ]);
  
  return { config, phases, currentPhase, qualityGates, sessions };
}

async function gatherQualityData(projectRoot) {
  const progressData = await gatherProgressData(projectRoot);
  
  // Get task tickets for quality assessment
  const taskTicketsPath = path.join(projectRoot, TASK_TICKETS);
  let taskTickets = [];
  try {
    const files = await fs.readdir(taskTicketsPath);
    const ticketFiles = files.filter(f => f.endsWith('.json'));
    taskTickets = await Promise.all(
      ticketFiles.map(async (file) => {
        const content = await fs.readFile(path.join(taskTicketsPath, file), 'utf8');
        return JSON.parse(content);
      })
    );
  } catch (error) {
    // No task tickets yet
  }
  
  return { ...progressData, taskTickets };
}

async function gatherBusinessData(projectRoot) {
  const qualityData = await gatherQualityData(projectRoot);
  
  const decisions = await readProjectFile(DECISIONS, projectRoot);
  
  return { ...qualityData, decisions };
}

// Calculation functions
function calculateOverallProgress(phases) {
  const phaseList = Object.values(phases.phases);
  const completed = phaseList.filter(p => p.status === 'completed').length;
  return Math.round((completed / phaseList.length) * 100);
}

function countCompletedDeliverables(qualityGates) {
  return Object.values(qualityGates)
    .reduce((total, gate) => total + (gate.completed?.length || 0), 0);
}

function countTotalDeliverables(qualityGates) {
  return Object.values(qualityGates)
    .reduce((total, gate) => total + (gate.required?.length || 0), 0);
}

function calculateTimeSpent(sessions) {
  // Estimate time based on session count and average duration
  return sessions.length * 30; // Rough estimate: 30 minutes per session
}

function generatePhaseProgress(phases, qualityGates) {
  const progress = {};
  
  Object.entries(phases.phases).forEach(([phaseName, phaseData]) => {
    const gates = qualityGates[phaseName] || {};
    progress[phaseName] = {
      status: phaseData.status,
      startedAt: phaseData.startedAt,
      completedAt: phaseData.completedAt,
      completedDeliverables: gates.completed?.length || 0,
      totalDeliverables: gates.required?.length || 0,
      progress: gates.required?.length > 0 ? 
        Math.round(((gates.completed?.length || 0) / gates.required.length) * 100) : 0
    };
  });
  
  return progress;
}

function getRecentActivity(sessions, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return sessions
    .filter(session => new Date(session.timestamp) > cutoff)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10); // Last 10 activities
}

async function getUpcomingTasks(projectRoot) {
  // This would integrate with task generation to show next tasks
  return [
    {
      phase: 'concept',
      deliverable: 'user_personas',
      estimatedDuration: 25,
      priority: 'high'
    }
  ];
}

function generateProgressRecommendations(data) {
  const recommendations = [];
  
  if (data.sessions.length === 0) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      message: 'No work sessions recorded. Start working on tasks to track progress.'
    });
  }
  
  const recentSessions = data.sessions.filter(s => 
    new Date(s.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  if (recentSessions.length === 0) {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      message: 'No recent activity. Consider resuming work on the project.'
    });
  }
  
  return recommendations;
}

function calculateQualityScore(data) {
  let score = 0;
  let factors = 0;
  
  // Completeness factor
  const totalDeliverables = countTotalDeliverables(data.qualityGates);
  const completedDeliverables = countCompletedDeliverables(data.qualityGates);
  if (totalDeliverables > 0) {
    score += (completedDeliverables / totalDeliverables) * 30;
    factors += 30;
  }
  
  // Documentation factor
  const hasDocumentation = data.sessions.some(s => 
    s.workCompleted && s.workCompleted.toLowerCase().includes('document')
  );
  if (hasDocumentation) {
    score += 25;
  }
  factors += 25;
  
  // Consistency factor (regular work sessions)
  if (data.sessions.length > 0) {
    score += Math.min(data.sessions.length * 5, 25);
  }
  factors += 25;
  
  // Task ticket quality
  if (data.taskTickets && data.taskTickets.length > 0) {
    score += 20;
  }
  factors += 20;
  
  return factors > 0 ? Math.round(score) : 0;
}

function assessCompleteness(qualityGates) {
  const total = countTotalDeliverables(qualityGates);
  const completed = countCompletedDeliverables(qualityGates);

  return {
    score: total > 0 ? Math.round((completed / total) * 100) : 0,
    completed,
    total,
    status: total > 0 && completed === total ? 'complete' :
            completed > total * 0.7 ? 'good' :
            completed > total * 0.4 ? 'fair' : 'poor'
  };
}

function assessConsistency(sessions) {
  if (sessions.length === 0) {
    return { score: 0, status: 'no-data' };
  }

  // Check for regular work patterns
  const dates = sessions.map(s => new Date(s.timestamp).toDateString());
  const uniqueDates = [...new Set(dates)];
  const consistency = uniqueDates.length / Math.max(sessions.length, 1);

  return {
    score: Math.round(consistency * 100),
    workDays: uniqueDates.length,
    totalSessions: sessions.length,
    status: consistency > 0.8 ? 'excellent' :
            consistency > 0.6 ? 'good' :
            consistency > 0.4 ? 'fair' : 'poor'
  };
}

function assessDocumentation(data) {
  const docSessions = data.sessions.filter(s =>
    s.workCompleted && (
      s.workCompleted.toLowerCase().includes('document') ||
      s.workCompleted.toLowerCase().includes('write') ||
      s.workCompleted.toLowerCase().includes('spec')
    )
  );

  return {
    score: Math.min(docSessions.length * 20, 100),
    documentationSessions: docSessions.length,
    status: docSessions.length > 3 ? 'excellent' :
            docSessions.length > 1 ? 'good' :
            docSessions.length > 0 ? 'fair' : 'poor'
  };
}

function assessTestCoverage(data) {
  const testSessions = data.sessions.filter(s =>
    s.workCompleted && s.workCompleted.toLowerCase().includes('test')
  );

  return {
    score: Math.min(testSessions.length * 25, 100),
    testingSessions: testSessions.length,
    status: testSessions.length > 2 ? 'excellent' :
            testSessions.length > 0 ? 'good' : 'poor'
  };
}

function assessPhaseQuality(qualityGates) {
  const phaseQuality = {};

  Object.entries(qualityGates).forEach(([phase, gates]) => {
    const required = gates.required?.length || 0;
    const completed = gates.completed?.length || 0;

    phaseQuality[phase] = {
      completionRate: required > 0 ? Math.round((completed / required) * 100) : 0,
      completed,
      required,
      status: required > 0 && completed === required ? 'complete' :
              completed > 0 ? 'in-progress' : 'pending'
    };
  });

  return phaseQuality;
}

function identifyQualityIssues(data) {
  const issues = [];

  // Check for incomplete phases
  Object.entries(data.qualityGates).forEach(([phase, gates]) => {
    const required = gates.required?.length || 0;
    const completed = gates.completed?.length || 0;

    if (required > 0 && completed < required) {
      issues.push({
        type: 'incomplete-deliverables',
        phase,
        severity: 'medium',
        message: `${phase} phase missing ${required - completed} deliverables`
      });
    }
  });

  // Check for stale sessions
  const lastSession = data.sessions[data.sessions.length - 1];
  if (lastSession) {
    const daysSinceLastSession = (Date.now() - new Date(lastSession.timestamp)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSession > 7) {
      issues.push({
        type: 'stale-project',
        severity: 'high',
        message: `No activity for ${Math.round(daysSinceLastSession)} days`
      });
    }
  }

  return issues;
}

function generateQualityRecommendations(data) {
  const recommendations = [];
  const issues = identifyQualityIssues(data);

  issues.forEach(issue => {
    switch (issue.type) {
      case 'incomplete-deliverables':
        recommendations.push({
          type: 'action',
          priority: 'high',
          message: `Complete missing deliverables in ${issue.phase} phase`
        });
        break;
      case 'stale-project':
        recommendations.push({
          type: 'warning',
          priority: 'high',
          message: 'Resume project work to maintain momentum'
        });
        break;
    }
  });

  return recommendations;
}

function generateExecutiveSummary(data) {
  const progress = calculateOverallProgress(data.phases);
  const qualityScore = calculateQualityScore(data);

  return {
    projectStatus: progress > 80 ? 'excellent' : progress > 60 ? 'good' : progress > 40 ? 'fair' : 'needs-attention',
    overallProgress: progress,
    qualityScore,
    keyAchievements: getKeyAchievements(data),
    criticalPath: getCriticalPath(data),
    nextMilestone: getNextMilestone(data)
  };
}

function getCompletedMilestones(data) {
  return Object.entries(data.phases.phases)
    .filter(([_, phase]) => phase.status === 'completed')
    .map(([name, phase]) => ({
      phase: name,
      completedAt: phase.completedAt,
      deliverables: data.qualityGates[name]?.completed || []
    }));
}

function getUpcomingMilestones(data) {
  return Object.entries(data.phases.phases)
    .filter(([_, phase]) => phase.status === 'pending')
    .slice(0, 3) // Next 3 phases
    .map(([name]) => ({
      phase: name,
      deliverables: data.qualityGates[name]?.required || [],
      estimatedDuration: estimatePhaseDuration(name)
    }));
}

function getDelayedMilestones() {
  // For now, return empty array - would need timeline data to determine delays
  return [];
}

function assessProjectRisks(data) {
  const risks = [];

  // Check for long gaps in activity
  if (data.sessions.length > 0) {
    const lastSession = new Date(data.sessions[data.sessions.length - 1].timestamp);
    const daysSince = (Date.now() - lastSession) / (1000 * 60 * 60 * 24);

    if (daysSince > 14) {
      risks.push({
        type: 'schedule',
        severity: 'high',
        description: 'Extended period of inactivity may impact timeline'
      });
    }
  }

  // Check for incomplete phases
  const currentPhase = data.currentPhase.phase;
  const gates = data.qualityGates[currentPhase];
  if (gates && gates.required) {
    const completion = (gates.completed?.length || 0) / gates.required.length;
    if (completion < 0.5) {
      risks.push({
        type: 'quality',
        severity: 'medium',
        description: `Current phase (${currentPhase}) is less than 50% complete`
      });
    }
  }

  return risks;
}

function assessResourceUtilization(data) {
  return {
    totalSessions: data.sessions.length,
    averageSessionsPerWeek: calculateAverageSessionsPerWeek(data.sessions),
    mostActivePhase: getMostActivePhase(data.sessions),
    efficiency: calculateEfficiency(data)
  };
}

function assessBusinessValue(data) {
  const completedDeliverables = countCompletedDeliverables(data.qualityGates);
  const totalDeliverables = countTotalDeliverables(data.qualityGates);

  return {
    deliveredValue: completedDeliverables,
    potentialValue: totalDeliverables,
    valueRealization: totalDeliverables > 0 ?
      Math.round((completedDeliverables / totalDeliverables) * 100) : 0,
    businessImpact: assessBusinessImpact(data)
  };
}

function getKeyDecisions(decisions) {
  return decisions.slice(-5).map(decision => ({
    timestamp: decision.timestamp,
    type: decision.type,
    summary: decision.summary || decision.description,
    impact: decision.impact || 'medium'
  }));
}

function generateBusinessRecommendations(data) {
  const recommendations = [];
  const progress = calculateOverallProgress(data.phases);

  if (progress < 25) {
    recommendations.push({
      type: 'strategic',
      priority: 'high',
      message: 'Focus on completing concept phase to establish strong foundation'
    });
  } else if (progress < 50) {
    recommendations.push({
      type: 'operational',
      priority: 'medium',
      message: 'Maintain momentum through requirements and design phases'
    });
  } else if (progress < 75) {
    recommendations.push({
      type: 'tactical',
      priority: 'medium',
      message: 'Prepare for implementation phase - ensure architecture is solid'
    });
  }

  return recommendations;
}

// Additional helper functions
function getKeyAchievements(data) {
  return data.sessions
    .filter(s => s.status === 'completed')
    .slice(-3)
    .map(s => s.deliverable);
}

function getCriticalPath(data) {
  return Object.keys(data.phases.phases)
    .filter(phase => data.phases.phases[phase].status !== 'completed')
    .slice(0, 2);
}

function getNextMilestone(data) {
  const nextPhase = Object.entries(data.phases.phases)
    .find(([_, phase]) => phase.status === 'pending');

  return nextPhase ? nextPhase[0] : 'Project Complete';
}

function estimatePhaseDuration(phaseName) {
  const durations = {
    concept: 5,
    requirements: 7,
    design: 10,
    architecture: 8,
    implementation: 20,
    deployment: 5
  };
  return durations[phaseName] || 7;
}

function calculateAverageSessionsPerWeek(sessions) {
  if (sessions.length === 0) return 0;

  const firstSession = new Date(sessions[0].timestamp);
  const lastSession = new Date(sessions[sessions.length - 1].timestamp);
  const weeks = Math.max(1, (lastSession - firstSession) / (1000 * 60 * 60 * 24 * 7));

  return Math.round(sessions.length / weeks * 10) / 10;
}

function getMostActivePhase(sessions) {
  const phaseCounts = {};
  sessions.forEach(session => {
    const phase = session.phase || 'unknown';
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });

  return Object.entries(phaseCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
}

function calculateEfficiency(data) {
  const completedSessions = data.sessions.filter(s => s.status === 'completed');
  return data.sessions.length > 0 ?
    Math.round((completedSessions.length / data.sessions.length) * 100) : 0;
}

function assessBusinessImpact(data) {
  const progress = calculateOverallProgress(data.phases);

  if (progress > 75) return 'high';
  if (progress > 50) return 'medium';
  if (progress > 25) return 'low';
  return 'minimal';
}
