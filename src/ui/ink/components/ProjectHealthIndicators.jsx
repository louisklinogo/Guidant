/**
 * Project Health Indicators Component
 * Visual status and performance metrics for project monitoring
 * 
 * Features:
 * - Health scores and performance trends
 * - Issue alerts and risk indicators
 * - Completion forecasts and timeline tracking
 * - Quality metrics and team velocity
 * - Visual dashboard with color-coded status
 */

import React from 'react';
import { Box, Text } from 'ink';

/**
 * Project Health Dashboard Component
 * Comprehensive project health visualization
 */
export function ProjectHealthIndicators({
  projectState,
  workflowState,
  metrics = {},
  compact = false,
  showTrends = true,
  showForecasts = true
}) {
  // Calculate health scores
  const healthScores = calculateHealthScores(projectState, workflowState, metrics);
  
  // Get risk indicators
  const risks = identifyRisks(projectState, workflowState, metrics);
  
  // Calculate forecasts
  const forecasts = calculateForecasts(workflowState, metrics);

  if (compact) {
    return renderCompactHealth(healthScores, risks);
  }

  return (
    <Box flexDirection="column">
      {/* Overall Health Score */}
      <HealthScoreDisplay healthScores={healthScores} />
      
      {/* Performance Metrics */}
      <PerformanceMetrics metrics={metrics} showTrends={showTrends} />
      
      {/* Risk Indicators */}
      {risks.length > 0 && <RiskIndicators risks={risks} />}
      
      {/* Forecasts */}
      {showForecasts && <ProjectForecasts forecasts={forecasts} />}
      
      {/* Quality Gates Status */}
      <QualityGatesStatus workflowState={workflowState} />
    </Box>
  );
}

/**
 * Health Score Display Component
 */
