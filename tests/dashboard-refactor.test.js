/**
 * Dashboard Refactor Test
 * Tests the new composition pattern components
 */

import { describe, it, expect } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { 
  DashboardLayout, 
  LiveDashboardContainer, 
  InteractiveDashboardContainer,
  DashboardApp 
} from '../src/ui/ink/components/DashboardApp.jsx';

// Mock data for testing
const mockProjectState = {
  config: {
    name: 'Test Project',
    version: '1.0.0'
  },
  workflow: {
    projectType: 'full_product',
    adaptive: true
  },
  ai: {
    capabilities: {
      totalTools: 16,
      categories: 5,
      coverage: 85,
      gaps: ['advanced-testing'],
      toolsByCategory: {
        'Core': 4,
        'Workflow Control': 3
      }
    }
  }
};

const mockWorkflowState = {
  currentPhase: {
    phase: 'implementation'
  },
  phases: {
    planning: { completed: true, progress: 100 },
    implementation: { completed: false, progress: 75 },
    testing: { completed: false, progress: 0 }
  }
};

describe('Dashboard Refactor - Composition Pattern', () => {
  it('should render DashboardLayout without side effects', () => {
    const { lastFrame } = render(
      <DashboardLayout
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        compact={false}
      />
    );

    // Check for key content (accounting for ANSI escape codes)
    expect(lastFrame()).toMatch(/Guidant|___|___/); // ASCII art or text
    expect(lastFrame()).toContain('Test Project');
    expect(lastFrame()).toMatch(/Project Progress|📊/);
  });

  it('should render LiveDashboardContainer with refresh footer', () => {
    const { lastFrame } = render(
      <LiveDashboardContainer
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        refreshInterval={1000}
        compact={false}
      />
    );

    expect(lastFrame()).toMatch(/Guidant|___|___/); // ASCII art or text
    expect(lastFrame()).toContain('Last updated:');
    expect(lastFrame()).toContain('Refresh interval: 1s');
  });

  it('should render InteractiveDashboardContainer with navigation footer', () => {
    const { lastFrame } = render(
      <InteractiveDashboardContainer
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        compact={false}
        selectedSection={0}
      />
    );

    expect(lastFrame()).toMatch(/Guidant|___|___/); // ASCII art or text
    expect(lastFrame()).toContain('Use ↑/↓ or j/k to navigate');
  });

  it('should maintain backward compatibility with DashboardApp', () => {
    // Test static mode
    const { lastFrame: staticFrame } = render(
      <DashboardApp
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        live={false}
        interactive={false}
        compact={false}
      />
    );

    expect(staticFrame()).toMatch(/Guidant|___|___/); // ASCII art or text
    expect(staticFrame()).toContain('Test Project');

    // Test live mode
    const { lastFrame: liveFrame } = render(
      <DashboardApp
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        live={true}
        interactive={false}
        refreshInterval={1000}
        compact={false}
      />
    );

    expect(liveFrame()).toContain('Last updated:');

    // Test interactive mode
    const { lastFrame: interactiveFrame } = render(
      <DashboardApp
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        live={false}
        interactive={true}
        compact={false}
      />
    );

    expect(interactiveFrame()).toContain('Use ↑/↓ or j/k to navigate');
  });

  it('should handle compact mode correctly', () => {
    const { lastFrame } = render(
      <DashboardLayout
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        compact={true}
      />
    );

    expect(lastFrame()).toMatch(/Guidant|___|___/); // ASCII art or text
    expect(lastFrame()).toContain('Test Project');
    // Compact mode should have less detailed output
    expect(lastFrame()).not.toContain('AI Agent Workflow Orchestrator');
  });
});

console.log('🧪 Dashboard Refactor Test Suite');
console.log('✅ Testing composition pattern components');
console.log('📊 Components tested:');
console.log('   • DashboardLayout (pure component)');
console.log('   • LiveDashboardContainer (auto-refresh behavior)');
console.log('   • InteractiveDashboardContainer (navigation behavior)');
console.log('   • DashboardApp (backward compatibility)');
console.log('🎯 All components should render without multiple render issues');
