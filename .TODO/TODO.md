# Guidant - AI Agent Orchestrator

> **Mission**: Transform AI agents from chaotic coders into systematic developers through structured workflows

## 🚨 **THE CORE PROBLEMS GUIDANT SOLVES**

**AI Agent Problems** (from ai-problems.md):
1. **Context & Memory Loss** - AI forgets previous work between sessions
2. **No Systematic Process** - Jumps to coding without research/planning
3. **Poor Research Habits** - Doesn't use tools like Tavily/Context7 effectively
4. **Inconsistent Execution** - Skips testing, documentation, best practices
5. **Communication Gaps** - Overwhelms users with technical complexity
6. **Decision Paralysis** - Too many options, no clear recommendations

## 🎯 **WHAT GUIDANT SHOULD BE**

**The Magic Formula**: `Your Idea + AI Assistant + Guidant Framework = Professional Software`

**For You (Non-Technical User)**:
- Start with vague idea: "I want a restaurant app"
- Make only business decisions throughout
- Get a fully deployed, working application
- Visual progress tracking like TaskMaster

**For AI Agents (Claude/GPT)**:
- Clear, systematic guidance at every step
- Proper context and memory management
- Structured workflows with quality gates
- Tool usage enforcement (research before coding)

**The Result**: AI agents become systematic, consistent, and professional

---

## � **IMMEDIATE FIXES NEEDED**

### **1. Fix Interactive Dashboard Launch**
**Issue**: `guidant interactive` command hangs/doesn't display properly
**Priority**: HIGH - This is the main user interface

**Tasks**:
- [ ] Debug why interactive dashboard doesn't render in terminal
- [ ] Fix tsx/JSX compilation issues in bin/guidant.js
- [ ] Test dashboard rendering with different terminal sizes
- [ ] Ensure keyboard navigation works properly

### **2. Fix Performance Issues**
**Issue**: 3 failing performance tests, memory usage over target
**Priority**: MEDIUM

**Tasks**:
- [ ] Optimize memory usage (currently 106MB, target <100MB)
- [ ] Fix guidant_discover_agent performance (150ms, target <100ms)
- [ ] Investigate file watcher memory leaks

### **3. Fix MCP Server Path Issues**
**Issue**: Tests failing due to missing MCP server files
**Priority**: MEDIUM

**Tasks**:
- [ ] Fix MCP server path references in tests
- [ ] Ensure MCP tools work in both CLI and MCP environments
- [ ] Update test configurations for correct server paths

---

## 🎯 **NEXT ACTIONS TO GET GUIDANT WORKING**

### **Week 1: Fix Core Issues**

**Day 1-2: Debug Interactive Dashboard**
- [ ] Investigate why `guidant interactive` hangs
- [ ] Test tsx compilation and JSX rendering
- [ ] Verify Ink components render properly
- [ ] Test keyboard shortcuts (n, a, r, c, g, i, h, q)

**Day 3-4: Performance Optimization**
- [ ] Profile memory usage and identify leaks
- [ ] Optimize file watchers and real-time updates
- [ ] Fix slow MCP tool execution times
- [ ] Ensure all performance targets are met

**Day 5: MCP Integration Testing**
- [ ] Fix MCP server path issues in tests
- [ ] Test MCP tools in Claude Desktop
- [ ] Verify all 16 MCP tools work correctly
- [ ] Document MCP setup process

### **Week 2: User Experience Polish**

**Day 1-2: CLI Improvements**
- [ ] Add better error messages and help text
- [ ] Improve command discoverability
- [ ] Add progress indicators for long operations
- [ ] Test all CLI commands work as expected

**Day 3-4: Dashboard Enhancements**
- [ ] Polish visual components and layouts
- [ ] Add missing keyboard shortcuts
- [ ] Improve real-time update performance
- [ ] Add better error handling and recovery

**Day 5: Documentation & Examples**
- [ ] Create quick start guide showing implementation ticket generation
- [ ] Add example project workflows through all phases
- [ ] Document all CLI commands and shortcuts
- [ ] Create troubleshooting guide

### **✅ NEW FEATURE COMPLETED: Enhanced Implementation Tickets**

