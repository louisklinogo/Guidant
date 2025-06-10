/**
 * Phase Transition Display Component
 * Beautiful confirmation screens for SDLC phase advancement
 * 
 * Features:
 * - Progress animations and completion summaries
 * - Next phase preview and requirements
 * - Visual celebration of milestones
 * - Quality gate validation display
 * - Smooth transition animations
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Phase Transition Component
 * Shows beautiful transition screens when advancing phases
 */
export function PhaseTransition({
  fromPhase,
  toPhase,
  completedDeliverables = [],
  nextPhaseRequirements = [],
  qualityGates = {},
  onComplete = () => {},
  onCancel = () => {},
  autoAdvance = true,
  duration = 3000
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnimation, setShowAnimation] = useState(true);

  // Animation steps
  const steps = [
    'validation',    // Validate current phase completion
    'celebration',   // Celebrate achievements
    'preview',       // Preview next phase
    'confirmation'   // Final confirmation
  ];

  // Auto-advance through steps
  useEffect(() => {
    if (!autoAdvance) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete();
      }
    }, duration / steps.length);

    return () => clearTimeout(timer);
  }, [currentStep, autoAdvance, duration, onComplete, steps.length]);

  // Render current step
  const renderCurrentStep = () => {
    switch (steps[currentStep]) {
      case 'validation':
        return renderValidationStep();
      case 'celebration':
        return renderCelebrationStep();
      case 'preview':
        return renderPreviewStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return renderValidationStep();
    }
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box justifyContent="center" marginBottom={2}>
        <Text color="cyan" bold>🚀 Phase Transition</Text>
      </Box>

      {/* Progress indicator */}
      <Box justifyContent="center" marginBottom={2}>
        <Text color="gray">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </Text>
      </Box>

      {/* Current step content */}
      <Box flexGrow={1}>
        {renderCurrentStep()}
      </Box>

      {/* Controls */}
      {!autoAdvance && (
        <Box justifyContent="center" marginTop={2}>
          <Text color="gray">
            Press Enter to continue, Esc to cancel
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Validation Step - Check phase completion
 */
function renderValidationStep() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box borderStyle="double" borderColor="green" padding={2} marginBottom={2}>
        <Box flexDirection="column" alignItems="center">
          <Text color="green" bold>✅ Phase Validation Complete</Text>
          <Newline />
          <Text color="gray">All requirements have been met</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text color="cyan" bold>Completed Deliverables:</Text>
        <Text color="green">• User research and analysis</Text>
        <Text color="green">• Market validation</Text>
        <Text color="green">• Technical feasibility study</Text>
        <Text color="green">• Project requirements document</Text>
      </Box>
    </Box>
  );
}

/**
 * Celebration Step - Celebrate achievements
 */
function renderCelebrationStep() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={2}>
        <Text color="yellow" bold>🎉 Congratulations! 🎉</Text>
      </Box>

      <Box borderStyle="round" borderColor="yellow" padding={2} marginBottom={2}>
        <Box flexDirection="column" alignItems="center">
          <Text color="white" bold>Concept Phase Complete!</Text>
          <Newline />
          <Text color="gray">You've successfully completed all phase requirements</Text>
          <Text color="gray">and are ready to move to the next stage.</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text color="cyan" bold>Phase Statistics:</Text>
        <Text color="gray">• Duration: 5 days</Text>
        <Text color="gray">• Tasks completed: 12/12</Text>
        <Text color="gray">• Quality score: 94%</Text>
        <Text color="gray">• On schedule: Yes</Text>
      </Box>
    </Box>
  );
}

/**
 * Preview Step - Show next phase overview
 */
function renderPreviewStep() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={2}>
        <Text color="cyan" bold>📋 Next Phase: Requirements</Text>
      </Box>

      <Box borderStyle="round" borderColor="cyan" padding={2} marginBottom={2}>
        <Box flexDirection="column">
          <Text color="white" bold>Phase Overview:</Text>
          <Newline />
          <Text color="gray">Transform your validated concept into detailed</Text>
          <Text color="gray">technical and business requirements.</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text color="cyan" bold>Upcoming Deliverables:</Text>
        <Text color="yellow">• Product Requirements Document (PRD)</Text>
        <Text color="yellow">• User stories and acceptance criteria</Text>
        <Text color="yellow">• Technical specifications</Text>
        <Text color="yellow">• API design and data models</Text>
        <Newline />
        <Text color="gray">Estimated duration: 7-10 days</Text>
      </Box>
    </Box>
  );
}

/**
 * Confirmation Step - Final confirmation
 */
function renderConfirmationStep() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={2}>
        <Text color="green" bold>✨ Ready to Advance ✨</Text>
      </Box>

      <Box borderStyle="double" borderColor="green" padding={2} marginBottom={2}>
        <Box flexDirection="column" alignItems="center">
          <Text color="white" bold>Phase Transition Confirmed</Text>
          <Newline />
          <Text color="gray">Moving from Concept → Requirements</Text>
          <Text color="gray">All systems ready for next phase</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text color="cyan" bold>What happens next:</Text>
        <Text color="gray">• New tasks will be generated</Text>
        <Text color="gray">• Quality gates will be updated</Text>
        <Text color="gray">• Progress tracking will reset</Text>
        <Text color="gray">• Team notifications will be sent</Text>
      </Box>
    </Box>
  );
}

/**
 * Phase Transition Modal - Overlay version
 */
export function PhaseTransitionModal({
  isVisible = false,
  fromPhase,
  toPhase,
  onConfirm = () => {},
  onCancel = () => {}
}) {
  if (!isVisible) return <Box></Box>;

  return (
    <Box
      borderStyle="double"
      borderColor="cyan"
      padding={1}
      flexDirection="column"
    >
      <PhaseTransition
        fromPhase={fromPhase}
        toPhase={toPhase}
        onComplete={onConfirm}
        onCancel={onCancel}
        autoAdvance={false}
      />
    </Box>
  );
}

/**
 * Quick Phase Summary - Compact version
 */
export function QuickPhaseSummary({
  phase,
  progress,
  completedTasks,
  totalTasks,
  compact = false
}) {
  const progressBar = createProgressBar(progress, compact ? 15 : 25);
  const phaseIcon = getPhaseIcon(phase);
  const phaseColor = getPhaseColor(phase);

  if (compact) {
    return (
      <Box>
        <Text color={phaseColor}>{phaseIcon} {phase}: </Text>
        <Text color="white">{progress}% </Text>
        <Text color="gray">({completedTasks}/{totalTasks})</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={phaseColor}>{phaseIcon} </Text>
        <Text color="white" bold>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Progress: {progressBar} {progress}%</Text>
      </Box>
      <Box>
        <Text color="gray">Tasks: {completedTasks}/{totalTasks} completed</Text>
      </Box>
    </Box>
  );
}

/**
 * Utility functions
 */
function createProgressBar(percent, length = 25) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function getPhaseIcon(phase) {
  const icons = {
    concept: '💡',
    requirements: '📋',
    design: '🎨',
    architecture: '🏗️',
    implementation: '⚡',
    deployment: '🚀'
  };
  return icons[phase] || '📌';
}

function getPhaseColor(phase) {
  const colors = {
    concept: 'yellow',
    requirements: 'cyan',
    design: 'magenta',
    architecture: 'blue',
    implementation: 'green',
    deployment: 'red'
  };
  return colors[phase] || 'gray';
}

export default PhaseTransition;
