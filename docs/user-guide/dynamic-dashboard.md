# Dynamic Terminal Layout System - User Guide

## 🎯 **Overview**

The Dynamic Terminal Layout System transforms Guidant's dashboard into a VS Code-inspired multi-pane interface that provides real-time workflow orchestration with keyboard navigation, collapsible panels, and direct MCP tool execution.

**Key Benefits:**
- **Unified Interface**: Single dashboard replacing separate static/live/interactive modes
- **Real-time Updates**: Live file watching and automatic UI updates
- **Keyboard Navigation**: Full keyboard control with intuitive shortcuts
- **Professional Layout**: VS Code-inspired panel system with responsive design
- **Direct Tool Access**: Execute MCP tools directly from the interface

---

## 🚀 **Getting Started**

### **Quick Start (5 minutes)**

1. **Launch Dynamic Dashboard**
   ```bash
   guidant dashboard --dynamic
   # or use the new unified command
   guidant dynamic-dashboard
   ```

2. **Choose Your Layout Preset**
   - **Quick Mode**: `guidant dynamic-dashboard --preset=quick`
   - **Development Mode**: `guidant dynamic-dashboard --preset=development` (default)
   - **Monitoring Mode**: `guidant dynamic-dashboard --preset=monitoring`
   - **Debug Mode**: `guidant dynamic-dashboard --preset=debug`

3. **Navigate with Keyboard**
   - Press `Tab` to move between panes
   - Press `h` for help and keyboard shortcuts
   - Press `q` to quit

### **System Requirements**
- Terminal width: 80+ columns (120+ recommended)
- Terminal height: 24+ rows (30+ recommended)
- Bun runtime environment
- Active Guidant project (`.guidant/` directory)

---

## 📋 **Layout Presets**

### **Quick Mode** (`--preset=quick`)
**Best for**: Quick status checks, CI/CD integration
- **Layout**: Single pane with essential project status
- **Performance**: Fastest rendering (<1s startup)
- **Use Case**: Scripts, automation, quick checks

### **Development Mode** (`--preset=development`) *[Default]*
**Best for**: Active development work
- **Layout**: 3-pane layout (Progress | Tasks | Capabilities)
- **Features**: Real-time updates, keyboard navigation
- **Use Case**: Daily development workflow

### **Monitoring Mode** (`--preset=monitoring`)
**Best for**: Project monitoring, team leads
- **Layout**: 4-pane layout (Progress | Tasks | Logs | Tools)
- **Features**: Live MCP tool execution feedback, error tracking
- **Use Case**: Project oversight, debugging

### **Debug Mode** (`--preset=debug`)
**Best for**: Troubleshooting, system analysis
- **Layout**: 5-pane layout (All panes visible)
- **Features**: Detailed state inspection, session replay
- **Use Case**: Debugging, system analysis

---

## ⌨️ **Keyboard Shortcuts**

### **Global Navigation**
| Key | Action | Description |
|-----|--------|-------------|
| `Tab` | Next Pane | Move focus to next pane |
| `Shift+Tab` | Previous Pane | Move focus to previous pane |
| `h` | Help | Show context-sensitive help |
| `q` | Quit | Exit dynamic dashboard |
| `r` | Refresh | Refresh current pane data |
| `Space` | Toggle Collapse | Collapse/expand focused pane |

### **Progress Pane Shortcuts**
| Key | Action | Description |
|-----|--------|-------------|
| `a` | Advance Phase | Move to next development phase |
| `p` | Report Progress | Report current task progress |
| `d` | Toggle Details | Show/hide phase details |
| `↑/↓` | Navigate Phases | Select different phases |
| `Enter` | View Details | View detailed phase information |

### **Tasks Pane Shortcuts**
| Key | Action | Description |
|-----|--------|-------------|
| `n` | Next Task | Generate next task |
| `c` | Complete Task | Mark current task as complete |
| `f` | Filter Tasks | Cycle through task filters |
| `s` | Sort Tasks | Change task sorting |
| `↑/↓` | Navigate Tasks | Select different tasks |

### **Capabilities Pane Shortcuts**
| Key | Action | Description |
|-----|--------|-------------|
| `c` | Analyze | Run capability analysis |
| `g` | Gap Analysis | Show capability gaps |
| `d` | Discover Agents | Discover available AI agents |
| `v` | View Mode | Cycle through view modes |
| `f` | Filter Category | Filter by tool category |

### **Logs Pane Shortcuts**
| Key | Action | Description |
|-----|--------|-------------|
| `f` | Filter Level | Cycle through log levels |
| `c` | Clear Logs | Clear all log entries |
| `e` | Errors Only | Show only error logs |
| `s` | Auto-scroll | Toggle automatic scrolling |
| `t` | Timestamps | Toggle timestamp display |

### **MCP Tools Pane Shortcuts**
| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | Execute Tool | Run selected MCP tool |
| `i` | Tool Info | Show tool information |
| `f` | Filter Tools | Filter by tool category |
| `x` | Clear Result | Clear execution result |
| **Quick Actions** | | |
| `n` | Next Task | Quick: Generate next task |
| `p` | Report Progress | Quick: Report progress |
| `a` | Advance Phase | Quick: Advance phase |

---

## 🔧 **Advanced Features**

### **Real-time File Watching**
The system automatically watches your `.guidant/` directory for changes:
- **Progress updates** when workflow files change
- **Task updates** when task tickets are modified
- **Capability updates** when agent configurations change
- **Log updates** from session activity

