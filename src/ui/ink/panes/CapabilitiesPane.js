/**
 * Capabilities Pane Component
 * Enhanced AI capabilities and tool analysis for the Dynamic Terminal Layout System
 * 
 * Builds on existing CapabilitiesSection with enhanced tool matrix display,
 * gap analysis visualization, coverage metrics, and agent discovery integration.
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import { BasePane } from './BasePane.js';

/**
 * Capabilities Pane Class
 * Displays AI tools, coverage analysis, and gap recommendations
 */
export class CapabilitiesPane extends BasePane {
  constructor(props) {
    super(props);
    
    // Additional state for capabilities pane
    this.state = {
      ...this.state,
      selectedToolIndex: 0,
      viewMode: 'overview', // overview, tools, gaps, agents
      showDetails: props.showDetails || false,
      filterCategory: 'all' // all, core, workflow, analysis, etc.
    };
  }

  /**
   * Lifecycle hooks
   */
  onMount() {
    this.loadCapabilitiesData();
  }

  onUnmount() {
    // Cleanup any timers or subscriptions
  }

  /**
   * Load capabilities data from project state
   */
  async loadCapabilitiesData() {
    try {
      this.setLoading(true);
      
      // In real implementation, this would load from .guidant/ai/capabilities.json
      const capabilitiesData = this.props.data || await this.fetchCapabilitiesData();
      
      this.safeSetState({
        data: capabilitiesData,
        lastUpdate: new Date(),
        internalState: 'ready'
      });
      
      this.setLoading(false);
      
    } catch (error) {
      this.handleError(error.message);
    }
  }

  /**
   * Fetch capabilities data (mock implementation)
   */
  async fetchCapabilitiesData() {
    // Mock data - in real implementation, read from .guidant/ai/capabilities.json
    return {
      overview: {
        totalTools: 16,
        categories: 5,
        coverage: 85,
        gapCount: 3,
        lastAnalysis: '2025-01-13T14:30:00Z'
      },
      toolsByCategory: {
        'Core Project Management': {
          tools: [
            { name: 'guidant_init_project', status: 'available', coverage: 100 },
            { name: 'guidant_get_project_state', status: 'available', coverage: 100 },
            { name: 'guidant_save_deliverable', status: 'available', coverage: 100 }
          ],
          coverage: 100
        },
        'Workflow Control': {
          tools: [
            { name: 'guidant_get_current_task', status: 'available', coverage: 95 },
            { name: 'guidant_report_progress', status: 'available', coverage: 90 },
            { name: 'guidant_advance_phase', status: 'available', coverage: 100 }
          ],
          coverage: 95
        },
        'Agent Discovery': {
          tools: [
            { name: 'guidant_discover_agent', status: 'available', coverage: 80 },
            { name: 'guidant_list_agents', status: 'available', coverage: 85 },
            { name: 'guidant_analyze_gaps', status: 'available', coverage: 75 }
          ],
          coverage: 80
        },
        'Capability Analysis': {
          tools: [
            { name: 'guidant_request_tools', status: 'available', coverage: 70 },
            { name: 'guidant_suggest_config', status: 'available', coverage: 85 }
          ],
          coverage: 78
        },
        'Adaptive Workflow': {
          tools: [
            { name: 'guidant_classify_project', status: 'available', coverage: 90 },
            { name: 'guidant_generate_adaptive_workflow', status: 'available', coverage: 85 },
            { name: 'guidant_apply_adaptive_workflow', status: 'available', coverage: 80 }
          ],
          coverage: 85
        }
      },
      gaps: [
        {
          category: 'Testing & QA',
          description: 'Advanced testing automation and quality assurance tools',
          impact: 'high',
          recommendation: 'Add automated testing framework integration',
          estimatedEffort: '2-3 days'
        },
        {
          category: 'Deployment',
          description: 'Automated deployment and CI/CD pipeline integration',
          impact: 'medium',
          recommendation: 'Integrate with popular CI/CD platforms',
          estimatedEffort: '1-2 days'
        },
        {
          category: 'Monitoring',
          description: 'Real-time project health and performance monitoring',
          impact: 'low',
          recommendation: 'Add performance metrics and alerting',
          estimatedEffort: '1 day'
        }
      ],
      agents: [
        {
          id: 'claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          status: 'active',
          capabilities: ['coding', 'analysis', 'documentation'],
          coverage: 95,
          lastSeen: '2025-01-13T14:30:00Z'
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          status: 'available',
          capabilities: ['coding', 'creative', 'analysis'],
          coverage: 85,
          lastSeen: '2025-01-13T12:00:00Z'
        }
      ],
      recommendations: [
        'Consider adding automated testing tools for better coverage',
        'Integrate deployment automation for streamlined releases',
        'Add performance monitoring for production insights'
      ]
    };
  }

