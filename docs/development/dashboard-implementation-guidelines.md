# Guidant Dashboard Implementation Guidelines

## 🎯 **Purpose & Scope**

This document provides definitive technical specifications for developing, extending, and maintaining Guidant's dashboard system. These guidelines ensure architectural consistency, performance standards, and seamless MCP integration across all dashboard features.

---

## 📁 **File Organization Standards**

### **Directory Structure**
```
src/
├── ui/
│   ├── dashboard-renderer.js          # Legacy renderer (static dashboards)
│   ├── ink/                          # Ink renderer system
│   │   ├── ink-renderer.jsx          # Main Ink renderer
│   │   └── components/               # React components
│   │       ├── DashboardApp.jsx      # Root component
│   │       ├── HeaderSection.jsx     # Project header
│   │       ├── ProgressSection.jsx   # Progress visualization
│   │       ├── CapabilitiesSection.jsx # AI capabilities
│   │       └── TasksSection.jsx      # Task management
│   └── shared/                       # Shared utilities
│       ├── colors.js                 # Color schemes
│       ├── formatting.js             # Text formatting
│       └── terminal-utils.js         # Terminal utilities
├── cli/
│   └── commands/
│       └── dashboard.js              # Dashboard CLI commands
└── workflow-logic/
    └── workflow-engine.js            # State management
```

### **File Naming Conventions**
```javascript
// File naming standards
const namingConventions = {
  reactComponents: 'PascalCase.jsx',     // DashboardApp.jsx
  utilities: 'kebab-case.js',           // terminal-utils.js
  renderers: 'kebab-case.jsx',          // ink-renderer.jsx
  commands: 'kebab-case.js',            // dashboard.js
  constants: 'UPPER_SNAKE_CASE.js',     // DASHBOARD_CONSTANTS.js
  tests: '*.test.js'                    // dashboard.test.js
};
```

---

## 🏗️ **Architectural Patterns**

### **Renderer Selection Pattern**
```javascript
// Standard renderer selection logic
const getRenderer = (mode, options = {}) => {
  switch (mode) {
    case 'static':
      return {
        type: 'legacy',
        renderer: renderProjectDashboard,
        use_case: 'Quick status check',
        performance: 'Fast (<1s)'
      };
    
    case 'live':
      return {
        type: 'ink',
        renderer: renderInkDashboard,
        use_case: 'Real-time monitoring',
        performance: 'Interactive'
      };
    
    case 'interactive':
      return {
        type: 'ink-enhanced',
        renderer: renderInteractiveDashboard,
        use_case: 'Workflow control',
        performance: 'Full-featured'
      };
    
    default:
      throw new Error(`Unknown dashboard mode: ${mode}`);
  }
};
```

### **MCP Integration Pattern**
```javascript
// Standard MCP tool integration
const mcpToolIntegration = {
  // 1. Tool execution wrapper
  async executeMCPTool(toolName, params) {
    try {
      const result = await mcpTools[toolName](params);
      await this.updateDashboardState(result);
      return result;
    } catch (error) {
      await this.handleMCPError(error, toolName);
      throw error;
    }
  },

  // 2. State update handler
  async updateDashboardState(mcpResult) {
    if (mcpResult.success) {
      const newState = await getCurrentWorkflowState();
      this.rerender(newState);
    }
  },

  // 3. Error handling
  async handleMCPError(error, toolName) {
    console.error(`MCP tool ${toolName} failed:`, error.message);
    // Show error in dashboard UI
    this.showError(`Tool execution failed: ${error.message}`);
  }
};
```

### **File Watcher Pattern**
```javascript
// Standard file watching implementation
class DashboardFileWatcher {
  constructor(onStateChange) {
    this.watchers = [];
    this.onStateChange = onStateChange;
    this.debounceTimeout = null;
  }

  startWatching() {
    const watchPaths = [
      '.guidant/workflow/',
      '.guidant/ai/task-tickets/',
      '.guidant/context/sessions.json'
    ];

    watchPaths.forEach(path => {
      const watcher = watch(path, { recursive: true }, (eventType, filename) => {
        this.debouncedUpdate();
      });
      this.watchers.push(watcher);
    });
  }

  debouncedUpdate() {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(async () => {
      try {
        const newState = await getCurrentWorkflowState();
        this.onStateChange(newState);
      } catch (error) {
        console.warn('File watcher update failed:', error.message);
      }
    }, 100); // 100ms debounce
  }

  cleanup() {
    this.watchers.forEach(watcher => watcher.close());
    clearTimeout(this.debounceTimeout);
  }
}
```

