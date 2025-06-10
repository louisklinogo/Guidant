# Multi-Pane Dashboard User Guide

## 🚀 **Quick Start**

The Multi-Pane Dashboard provides a VS Code-inspired interface for managing your AI workflow with multiple collapsible panels and real-time updates.

### **Launch Commands**

```bash
# Basic multi-pane dashboard
guidant multi-pane

# Short alias
guidant mp

# With specific preset
guidant multi-pane --preset debug

# Compact mode
guidant multi-pane --compact

# Demo with rich mock data
guidant demo
```

## 🎮 **Keyboard Controls**

### **Navigation**
- **Tab** - Move to next pane
- **Shift+Tab** - Move to previous pane
- **Space** - Toggle current pane collapse/expand

### **Workflow Controls**
- **n** - Get next task
- **a** - Advance to next phase
- **r** - Refresh project state
- **c** - Analyze AI capabilities
- **g** - Analyze capability gaps
- **i** - Show project information

### **System Controls**
- **h** - Toggle help overlay
- **q** - Quit dashboard

## 📊 **Layout Presets**

### **Quick Mode** (`--preset quick`)
- **Single pane**: Progress only
- **Minimum size**: 60x20 characters
- **Best for**: Quick status checks

### **Development Mode** (`--preset development`) - Default
- **Three panes**: Progress, Tasks, Capabilities
- **Minimum size**: 120x24 characters
- **Best for**: Active development workflow

### **Monitoring Mode** (`--preset monitoring`)
- **Four panes**: Progress, Tasks, Logs, MCP Tools
- **Minimum size**: 160x30 characters
- **Best for**: Workflow monitoring and debugging

### **Debug Mode** (`--preset debug`)
- **Five panes**: All available panes
- **Minimum size**: 180x35 characters
- **Best for**: Comprehensive project oversight

## 🎨 **Pane Overview**

### **📊 Progress Pane**
- Current phase status and completion percentage
- Phase timeline and deliverables
- Overall project progress indicators
- Quality gate status

### **📋 Tasks Pane**
- Current and upcoming tasks
- Task priorities and deadlines
- Progress tracking and completion status
- Task dependencies and assignments

### **🔧 Capabilities Pane**
- AI agent tool inventory
- Capability coverage analysis
- Gap identification and recommendations
- Tool categories and success rates

### **📝 Logs Pane**
- Recent project activity
- System events and notifications
- Error messages and warnings
- Workflow execution history

### **🛠️ MCP Tools Pane**
- Available MCP tools and their status
- Tool execution shortcuts
- Real-time tool performance metrics
- Integration health monitoring

## 🎯 **Status Indicators**

### **Pane States**
- **📂** - Expanded pane (normal state)
- **📁** - Collapsed pane
- **⏳** - Loading/updating
- **❌** - Error state

### **Border Colors**
- **Cyan** - Focused pane (currently selected)
- **Gray** - Normal pane
- **Yellow** - Loading/updating
- **Red** - Error state

## 📱 **Responsive Design**

The dashboard automatically adapts to your terminal size:

- **Small terminals** (60x20): Single pane layout
- **Medium terminals** (120x24): Triple pane layout
- **Large terminals** (160x30): Quad pane layout
- **Extra large terminals** (180x35+): Full 5-pane layout

## 🔄 **Real-time Updates**

The dashboard monitors your project files and updates automatically:

- **File changes**: Detected within 100ms
- **State updates**: Reflected immediately
- **MCP tool results**: Real-time feedback
- **Workflow progress**: Live tracking

## 💡 **Tips & Tricks**

### **Efficient Navigation**
1. Use **Tab** to quickly cycle through panes
2. Collapse unused panes with **Space** to save screen space
3. Use **h** to quickly reference keyboard shortcuts
4. Focus on the most relevant preset for your current task

### **Workflow Optimization**
1. Start with **Development** preset for daily work
2. Switch to **Monitoring** preset when debugging
3. Use **Debug** preset for comprehensive project reviews
4. Use **Quick** preset for rapid status checks

### **Terminal Setup**
1. Use a monospaced font (Fira Code, Consolas, JetBrains Mono)
2. Ensure UTF-8 encoding for proper Unicode characters
3. Minimum 120x24 terminal size recommended
4. Dark theme recommended for better contrast

## 🚨 **Troubleshooting**

### **Layout Issues**
- **Problem**: Panes not rendering correctly
- **Solution**: Ensure terminal is large enough for selected preset
- **Fallback**: Dashboard automatically downgrades to smaller preset

### **Performance Issues**
- **Problem**: Slow updates or high memory usage
- **Solution**: Close unused terminals, restart dashboard
- **Monitoring**: Check status bar for performance metrics

### **Keyboard Issues**
- **Problem**: Shortcuts not working
- **Solution**: Ensure terminal has focus, check for conflicting shortcuts
- **Alternative**: Use help overlay (h) to verify available shortcuts

### **File Watcher Issues**
- **Problem**: Updates not appearing
- **Solution**: Check file permissions, restart dashboard
- **Workaround**: Use manual refresh (r) key

## 🔧 **Advanced Usage**

### **Custom Terminal Dimensions**
The dashboard detects your terminal size automatically, but you can optimize by:
- Resizing terminal to preferred layout size
- Using full-screen terminal for best experience
- Adjusting font size for optimal pane visibility

### **Integration with Development Workflow**
- Run dashboard in dedicated terminal tab/pane
- Keep it visible while coding for real-time feedback
- Use keyboard shortcuts for quick workflow actions
- Monitor progress without leaving your editor

### **Team Collaboration**
- Share terminal sessions for collaborative debugging
- Use monitoring preset for team status meetings
- Export logs and progress for reporting
- Coordinate workflow phases with team members

## 📚 **Related Documentation**

- [Dynamic Layout Architecture](../docs/architecture/dynamic-layout-architecture.md)
- [Keyboard Navigation Guide](../docs/keyboard-navigation.md)
- [MCP Integration Guide](../docs/mcp-integration.md)
- [Performance Optimization](../docs/performance-optimization.md)

## 🆘 **Support**

For issues or questions:
1. Check the help overlay (h key) for quick reference
2. Review this guide for detailed information
3. Check project logs for error details
4. Report issues with terminal size and preset information