  /**
   * Keyboard shortcuts for capabilities pane
   */
  handleKeyPress(key) {
    switch (key) {
      case 'c':
        // Handle async capabilities analysis - don't await to maintain sync interface
        this.analyzeCapabilities().catch(error => {
          this.handleError(`Capabilities analysis failed: ${error.message}`);
        });
        return true;
      case 'g':
        return this.showGapAnalysis();
      case 'd':
        // Handle async agent discovery - don't await to maintain sync interface
        this.discoverAgents().catch(error => {
          this.handleError(`Agent discovery failed: ${error.message}`);
        });
        return true;
      case 'r':
        // Handle async refresh - don't await to maintain sync interface
        this.refreshCapabilities().catch(error => {
          this.handleError(`Refresh failed: ${error.message}`);
        });
        return true;
      case 'v':
        return this.cycleViewMode();
      case 'f':
        return this.cycleFilter();
      case 't':
        return this.toggleDetails();
      case 'Enter':
        return this.viewToolDetails();
      case 'ArrowUp':
        return this.selectPreviousTool();
      case 'ArrowDown':
        return this.selectNextTool();
      default:
        return super.handleKeyPress(key);
    }
  }

  /**
   * Get context-sensitive help
   */
  getKeyboardHelp() {
    return [
      'Capabilities Pane:',
      '  c - Analyze capabilities',
      '  g - Show gap analysis',
      '  d - Discover agents',
      '  v - Change view mode',
      '  f - Filter category',
      '  t - Toggle details',
      '  ↑/↓ - Navigate tools',
      '  Enter - View tool details',
      ...super.getKeyboardHelp()
    ];
  }

  /**
   * Capabilities pane actions
   */
  async analyzeCapabilities() {
    try {
      // In real implementation, call MCP tool guidant_analyze_gaps
      console.log('Analyzing capabilities...');
      
      // Mock analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data after analysis
      await this.loadCapabilitiesData();
      
      return true;
    } catch (error) {
      this.handleError(`Failed to analyze capabilities: ${error.message}`);
      return false;
    }
  }

  showGapAnalysis() {
    this.safeSetState({ viewMode: 'gaps' });
    return true;
  }

  async discoverAgents() {
    try {
      // In real implementation, call MCP tool guidant_discover_agent
      console.log('Discovering agents...');
      
      // Mock discovery
      await new Promise(resolve => setTimeout(resolve, 800));
      
      this.safeSetState({ viewMode: 'agents' });
      
      return true;
    } catch (error) {
      this.handleError(`Failed to discover agents: ${error.message}`);
      return false;
    }
  }

  async refreshCapabilities() {
    await this.loadCapabilitiesData();
    return true;
  }

