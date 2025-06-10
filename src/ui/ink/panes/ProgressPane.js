/**
 * Progress Pane Component
 * Enhanced progress visualization for the Dynamic Terminal Layout System
 * 
 * Builds on existing ProgressSection with enhanced phase progression visualization,
 * real-time updates, collapsible phase details, and MCP tool integration.
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import { BasePane } from './BasePane.js';
import { ProjectHealthIndicators } from '../components/ProjectHealthIndicators.jsx';
import { PhaseTransitionModal } from '../components/PhaseTransition.jsx';
// Note: Building on existing ProgressSection.jsx patterns
// import { ProgressSection } from '../components/ProgressSection.jsx';

/**
 * Progress Pane Class
 * Displays project phase progression and completion status
 */
export class ProgressPane extends BasePane {
  constructor(props) {
    super(props);
    
    // Additional state for progress pane
    this.state = {
      ...this.state,
      showPhaseDetails: props.showPhaseDetails || false,
      selectedPhase: null,
      progressHistory: [],
      viewMode: 'overview', // overview, health, timeline
      showPhaseTransition: false
    };
  }

  /**
   * Lifecycle hooks
   */
  onMount() {
    this.loadProgressData();
  }

  onUnmount() {
    // Cleanup any timers or subscriptions
  }

  /**
   * Load progress data from project state
   */
  async loadProgressData() {
    try {
      this.setLoading(true);
      
      // In real implementation, this would load from .guidant/workflow/
      const progressData = this.props.data || await this.fetchProgressData();
      
      this.setState({
        data: progressData,
        lastUpdate: new Date(),
        internalState: 'ready'
      });
      
      this.setLoading(false);
      
    } catch (error) {
      this.handleError(error.message);
    }
  }

  /**
   * Fetch progress data (mock implementation)
   */
  async fetchProgressData() {
    // Mock data - in real implementation, read from .guidant/workflow/
    return {
      phases: {
        'concept': {
          name: 'Concept & Planning',
          completed: true,
          progress: 100,
          startDate: '2025-01-10',
          endDate: '2025-01-11',
          deliverables: ['Project Requirements', 'Technical Specification']
        },
        'design': {
          name: 'Design & Architecture',
          completed: true,
          progress: 100,
          startDate: '2025-01-11',
          endDate: '2025-01-12',
          deliverables: ['System Architecture', 'UI/UX Design']
        },
        'implementation': {
          name: 'Implementation',
          completed: false,
          progress: 75,
          startDate: '2025-01-12',
          endDate: null,
          deliverables: ['Core Features', 'Dynamic Layout System']
        },
        'testing': {
          name: 'Testing & QA',
          completed: false,
          progress: 0,
          startDate: null,
          endDate: null,
          deliverables: ['Unit Tests', 'Integration Tests']
        },
        'deployment': {
          name: 'Deployment',
          completed: false,
          progress: 0,
          startDate: null,
          endDate: null,
          deliverables: ['Production Build', 'Documentation']
        }
      },
      currentPhase: {
        phase: 'implementation',
        startDate: '2025-01-12',
        progress: 75
      },
      overallProgress: 55,
      completedPhases: 2,
      totalPhases: 5,
      timeTracking: {
        totalTimeSpent: '3 days',
        estimatedTimeRemaining: '2 days',
        efficiency: 85
      }
    };
  }

  /**
   * Keyboard shortcuts for progress pane
   */
  handleKeyPress(key) {
    switch (key) {
      case 'a':
        this.advancePhase();
        return true;
      case 'p':
        this.reportProgress();
        return true;
      case 'r':
        // Handle async refresh - don't await to maintain sync interface
        this.refreshProgress().catch(error => {
          this.handleError(`Refresh failed: ${error.message}`);
        });
        return true;
      case 'd':
        return this.togglePhaseDetails();
      case 'h':
        return this.toggleHealthView();
      case 'Enter':
        return this.viewPhaseDetails();
      case 'ArrowUp':
        return this.selectPreviousPhase();
      case 'ArrowDown':
        return this.selectNextPhase();
      default:
        return super.handleKeyPress(key);
    }
  }

