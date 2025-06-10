# Guidant Dashboard Integration Architecture

## 🏗️ **System Overview**

Guidant's dashboard system is designed as a **multi-modal interface** for AI Agent Workflow Orchestration, providing both quick status checks and real-time workflow monitoring through a sophisticated MCP-integrated architecture.

---

## 🔄 **MCP Integration Layer**

### **Model Context Protocol Foundation**
```
MCP Architecture:
├── Persistent Connections
│   ├── Claude/AI Agent Sessions
│   ├── Real-time State Synchronization
│   └── Event-driven Workflow Updates
├── Tool Registry (16 MCP Tools)
│   ├── Core: Project management
│   ├── Workflow Control: Phase management
│   ├── Agent Discovery: Capability analysis
│   ├── Capability Analysis: Tool assessment
│   └── Adaptive Workflow: Intelligence scaling
└── State Management
    ├── .guidant/ Directory Structure
    ├── JSON-based Persistence
    └── Atomic File Operations
```

### **Real-time Integration Points**
```javascript
// File System Watchers
const mcpIntegrationPoints = {
  workflowState: '.guidant/workflow/current-phase.json',
  taskTickets: '.guidant/ai/task-tickets/',
  sessions: '.guidant/context/sessions.json',
  decisions: '.guidant/context/decisions.json',
  capabilities: '.guidant/ai/capabilities.json'
};

// Live Dashboard Updates
watchers.forEach(path => {
  watch(path, { recursive: true }, async () => {
    const newState = await getCurrentWorkflowState();
    updateDashboard(newState);
  });
});
```

---

## 🖥️ **CLI Command Structure**

### **Command Hierarchy**
```
guidant
├── dashboard (Static Status)
│   ├── --compact          # Compact view
│   ├── --no-header        # Hide banner
│   ├── --no-progress      # Hide progress
│   ├── --no-capabilities  # Hide AI tools
│   └── --no-tasks         # Hide task overview
├── live (Real-time Monitoring)
│   ├── --interval <ms>    # Refresh rate
│   ├── --compact          # Compact live view
│   └── [same options as dashboard]
└── interactive (Future: Full Control)
    ├── --keyboard         # Enable navigation
    ├── --mcp-tools        # Direct tool access
    └── --multi-project    # Portfolio view
```

### **Renderer Selection Logic**
```javascript
const rendererStrategy = {
  static: {
    command: 'dashboard',
    renderer: 'legacy',
    use_case: 'Quick status check',
    performance: 'Fast (<1s)',
    integration: 'CLI-friendly'
  },
  live: {
    command: 'live',
    renderer: 'ink',
    use_case: 'Workflow monitoring',
    performance: 'Interactive',
    integration: 'MCP file watchers'
  },
  interactive: {
    command: 'interactive',
    renderer: 'ink + controls',
    use_case: 'Workflow management',
    performance: 'Full-featured',
    integration: 'Direct MCP tools'
  }
};
```

---

## 📊 **Live Dashboard Architecture**

### **Component Hierarchy**
```
LiveDashboard
├── DashboardApp (Root)
│   ├── HeaderSection
│   │   ├── ProjectBanner (Figlet)
│   │   ├── ProjectInfo
│   │   └── WorkflowStatus
│   ├── ProgressSection
│   │   ├── OverallProgress
│   │   ├── PhaseBreakdown
│   │   └── TimeTracking
│   ├── CapabilitiesSection
│   │   ├── ToolMatrix
│   │   ├── GapAnalysis
│   │   └── CoverageMetrics
│   ├── TasksSection
│   │   ├── CurrentTask
│   │   ├── UpcomingTasks
│   │   └── DependencyView
│   └── StatusFooter
│       ├── LastUpdated
│       ├── RefreshInterval
│       └── KeyboardHints
└── InteractiveControls (Future)
    ├── KeyboardNavigation
    ├── MCPToolExecution
    └── ContextualHelp
```

### **State Management Flow**
```javascript
// Real-time State Updates
const stateFlow = {
  1: 'File System Change Detected',
  2: 'File Watcher Triggers Event',
  3: 'getCurrentWorkflowState() Called',
  4: 'New State Fetched from .guidant/',
  5: 'React Component Rerender',
  6: 'UI Updates Instantly'
};

// State Sources
const stateSources = {
  projectState: 'src/file-management/project-structure.js',
  workflowState: 'src/workflow-logic/workflow-engine.js',
  capabilities: 'src/ai-coordination/capability-discovery.js',
  tasks: '.guidant/ai/task-tickets/',
  sessions: '.guidant/context/sessions.json'
};
```

---

## ⌨️ **Interactive Control System**

### **Planned Keyboard Navigation**
```javascript
const keyboardControls = {
  // Workflow Management
  'n': 'generateNextTask()',
  'p': 'reportProgress()',
  'a': 'advancePhase()',
  'r': 'refreshState()',
  
  // Navigation
  '↑/↓': 'Navigate sections',
  '←/→': 'Navigate items',
  'Enter': 'Expand/Execute',
  'Tab': 'Switch focus',
  
  // Views
  'c': 'Toggle compact mode',
  'h': 'Show/hide help',
  'f': 'Toggle full screen',
  
  // System
  'q': 'Quit dashboard',
  'Ctrl+C': 'Force exit'
};
```

