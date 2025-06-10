/**
 * Base Pane Component
 * Abstract base class for all panes in the Dynamic Terminal Layout System
 * 
 * Provides common pane interface, lifecycle management, and standard behaviors
 * including collapse/expand, focus management, error handling, and loading states.
 */

import React, { Component } from 'react';
import { Box, Text, Newline } from 'ink';
import Spinner from 'ink-spinner';
import { PANE_STATES } from '../layout/PaneManager.js';

/**
 * Base Pane Class Component
 * All specialized panes should extend this class
 */
export class BasePane extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: props.collapsed || false,
      focused: props.focused || false,
      loading: false,
      error: props.error || null,
      data: props.data || null,
      lastUpdate: null,
      internalState: props.error ? PANE_STATES.ERROR : PANE_STATES.INITIALIZING
    };

    // Component lifecycle tracking
    this._isMounted = false;

    // Bind methods
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleError = this.handleError.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.setFocus = this.setFocus.bind(this);

    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = null;
  }

  /**
   * Component lifecycle - mount
   */
  componentDidMount() {
    this._isMounted = true;
    this.setState({ internalState: PANE_STATES.LOADING });

    // Subscribe to pane manager updates if available
    if (this.props.paneManager) {
      this.unsubscribe = this.props.paneManager.on('paneStateChange', (event) => {
        if (event.paneId === this.props.paneId) {
          this.handleUpdate(event);
        }
      });
    }

    // Call subclass mount hook
    this.onMount();
  }

  /**
   * Component lifecycle - unmount
   */
  componentWillUnmount() {
    this._isMounted = false;

    // Unsubscribe from updates
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Call subclass unmount hook
    this.onUnmount();
  }

  /**
   * Component lifecycle - update
   */
  componentDidUpdate(prevProps, prevState) {
    // Handle focus changes
    if (prevProps.focused !== this.props.focused) {
      this.setFocus(this.props.focused);
    }

    // Handle data changes
    if (prevProps.data !== this.props.data) {
      this.safeSetState({
        data: this.props.data,
        lastUpdate: new Date(),
        internalState: PANE_STATES.READY
      });
    }

    // Handle collapse changes
    if (prevProps.collapsed !== this.props.collapsed) {
      this.safeSetState({ collapsed: this.props.collapsed });
    }
  }

  /**
   * Safe setState that checks if component is mounted
   */
  safeSetState(newState, callback) {
    if (this._isMounted) {
      this.setState(newState, callback);
    }
  }

  /**
   * Abstract methods - must be implemented by subclasses
   */
  onMount() {
    // Override in subclasses
    this.safeSetState({ internalState: PANE_STATES.READY });
  }

  onUnmount() {
    // Override in subclasses for cleanup
  }

  renderContent() {
    // Override in subclasses
    return (
      <Box>
        <Text color="gray">Base pane - override renderContent() in subclass</Text>
      </Box>
    );
  }

  handleKeyPress(key) {
    // Override in subclasses for pane-specific shortcuts
    return false;
  }

  getKeyboardHelp() {
    // Override in subclasses for context-sensitive help
    return [
      'Space - Toggle collapse',
      'Enter - Execute default action'
    ];
  }

  /**
   * Common pane functionality
   */
  handleUpdate(event) {
    if (event.data) {
      this.safeSetState({
        data: event.data,
        lastUpdate: new Date(),
        error: null,
        internalState: PANE_STATES.READY
      });
    }

    if (event.error) {
      this.handleError(event.error);
    }
  }

  handleError(error) {
    this.safeSetState({
      error: error,
      loading: false,
      internalState: PANE_STATES.ERROR
    });
  }

  toggleCollapse() {
    const newCollapsed = !this.state.collapsed;
    this.safeSetState({
      collapsed: newCollapsed,
      internalState: newCollapsed ? PANE_STATES.COLLAPSED : PANE_STATES.READY
    });

    // Notify parent of collapse change
    if (this.props.onCollapseChange) {
      this.props.onCollapseChange(this.props.paneId, newCollapsed);
    }
  }

  setFocus(focused) {
    this.safeSetState({
      focused: focused,
      internalState: focused ? PANE_STATES.FOCUSED : PANE_STATES.READY
    });

    // Notify parent of focus change
    if (this.props.onFocusChange) {
      this.props.onFocusChange(this.props.paneId, focused);
    }
  }

  setLoading(loading) {
    this.safeSetState({
      loading: loading,
      internalState: loading ? PANE_STATES.LOADING : PANE_STATES.READY
    });
  }

  clearError() {
    this.safeSetState({
      error: null,
      internalState: PANE_STATES.READY
    });
  }

  /**
   * Render methods
   */
  renderHeader() {
    const { paneId, title } = this.props;
    const { focused, collapsed, loading, error } = this.state;
    
    // Determine border color based on state
    let borderColor = 'gray';
    if (error) borderColor = 'red';
    else if (focused) borderColor = 'cyan';
    else if (loading) borderColor = 'yellow';
    
    // Status indicator
    let statusIcon = '';
    if (loading) statusIcon = '⏳';
    else if (error) statusIcon = '❌';
    else if (collapsed) statusIcon = '📁';
    else statusIcon = '📂';
    
    return (
      <Box>
        <Text color={borderColor} bold>
          {statusIcon} {title || paneId}
        </Text>
        {loading && (
          <Box marginLeft={1}>
            <Spinner type="dots" />
          </Box>
        )}
      </Box>
    );
  }

  renderLoading() {
    return (
      <Box justifyContent="center" alignItems="center" minHeight={3}>
        <Box>
          <Spinner type="dots" />
          <Text color="yellow"> Loading...</Text>
        </Box>
      </Box>
    );
  }

  renderError() {
    const { error } = this.state;
    
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>❌ Error</Text>
        <Newline />
        <Text color="red">{error}</Text>
        <Newline />
        <Text color="gray">Press 'r' to retry or 'c' to clear error</Text>
      </Box>
    );
  }

  renderCollapsed() {
    return (
      <Box>
        <Text color="gray">Press Space to expand</Text>
      </Box>
    );
  }

  renderFooter() {
    const { lastUpdate } = this.state;
    const { showFooter = false } = this.props;
    
    if (!showFooter || !lastUpdate) {
      return null;
    }
    
    return (
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Text>
      </Box>
    );
  }

  /**
   * Main render method
   */
  render() {
    const { width, height, borderStyle = 'round' } = this.props;
    const { collapsed, focused, loading, error, internalState } = this.state;
    
    // Track render performance
    this.renderCount++;
    this.lastRenderTime = performance.now();
    
    // Determine border color
    let borderColor = 'gray';
    if (error) borderColor = 'red';
    else if (focused) borderColor = 'cyan';
    else if (loading) borderColor = 'yellow';
    
    return (
      <Box
        flexDirection="column"
        borderStyle={borderStyle}
        borderColor={borderColor}
        padding={1}
        width={width}
        height={height}
      >
        {/* Header */}
        {this.renderHeader()}
        
        {/* Content */}
        {!collapsed && (
          <Box flexDirection="column" marginTop={1}>
            {error ? this.renderError() :
             loading ? this.renderLoading() :
             this.renderContent()}
          </Box>
        )}
        
        {/* Collapsed state */}
        {collapsed && this.renderCollapsed()}
        
        {/* Footer */}
        {this.renderFooter()}
      </Box>
    );
  }

  /**
   * Utility methods
   */
  getStatus() {
    return {
      paneId: this.props.paneId,
      state: this.state.internalState,
      collapsed: this.state.collapsed,
      focused: this.state.focused,
      loading: this.state.loading,
      hasData: this.state.data !== null,
      hasError: this.state.error !== null,
      lastUpdate: this.state.lastUpdate,
      renderCount: this.renderCount
    };
  }

  getData() {
    return this.state.data;
  }

  getError() {
    return this.state.error;
  }

  isCollapsed() {
    return this.state.collapsed;
  }

  isFocused() {
    return this.state.focused;
  }

  isLoading() {
    return this.state.loading;
  }

  hasError() {
    return this.state.error !== null;
  }
}

/**
 * Default props for BasePane
 */
BasePane.defaultProps = {
  paneId: 'unknown',
  title: 'Base Pane',
  collapsed: false,
  focused: false,
  data: null,
  borderStyle: 'round',
  showFooter: false
};

export default BasePane;