  /**
   * Get context-sensitive help
   */
  getKeyboardHelp() {
    return [
      'Progress Pane:',
      '  a - Advance to next phase',
      '  p - Report progress',
      '  r - Refresh progress data',
      '  d - Toggle phase details',
      '  h - Toggle health view',
      '  ↑/↓ - Navigate phases',
      '  Enter - View phase details',
      ...super.getKeyboardHelp()
    ];
  }

  /**
   * Progress pane actions
   */
  async advancePhase() {
    try {
      // In real implementation, call MCP tool guidant_advance_phase
      console.log('Advancing to next phase...');
      
      // Mock advancement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh data after advancement
      await this.loadProgressData();
      
      return true;
    } catch (error) {
      this.handleError(`Failed to advance phase: ${error.message}`);
      return false;
    }
  }

  async reportProgress() {
    try {
      // In real implementation, call MCP tool guidant_report_progress
      console.log('Reporting progress...');
      
      // Mock progress report
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      this.handleError(`Failed to report progress: ${error.message}`);
      return false;
    }
  }

  async refreshProgress() {
    await this.loadProgressData();
    return true;
  }

  togglePhaseDetails() {
    this.setState(prev => ({
      showPhaseDetails: !prev.showPhaseDetails
    }));
    return true;
  }

  toggleHealthView() {
    this.setState(prev => ({
      viewMode: prev.viewMode === 'health' ? 'overview' : 'health'
    }));
    return true;
  }

  viewPhaseDetails() {
    const { selectedPhase } = this.state;
    if (selectedPhase) {
      // Show detailed view of selected phase
      console.log(`Viewing details for phase: ${selectedPhase}`);
    }
    return true;
  }

  selectPreviousPhase() {
    const { data } = this.state;
    if (!data?.phases) return false;
    
    const phaseKeys = Object.keys(data.phases);
    const currentIndex = phaseKeys.indexOf(this.state.selectedPhase);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : phaseKeys.length - 1;
    
    this.setState({ selectedPhase: phaseKeys[newIndex] });
    return true;
  }

  selectNextPhase() {
    const { data } = this.state;
    if (!data?.phases) return false;
    
    const phaseKeys = Object.keys(data.phases);
    const currentIndex = phaseKeys.indexOf(this.state.selectedPhase);
    const newIndex = currentIndex < phaseKeys.length - 1 ? currentIndex + 1 : 0;
    
    this.setState({ selectedPhase: phaseKeys[newIndex] });
    return true;
  }

