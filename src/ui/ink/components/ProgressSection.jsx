/**
 * Progress Section Component (Ink/React)
 * Phase progress and status visualization
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Progress Section Component
 */
export function ProgressSection({ 
  phases, 
  currentPhase, 
  overallProgress, 
  completedPhases, 
  totalPhases, 
  compact = false,
  selected = false 
}) {
  if (!phases || Object.keys(phases).length === 0) {
    return (
      <Box borderStyle="round" borderColor="yellow" padding={1} marginBottom={1}>
        <Text color="yellow">⚠️ No phases configured</Text>
      </Box>
    );
  }

  const borderColor = selected ? 'cyan' : 'gray';

  if (compact) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>📊 Progress: </Text>
        <Text>{createProgressBar(overallProgress, 30)} </Text>
        <Text color="gray">({completedPhases}/{totalPhases} phases)</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* Section Header */}
      <Box borderStyle="round" borderColor={borderColor} padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="cyan" bold>📊 Project Progress</Text>
          <Newline />
          <Box>
            <Text>Overall: </Text>
            <Text>{createProgressBar(overallProgress, 40)}</Text>
          </Box>
          <Box>
            <Text color="gray">Completed: {completedPhases}/{totalPhases} phases ({overallProgress}%)</Text>
          </Box>
        </Box>
      </Box>

      {/* Phase Breakdown */}
      <PhaseBreakdown 
        phases={phases} 
        currentPhase={currentPhase}
        compact={compact}
      />
    </Box>
  );
}

/**
 * Phase Breakdown Component
 */
function PhaseBreakdown({ phases, currentPhase, compact }) {
  const phaseEntries = Object.entries(phases);

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>Phase Details:</Text>
      <Newline />
      
      {phaseEntries.map(([phaseName, phase]) => {
        const isCurrent = currentPhase?.phase === phaseName;
        const status = phase.completed ? 'completed' : (isCurrent ? 'in-progress' : 'pending');
        const progress = phase.progress || 0;

        return (
          <PhaseRow 
            key={phaseName}
            name={phaseName}
            status={status}
            progress={progress}
            isCurrent={isCurrent}
            compact={compact}
          />
        );
      })}
    </Box>
  );
}

/**
 * Individual Phase Row Component
 */
function PhaseRow({ name, status, progress, isCurrent, compact }) {
  const statusColors = {
    completed: 'green',
    'in-progress': 'yellow',
    pending: 'gray'
  };

  const statusIcons = {
    completed: '✅',
    'in-progress': '🔄',
    pending: '⏱️'
  };

  const color = statusColors[status] || 'gray';
  const icon = statusIcons[status] || '?';

  return (
    <Box marginBottom={compact ? 0 : 1}>
      <Box width={20}>
        <Text color={isCurrent ? 'yellow' : 'white'} bold={isCurrent}>
          {isCurrent ? '► ' : '  '}{name}
        </Text>
      </Box>
      <Box width={15}>
        <Text color={color}>{icon} {status}</Text>
      </Box>
      <Box>
        <Text>{createProgressBar(progress, 20)}</Text>
      </Box>
    </Box>
  );
}

/**
 * Create progress bar (simplified for Ink)
 */
function createProgressBar(percent, length = 30) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;

  let color = 'red';
  if (percent >= 75) color = 'green';
  else if (percent >= 50) color = 'yellow';
  else if (percent >= 25) color = 'yellow';

  const filledSection = '█'.repeat(filled);
  const emptySection = '░'.repeat(empty);

  return (
    <Text>
      <Text color={color}>{filledSection}</Text>
      <Text color="gray">{emptySection}</Text>
      <Text color={color}> {percent.toFixed(0)}%</Text>
    </Text>
  );
}

/**
 * Simple Progress Bar Component
 */
export function SimpleProgressBar({ percent, length = 30, label = '' }) {
  return (
    <Box>
      {label && <Text>{label}: </Text>}
      <Text>{createProgressBar(percent, length)}</Text>
    </Box>
  );
}

export default ProgressSection;
