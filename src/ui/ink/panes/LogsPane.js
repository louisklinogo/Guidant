/**
 * Logs Pane Component
 * Real-time logging display for the Dynamic Terminal Layout System
 * 
 * Displays MCP tool execution logs, error tracking, session activity,
 * and filterable log levels with auto-scroll and history management.
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import { BasePane } from './BasePane.js';

/**
 * Log levels and their properties
 */
const LOG_LEVELS = {
  ERROR: { priority: 4, color: 'red', icon: '❌' },
  WARN: { priority: 3, color: 'yellow', icon: '⚠️' },
  INFO: { priority: 2, color: 'blue', icon: 'ℹ️' },
  DEBUG: { priority: 1, color: 'gray', icon: '🔍' },
  SUCCESS: { priority: 2, color: 'green', icon: '✅' }
};

/**
 * Logs Pane Class
 * Displays real-time MCP tool execution and system activity
 */
export class LogsPane extends BasePane {
  constructor(props) {
    super(props);
    
    // Additional state for logs pane
    this.state = {
      ...this.state,
      logs: [],
      filteredLogs: [],
      logLevel: 'INFO', // ERROR, WARN, INFO, DEBUG, SUCCESS
      autoScroll: true,
      scrollPosition: 0,
      maxLogs: props.maxLogs || 100,
      searchTerm: '',
      showTimestamps: props.showTimestamps !== false
    };
    
    // Performance tracking
    this.logBuffer = [];
    this.bufferFlushTimer = null;
    this.bufferFlushInterval = 100; // ms
  }

  /**
   * Lifecycle hooks
   */
  onMount() {
    this.loadLogsData();
    this.startLogBuffering();
  }

  componentDidMount() {
    super.componentDidMount();
    // Process initial data if provided
    if (this.props.data) {
      this.safeSetState({
        logs: this.props.data.logs || [],
        lastUpdate: new Date(),
        internalState: 'ready'
      }, () => {
        // Filter logs after state is set
        this.filterLogs();
      });
    }
  }

  onUnmount() {
    this.stopLogBuffering();
  }

  /**
   * Load logs data from project state
   */
  async loadLogsData() {
    try {
      this.setLoading(true);
      
      // In real implementation, this would load from .guidant/context/sessions.json
      const logsData = this.props.data || await this.fetchLogsData();
      
      this.safeSetState({
        logs: logsData.logs || [],
        lastUpdate: new Date(),
        internalState: 'ready'
      });
      
      this.filterLogs();
      this.setLoading(false);
      
    } catch (error) {
      this.handleError(error.message);
    }
  }

  /**
   * Fetch logs data (mock implementation)
   */
  async fetchLogsData() {
    // Mock data - in real implementation, read from .guidant/context/sessions.json
    const now = new Date();
    return {
      logs: [
        {
          id: 'log-001',
          timestamp: new Date(now.getTime() - 300000), // 5 min ago
          level: 'INFO',
          source: 'LayoutManager',
          message: 'Dynamic layout system initialized with development preset',
          details: { preset: 'development', panes: 3 }
        },
        {
          id: 'log-002',
          timestamp: new Date(now.getTime() - 240000), // 4 min ago
          level: 'SUCCESS',
          source: 'PaneManager',
          message: 'Progress pane registered successfully',
          details: { paneId: 'progress', state: 'ready' }
        },
        {
          id: 'log-003',
          timestamp: new Date(now.getTime() - 180000), // 3 min ago
          level: 'INFO',
          source: 'KeyboardNavigator',
          message: 'Keyboard shortcuts initialized',
          details: { globalShortcuts: 12, paneShortcuts: 25 }
        },
        {
          id: 'log-004',
          timestamp: new Date(now.getTime() - 120000), // 2 min ago
          level: 'SUCCESS',
          source: 'RealTimeUpdater',
          message: 'File watchers established for .guidant directory',
          details: { watchPaths: 5, activeWatchers: 5 }
        },
        {
          id: 'log-005',
          timestamp: new Date(now.getTime() - 60000), // 1 min ago
          level: 'INFO',
          source: 'MCP:guidant_get_current_task',
          message: 'Task generation completed',
          details: { taskId: 'TASK-003', priority: 'high' }
        },
        {
          id: 'log-006',
          timestamp: new Date(now.getTime() - 30000), // 30 sec ago
          level: 'WARN',
          source: 'FileWatcher',
          message: 'Temporary file watcher disconnection detected',
          details: { path: '.guidant/ai/capabilities.json', retryAttempt: 1 }
        },
        {
          id: 'log-007',
          timestamp: new Date(now.getTime() - 10000), // 10 sec ago
          level: 'SUCCESS',
          source: 'FileWatcher',
          message: 'File watcher reconnected successfully',
          details: { path: '.guidant/ai/capabilities.json', downtime: '20s' }
        },
        {
          id: 'log-008',
          timestamp: new Date(now.getTime() - 5000), // 5 sec ago
          level: 'INFO',
          source: 'TasksPane',
          message: 'Task progress updated',
          details: { taskId: 'TASK-003', progress: 75 }
        }
      ]
    };
  }