  /**
   * Render progress content
   */
  renderContent() {
    const { data, showPhaseDetails, selectedPhase, viewMode } = this.state;
    const { compact = false, projectState, workflowState } = this.props;

    if (!data) {
      return (
        <Box>
          <Text color="yellow">No progress data available</Text>
        </Box>
      );
    }

    // Health view mode
    if (viewMode === 'health' && !compact) {
      return this.renderHealthView();
    }

    // Default overview mode
    return (
      <Box flexDirection="column">
        {/* Overall Progress */}
        <OverallProgressDisplay
          progress={data.overallProgress}
          completedPhases={data.completedPhases}
          totalPhases={data.totalPhases}
          timeTracking={data.timeTracking}
          compact={compact}
        />

        {/* Phase Breakdown */}
        {!compact && (
          <PhaseBreakdownDisplay
            phases={data.phases}
            currentPhase={data.currentPhase}
            selectedPhase={selectedPhase}
            showDetails={showPhaseDetails}
            onPhaseSelect={(phase) => this.setState({ selectedPhase: phase })}
          />
        )}

        {/* Current Phase Details */}
        {data.currentPhase && (
          <CurrentPhaseDisplay
            currentPhase={data.currentPhase}
            phaseData={data.phases[data.currentPhase.phase]}
            compact={compact}
          />
        )}

        {/* View Mode Indicator */}
        {!compact && (
          <Box marginTop={1}>
            <Text color="gray">
              View: {viewMode} | h to toggle health view
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  /**
   * Render health view with project health indicators
   */
  renderHealthView() {
    const { data } = this.state;
    const { projectState, workflowState } = this.props;

    // Create mock metrics from progress data
    const metrics = {
      tasksPerDay: '2.3',
      avgTaskTime: '4.2h',
      bugRate: '0.12',
      codeCoverage: '87%'
    };

    return (
      <Box flexDirection="column">
        {/* Health View Header */}
        <Box marginBottom={1}>
          <Text color="cyan" bold>🏥 Project Health Dashboard</Text>
          <Text color="gray"> (h to switch to overview)</Text>
        </Box>

        {/* Project Health Indicators */}
        <ProjectHealthIndicators
          projectState={projectState}
          workflowState={workflowState}
          metrics={metrics}
          compact={false}
          showTrends={true}
          showForecasts={true}
        />

        {/* Quick Phase Summary */}
        {data.currentPhase && (
          <Box marginTop={1}>
            <Text color="cyan" bold>📊 Current Phase Summary</Text>
            <Box marginTop={1}>
              <Text color="yellow">
                🎯 {data.phases[data.currentPhase.phase]?.name || 'Unknown Phase'}
              </Text>
              <Text color="gray"> - {data.currentPhase.progress}% complete</Text>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
}

/**
 * Overall Progress Display Component
 */
function OverallProgressDisplay({ progress, completedPhases, totalPhases, timeTracking, compact }) {
  const progressBar = createProgressBar(progress, compact ? 20 : 30);
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>📊 Overall Progress</Text>
      <Box marginTop={1}>
        <Text>{progressBar} {progress}%</Text>
      </Box>
      <Box>
        <Text color="gray">
          {completedPhases}/{totalPhases} phases complete
        </Text>
      </Box>
      
      {!compact && timeTracking && (
        <Box marginTop={1}>
          <Text color="gray">
            Time: {timeTracking.totalTimeSpent} spent, {timeTracking.estimatedTimeRemaining} remaining
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Phase Breakdown Display Component
 */
function PhaseBreakdownDisplay({ phases, currentPhase, selectedPhase, showDetails, onPhaseSelect }) {
  const phaseEntries = Object.entries(phases);
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>📋 Phase Breakdown</Text>
      <Newline />
      
      {phaseEntries.map(([phaseName, phase]) => {
        const isCurrent = currentPhase?.phase === phaseName;
        const isSelected = selectedPhase === phaseName;
        const status = phase.completed ? 'completed' : (isCurrent ? 'in-progress' : 'pending');
        
        return (
          <PhaseRow
            key={phaseName}
            name={phaseName}
            phase={phase}
            status={status}
            isCurrent={isCurrent}
            isSelected={isSelected}
            showDetails={showDetails}
            onSelect={() => onPhaseSelect(phaseName)}
          />
        );
      })}
    </Box>
  );
}

/**
 * Individual Phase Row Component
 */
function PhaseRow({ name, phase, status, isCurrent, isSelected, showDetails, onSelect }) {
  const statusColors = {
    completed: 'green',
    'in-progress': 'yellow',
    pending: 'gray'
  };
  
  const statusIcons = {
    completed: '✅',
    'in-progress': '🔄',
    pending: '⏳'
  };
  
  const borderColor = isSelected ? 'cyan' : 'gray';
  const backgroundColor = isCurrent ? 'blue' : undefined;
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={statusColors[status]}>
          {statusIcons[status]} {phase.name}
        </Text>
        <Text color="gray"> ({phase.progress}%)</Text>
      </Box>
      
      {showDetails && isSelected && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color="gray">Start: {phase.startDate || 'Not started'}</Text>
          <Text color="gray">End: {phase.endDate || 'In progress'}</Text>
          {phase.deliverables && (
            <Box flexDirection="column">
              <Text color="gray">Deliverables:</Text>
              {phase.deliverables.map((deliverable, index) => (
                <Text key={index} color="gray">  • {deliverable}</Text>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

/**
 * Current Phase Display Component
 */
function CurrentPhaseDisplay({ currentPhase, phaseData, compact }) {
  if (!currentPhase || !phaseData) return null;
  
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="yellow" bold>🎯 Current Phase: {phaseData.name}</Text>
      {!compact && (
        <Box marginTop={1}>
          <Text color="gray">
            Progress: {createProgressBar(phaseData.progress, 20)} {phaseData.progress}%
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Create progress bar visualization
 */
function createProgressBar(percent, length = 30) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;
  const color = percent >= 75 ? 'green' : percent >= 50 ? 'yellow' : 'red';
  
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

/**
 * Default props
 */
ProgressPane.defaultProps = {
  ...BasePane.defaultProps,
  paneId: 'progress',
  title: '📊 Progress',
  showPhaseDetails: false
};

export default ProgressPane;