### **Direct MCP Tool Integration**
```javascript
// Interactive MCP Tool Execution
const mcpToolIntegration = {
  taskManagement: {
    'guidant_get_current_task': 'Get next task',
    'guidant_report_progress': 'Report completion',
    'guidant_advance_phase': 'Move to next phase'
  },
  projectControl: {
    'guidant_get_project_state': 'Refresh project state',
    'guidant_save_deliverable': 'Save work output',
    'guidant_classify_project': 'Analyze project type'
  },
  agentCoordination: {
    'guidant_discover_agent': 'Analyze capabilities',
    'guidant_analyze_gaps': 'Find missing tools',
    'guidant_request_tools': 'Request new capabilities'
  }
};
```

---

## 🔄 **Data Flow Diagrams**

### **Static Dashboard Flow**
```
User Command → CLI Parser → Project State → Legacy Renderer → Terminal Output
     ↓              ↓            ↓              ↓              ↓
guidant dashboard → dashboard.js → getProjectState() → renderProjectDashboard() → stdout
```

### **Live Dashboard Flow**
```
User Command → CLI Parser → Initial State → Ink Renderer → File Watchers → Real-time Updates
     ↓              ↓           ↓             ↓              ↓              ↓
guidant live → liveDashboard() → getProjectState() → renderInkDashboard() → watch(.guidant/) → rerender()
                                                                                    ↓
                                                                            State Change Detection
                                                                                    ↓
                                                                            getCurrentWorkflowState()
                                                                                    ↓
                                                                            Component Update
```

### **MCP Integration Flow**
```
AI Agent → MCP Tool → File System → File Watcher → Dashboard Update
    ↓         ↓          ↓             ↓              ↓
Claude → guidant_report_progress → .guidant/context/sessions.json → watch() → rerender()
```

---

## 🎯 **Integration Points**

### **CLI ↔ MCP Integration**
```javascript
// CLI commands trigger MCP tools
const cliMcpBridge = {
  'guidant next': 'guidant_get_current_task',
  'guidant progress': 'guidant_report_progress',
  'guidant advance': 'guidant_advance_phase',
  'guidant status': 'guidant_get_project_state',
  'guidant capabilities': 'guidant_discover_agent'
};
```

### **Dashboard ↔ File System Integration**
```javascript
// Real-time file monitoring
const fileSystemIntegration = {
  watchPaths: [
    '.guidant/workflow/',
    '.guidant/ai/task-tickets/',
    '.guidant/context/sessions.json',
    '.guidant/project/config.json'
  ],
  updateTriggers: [
    'Task completion',
    'Phase advancement',
    'Capability changes',
    'Project configuration'
  ]
};
```

### **Live Dashboard ↔ MCP Tools Integration**
```javascript
// Direct tool execution from dashboard
const dashboardMcpIntegration = {
  interactiveMode: {
    keyPress: 'n',
    action: 'generateNextTask',
    mcpTool: 'guidant_get_current_task',
    feedback: 'Visual task update'
  },
  realTimeUpdates: {
    trigger: 'File system change',
    detection: 'File watcher',
    response: 'Component rerender',
    latency: '<100ms'
  }
};
```

---

## 📈 **Scalability Considerations**

### **Multi-Project Support**
```javascript
// Portfolio dashboard architecture
const multiProjectArchitecture = {
  projectDiscovery: 'Scan for .guidant/ directories',
  stateAggregation: 'Combine project states',
  watcherManagement: 'Multiple file watchers',
  uiScaling: 'Responsive project grid',
  performanceOptimization: 'Lazy loading, virtualization'
};
```

### **Team Coordination**
```javascript
// Multi-agent workflow monitoring
const teamCoordination = {
  agentSessions: 'Track multiple AI agents',
  workDistribution: 'Task assignment visualization',
  conflictDetection: 'Concurrent work alerts',
  progressAggregation: 'Team progress metrics',
  communicationChannels: 'Agent coordination logs'
};
```

### **Performance Optimization**
```javascript
// Efficient real-time updates
const performanceStrategy = {
  fileWatching: 'Debounced updates (100ms)',
  stateManagement: 'Incremental updates only',
  rendering: 'Virtual DOM diffing',
  memoryManagement: 'Cleanup on unmount',
  networkOptimization: 'Local file system only'
};
```

---

## 🔒 **Backward Compatibility**

### **Legacy Support**
- **Static Dashboard**: Always available as fallback
- **CLI Commands**: Maintain existing command structure
- **File Formats**: Support legacy .guidant/ structure
- **MCP Tools**: Backward compatible tool signatures

### **Migration Strategy**
- **Graceful Degradation**: Live dashboard falls back to static
- **Progressive Enhancement**: Add features without breaking existing
- **Version Detection**: Automatic compatibility mode selection
- **User Choice**: Manual renderer selection available

---

**Next Document**: Evolution-Proof Roadmap and Implementation Guidelines
