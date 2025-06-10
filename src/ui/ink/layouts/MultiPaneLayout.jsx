/**
 * Multi-Pane Layout Component
 * VS Code-inspired multi-pane interface for Dynamic Terminal Layout System
 * 
 * Provides 5-pane layout with collapsible panels, keyboard navigation,
 * and real-time updates while maintaining backward compatibility.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { LayoutManager } from '../layout/LayoutManager.js';
import { PaneManager } from '../layout/PaneManager.js';
import { KeyboardNavigator } from '../layout/KeyboardNavigator.js';
import { RealTimeUpdater } from '../layout/RealTimeUpdater.js';
import { PANE_COMPONENTS } from '../panes/index.js';

/**
 * Multi-Pane Layout Component
 * Orchestrates multiple panes in a dynamic, responsive layout
 */
export function MultiPaneLayout({
  projectState,
  workflowState,
  preset = 'development',
  terminalDimensions = { width: 120, height: 30 },
  onPaneUpdate = () => {},
  onLayoutChange = () => {},
  onKeyboardAction = () => {},
  interactive = true,
  compact = false
}) {
  // Core layout system state
  const [layoutManager] = useState(() => new LayoutManager({ 
    terminalDimensions, 
    preset 
  }));
  
  const [paneManager] = useState(() => new PaneManager({
    updateDebounceMs: 100,
    maxConcurrentUpdates: 3
  }));
  
  const [keyboardNavigator] = useState(() => new KeyboardNavigator(
    layoutManager, 
    paneManager,
    { enableGlobalShortcuts: true, enablePaneShortcuts: true }
  ));
  
  const [realTimeUpdater] = useState(() => new RealTimeUpdater(paneManager, {
    debounceMs: 100,
    maxConcurrentUpdates: 3
  }));

  // Layout state
  const [currentLayout, setCurrentLayout] = useState(null);
  const [focusedPaneId, setFocusedPaneId] = useState(null);
  const [collapsedPanes, setCollapsedPanes] = useState(new Set());
  const [paneStates, setPaneStates] = useState(new Map());
  const [showHelp, setShowHelp] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  // Calculate current layout based on preset and terminal dimensions
  const layout = useMemo(() => {
    return layoutManager.calculateLayout();
  }, [layoutManager, preset, terminalDimensions]);

  // Initialize layout system
  useEffect(() => {
    const initializeLayout = async () => {
      try {
        // Set up layout immediately (synchronous)
        setCurrentLayout(layout);

        // Register panes
        layout.panes.forEach(pane => {
          try {
            paneManager.registerPane(pane.id);
          } catch (error) {
            // Pane might already be registered
            if (!error.message.includes('already registered')) {
              console.warn(`Failed to register pane ${pane.id}:`, error.message);
            }
          }
        });

        // Set initial focus
        if (layout.panes.length > 0 && !focusedPaneId) {
          const firstPane = layout.panes.find(p => p.focused) || layout.panes[0];
          setFocusedPaneId(firstPane.id);
        }

        // Initialize real-time updater (only in interactive mode)
        if (interactive) {
          try {
            await realTimeUpdater.initialize(process.cwd());
          } catch (error) {
            // Non-critical error for testing
            console.warn('Real-time updater initialization failed:', error.message);
          }
        }

      } catch (error) {
        console.error('Failed to initialize multi-pane layout:', error);
      }
    };

    // Set layout immediately for synchronous rendering
    setCurrentLayout(layout);

    // Then initialize async components
    initializeLayout();

    // Cleanup on unmount
    return () => {
      if (interactive) {
        realTimeUpdater.cleanup();
        keyboardNavigator.cleanup();
        paneManager.cleanup();
      }
    };
  }, [layout, paneManager, realTimeUpdater, keyboardNavigator, focusedPaneId, interactive]);

  // Handle pane state changes
  useEffect(() => {
    const handlePaneStateChange = (event) => {
      setPaneStates(prev => new Map(prev.set(event.paneId, event)));
      onPaneUpdate(event);
    };

    paneManager.on('paneStateChange', handlePaneStateChange);
    
    return () => {
      paneManager.off('paneStateChange', handlePaneStateChange);
    };
  }, [paneManager, onPaneUpdate]);

  // Keyboard navigation handlers
  const handlePaneNavigation = useCallback((direction) => {
    if (!currentLayout || !currentLayout.panes) return;
    
    const currentIndex = currentLayout.panes.findIndex(p => p.id === focusedPaneId);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % currentLayout.panes.length;
    } else {
      nextIndex = currentIndex <= 0 ? currentLayout.panes.length - 1 : currentIndex - 1;
    }
    
    const nextPane = currentLayout.panes[nextIndex];
    setFocusedPaneId(nextPane.id);
    onKeyboardAction({ action: 'focusPane', paneId: nextPane.id });
  }, [currentLayout, focusedPaneId, onKeyboardAction]);

  const handlePaneCollapse = useCallback((paneId) => {
    setCollapsedPanes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paneId)) {
        newSet.delete(paneId);
      } else {
        newSet.add(paneId);
      }
      return newSet;
    });
    onKeyboardAction({ action: 'toggleCollapse', paneId });
  }, [onKeyboardAction]);

  // Keyboard input handling
  useInput((input, key) => {
    if (!interactive) return;

    // Handle multi-pane navigation shortcuts
    if (key.tab && !key.shift) {
      handlePaneNavigation('next');
      return;
    }
    
    if (key.tab && key.shift) {
      handlePaneNavigation('previous');
      return;
    }
    
    if (input === ' ') {
      if (focusedPaneId) {
        handlePaneCollapse(focusedPaneId);
      }
      return;
    }

    if (input === 'h') {
      setShowHelp(!showHelp);
      return;
    }

    if (input === 'q') {
      process.exit(0);
    }

    // Pass to keyboard navigator for other shortcuts
    keyboardNavigator.handleKeyPress(input, key).then(handled => {
      if (handled) {
        setLastAction(`Executed: ${input}`);
        setTimeout(() => setLastAction(null), 2000);
      }
    }).catch(error => {
      console.error('Keyboard navigation error:', error);
    });
  });

  // Render individual pane
  const renderPane = useCallback((pane) => {
    const PaneComponent = PANE_COMPONENTS[pane.id];
    if (!PaneComponent) {
      return (
        <Box key={pane.id} width={pane.width} height={pane.height}>
          <Text color="red">Unknown pane: {pane.id}</Text>
        </Box>
      );
    }

    const isCollapsed = collapsedPanes.has(pane.id);
    const isFocused = focusedPaneId === pane.id;
    const paneState = paneStates.get(pane.id);

    return (
      <Box key={pane.id} width={pane.width} height={pane.height}>
        <PaneComponent
          paneId={pane.id}
          projectState={projectState}
          workflowState={workflowState}
          focused={isFocused}
          collapsed={isCollapsed}
          width={pane.width}
          height={pane.height}
          compact={compact}
          paneManager={paneManager}
          onCollapseChange={handlePaneCollapse}
          onFocusChange={setFocusedPaneId}
          data={paneState?.data}
          error={paneState?.error}
        />
      </Box>
    );
  }, [
    collapsedPanes, 
    focusedPaneId, 
    paneStates, 
    projectState, 
    workflowState, 
    compact, 
    paneManager, 
    handlePaneCollapse
  ]);

  // Render layout based on type
  const renderLayout = useCallback(() => {
    // Use layout directly if currentLayout is not set yet
    const activeLayout = currentLayout || layout;

    if (!activeLayout || !activeLayout.panes) {
      return (
        <Box justifyContent="center" alignItems="center">
          <Text color="yellow">Loading layout...</Text>
        </Box>
      );
    }

    switch (activeLayout.type) {
      case 'single':
        return (
          <Box flexDirection="column">
            {activeLayout.panes.map(renderPane)}
          </Box>
        );

      case 'triple':
        return (
          <Box flexDirection="row">
            {activeLayout.panes.map(renderPane)}
          </Box>
        );

      case 'quad':
        // 2x2 grid layout
        const topPanes = activeLayout.panes.slice(0, 2);
        const bottomPanes = activeLayout.panes.slice(2, 4);

        return (
          <Box flexDirection="column">
            <Box flexDirection="row">
              {topPanes.map(renderPane)}
            </Box>
            <Box flexDirection="row">
              {bottomPanes.map(renderPane)}
            </Box>
          </Box>
        );

      case 'full':
        // Complex 5-pane layout
        const [progressPane, tasksPane, capabilitiesPane, logsPane, toolsPane] = activeLayout.panes;

        return (
          <Box flexDirection="column">
            {/* Top row: Progress, Tasks, Capabilities */}
            <Box flexDirection="row">
              {renderPane(progressPane)}
              {renderPane(tasksPane)}
              {renderPane(capabilitiesPane)}
            </Box>
            {/* Bottom row: Logs, Tools */}
            <Box flexDirection="row">
              {renderPane(logsPane)}
              {renderPane(toolsPane)}
            </Box>
          </Box>
        );

      default:
        return (
          <Box>
            <Text color="red">Unknown layout type: {activeLayout.type}</Text>
          </Box>
        );
    }
  }, [currentLayout, layout, renderPane]);

  // Render help overlay
  const renderHelpOverlay = () => {
    if (!showHelp) return null;

    return (
      <Box
        position="absolute"
        top={2}
        left={2}
        right={2}
        bottom={2}
        borderStyle="double"
        borderColor="cyan"
        backgroundColor="black"
        padding={1}
        flexDirection="column"
      >
        <Text color="cyan" bold>Multi-Pane Dashboard Help</Text>
        <Text> </Text>
        <Text color="yellow" bold>Navigation:</Text>
        <Text>  Tab          - Next pane</Text>
        <Text>  Shift+Tab    - Previous pane</Text>
        <Text>  Space        - Toggle pane collapse</Text>
        <Text> </Text>
        <Text color="yellow" bold>Workflow:</Text>
        <Text>  n            - Next task</Text>
        <Text>  a            - Advance phase</Text>
        <Text>  r            - Refresh state</Text>
        <Text>  c            - Analyze capabilities</Text>
        <Text>  g            - Analyze gaps</Text>
        <Text>  i            - Show project info</Text>
        <Text> </Text>
        <Text color="yellow" bold>System:</Text>
        <Text>  h            - Toggle this help</Text>
        <Text>  q            - Quit dashboard</Text>
        <Text> </Text>
        <Text color="gray">Press 'h' again to close help</Text>
      </Box>
    );
  };

  // Render status bar
  const renderStatusBar = () => {
    const activeLayout = currentLayout || layout;
    const paneCount = activeLayout?.panes?.length || 0;
    const collapsedCount = collapsedPanes.size;
    const focusedPane = focusedPaneId || 'none';

    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          Layout: {preset} | Panes: {paneCount} ({collapsedCount} collapsed) |
          Focus: {focusedPane} |
          {lastAction && <Text color="green"> {lastAction}</Text>}
          {!lastAction && <Text> Press 'h' for help</Text>}
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Main layout */}
      <Box flexGrow={1}>
        {renderLayout()}
      </Box>

      {/* Status bar */}
      {renderStatusBar()}

      {/* Help overlay */}
      {renderHelpOverlay()}
    </Box>
  );
}

export default MultiPaneLayout;
