/**
 * Header Section Component (Ink/React)
 * Project banner and basic info display
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Header Section Component
 */
export function HeaderSection({ projectState, workflowState, compact = false }) {
  const projectName = projectState?.config?.name || 'Unnamed Project';
  const version = projectState?.config?.version || '1.0.0';
  const projectType = projectState?.workflow?.projectType || 'Unknown';
  const isAdaptive = projectState?.workflow?.adaptive || false;
  const currentPhase = workflowState?.currentPhase?.phase || 'Not Started';

  if (compact) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="cyan" bold>Guidant</Text>
          <Text color="gray"> v{version}</Text>
          <Text color="gray"> • {projectName}</Text>
        </Box>
        <Box>
          <Text color="gray">─────────────────────────────────────────</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* Main Banner */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="cyan" bold>
          {`
   ____       _     _             _
  / ___|_   _(_) __| | __ _ _ __ | |_
 | |  _| | | | |/ _\` |/ _\` | '_ \\| __|
 | |_| | |_| | | (_| | (_| | | | | |_
  \\____|\\__,_|_|\\__,_|\\__,_|_| |_|\\__|
          `}
        </Text>
      </Box>

      {/* Subtitle */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="gray">AI Agent Workflow Orchestrator</Text>
      </Box>

      {/* Project Info Box */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box>
            <Text color="white" bold>Project: </Text>
            <Text color="white">{projectName}</Text>
          </Box>
          <Box>
            <Text color="white" bold>Version: </Text>
            <Text color="white">{version}</Text>
          </Box>
          <Box>
            <Text color="white" bold>Type: </Text>
            <Text color="white">{projectType}</Text>
          </Box>
        </Box>
      </Box>

      {/* Workflow Status */}
      <WorkflowStatus
        isAdaptive={isAdaptive}
        currentPhase={currentPhase}
        projectType={projectType}
      />
    </Box>
  );
}

/**
 * Workflow Status Component
 */
function WorkflowStatus({ isAdaptive, currentPhase, projectType }) {
  if (isAdaptive) {
    return (
      <Box marginBottom={1}>
        <Text color="green">✨ Adaptive Workflow Intelligence Active</Text>
        <Text color="cyan"> • {currentPhase}</Text>
        <Text color="gray"> • {projectType}</Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text color="yellow">⚠️ Legacy workflow detected - consider upgrading to adaptive intelligence</Text>
    </Box>
  );
}

/**
 * Compact Header for small terminals
 */
export function CompactHeader({ projectState, workflowState }) {
  const projectName = projectState?.config?.name || 'Unnamed';
  const currentPhase = workflowState?.currentPhase?.phase || 'N/A';
  const isAdaptive = projectState?.workflow?.adaptive || false;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color="cyan" bold>Guidant</Text>
        <Text color="gray"> • {projectName}</Text>
        <Text color="gray"> • {currentPhase}</Text>
        {isAdaptive && <Text color="green"> ✨</Text>}
      </Box>
      <Text color="gray">{'─'.repeat(50)}</Text>
    </Box>
  );
}

/**
 * Banner with ASCII art (for full-size terminals)
 */
export function ASCIIBanner() {
  return (
    <Box justifyContent="center" marginBottom={1}>
      <Text color="cyan" bold>
        {`
   ____       _     _             _   
  / ___|_   _(_) __| | __ _ _ __ | |_ 
 | |  _| | | | |/ _\` |/ _\` | '_ \\| __|
 | |_| | |_| | | (_| | (_| | | | | |_ 
  \\____|\\__,_|_|\\__,_|\\__,_|_| |_|\\__|
        `}
      </Text>
    </Box>
  );
}

export default HeaderSection;