**What's Working Now:**
- When Guidant reaches the **implementation phase**, it automatically generates detailed tickets like your example
- Tickets include: acceptance criteria, technical specifications, code examples, testing requirements
- Both AI-generated (when API keys available) and fallback templates work
- Formatted as clean YAML output for easy reading
- Integrated with MCP tools for Claude/Cursor usage

**To See It In Action:**
1. `guidant init` - Initialize project
2. Advance through phases to implementation
3. `guidant_get_current_task` (MCP) - Get detailed implementation ticket
4. Tickets will match your desired format with comprehensive specifications

---

## 🚀 **FUTURE ENHANCEMENTS** (After Core Issues Fixed)

### **Enhanced AI Integration**
- [ ] **Claude Context Integration** - Auto-inject project state into Claude conversations
- [ ] **Trigger Keywords** - "guidant:" prefix activates orchestrated mode
- [ ] **Multi-Provider Support** - GPT, Perplexity, OpenRouter integration
- [ ] **Intelligent Task Routing** - Assign tasks based on AI capabilities

### **Advanced Features**
- [ ] **Multi-Project Support** - Portfolio management and templates
- [ ] **GitHub Integration** - Import issues, sync with repositories
- [ ] **Advanced Analytics** - Task complexity analysis, performance metrics
- [ ] **Quality Gates** - Automated validation and approval workflows

### **User Experience**
- [ ] **Project Templates** - Quick start for common project types
- [ ] **Visual Reporting** - PDF reports, charts, progress tracking
- [ ] **Team Collaboration** - Multi-user support, role-based access
- [ ] **Plugin System** - Extensible architecture for custom tools

---

## 📊 **SUCCESS METRICS**

### **Immediate Success (Week 1-2)**
- [ ] Interactive dashboard launches and renders properly
- [ ] All keyboard shortcuts work (n, a, r, c, g, i, h, q)
- [ ] Performance tests pass (memory <100MB, tools <100ms)
- [ ] MCP tools work in Claude Desktop
- [ ] All CLI commands work without errors

### **Short-term Success (Month 1)**
- [ ] Users can complete full project workflows
- [ ] Dashboard provides clear project visibility
- [ ] AI agents can use Guidant tools effectively
- [ ] Documentation enables easy onboarding
- [ ] System handles real projects reliably

### **Long-term Success (Month 3+)**
- [ ] Teams adopt Guidant for systematic AI development
- [ ] Multi-project workflows work smoothly
- [ ] Advanced features enhance productivity
- [ ] Community contributes templates and improvements
- [ ] Guidant becomes standard for AI orchestration

---

## 🔧 **GETTING STARTED**

### **Quick Test Commands**
```bash
# Test basic functionality
bun run index.js --help
bun run index.js status
bun run index.js health

# Test dashboard (main interface)
bun run index.js interactive

# Run tests to see what's working
bun test

# Test MCP server
bun run mcp-server
```

### **Current Status Check**
- **CLI Commands**: ✅ Working (`init`, `status`, `health`, `interactive`)
- **Tests**: ⚠️ 191/194 passing (3 performance failures)
- **Dashboard**: ❌ Interactive mode not rendering properly
- **MCP Tools**: ⚠️ Some path issues in tests, but tools exist

### **Priority Order**
1. **Fix interactive dashboard** - This is the main user interface
2. **Fix performance issues** - Memory and speed optimization
3. **Polish user experience** - Better error messages, help text
4. **Add missing features** - Complete any half-implemented functionality

---

## 📝 **NOTES**

**What's Actually Working**:
- Core CLI commands and project structure
- MCP tools and integration (16 tools available)
- Multi-pane dashboard components (191/194 tests passing)
- File watching and real-time updates
- Workflow engine and state management

**What Needs Fixing**:
- Interactive dashboard rendering in terminal
- Performance optimization (memory usage)
- MCP server path configuration
- Better error handling and user feedback

**Key Insight**: Guidant has a solid foundation with most functionality implemented. The focus should be on fixing the user interface and polishing the experience rather than building new features.

---

**Last Updated**: January 15, 2025
**Focus**: Fix core issues to get Guidant working in action
**Priority**: Interactive dashboard → Performance → User experience
**Goal**: Users can see Guidant orchestrating AI workflows effectively