  /**
   * Start log buffering for performance
   */
  startLogBuffering() {
    this.bufferFlushTimer = setInterval(() => {
      this.flushLogBuffer();
    }, this.bufferFlushInterval);
  }

  /**
   * Stop log buffering
   */
  stopLogBuffering() {
    if (this.bufferFlushTimer) {
      clearInterval(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }
    this.flushLogBuffer(); // Flush any remaining logs
  }

  /**
   * Add log entry to buffer
   */
  addLogEntry(level, source, message, details = null) {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      source,
      message,
      details
    };
    
    this.logBuffer.push(logEntry);
  }

  /**
   * Flush log buffer to state
   */
  flushLogBuffer() {
    if (this.logBuffer.length === 0) return;
    
    this.safeSetState(prev => {
      const newLogs = [...prev.logs, ...this.logBuffer];

      // Trim logs if exceeding max
      const trimmedLogs = newLogs.length > prev.maxLogs
        ? newLogs.slice(-prev.maxLogs)
        : newLogs;

      return { logs: trimmedLogs };
    });
    
    this.logBuffer = [];
    this.filterLogs();
  }

  /**
   * Filter logs based on level and search term
   */
  filterLogs() {
    const { logs, logLevel, searchTerm } = this.state;
    const minPriority = LOG_LEVELS[logLevel]?.priority || 0;
    
    const filtered = logs.filter(log => {
      // Filter by log level
      const logPriority = LOG_LEVELS[log.level]?.priority || 0;
      if (logPriority < minPriority) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          log.message.toLowerCase().includes(searchLower) ||
          log.source.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    this.safeSetState({ filteredLogs: filtered });
  }

  /**
   * Keyboard shortcuts for logs pane
   */
  handleKeyPress(key) {
    switch (key) {
      case 'f':
        return this.cycleLogLevel();
      case 'c':
        return this.clearLogs();
      case 'e':
        return this.showErrorsOnly();
      case 's':
        return this.toggleAutoScroll();
      case 't':
        return this.toggleTimestamps();
      case 'r':
        // Handle async refresh - don't await to maintain sync interface
        this.refreshLogs().catch(error => {
          this.handleError(`Refresh failed: ${error.message}`);
        });
        return true;
      case '/':
        return this.startSearch();
      case 'Enter':
        return this.viewLogDetails();
      case 'ArrowUp':
        return this.scrollUp();
      case 'ArrowDown':
        return this.scrollDown();
      case 'PageUp':
        return this.pageUp();
      case 'PageDown':
        return this.pageDown();
      default:
        return super.handleKeyPress(key);
    }
  }

  /**
   * Get context-sensitive help
   */
  getKeyboardHelp() {
    return [
      'Logs Pane:',
      '  f - Filter log level',
      '  c - Clear logs',
      '  e - Show errors only',
      '  s - Toggle auto-scroll',
      '  t - Toggle timestamps',
      '  / - Search logs',
      '  ↑/↓ - Scroll logs',
      '  PgUp/PgDn - Page scroll',
      '  Enter - View log details',
      ...super.getKeyboardHelp()
    ];
  }

  /**
   * Logs pane actions
   */
  cycleLogLevel() {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentIndex = levels.indexOf(this.state.logLevel);
    const nextIndex = (currentIndex + 1) % levels.length;

    this.safeSetState({ logLevel: levels[nextIndex] }, () => {
      this.filterLogs();
    });
    return true;
  }

  clearLogs() {
    this.safeSetState({
      logs: [],
      filteredLogs: [],
      scrollPosition: 0
    });
    return true;
  }

  showErrorsOnly() {
    this.safeSetState({ logLevel: 'ERROR' }, () => {
      this.filterLogs();
    });
    return true;
  }

  toggleAutoScroll() {
    this.safeSetState(prev => ({ autoScroll: !prev.autoScroll }));
    return true;
  }

  toggleTimestamps() {
    this.safeSetState(prev => ({ showTimestamps: !prev.showTimestamps }));
    return true;
  }

  async refreshLogs() {
    await this.loadLogsData();
    return true;
  }

  startSearch() {
    // In a real implementation, this would open a search input
    console.log('Search functionality would be implemented here');
    return true;
  }

  viewLogDetails() {
    const { filteredLogs, scrollPosition } = this.state;
    const selectedLog = filteredLogs[scrollPosition];
    
    if (selectedLog) {
      console.log('Log details:', selectedLog);
    }
    return true;
  }

  scrollUp() {
    this.safeSetState(prev => ({
      scrollPosition: Math.max(0, prev.scrollPosition - 1),
      autoScroll: false
    }));
    return true;
  }

  scrollDown() {
    this.safeSetState(prev => ({
      scrollPosition: Math.min(prev.filteredLogs.length - 1, prev.scrollPosition + 1),
      autoScroll: false
    }));
    return true;
  }

  pageUp() {
    this.safeSetState(prev => ({
      scrollPosition: Math.max(0, prev.scrollPosition - 10),
      autoScroll: false
    }));
    return true;
  }

  pageDown() {
    this.safeSetState(prev => ({
      scrollPosition: Math.min(prev.filteredLogs.length - 1, prev.scrollPosition + 10),
      autoScroll: false
    }));
    return true;
  }

  /**
   * Render logs content
   */
  renderContent() {
    const { 
      filteredLogs, 
      logLevel, 
      autoScroll, 
      scrollPosition, 
      showTimestamps,
      searchTerm 
    } = this.state;
    const { compact = false, height = 10 } = this.props;
    
    if (filteredLogs.length === 0) {
      return (
        <Box>
          <Text color="gray">No logs available (Level: {logLevel})</Text>
        </Box>
      );
    }

    // Calculate visible logs based on height
    const visibleHeight = compact ? Math.min(5, height - 2) : height - 2;
    const startIndex = autoScroll 
      ? Math.max(0, filteredLogs.length - visibleHeight)
      : Math.max(0, scrollPosition - Math.floor(visibleHeight / 2));
    
    const visibleLogs = filteredLogs.slice(startIndex, startIndex + visibleHeight);

    return (
      <Box flexDirection="column">
        {/* Status Bar */}
        <LogsStatusBar
          logLevel={logLevel}
          totalLogs={filteredLogs.length}
          autoScroll={autoScroll}
          searchTerm={searchTerm}
          compact={compact}
        />
        
        {/* Log Entries */}
        <Box flexDirection="column" marginTop={1}>
          {visibleLogs.map((log, index) => (
            <LogEntry
              key={log.id}
              log={log}
              showTimestamps={showTimestamps}
              isSelected={!autoScroll && (startIndex + index) === scrollPosition}
              compact={compact}
            />
          ))}
        </Box>
        
        {/* Scroll Indicator */}
        {!compact && !autoScroll && (
          <ScrollIndicator
            current={scrollPosition + 1}
            total={filteredLogs.length}
          />
        )}
      </Box>
    );
  }
}

/**
 * Logs Status Bar Component
 */
function LogsStatusBar({ logLevel, totalLogs, autoScroll, searchTerm, compact }) {
  return (
    <Box>
      <Text color="cyan">📝 Logs</Text>
      {!compact && (
        <Box marginLeft={2}>
          <Text color="gray">
            Level: {logLevel} | Count: {totalLogs}
            {autoScroll && ' | Auto-scroll'}
            {searchTerm && ` | Search: "${searchTerm}"`}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Log Entry Component
 */
function LogEntry({ log, showTimestamps, isSelected, compact }) {
  const levelConfig = LOG_LEVELS[log.level] || LOG_LEVELS.INFO;
  const backgroundColor = isSelected ? 'blue' : undefined;
  
  return (
    <Box backgroundColor={backgroundColor}>
      {showTimestamps && !compact && (
        <Text color="gray">
          {log.timestamp.toLocaleTimeString()} 
        </Text>
      )}
      
      <Text color={levelConfig.color} marginLeft={showTimestamps && !compact ? 1 : 0}>
        {levelConfig.icon}
      </Text>
      
      <Text color="gray" marginLeft={1}>
        [{log.source}]
      </Text>
      
      <Text marginLeft={1}>
        {compact ? truncateMessage(log.message, 40) : log.message}
      </Text>
    </Box>
  );
}

/**
 * Scroll Indicator Component
 */
function ScrollIndicator({ current, total }) {
  return (
    <Box marginTop={1}>
      <Text color="gray">
        {current}/{total} | ↑/↓ to scroll, s for auto-scroll
      </Text>
    </Box>
  );
}

/**
 * Utility functions
 */
function truncateMessage(message, maxLength) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Default props
 */
LogsPane.defaultProps = {
  ...BasePane.defaultProps,
  paneId: 'logs',
  title: '📝 Logs',
  maxLogs: 100,
  showTimestamps: true
};

export default LogsPane;