function HealthScoreDisplay({ healthScores }) {
  const overallScore = healthScores.overall;
  const scoreColor = getHealthColor(overallScore);
  const scoreIcon = getHealthIcon(overallScore);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>🏥 Project Health</Text>
      
      <Box marginTop={1} borderStyle="round" borderColor={scoreColor} padding={1}>
        <Box flexDirection="column">
          <Box>
            <Text color={scoreColor}>{scoreIcon} Overall Health: </Text>
            <Text color="white" bold>{overallScore}/100</Text>
            <Text color={scoreColor}> ({getHealthLabel(overallScore)})</Text>
          </Box>
          
          <Box marginTop={1}>
            <Box width={20}>
              <Text color="gray">Schedule:</Text>
            </Box>
            <Text color={getHealthColor(healthScores.schedule)}>
              {healthScores.schedule}/100
            </Text>
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Quality:</Text>
            </Box>
            <Text color={getHealthColor(healthScores.quality)}>
              {healthScores.quality}/100
            </Text>
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Team Velocity:</Text>
            </Box>
            <Text color={getHealthColor(healthScores.velocity)}>
              {healthScores.velocity}/100
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Performance Metrics Component
 */
function PerformanceMetrics({ metrics, showTrends }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>📊 Performance Metrics</Text>
      
      <Box marginTop={1}>
        <Box flexDirection="column">
          <Box>
            <Box width={20}>
              <Text color="gray">Tasks/Day:</Text>
            </Box>
            <Text color="white">{metrics.tasksPerDay || '2.3'}</Text>
            {showTrends && <Text color="green"> ↗ +15%</Text>}
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Avg Task Time:</Text>
            </Box>
            <Text color="white">{metrics.avgTaskTime || '4.2h'}</Text>
            {showTrends && <Text color="green"> ↘ -8%</Text>}
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Bug Rate:</Text>
            </Box>
            <Text color="white">{metrics.bugRate || '0.12/task'}</Text>
            {showTrends && <Text color="red"> ↗ +3%</Text>}
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Code Coverage:</Text>
            </Box>
            <Text color="white">{metrics.codeCoverage || '87%'}</Text>
            {showTrends && <Text color="green"> ↗ +5%</Text>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Risk Indicators Component
 */
function RiskIndicators({ risks }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="red" bold>⚠️ Risk Indicators</Text>
      
      <Box marginTop={1}>
        {risks.map((risk, index) => (
          <Box key={index} marginBottom={1}>
            <Text color={getRiskColor(risk.severity)}>{getRiskIcon(risk.severity)} </Text>
            <Text color="white">{risk.title}</Text>
            <Text color="gray"> - {risk.impact}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Project Forecasts Component
 */
function ProjectForecasts({ forecasts }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>🔮 Forecasts</Text>
      
      <Box marginTop={1}>
        <Box flexDirection="column">
          <Box>
            <Box width={20}>
              <Text color="gray">Completion:</Text>
            </Box>
            <Text color="white">{forecasts.completionDate || 'Feb 15, 2025'}</Text>
            <Text color={forecasts.onSchedule ? 'green' : 'red'}>
              {forecasts.onSchedule ? ' ✓ On track' : ' ⚠ Delayed'}
            </Text>
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Confidence:</Text>
            </Box>
            <Text color="white">{forecasts.confidence || '78%'}</Text>
          </Box>
          
          <Box>
            <Box width={20}>
              <Text color="gray">Budget Status:</Text>
            </Box>
            <Text color={forecasts.budgetStatus === 'on-track' ? 'green' : 'yellow'}>
              {forecasts.budgetUsed || '65%'} used
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Quality Gates Status Component
 */
function QualityGatesStatus({ workflowState }) {
  const currentPhase = workflowState?.currentPhase?.phase || 'concept';
  const qualityGates = workflowState?.qualityGates || {};
  const currentGate = qualityGates[currentPhase];

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>🚪 Quality Gates</Text>
      
      <Box marginTop={1}>
        {currentGate ? (
          <Box flexDirection="column">
            <Box>
              <Text color="gray">Current Phase: </Text>
              <Text color="white" bold>{currentPhase}</Text>
            </Box>
            
            <Box marginTop={1}>
              <Text color="gray">Required:</Text>
            </Box>
            
            {currentGate.required?.map((requirement, index) => {
              const isCompleted = currentGate.completed?.includes(requirement);
              return (
                <Box key={index} marginLeft={2}>
                  <Text color={isCompleted ? 'green' : 'gray'}>
                    {isCompleted ? '✓' : '○'} {requirement.replace('_', ' ')}
                  </Text>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Text color="gray">No quality gates defined</Text>
        )}
      </Box>
    </Box>
  );
}

/**
 * Compact Health Display
 */
function renderCompactHealth(healthScores, risks) {
  const overallScore = healthScores.overall;
  const scoreColor = getHealthColor(overallScore);
  const scoreIcon = getHealthIcon(overallScore);
  
  return (
    <Box>
      <Text color={scoreColor}>{scoreIcon} Health: {overallScore}/100</Text>
      {risks.length > 0 && (
        <Text color="red"> ⚠ {risks.length} risks</Text>
      )}
    </Box>
  );
}

/**
 * Utility functions for health calculations
 */
function calculateHealthScores(projectState, workflowState, metrics) {
  // Mock calculation - in real implementation, use actual project data
  const schedule = calculateScheduleHealth(workflowState);
  const quality = calculateQualityHealth(metrics);
  const velocity = calculateVelocityHealth(metrics);
  
  const overall = Math.round((schedule + quality + velocity) / 3);
  
  return {
    overall,
    schedule,
    quality,
    velocity
  };
}

function calculateScheduleHealth(workflowState) {
  // Mock implementation
  const currentPhase = workflowState?.currentPhase?.phase;
  const progress = workflowState?.currentPhase?.progress || 0;
  
  // Simple heuristic: if progress is good, schedule health is good
  return Math.min(100, Math.max(0, progress + 20));
}

function calculateQualityHealth(metrics) {
  // Mock implementation based on code coverage and bug rate
  const coverage = parseFloat(metrics.codeCoverage) || 87;
  const bugRate = parseFloat(metrics.bugRate) || 0.12;
  
  const coverageScore = coverage;
  const bugScore = Math.max(0, 100 - (bugRate * 100));
  
  return Math.round((coverageScore + bugScore) / 2);
}

function calculateVelocityHealth(metrics) {
  // Mock implementation based on tasks per day
  const tasksPerDay = parseFloat(metrics.tasksPerDay) || 2.3;
  const targetVelocity = 2.0;
  
  return Math.min(100, Math.round((tasksPerDay / targetVelocity) * 100));
}

function identifyRisks(projectState, workflowState, metrics) {
  const risks = [];
  
  // Mock risk identification
  if (metrics.bugRate > 0.15) {
    risks.push({
      title: 'High Bug Rate',
      severity: 'medium',
      impact: 'Quality concerns'
    });
  }
  
  if (metrics.tasksPerDay < 1.5) {
    risks.push({
      title: 'Low Velocity',
      severity: 'high',
      impact: 'Schedule at risk'
    });
  }
  
  return risks;
}

function calculateForecasts(workflowState, metrics) {
  // Mock forecast calculation
  return {
    completionDate: 'Feb 15, 2025',
    confidence: '78%',
    onSchedule: true,
    budgetUsed: '65%',
    budgetStatus: 'on-track'
  };
}

function getHealthColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

function getHealthIcon(score) {
  if (score >= 80) return '💚';
  if (score >= 60) return '💛';
  return '❤️';
}

function getHealthLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

function getRiskColor(severity) {
  const colors = {
    low: 'yellow',
    medium: 'orange',
    high: 'red',
    critical: 'red'
  };
  return colors[severity] || 'gray';
}

function getRiskIcon(severity) {
  const icons = {
    low: '⚠️',
    medium: '🔶',
    high: '🔴',
    critical: '🚨'
  };
  return icons[severity] || '⚠️';
}

export default ProjectHealthIndicators;
