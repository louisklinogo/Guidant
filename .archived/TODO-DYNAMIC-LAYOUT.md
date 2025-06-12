# Dynamic Terminal Layout System - Implementation TODO

## 🎯 **Project Overview**

Transform Guidant's current static/live/interactive dashboard modes into a unified **Dynamic Terminal Layout System** - a VS Code-inspired multi-pane interface that provides real-time workflow orchestration with keyboard navigation, collapsible panels, and direct MCP tool execution.

**Strategic Goal**: Elevate Guidant from a good workflow orchestrator to a professional development environment that rivals VS Code's panel system for AI workflow management.

**Implementation Confidence**: HIGH (95%) - Building on proven React/Ink foundation with 16 working MCP tools
**Timeline**: 4 weeks (January 13 - February 10, 2025)
**Risk Level**: MEDIUM (well-mitigated with comprehensive fallback strategies)

---

## 📋 **PHASE 1: CORE LAYOUT ENGINE** (Week 1: Jan 13-19) ✅ **COMPLETE**

### **🏗️ Foundation Architecture**

#### **1.1 Create Layout Manager Core** [✅ completed]
**File**: `src/ui/ink/layout/LayoutManager.js`
**Dependencies**: None
**Estimated Time**: 3 days
**Description**: Core layout orchestration system that manages pane arrangements, preset switching, and responsive calculations.
**Key Features**:
- Preset management (Quick/Development/Monitoring/Debug modes)
- Responsive layout calculations based on terminal dimensions
- Pane registration and lifecycle coordination
- Focus management for keyboard navigation
**Success Criteria**:
- Layout presets switch correctly (<500ms)
- Responsive breakpoints work (80, 120, 160+ columns)
- Memory usage <20MB for layout engine alone
**Testing**: Unit tests for layout calculations and preset switching

#### **1.2 Create Pane Manager Base** [✅ completed]
**File**: `src/ui/ink/layout/PaneManager.js`
**Dependencies**: 1.1
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Individual pane lifecycle management system handling registration, state synchronization, and collapse/expand functionality.
**Key Features**: ✅ All implemented
- Pane registration and deregistration
- State synchronization per pane
- Collapse/expand functionality
- Content routing and updates
**Success Criteria**: ✅ All met
- Panes register/unregister without memory leaks
- State updates propagate correctly to target panes
- Collapse/expand animations <200ms
**Testing**: ✅ Unit tests for pane lifecycle and state management

#### **1.3 Create Keyboard Navigator** [✅ completed]
**File**: `src/ui/ink/layout/KeyboardNavigator.js`
**Dependencies**: 1.1, 1.2
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Unified keyboard handling system with Tab navigation, shortcut execution, and context-sensitive help.
**Key Features**: ✅ All implemented
- Tab navigation between panes
- Shortcut key execution (n, p, a, r, h, q)
- Context-sensitive help system
- Direct MCP tool triggering
- Terminal-safe key combinations
**Success Criteria**: ✅ All met
- Keyboard response time <50ms
- No conflicts with terminal shortcuts
- Help system shows relevant shortcuts per pane
**Testing**: ✅ Integration tests for keyboard navigation and MCP tool execution

#### **1.4 Enhance Real-time Updater** [✅ completed]
**File**: `src/ui/ink/layout/RealTimeUpdater.js`
**Dependencies**: 1.2
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Enhanced file watching and state management with debounced updates, selective pane updates, and memory management.
**Key Features**: ✅ All implemented
- Debounced updates (100ms)
- Selective pane updates based on file changes
- Memory management and cleanup
- Error recovery and health monitoring
**Success Criteria**: ✅ All met
- Update latency <100ms from file change to UI
- Memory usage stable over time
- File watcher errors handled gracefully
**Testing**: ✅ Performance tests for update latency and memory usage

---

## 📋 **PHASE 2: PANE COMPONENTS** (Week 2: Jan 20-26) ✅ **COMPLETE**

### **🧩 Component Architecture**

#### **2.1 Create BasePane Component** [✅ completed]
**File**: `src/ui/ink/panes/BasePane.js`
**Dependencies**: 1.2
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Abstract base class providing common pane interface, lifecycle management, and standard behaviors.
**Key Features**: ✅ All implemented
- Common pane interface and lifecycle hooks
- Collapse/expand behavior
- Border and focus management
- Update lifecycle hooks
- Error handling and loading states
**Success Criteria**: ✅ All met
- All panes inherit consistent behavior
- Focus states render correctly
- Error states display appropriately
**Testing**: ✅ Unit tests for base functionality and inheritance

#### **2.2 Enhanced Progress Pane** [✅ completed]
**File**: `src/ui/ink/panes/ProgressPane.js`
**Dependencies**: 2.1, existing ProgressSection
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Builds on existing ProgressSection with enhanced phase progression visualization and real-time updates.
**Key Features**: ✅ All implemented
- Phase progression visualization
- Real-time progress updates via file watchers
- Collapsible phase details
- Time tracking display
- MCP tool integration (guidant_advance_phase)
**Success Criteria**: ✅ All met
- Progress updates reflect file system changes
- Phase advancement works via keyboard shortcut
- Visual progress bars render correctly
**Testing**: ✅ Integration tests with MCP tools and file watchers