  cycleViewMode() {
    const modes = ['overview', 'tools', 'gaps', 'agents'];
    const currentIndex = modes.indexOf(this.state.viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;

    this.safeSetState({ viewMode: modes[nextIndex] });
    return true;
  }

  cycleFilter() {
    const { data } = this.state;
    if (!data?.toolsByCategory) return false;

    const categories = ['all', ...Object.keys(data.toolsByCategory)];
    const currentIndex = categories.indexOf(this.state.filterCategory);
    const nextIndex = (currentIndex + 1) % categories.length;

    this.safeSetState({ filterCategory: categories[nextIndex] });
    return true;
  }

  toggleDetails() {
    this.safeSetState(prev => ({ showDetails: !prev.showDetails }));
    return true;
  }

  viewToolDetails() {
    const { data, selectedToolIndex, viewMode } = this.state;
    if (viewMode === 'tools' && data?.toolsByCategory) {
      // Find selected tool across all categories
      let toolIndex = 0;
      for (const [category, categoryData] of Object.entries(data.toolsByCategory)) {
        for (const tool of categoryData.tools) {
          if (toolIndex === selectedToolIndex) {
            console.log(`Viewing details for tool: ${tool.name}`);
            return true;
          }
          toolIndex++;
        }
      }
    }
    return true;
  }

  selectPreviousTool() {
    this.safeSetState(prev => ({
      selectedToolIndex: prev.selectedToolIndex > 0
        ? prev.selectedToolIndex - 1
        : this.getTotalToolCount() - 1
    }));
    return true;
  }

  selectNextTool() {
    this.safeSetState(prev => ({
      selectedToolIndex: prev.selectedToolIndex < this.getTotalToolCount() - 1
        ? prev.selectedToolIndex + 1
        : 0
    }));
    return true;
  }

  getTotalToolCount() {
    const { data } = this.state;
    if (!data?.toolsByCategory) return 0;
    
    return Object.values(data.toolsByCategory)
      .reduce((total, category) => total + category.tools.length, 0);
  }

  /**
   * Render capabilities content
   */
  renderContent() {
    const { data, viewMode, showDetails, filterCategory, selectedToolIndex } = this.state;
    const { compact = false } = this.props;
    
    if (!data) {
      return (
        <Box>
          <Text color="yellow">No capabilities data available</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {/* View Mode Header */}
        <ViewModeHeader 
          viewMode={viewMode}
          overview={data.overview}
          compact={compact}
        />
        
        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <OverviewDisplay 
            overview={data.overview}
            toolsByCategory={data.toolsByCategory}
            compact={compact}
          />
        )}
        
        {viewMode === 'tools' && (
          <ToolsDisplay
            toolsByCategory={data.toolsByCategory}
            selectedIndex={selectedToolIndex}
            filterCategory={filterCategory}
            showDetails={showDetails}
            compact={compact}
          />
        )}
        
        {viewMode === 'gaps' && (
          <GapsDisplay
            gaps={data.gaps}
            recommendations={data.recommendations}
            compact={compact}
          />
        )}
        
        {viewMode === 'agents' && (
          <AgentsDisplay
            agents={data.agents}
            compact={compact}
          />
        )}
        
        {/* Status Bar */}
        {!compact && (
          <Box marginTop={1}>
            <Text color="gray">
              View: {viewMode} | Filter: {filterCategory} | v/f to change
            </Text>
          </Box>
        )}
      </Box>
    );
  }
}

/**
 * View Mode Header Component
 */
