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
import { MultiPaneLayout } from '../layouts/MultiPaneLayout.jsx';

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
 * Multi-Pane Dashboard Container - New VS Code-inspired multi-pane interface
 * Provides enhanced workflow orchestration with collapsible panels
 */
export function MultiPaneDashboardContainer({
  projectState,
  workflowState,
  preset = 'development',
  terminalDimensions,
  compact = false,
  onPaneUpdate = () => {},
  onLayoutChange = () => {},
  onKeyboardAction = () => {}
}) {
  return (
    <MultiPaneLayout
      projectState={projectState}
      workflowState={workflowState}
      preset={preset}
      terminalDimensions={terminalDimensions}
      compact={compact}
      interactive={true}
      onPaneUpdate={onPaneUpdate}
      onLayoutChange={onLayoutChange}
      onKeyboardAction={onKeyboardAction}
    />
  );
}

/**
 * Legacy DashboardApp Component - Maintains backward compatibility
 * @deprecated Use DashboardLayout, LiveDashboardContainer, InteractiveDashboardContainer, or MultiPaneDashboardContainer instead
 */
export function DashboardApp({
  projectState,
  workflowState,
  live = false,
  refreshInterval = 5000,
  compact = false,
  selectedSection = 0,
  interactive = false,
  multiPane = false,
  preset = 'development',
  terminalDimensions
}) {
  // Route to multi-pane layout if requested
  if (multiPane) {
    return (
      <MultiPaneDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        preset={preset}
        terminalDimensions={terminalDimensions}
        compact={compact}
      />
    );
  }

  // Route to appropriate component based on props
  if (live) {
    return (
      <LiveDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        refreshInterval={refreshInterval}
        compact={compact}
      />
    );
  }

  if (interactive) {
    return (
      <InteractiveDashboardContainer
        projectState={projectState}
        workflowState={workflowState}
        compact={compact}
        selectedSection={selectedSection}
      />
    );
  }

  // Default to pure layout
  return (
    <DashboardLayout
      projectState={projectState}
      workflowState={workflowState}
      compact={compact}
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