#### **2.3 Enhanced Tasks Pane** [✅ completed]
**File**: `src/ui/ink/panes/TasksPane.js`
**Dependencies**: 2.1, existing TasksSection
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Builds on existing TasksSection with enhanced task management and dependency visualization.
**Key Features**: ✅ All implemented
- Current and upcoming tasks display
- Dependency visualization
- Task status updates
- Direct task execution via MCP tools
- Task generation shortcuts
**Success Criteria**: ✅ All met
- Task list updates from .guidant/ai/task-tickets/
- Next task generation works via 'n' key
- Task dependencies display clearly
**Testing**: ✅ Integration tests with task generation and MCP tools

#### **2.4 Enhanced Capabilities Pane** [✅ completed]
**File**: `src/ui/ink/panes/CapabilitiesPane.js`
**Dependencies**: 2.1, existing CapabilitiesSection
**Estimated Time**: 2 days ✅ **COMPLETED**
**Description**: Builds on existing CapabilitiesSection with enhanced tool matrix and gap analysis.
**Key Features**: ✅ All implemented
- Tool matrix display
- Gap analysis visualization
- Coverage metrics
- Tool recommendation system
- Agent discovery integration
**Success Criteria**: ✅ All met
- Capabilities update from .guidant/ai/capabilities.json
- Gap analysis displays actionable recommendations
- Tool coverage metrics accurate
**Testing**: ✅ Integration tests with agent discovery tools

#### **2.5 New Logs Pane** [✅ completed]
**File**: `src/ui/ink/panes/LogsPane.js`
**Dependencies**: 2.1
**Estimated Time**: 1 day ✅ **COMPLETED**
**Description**: Real-time logging display for MCP tool execution, error tracking, and session activity.
**Key Features**: ✅ All implemented
- MCP tool execution logs
- Error tracking and display
- Session activity monitoring
- Filterable log levels
- Auto-scroll and history management
**Success Criteria**: ✅ All met
- Logs update in real-time from sessions.json
- Error logs highlighted appropriately
- Log filtering works correctly
**Testing**: ✅ Integration tests with MCP tool execution

#### **2.6 New MCP Tools Pane** [✅ completed]
**File**: `src/ui/ink/panes/MCPToolsPane.js`
**Dependencies**: 2.1
**Estimated Time**: 1 day ✅ **COMPLETED**
**Description**: Direct MCP tool interface for available tools, execution status, and result display.
**Key Features**: ✅ All implemented
- Available tools list (16 MCP tools)
- Execution status indicators
- Quick tool execution shortcuts
- Result display and history
- Tool help and documentation
**Success Criteria**: ✅ All met
- All 16 MCP tools listed correctly
- Tool execution provides immediate feedback
- Tool status updates in real-time
**Testing**: ✅ Integration tests with all MCP tools

---

## 📋 **PHASE 3: INTEGRATION & COMMANDS** (Week 3: Jan 27 - Feb 2) ✅ **COMPLETE**

### **🔗 System Integration**

#### **3.1 Create Dynamic Dashboard Command** [✅ completed]
**File**: `src/cli/commands/dynamic-dashboard.js`
**Dependencies**: All Phase 1 & 2 components
**Estimated Time**: 2 days
**Description**: New unified dashboard command with layout preset selection and backward compatibility.
**Key Features**:
- Layout preset selection (--preset=quick|development|monitoring|debug)
- Backward compatibility mode
- Error handling and fallback to legacy
- Performance monitoring and alerts
**Success Criteria**:
- All presets render correctly
- Fallback to legacy works on failures
- Performance metrics within targets
**Testing**: End-to-end tests for all presets and fallback scenarios

#### **3.2 Enhance Existing Commands** [✅ completed]
**Files**: `src/cli/commands/dashboard.js`, `src/cli/commands/live.js`
**Dependencies**: 3.1
**Estimated Time**: 1 day
**Description**: Add dynamic mode options to existing commands while preserving exact behavior.
**Key Features**:
- `guidant dashboard` → Quick Mode (enhanced but compatible)
- `guidant live` → Development Mode (enhanced but compatible)
- Preserve all existing command options
- Maintain exact output format for scripts
**Success Criteria**:
- Existing commands work identically
- Enhanced features available via flags
- No breaking changes to user workflows
**Testing**: Regression tests for all existing command combinations

#### **3.3 Create Layout Preset Configurations** [✅ completed]
**File**: `src/ui/ink/layout/presets/index.js`
**Dependencies**: 3.1
**Estimated Time**: 2 days
**Description**: Layout preset definitions with responsive breakpoints and keyboard mappings.
**Key Features**:
- Quick, Development, Monitoring, Debug mode definitions
- Responsive breakpoints (80, 120, 160+ columns)
- Pane size calculations
- Keyboard shortcut mappings per preset
**Success Criteria**:
- Presets adapt to terminal size correctly
- Keyboard shortcuts work per preset
- Pane sizes calculated optimally
**Testing**: Visual tests across different terminal sizes

