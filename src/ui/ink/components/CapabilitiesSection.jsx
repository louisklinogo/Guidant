/**
 * Capabilities Section Component (Ink/React)
 * AI agent capabilities and tool availability display
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Capabilities Section Component
 */
export function CapabilitiesSection({ projectState, compact = false, selected = false }) {
  // Get actual capabilities data with intelligent fallbacks
  const capabilities = getCapabilitiesData(projectState);

  const borderColor = selected ? 'cyan' : 'gray';

  if (compact) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>🤖 AI Capabilities: </Text>
        <Text>Tools: {capabilities.totalTools} • Categories: {capabilities.categories} • Coverage: {capabilities.coverage}%</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* Section Header */}
      <Box borderStyle="round" borderColor={borderColor} padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="cyan" bold>🤖 AI Capabilities</Text>
          <Newline />
          
          {/* Overview Stats */}
          <Box>
            <Text color="white" bold>Available Tools: </Text>
            <Text color="green">{capabilities.totalTools}</Text>
          </Box>
          <Box>
            <Text color="white" bold>Categories: </Text>
            <Text color="green">{capabilities.categories}</Text>
          </Box>
          <Box>
            <Text color="white" bold>Coverage: </Text>
            <Text>{createCoverageBar(capabilities.coverage)}</Text>
          </Box>
        </Box>
      </Box>

      {/* Tool Categories Breakdown */}
      <ToolCategoriesBreakdown 
        toolsByCategory={capabilities.toolsByCategory}
        compact={compact}
      />

      {/* Capability Gaps */}
      {capabilities.gaps && capabilities.gaps.length > 0 && (
        <CapabilityGaps gaps={capabilities.gaps} />
      )}
    </Box>
  );
}

/**
 * Tool Categories Breakdown Component
 */
function ToolCategoriesBreakdown({ toolsByCategory, compact }) {
  if (!toolsByCategory || Object.keys(toolsByCategory).length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>Tool Categories:</Text>
      <Newline />
      
      {Object.entries(toolsByCategory).map(([category, count]) => (
        <Box key={category} marginBottom={compact ? 0 : 1}>
          <Box width={25}>
            <Text color="white">{category}:</Text>
          </Box>
          <Box>
            <Text color="green">{count} tools</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Capability Gaps Component
 */
function CapabilityGaps({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column">
      <Text color="yellow" bold>⚠️ Capability Gaps:</Text>
      <Newline />
      
      {gaps.map((gap, index) => (
        <Box key={index}>
          <Text color="yellow">• </Text>
          <Text color="white">{gap}</Text>
        </Box>
      ))}
      
      <Newline />
      <Text color="gray">Run 'guidant analyze-gaps' for recommendations</Text>
    </Box>
  );
}

/**
 * Create coverage progress bar
 */
function createCoverageBar(percent, length = 20) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;

  let color = 'red';
  if (percent >= 90) color = 'green';
  else if (percent >= 75) color = 'yellow';
  else if (percent >= 50) color = 'yellow';

  const filledSection = '█'.repeat(filled);
  const emptySection = '░'.repeat(empty);

  return (
    <Text>
      <Text color={color}>{filledSection}</Text>
      <Text color="gray">{emptySection}</Text>
      <Text color={color}> {percent}%</Text>
    </Text>
  );
}

/**
 * Agent Status Component
 */
export function AgentStatus({ agentInfo }) {
  if (!agentInfo) {
    return (
      <Box borderStyle="round" borderColor="yellow" padding={1}>
        <Text color="yellow">⚠️ No agent information available</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" borderColor="blue" padding={1}>
      <Box flexDirection="column">
        <Text color="cyan" bold>Current Agent:</Text>
        <Newline />
        <Box>
          <Text color="white" bold>Type: </Text>
          <Text>{agentInfo.type || 'Unknown'}</Text>
        </Box>
        <Box>
          <Text color="white" bold>Capabilities: </Text>
          <Text color="green">{agentInfo.capabilities || 0}</Text>
        </Box>
        <Box>
          <Text color="white" bold>Status: </Text>
          <Text color="green">Active</Text>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Tool Availability Grid Component
 */
export function ToolAvailabilityGrid({ tools, compact = false }) {
  if (!tools || tools.length === 0) {
    return (
      <Box>
        <Text color="gray">No tools configured</Text>
      </Box>
    );
  }

  const toolsPerRow = compact ? 4 : 3;
  const rows = [];
  
  for (let i = 0; i < tools.length; i += toolsPerRow) {
    rows.push(tools.slice(i, i + toolsPerRow));
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, rowIndex) => (
        <Box key={rowIndex} marginBottom={1}>
          {row.map((tool, toolIndex) => (
            <Box key={toolIndex} width={compact ? 15 : 20}>
              <Text color={tool.available ? 'green' : 'red'}>
                {tool.available ? '✅' : '❌'} {tool.name}
              </Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Get capabilities data with intelligent fallbacks
 */
function getCapabilitiesData(projectState) {
  // Try to get real capabilities data first
  const realCapabilities = projectState?.capabilities;
  const aiCapabilities = projectState?.ai?.capabilities;

  // If we have real data, use it
  if (realCapabilities || aiCapabilities) {
    const capabilities = realCapabilities || aiCapabilities;

    return {
      totalTools: capabilities.totalTools || capabilities.tools?.length || 0,
      categories: capabilities.categories || calculateCategories(capabilities.tools),
      coverage: capabilities.coverage || calculateCoverage(capabilities.tools),
      gaps: capabilities.gaps || identifyGaps(capabilities.tools),
      toolsByCategory: capabilities.toolsByCategory || categorizeTools(capabilities.tools)
    };
  }

  // Fallback to reasonable defaults with clear indication
  return {
    totalTools: 0,
    categories: 0,
    coverage: 0,
    gaps: ['No capabilities data available'],
    toolsByCategory: {},
    _isPlaceholder: true
  };
}

/**
 * Calculate number of tool categories
 */
function calculateCategories(tools) {
  if (!tools || !Array.isArray(tools)) return 0;

  const categories = new Set();
  tools.forEach(tool => {
    if (tool.category) {
      categories.add(tool.category);
    }
  });

  return categories.size;
}

/**
 * Calculate coverage percentage
 */
function calculateCoverage(tools) {
  if (!tools || !Array.isArray(tools)) return 0;

  const totalPossibleTools = 20; // Estimate of total possible tools
  const availableTools = tools.filter(tool => tool.available !== false).length;

  return Math.min(Math.round((availableTools / totalPossibleTools) * 100), 100);
}

/**
 * Identify capability gaps
 */
function identifyGaps(tools) {
  if (!tools || !Array.isArray(tools)) return ['Project not initialized'];

  const gaps = [];
  const availableCategories = new Set();

  tools.forEach(tool => {
    if (tool.category && tool.available !== false) {
      availableCategories.add(tool.category);
    }
  });

  // Check for common missing categories
  const expectedCategories = [
    'file-management',
    'web-search',
    'code-analysis',
    'testing',
    'deployment'
  ];

  expectedCategories.forEach(category => {
    if (!availableCategories.has(category)) {
      gaps.push(category);
    }
  });

  return gaps.length > 0 ? gaps : [];
}

/**
 * Categorize tools by type
 */
function categorizeTools(tools) {
  if (!tools || !Array.isArray(tools)) return {};

  const categorized = {};

  tools.forEach(tool => {
    const category = tool.category || 'Other';
    if (!categorized[category]) {
      categorized[category] = 0;
    }
    if (tool.available !== false) {
      categorized[category]++;
    }
  });

  return categorized;
}

export default CapabilitiesSection;