### **Responsive Design**
The layout adapts to your terminal size:
- **80-119 columns**: Compact layout with essential information
- **120-159 columns**: Standard layout with full features
- **160+ columns**: Full layout with maximum detail

### **Error Recovery**
Built-in error handling and recovery:
- **Automatic retry** for network and MCP tool failures
- **Graceful fallback** for rendering issues
- **State recovery** for component errors
- **User-friendly messages** for all error conditions

### **Performance Monitoring**
Real-time performance tracking:
- **Update latency**: <100ms target
- **Memory usage**: <100MB target
- **Keyboard response**: <50ms target
- **Automatic alerts** when targets are exceeded

---

## 🛠️ **Customization**

### **Environment Variables**
```bash
# Performance tuning
export GUIDANT_UPDATE_DEBOUNCE=100    # Update debounce (ms)
export GUIDANT_MAX_MEMORY=104857600   # Max memory (bytes)
export GUIDANT_LOG_LEVEL=info         # Log level

# UI customization
export GUIDANT_THEME=dark             # UI theme
export GUIDANT_UNICODE_MODE=auto      # Unicode support
```

### **Configuration File**
Create `.guidant/config/dashboard.json`:
```json
{
  "defaultPreset": "development",
  "keyboardShortcuts": {
    "customShortcuts": {
      "ctrl+r": "refresh",
      "ctrl+t": "toggleTheme"
    }
  },
  "performance": {
    "updateLatency": 100,
    "memoryLimit": 104857600
  }
}
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

**Dashboard won't start**
- Ensure you're in a Guidant project directory
- Check terminal size (minimum 80x24)
- Verify Bun installation: `bun --version`

**Slow performance**
- Reduce terminal size or use Quick mode
- Check system resources
- Clear logs: Press `c` in Logs pane

**Keyboard shortcuts not working**
- Ensure terminal supports key combinations
- Check for conflicting terminal shortcuts
- Try alternative shortcuts (see help with `h`)

**Layout issues**
- Increase terminal size
- Use ASCII mode: `--unicode-mode=ascii`
- Try different preset: `--preset=quick`

### **Performance Issues**

**High memory usage**
```bash
# Monitor memory
guidant dynamic-dashboard --preset=quick
# Clear caches
rm -rf .guidant/cache/*
```

**Slow updates**
```bash
# Increase debounce time
export GUIDANT_UPDATE_DEBOUNCE=200
guidant dynamic-dashboard
```

### **Getting Help**

**In-app help**
- Press `h` for context-sensitive help
- Each pane shows relevant shortcuts

**Command line help**
```bash
guidant dynamic-dashboard --help
guidant dashboard --help
```

**Debug information**
```bash
# Enable debug mode
guidant dynamic-dashboard --preset=debug --log-level=debug
```

---

## 🔄 **Migration from Legacy Commands**

### **Backward Compatibility**
All existing commands continue to work:
```bash
# These still work exactly as before
guidant dashboard
guidant live
guidant interactive
```

### **Enhanced Commands**
Existing commands now support dynamic features:
```bash
# Enhanced with dynamic features
guidant dashboard --dynamic
guidant live --dynamic
```

### **New Unified Command**
The new command provides the full experience:
```bash
# New unified command
guidant dynamic-dashboard --preset=development
```

---

## 📊 **Performance Targets**

The system is designed to meet these performance targets:

| Metric | Target | Description |
|--------|--------|-------------|
| **Update Latency** | <100ms | File change → UI update |
| **Memory Usage** | <100MB | Total memory consumption |
| **Keyboard Response** | <50ms | Key press → action |
| **Startup Time** | <2s | Dashboard initialization |
| **MCP Tool Success** | >95% | Tool execution success rate |

---

## 🎓 **Best Practices**

### **Daily Workflow**
1. Start with Development mode: `guidant dynamic-dashboard`
2. Use keyboard navigation for efficiency
3. Monitor progress in Progress pane
4. Generate tasks with `n` key
5. Check capabilities regularly with `c`

### **Team Collaboration**
1. Use Monitoring mode for team oversight
2. Share logs for debugging
3. Use MCP tools for consistent workflows
4. Monitor performance metrics

### **Troubleshooting**
1. Start with Debug mode for issues
2. Check logs pane for errors
3. Use performance monitoring
4. Clear state if needed

---

---

## 📞 **Support & Resources**

### **Documentation**
- [Keyboard Reference](keyboard-reference.md) - Complete shortcut list
- [Advanced Configuration](advanced-config.md) - Customization options
- [Architecture Guide](../architecture/dynamic-layout-architecture.md) - Technical details
- [Troubleshooting Guide](troubleshooting.md) - Detailed problem solving

### **Community**
- GitHub Issues: Report bugs and feature requests
- Discussions: Ask questions and share tips
- Wiki: Community-contributed guides and examples

### **Quick Reference Card**
```
┌─ GUIDANT DYNAMIC DASHBOARD ─────────────────────────┐
│ Navigation: Tab/Shift+Tab  Help: h  Quit: q        │
│ Progress: a(advance) p(progress) d(details)         │
│ Tasks: n(next) c(complete) f(filter) s(sort)       │
│ Capabilities: c(analyze) g(gaps) d(discover)       │
│ Logs: f(filter) c(clear) e(errors) s(scroll)       │
│ Tools: Enter(execute) i(info) n/p/a(quick actions) │
└─────────────────────────────────────────────────────┘
```

**Happy coding with Guidant! 🚀**