---

## 🎨 **UI Component Standards**

### **React Component Structure**
```jsx
// Standard component template
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {Object} props.projectState - Current project state
 * @param {Object} props.workflowState - Current workflow state
 * @param {boolean} props.compact - Compact mode flag
 */
export function ComponentName({ projectState, workflowState, compact = false }) {
  const [localState, setLocalState] = useState(null);

  // Effect hooks for state management
  useEffect(() => {
    // Component initialization
  }, []);

  // Event handlers
  const handleAction = () => {
    // Action implementation
  };

  // Render logic
  if (compact) {
    return (
      <Box>
        <Text>Compact view content</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" padding={1}>
      <Text bold>Component Title</Text>
      {/* Component content */}
    </Box>
  );
}
```

### **Color Scheme Standards**
```javascript
// Standard color palette
export const DASHBOARD_COLORS = {
  // Primary colors
  primary: '#00b4d8',      // Cyan
  secondary: '#0077b6',    // Blue
  accent: '#03045e',       // Dark blue

  // Status colors
  success: '#28a745',      // Green
  warning: '#ffc107',      // Yellow
  error: '#dc3545',        // Red
  info: '#17a2b8',         // Light blue
  muted: '#6c757d',        // Gray

  // Progress colors
  completed: '#28a745',    // Green
  inProgress: '#fd7e14',   // Orange
  pending: '#ffc107',      // Yellow
  blocked: '#dc3545',      // Red
  deferred: '#6c757d'      // Gray
};
```

### **Layout Standards**
```javascript
// Standard layout configuration
export const LAYOUT_CONFIG = {
  // Terminal constraints
  minWidth: 80,
  maxWidth: 120,
  defaultPadding: 1,
  
  // Component spacing
  sectionMargin: 1,
  itemSpacing: 0,
  
  // Border styles
  borderStyle: 'round',
  borderColors: {
    default: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  },
  
  // Progress bar configuration
  progressBar: {
    length: 30,
    completedChar: '█',
    pendingChar: '░',
    inProgressChar: '▓'
  }
};
```

---

## 🧪 **Testing Strategies**

### **Unit Testing Pattern**
```javascript
// Standard test structure
import { render } from 'ink-testing-library';
import { DashboardApp } from '../src/ui/ink/components/DashboardApp.jsx';

describe('DashboardApp', () => {
  const mockProjectState = {
    name: 'Test Project',
    version: '1.0.0',
    type: 'prototype'
  };

  const mockWorkflowState = {
    currentPhase: { phase: 'concept', status: 'in-progress' },
    phases: { concept: { status: 'in-progress' } }
  };

  test('renders project information correctly', () => {
    const { lastFrame } = render(
      <DashboardApp 
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        compact={false}
      />
    );

    expect(lastFrame()).toContain('Test Project');
    expect(lastFrame()).toContain('1.0.0');
  });

  test('handles compact mode', () => {
    const { lastFrame } = render(
      <DashboardApp 
        projectState={mockProjectState}
        workflowState={mockWorkflowState}
        compact={true}
      />
    );

    // Verify compact layout
    expect(lastFrame().split('\n').length).toBeLessThan(20);
  });
});
```

### **Integration Testing Pattern**
```javascript
// Dashboard command integration tests
import { execSync } from 'child_process';

describe('Dashboard Commands', () => {
  test('static dashboard command works', () => {
    const output = execSync('npm run dashboard', { encoding: 'utf8' });
    
    expect(output).toContain('Guidant');
    expect(output).toContain('Project Progress');
    expect(output).toContain('AI Capabilities');
    expect(output).not.toContain('Error');
  });

  test('live dashboard starts without errors', (done) => {
    const child = spawn('npx', ['tsx', 'index.js', 'live', '--interval', '1000']);
    
    setTimeout(() => {
      child.kill('SIGINT');
      done();
    }, 3000);

    child.stderr.on('data', (data) => {
      fail(`Live dashboard error: ${data}`);
    });
  });
});
```

### **Performance Testing Standards**
```javascript
// Performance benchmarks
const PERFORMANCE_BENCHMARKS = {
  staticDashboard: {
    maxExecutionTime: 1000,    // 1 second
    maxMemoryUsage: 50,        // 50MB
    description: 'Static dashboard render time'
  },
  
  liveDashboard: {
    maxStartupTime: 2000,      // 2 seconds
    maxUpdateLatency: 100,     // 100ms
    maxMemoryUsage: 100,       // 100MB
    description: 'Live dashboard performance'
  },
  
  fileWatcher: {
    maxResponseTime: 50,       // 50ms
    maxCPUUsage: 5,           // 5%
    description: 'File watcher responsiveness'
  }
};
```

