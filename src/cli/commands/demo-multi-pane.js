/**
 * Multi-Pane Dashboard Demo Command
 * Showcases the VS Code-inspired multi-pane interface with rich mock data
 */

import chalk from 'chalk';
import { renderInteractiveDashboard } from '../../ui/ink/renderers/interactive-renderer.tsx';

/**
 * Generate rich mock data for demo
 */
function generateDemoData() {
  const projectState = {
    name: 'AI-Powered E-Commerce Platform',
    description: 'Next-generation e-commerce platform with AI recommendations',
    version: '2.1.0',
    created: new Date('2024-01-15'),
    lastModified: new Date(),
    
    capabilities: {
      tools: [
        'guidant_get_current_task',
        'guidant_advance_phase', 
        'guidant_report_progress',
        'guidant_analyze_gaps',
        'guidant_discover_agent',
        'tavily-search_tavily',
        'resolve-library-id_context7',
        'get-library-docs_context7',
        'codebase-retrieval',
        'str-replace-editor',
        'save-file',
        'launch-process',
        'web-search',
        'web-fetch',
        'render-mermaid'
      ],
      coverage: {
        research: 95,
        design: 87,
        development: 92,
        testing: 78,
        deployment: 85
      },
      gaps: [
        { category: 'testing', tool: 'automated-testing-framework', priority: 'high' },
        { category: 'deployment', tool: 'container-orchestration', priority: 'medium' }
      ]
    },

    team: {
      size: 1,
      roles: ['Full-Stack AI Developer'],
      experience: 'Senior'
    },

    metrics: {
      linesOfCode: 15420,
      filesModified: 127,
      testsWritten: 89,
      bugsFixed: 23,
      featuresCompleted: 12
    }
  };

  const workflowState = {
    currentPhase: 'implementation',
    startDate: new Date('2024-01-15'),
    
    phases: {
      planning: {
        name: 'Project Planning',
        completed: true,
        progress: 100,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        deliverables: [
          { name: 'Project Charter', completed: true },
          { name: 'Technical Requirements', completed: true },
          { name: 'Architecture Design', completed: true }
        ]
      },
      
      design: {
        name: 'System Design',
        completed: true,
        progress: 100,
        startDate: new Date('2024-01-22'),
        endDate: new Date('2024-02-05'),
        deliverables: [
          { name: 'Database Schema', completed: true },
          { name: 'API Specifications', completed: true },
          { name: 'UI/UX Mockups', completed: true }
        ]
      },
      
      implementation: {
        name: 'Development',
        completed: false,
        progress: 67,
        startDate: new Date('2024-02-05'),
        estimatedEndDate: new Date('2024-03-15'),
        deliverables: [
          { name: 'User Authentication', completed: true },
          { name: 'Product Catalog', completed: true },
          { name: 'Shopping Cart', completed: false, progress: 80 },
          { name: 'Payment Integration', completed: false, progress: 45 },
          { name: 'AI Recommendations', completed: false, progress: 30 }
        ]
      },
      
      testing: {
        name: 'Quality Assurance',
        completed: false,
        progress: 25,
        deliverables: [
          { name: 'Unit Tests', completed: false, progress: 60 },
          { name: 'Integration Tests', completed: false, progress: 30 },
          { name: 'Performance Tests', completed: false, progress: 10 }
        ]
      },
      
      deployment: {
        name: 'Production Deployment',
        completed: false,
        progress: 0,
        deliverables: [
          { name: 'CI/CD Pipeline', completed: false },
          { name: 'Production Environment', completed: false },
          { name: 'Monitoring Setup', completed: false }
        ]
      }
    },

    currentTasks: [
      {
        id: 'TASK-001',
        title: 'Implement Shopping Cart Persistence',
        description: 'Add Redis-based session storage for shopping cart data',
        priority: 'high',
        status: 'in_progress',
        assignee: 'AI Agent',
        estimatedHours: 8,
        completedHours: 5,
        dueDate: new Date('2024-01-28')
      },
      {
        id: 'TASK-002', 
        title: 'Integrate Stripe Payment Gateway',
        description: 'Complete payment processing with Stripe API',
        priority: 'high',
        status: 'pending',
        assignee: 'AI Agent',
        estimatedHours: 12,
        completedHours: 0,
        dueDate: new Date('2024-01-30')
      },
      {
        id: 'TASK-003',
        title: 'Build AI Recommendation Engine',
        description: 'Implement collaborative filtering for product recommendations',
        priority: 'medium',
        status: 'pending',
        assignee: 'AI Agent',
        estimatedHours: 20,
        completedHours: 0,
        dueDate: new Date('2024-02-05')
      }
    ],

    recentActivity: [
      { timestamp: new Date(), action: 'Completed user authentication module', type: 'success' },
      { timestamp: new Date(Date.now() - 3600000), action: 'Fixed shopping cart bug #127', type: 'fix' },
      { timestamp: new Date(Date.now() - 7200000), action: 'Added product search functionality', type: 'feature' },
      { timestamp: new Date(Date.now() - 10800000), action: 'Updated database schema', type: 'update' }
    ],

    qualityGates: {
      codeReview: { passed: true, score: 92 },
      testing: { passed: false, score: 78, threshold: 85 },
      security: { passed: true, score: 94 },
      performance: { passed: false, score: 82, threshold: 90 }
    }
  };

  return { projectState, workflowState };
}

/**
 * Demo Multi-Pane Dashboard Command
 */
export async function demoMultiPaneCommand(options = {}) {
  try {
    console.log(chalk.blue('🚀 Launching Multi-Pane Dashboard Demo...'));
    console.log(chalk.gray('This demo showcases the VS Code-inspired interface with rich mock data.\n'));
    
    // Generate demo data
    const { projectState, workflowState } = generateDemoData();
    
    // Get terminal dimensions
    const terminalDimensions = {
      width: process.stdout.columns || 120,
      height: process.stdout.rows || 30
    };

    // Render options
    const renderOptions = {
      compact: options.compact || false,
      multiPane: true,
      preset: options.preset || 'debug', // Use debug preset to show all panes
      terminalDimensions
    };

    console.log(chalk.cyan('📊 Demo Features:'));
    console.log(chalk.gray('  • 5-pane layout (Progress, Tasks, Capabilities, Logs, Tools)'));
    console.log(chalk.gray('  • Real-time keyboard navigation'));
    console.log(chalk.gray('  • Collapsible panels'));
    console.log(chalk.gray('  • Rich mock project data'));
    console.log(chalk.gray('  • Professional VS Code-inspired design\n'));
    
    console.log(chalk.yellow('🎮 Controls:'));
    console.log(chalk.gray('  Tab/Shift+Tab - Navigate panes'));
    console.log(chalk.gray('  Space - Toggle collapse'));
    console.log(chalk.gray('  h - Help overlay'));
    console.log(chalk.gray('  q - Quit\n'));

    // Launch the multi-pane dashboard
    await renderInteractiveDashboard(projectState, workflowState, renderOptions);

    return { success: true };

  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Register demo command
 */
export function registerDemoCommand(program) {
  program
    .command('demo')
    .description('Launch multi-pane dashboard demo with rich mock data')
    .option('-c, --compact', 'Show compact view')
    .option('-p, --preset <preset>', 'Layout preset (quick|development|monitoring|debug)', 'debug')
    .action(demoMultiPaneCommand);
}

export default { demoMultiPaneCommand, registerDemoCommand };