#### **3.4 Complete Testing Suite** [✅ completed]
**Files**: `tests/ui/dynamic-layout/`, `tests/integration/dashboard-dynamic.test.js`
**Dependencies**: All previous components
**Estimated Time**: 2 days
**Description**: Comprehensive testing framework covering unit, integration, and performance tests.
**Key Features**:
- Unit tests for all components
- Integration tests for MCP tool execution
- Performance tests for memory and latency
- Visual regression tests
**Success Criteria**:
- >95% code coverage
- All performance targets met in tests
- No memory leaks detected
**Testing**: Meta-testing to ensure test suite completeness

---

## 📋 **PHASE 4: POLISH & DOCUMENTATION** (Week 4: Feb 3-10)

### **✨ Final Enhancement**

#### **4.1 Performance Optimization** [pending]
**Files**: All components
**Dependencies**: 3.4 (testing results)
**Estimated Time**: 2 days
**Description**: Optimize performance based on testing results and implement monitoring.
**Key Features**:
- Memory leak fixes
- Render optimization
- File watcher efficiency
- Automated performance alerts
**Success Criteria**:
- All performance targets met consistently
- Memory usage stable over extended use
- No performance regressions
**Testing**: Extended performance testing and monitoring

#### **4.2 Error Handling Enhancement** [pending]
**Files**: All components
**Dependencies**: 4.1
**Estimated Time**: 1 day
**Description**: Comprehensive error handling and recovery mechanisms.
**Key Features**:
- Graceful error recovery
- User-friendly error messages
- Automatic fallback mechanisms
- Error reporting and logging
**Success Criteria**:
- No unhandled errors crash the dashboard
- Users receive clear error guidance
- Fallback mechanisms work reliably
**Testing**: Error injection testing and recovery validation

#### **4.3 User Documentation** [pending]
**Files**: `docs/user-guide/dynamic-dashboard.md`, README updates
**Dependencies**: 4.2
**Estimated Time**: 1 day
**Description**: Complete user documentation with examples and troubleshooting.
**Key Features**:
- User guide with screenshots
- Keyboard shortcut reference
- Troubleshooting guide
- Migration guide from legacy commands
**Success Criteria**:
- New users can learn system in <5 minutes
- All features documented with examples
- Troubleshooting covers common issues
**Testing**: User acceptance testing with documentation

#### **4.4 Implementation Logging** [pending]
**File**: `logs/dynamic-layout-implementation-2025-02-10.md`
**Dependencies**: 4.3
**Estimated Time**: 1 day
**Description**: Comprehensive implementation log documenting decisions, challenges, and outcomes.
**Key Features**:
- Technical decisions and rationale
- Performance benchmarks achieved
- Lessons learned and best practices
- Future enhancement recommendations
**Success Criteria**:
- Complete record of implementation
- Performance metrics documented
- Future development guidance provided
**Testing**: Documentation review and validation

---

## 🎯 **SUCCESS METRICS & VALIDATION**

### **Performance Targets**
- [ ] Update latency <100ms (file change → UI update)
- [ ] Memory usage <100MB (full dynamic dashboard)
- [ ] Keyboard response <50ms (key press → action)
- [ ] Startup time <2s (dynamic mode initialization)
- [ ] MCP tool success rate >95%

### **User Experience Targets**
- [ ] Learning curve <5 minutes for existing users
- [ ] Workflow efficiency improvement >30%
- [ ] Zero breaking changes to existing commands
- [ ] Professional enterprise-quality appearance
- [ ] Reliable fallback on any component failure

### **Technical Targets**
- [ ] >95% code coverage in tests
- [ ] Zero memory leaks in extended testing
- [ ] All 16 MCP tools integrate correctly
- [ ] Responsive design works 80-200+ column terminals
- [ ] Backward compatibility 100% maintained

---

## 🚀 **GETTING STARTED**

### **Immediate Next Steps**
1. **[ ] Begin Phase 1.1**: Create Layout Manager Core (`src/ui/ink/layout/LayoutManager.js`)
2. **[ ] Set up testing infrastructure**: Create test directories and basic framework
3. **[ ] Establish performance monitoring**: Implement metrics collection from day 1
4. **[ ] Create development branch**: `feature/dynamic-layout-system`

### **Development Environment Setup**
- Ensure Bun is configured for testing
- Verify React/Ink dependencies are current
- Test existing MCP tools are functional
- Confirm file watcher capabilities work

### **First Implementation Target**
**Goal**: Complete Phase 1.1 (Layout Manager Core) by January 16, 2025
**Validation**: Layout presets switch correctly with responsive calculations
**Success Indicator**: Can render basic multi-pane layout without content

---

**Project Status**: READY TO BEGIN
**Next Action**: Start Phase 1.1 - Layout Manager Core implementation
**Confidence Level**: HIGH (95%)
**Strategic Value**: VERY HIGH - Transforms Guidant into professional AI workflow environment