---

## ⚡ **Performance Standards**

### **File Watcher Optimization**
```javascript
// Optimized file watching implementation
class OptimizedFileWatcher {
  constructor() {
    this.updateQueue = [];
    this.isProcessing = false;
    this.debounceTime = 100;
  }

  async processUpdates() {
    if (this.isProcessing || this.updateQueue.length === 0) return;
    
    this.isProcessing = true;
    const updates = [...this.updateQueue];
    this.updateQueue = [];

    try {
      // Batch process all updates
      const uniquePaths = [...new Set(updates.map(u => u.path))];
      const stateUpdates = await Promise.all(
        uniquePaths.map(path => this.getStateForPath(path))
      );
      
      // Apply updates efficiently
      await this.applyBatchedUpdates(stateUpdates);
    } finally {
      this.isProcessing = false;
      
      // Process any queued updates
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processUpdates(), this.debounceTime);
      }
    }
  }
}
```

### **Memory Management**
```javascript
// Memory optimization patterns
const memoryOptimization = {
  // Component cleanup
  useEffect(() => {
    return () => {
      // Cleanup subscriptions, timers, watchers
      watchers.forEach(w => w.close());
      clearInterval(refreshInterval);
    };
  }, []),

  // State optimization
  useMemo(() => {
    // Expensive calculations
    return calculateComplexMetrics(projectState);
  }, [projectState.lastModified]),

  // Event handler optimization
  useCallback((event) => {
    // Stable event handlers
    handleUserAction(event);
  }, [dependencies])
};
```

### **Rendering Performance**
```javascript
// Efficient rendering strategies
const renderingOptimization = {
  // Conditional rendering
  shouldComponentUpdate(nextProps) {
    return nextProps.lastUpdated !== this.props.lastUpdated;
  },

  // Virtual scrolling for large lists
  renderTaskList() {
    const visibleTasks = tasks.slice(startIndex, endIndex);
    return visibleTasks.map(task => <TaskItem key={task.id} {...task} />);
  },

  // Lazy loading
  const LazySection = lazy(() => import('./HeavySection'));
};
```

---

## 🔧 **Development Workflow**

### **Feature Development Process**
1. **Design Review**: Ensure alignment with architectural patterns
2. **Implementation**: Follow coding standards and patterns
3. **Testing**: Unit, integration, and performance tests
4. **Documentation**: Update relevant documentation
5. **Review**: Code review focusing on architecture compliance
6. **Integration**: Merge with comprehensive testing

### **Code Quality Standards**
```javascript
// ESLint configuration for dashboard code
module.exports = {
  extends: ['react', 'react-hooks'],
  rules: {
    'react/prop-types': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-unused-vars': 'error'
  }
};
```

### **Documentation Requirements**
- **JSDoc**: All functions and components must have JSDoc comments
- **README**: Each major component directory needs a README
- **Architecture Docs**: Update architecture docs for significant changes
- **Examples**: Provide usage examples for new features

---

## 🚀 **Deployment Guidelines**

### **Build Process**
```bash
# Standard build commands
npm run build          # Production build
npm run test           # Run all tests
npm run lint           # Code quality check
npm run docs           # Generate documentation
```

### **Environment Configuration**
```javascript
// Environment-specific settings
const config = {
  development: {
    fileWatchDebounce: 100,
    logLevel: 'debug',
    enableDevTools: true
  },
  production: {
    fileWatchDebounce: 200,
    logLevel: 'error',
    enableDevTools: false
  }
};
```

### **Monitoring & Observability**
```javascript
// Performance monitoring
const monitoring = {
  trackRenderTime: (componentName, renderTime) => {
    if (renderTime > PERFORMANCE_BENCHMARKS[componentName].maxExecutionTime) {
      console.warn(`${componentName} render time exceeded: ${renderTime}ms`);
    }
  },
  
  trackMemoryUsage: () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > MAX_MEMORY_THRESHOLD) {
      console.warn('Memory usage high:', usage);
    }
  }
};
```

---

**This completes the comprehensive documentation suite for Guidant's dashboard system. All architectural decisions, implementation patterns, and evolution strategies are now documented for future development.**