function ViewModeHeader({ viewMode, overview, compact }) {
  const modeIcons = {
    overview: '📊',
    tools: '🔧',
    gaps: '⚠️',
    agents: '🤖'
  };
  
  const modeTitles = {
    overview: 'Capabilities Overview',
    tools: 'Available Tools',
    gaps: 'Gap Analysis',
    agents: 'Discovered Agents'
  };
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        {modeIcons[viewMode]} {modeTitles[viewMode]}
      </Text>
      
      {!compact && overview && (
        <Box marginTop={1}>
          <Text color="gray">
            {overview.totalTools} tools | {overview.coverage}% coverage | {overview.gapCount} gaps
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Overview Display Component
 */
function OverviewDisplay({ overview, toolsByCategory, compact }) {
  const coverageBar = createProgressBar(overview.coverage, compact ? 15 : 25);
  
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="gray">Coverage: </Text>
        <Text>{coverageBar} {overview.coverage}%</Text>
      </Box>
      
      {!compact && (
        <Box flexDirection="column">
          <Text color="cyan">Categories:</Text>
          {Object.entries(toolsByCategory).map(([category, data]) => (
            <Box key={category} marginLeft={2}>
              <Text color="gray">• {category}: </Text>
              <Text color={getCoverageColor(data.coverage)}>
                {data.coverage}% ({data.tools.length} tools)
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * Tools Display Component
 */
function ToolsDisplay({ toolsByCategory, selectedIndex, filterCategory, showDetails, compact }) {
  let toolIndex = 0;
  
  return (
    <Box flexDirection="column">
      {Object.entries(toolsByCategory)
        .filter(([category]) => filterCategory === 'all' || category === filterCategory)
        .map(([category, categoryData]) => (
          <Box key={category} flexDirection="column" marginBottom={1}>
            <Text color="cyan" bold>{category} ({categoryData.coverage}%)</Text>
            
            {categoryData.tools.map((tool, index) => {
              const isSelected = toolIndex === selectedIndex;
              const currentToolIndex = toolIndex++;
              
              return (
                <ToolRow
                  key={tool.name}
                  tool={tool}
                  isSelected={isSelected}
                  showDetails={showDetails && isSelected}
                  compact={compact}
                />
              );
            })}
          </Box>
        ))}
    </Box>
  );
}

/**
 * Tool Row Component
 */
function ToolRow({ tool, isSelected, showDetails, compact }) {
  const statusColor = tool.status === 'available' ? 'green' : 'red';
  const coverageColor = getCoverageColor(tool.coverage);
  
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <Text color={statusColor}>
          {tool.status === 'available' ? '✅' : '❌'} {tool.name}
        </Text>
        {!compact && (
          <Text color={coverageColor}> ({tool.coverage}%)</Text>
        )}
      </Box>
      
      {showDetails && !compact && (
        <Box marginLeft={2} marginTop={1}>
          <Text color="gray">Status: {tool.status}</Text>
          <Newline />
          <Text color="gray">Coverage: {tool.coverage}%</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Gaps Display Component
 */
function GapsDisplay({ gaps, recommendations, compact }) {
  return (
    <Box flexDirection="column">
      {gaps.map((gap, index) => (
        <GapRow key={index} gap={gap} compact={compact} />
      ))}
      
      {!compact && recommendations && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan" bold>Recommendations:</Text>
          {recommendations.map((rec, index) => (
            <Box key={index} marginLeft={2}>
              <Text color="gray">• {rec}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * Gap Row Component
 */
function GapRow({ gap, compact }) {
  const impactColor = gap.impact === 'high' ? 'red' : gap.impact === 'medium' ? 'yellow' : 'green';
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={impactColor}>⚠️ {gap.category}</Text>
        <Text color="gray"> ({gap.impact} impact)</Text>
      </Box>
      
      {!compact && (
        <Box flexDirection="column" marginLeft={2}>
          <Text color="gray">{gap.description}</Text>
          <Text color="gray">Effort: {gap.estimatedEffort}</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Agents Display Component
 */
function AgentsDisplay({ agents, compact }) {
  return (
    <Box flexDirection="column">
      {agents.map((agent, index) => (
        <AgentRow key={agent.id} agent={agent} compact={compact} />
      ))}
    </Box>
  );
}

/**
 * Agent Row Component
 */
function AgentRow({ agent, compact }) {
  const statusColor = agent.status === 'active' ? 'green' : 'yellow';
  const coverageColor = getCoverageColor(agent.coverage);
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={statusColor}>🤖 {agent.name}</Text>
        <Text color={coverageColor}> ({agent.coverage}%)</Text>
      </Box>
      
      {!compact && (
        <Box marginLeft={2}>
          <Text color="gray">
            Capabilities: {agent.capabilities.join(', ')}
          </Text>
        </Box>
      )}
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

function getCoverageColor(coverage) {
  if (coverage >= 90) return 'green';
  if (coverage >= 70) return 'yellow';
  return 'red';
}

/**
 * Default props
 */
CapabilitiesPane.defaultProps = {
  ...BasePane.defaultProps,
  paneId: 'capabilities',
  title: '🔧 Capabilities',
  showDetails: false
};

export default CapabilitiesPane;
