/**
 * Dashboard Components (Ink/React)
 * Refactored using composition pattern for clean separation of concerns
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, Newline } from 'ink';
import { HeaderSection } from './HeaderSection.jsx';
import { ProgressSection } from './ProgressSection.jsx';
import { CapabilitiesSection } from './CapabilitiesSection.jsx';
import { TasksSection } from './TasksSection.jsx';

/**
 * Pure Dashboard Layout Component - No side effects, just rendering
 * This is the core layout that all other components wrap
 */
export function DashboardLayout({
  projectState,
  workflowState,
  compact = false,
  selectedSection = 0,
  interactive = false,
  footer = null
}) {
  // Calculate overall progress
  const overallProgress = calculateOverallProgress(workflowState.phases);
  const completedPhases = countCompletedPhases(workflowState.phases);
  const totalPhases = Object.keys(workflowState.phases || {}).length;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header Section */}
      <HeaderSection
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
      />

      {/* Progress Section */}
      <ProgressSection
        phases={workflowState.phases}
        currentPhase={workflowState.currentPhase}
        overallProgress={overallProgress}
        completedPhases={completedPhases}
        totalPhases={totalPhases}
        compact={compact}
        selected={interactive && selectedSection === 0}
      />

      {/* Capabilities Section */}
      <CapabilitiesSection
        projectState={projectState}
        compact={compact}
        selected={interactive && selectedSection === 1}
      />

      {/* Tasks Section */}
      <TasksSection
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
        selected={interactive && selectedSection === 2}
      />

      {/* Dynamic Footer */}
      {footer}

      {/* Interactive Footer */}
      {interactive && (
        <Box marginTop={1}>
          <Text color="gray">
            Use ↑/↓ or j/k to navigate • h for help • q to quit
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Live Dashboard Container - Wraps DashboardLayout with auto-refresh behavior
 */
export function LiveDashboardContainer({
  projectState,
  workflowState,
  refreshInterval = 5000,
  compact = false
}) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Live footer component
  const liveFooter = (
    <Box marginTop={1}>
      <Text color="gray">
        Last updated: {lastUpdate.toLocaleTimeString()} •
        Refresh interval: {refreshInterval / 1000}s
      </Text>
    </Box>
  );

  return (
    <DashboardLayout
      projectState={projectState}
      workflowState={workflowState}
      compact={compact}
      footer={liveFooter}
    />
  );
}

/**
 * Interactive Dashboard Container - Wraps DashboardLayout with navigation behavior
 */
export function InteractiveDashboardContainer({
  projectState,
  workflowState,
  compact = false,
  selectedSection = 0,
  onSectionChange = () => {}
}) {
  return (
    <DashboardLayout
      projectState={projectState}
      workflowState={workflowState}
      compact={compact}
      selectedSection={selectedSection}
      interactive={true}
    />
  );
}



/**
 * Intelligent Dashboard Component - Single adaptive dashboard
 * Automatically adapts to context following TaskMaster's single-focus approach
 *
 * Features:
 * - Auto-detects if live updates are needed
 * - Shows interactive elements when terminal supports it
 * - Adapts layout to terminal size
 * - Single prop for intelligent behavior
 */
export function DashboardApp({
  projectState,
  workflowState,
  autoAdapt = true,
  refreshInterval = 5000,
  compact = false,
  selectedSection = 0
}) {
  // Get terminal capabilities
  const terminalWidth = process.stdout.columns || 80;
  const terminalHeight = process.stdout.rows || 24;
  const supportsInteraction = process.stdin.isTTY && process.stdout.isTTY;

  // Auto-detect optimal mode based on context
  const shouldAutoRefresh = autoAdapt && (
    workflowState?.currentPhase === 'implementation' ||
    workflowState?.currentPhase === 'deployment' ||
    projectState?.activeProcesses > 0
  );

  const shouldBeInteractive = autoAdapt && supportsInteraction && terminalWidth >= 80;
  const shouldBeCompact = autoAdapt && (terminalWidth < 100 || terminalHeight < 20);

  // Single intelligent dashboard that adapts automatically
  if (shouldAutoRefresh) {
    return (
      <LiveDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        refreshInterval={refreshInterval}
        compact={shouldBeCompact}
      />
    );
  }

  if (shouldBeInteractive) {
    return (
      <InteractiveDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        compact={shouldBeCompact}
        selectedSection={selectedSection}
      />
    );
  }

  // Default to pure layout with intelligent sizing
  return (
    <DashboardLayout
      projectState={projectState}
      workflowState={workflowState}
      compact={shouldBeCompact}
    />
  );
}

/**
 * Calculate overall project progress
 */
function calculateOverallProgress(phases) {
  if (!phases || Object.keys(phases).length === 0) return 0;

  const phaseEntries = Object.entries(phases);
  const completedPhases = phaseEntries.filter(([_, phase]) => phase.completed).length;
  
  return Math.round((completedPhases / phaseEntries.length) * 100);
}

/**
 * Count completed phases
 */
function countCompletedPhases(phases) {
  if (!phases) return 0;
  return Object.values(phases).filter(phase => phase.completed).length;
}

/**
 * Error Boundary Component
 */
export function DashboardErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    process.on('uncaughtException', handleError);
    process.on('unhandledRejection', handleError);

    return () => {
      process.removeListener('uncaughtException', handleError);
      process.removeListener('unhandledRejection', handleError);
    };
  }, []);

  if (hasError) {
    return fallback ? fallback(error) : (
      <Box borderStyle="round" borderColor="red" padding={1}>
        <Text color="red" bold>Dashboard Error</Text>
        <Newline />
        <Text>{error?.message || 'An unexpected error occurred'}</Text>
        <Newline />
        <Text color="gray">Please check your configuration and try again.</Text>
      </Box>
    );
  }

  return children;
}

/**
 * Loading Component
 */
export function DashboardLoading({ message = 'Loading dashboard...' }) {
  return (
    <Box justifyContent="center" alignItems="center" minHeight={10}>
      <Text color="cyan">
        {message}
      </Text>
    </Box>
  );
}

/**
 * Empty State Component
 */
export function DashboardEmpty({ message = 'No project data available' }) {
  return (
    <Box justifyContent="center" alignItems="center" minHeight={10}>
      <Box borderStyle="round" borderColor="yellow" padding={2}>
        <Text color="yellow" bold>No Data</Text>
        <Newline />
        <Text>{message}</Text>
        <Newline />
        <Text color="gray">Try running 'guidant init' to set up a project.</Text>
      </Box>
    </Box>
  );
}

export default DashboardApp;
