/**
 * Feedback System Component
 * Visual feedback for user actions, loading states, and system status
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

/**
 * Feedback System Component
 * Provides visual feedback for user actions and system state
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Feedback type: 'success', 'error', 'warning', 'info', 'loading'
 * @param {string} props.message - Feedback message to display
 * @param {boolean} props.visible - Whether feedback is visible
 * @param {number} props.duration - Auto-hide duration in milliseconds (0 = no auto-hide)
 * @param {Function} props.onHide - Callback when feedback is hidden
 */
export function FeedbackSystem({ 
  type = 'info',
  message = '',
  visible = false,
  duration = 3000,
  onHide = null
}) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onHide) onHide();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!isVisible || !message) return null;

  const getFeedbackStyle = () => {
    switch (type) {
      case 'success':
        return { color: 'green', icon: '✅', borderColor: 'green' };
      case 'error':
        return { color: 'red', icon: '❌', borderColor: 'red' };
      case 'warning':
        return { color: 'yellow', icon: '⚠️', borderColor: 'yellow' };
      case 'loading':
        return { color: 'cyan', icon: null, borderColor: 'cyan' };
      case 'info':
      default:
        return { color: 'blue', icon: 'ℹ️', borderColor: 'blue' };
    }
  };

  const style = getFeedbackStyle();

  return (
    <Box borderStyle="round" borderColor={style.borderColor} padding={1}>
      <Box>
        {type === 'loading' ? (
          <Text color={style.color}>
            <Spinner type="dots" /> {message}
          </Text>
        ) : (
          <Text color={style.color}>
            {style.icon} {message}
          </Text>
        )}
      </Box>
    </Box>
  );
}

/**
 * Action Feedback Component
 * Specialized feedback for MCP tool execution and user actions
 */
export function ActionFeedback({ 
  action = null,
  status = 'idle', // 'idle', 'executing', 'success', 'error'
  result = null,
  compact = false
}) {
  if (!action && status === 'idle') return null;

  const getStatusDisplay = () => {
    switch (status) {
      case 'executing':
        return {
          type: 'loading',
          message: `Executing: ${action}...`
        };
      case 'success':
        return {
          type: 'success',
          message: `${action} completed successfully${result?.message ? `: ${result.message}` : ''}`
        };
      case 'error':
        return {
          type: 'error',
          message: `${action} failed${result?.error ? `: ${result.error}` : ''}`
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  if (!statusDisplay) return null;

  if (compact) {
    return (
      <Box>
        <Text color={statusDisplay.type === 'success' ? 'green' : statusDisplay.type === 'error' ? 'red' : 'cyan'}>
          {statusDisplay.message}
        </Text>
      </Box>
    );
  }

  return (
    <FeedbackSystem
      type={statusDisplay.type}
      message={statusDisplay.message}
      visible={true}
      duration={statusDisplay.type === 'loading' ? 0 : 3000}
    />
  );
}

/**
 * Progress Indicator Component
 * Shows progress for long-running operations
 */
export function ProgressIndicator({ 
  current = 0,
  total = 100,
  label = '',
  showPercentage = true,
  compact = false
}) {
  const percentage = Math.round((current / total) * 100);
  const progressBarLength = compact ? 20 : 30;
  const filledLength = Math.round((percentage / 100) * progressBarLength);
  
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

  if (compact) {
    return (
      <Box>
        <Text color="cyan">
          {label && `${label}: `}[{progressBar}] {showPercentage && `${percentage}%`}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      {label && (
        <Box marginBottom={1}>
          <Text color="cyan" bold>{label}</Text>
        </Box>
      )}
      
      <Box>
        <Text color="cyan">
          [{progressBar}] {showPercentage && `${percentage}%`} ({current}/{total})
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Status Badge Component
 * Shows status indicators for various system states
 */
export function StatusBadge({ 
  status = 'unknown',
  label = '',
  compact = false
}) {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'online':
        return { color: 'green', symbol: '●' };
      case 'inactive':
      case 'stopped':
      case 'offline':
        return { color: 'red', symbol: '●' };
      case 'pending':
      case 'waiting':
        return { color: 'yellow', symbol: '●' };
      case 'error':
      case 'failed':
        return { color: 'red', symbol: '✗' };
      case 'success':
      case 'completed':
        return { color: 'green', symbol: '✓' };
      default:
        return { color: 'gray', symbol: '○' };
    }
  };

  const style = getStatusStyle();

  return (
    <Box>
      <Text color={style.color}>
        {style.symbol} {label || status}
      </Text>
    </Box>
  );
}

/**
 * Notification System Hook
 * Manages multiple notifications and their lifecycle
 */
export function useNotificationSystem() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, message, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}

/**
 * Notification Display Component
 * Renders multiple notifications in a stack
 */
export function NotificationDisplay({ notifications = [], compact = false }) {
  if (notifications.length === 0) return null;

  return (
    <Box flexDirection="column">
      {notifications.map((notification, index) => (
        <Box key={notification.id} marginBottom={index < notifications.length - 1 ? 1 : 0}>
          <FeedbackSystem
            type={notification.type}
            message={notification.message}
            visible={true}
            duration={0} // Managed by the notification system
          />
        </Box>
      ))}
    </Box>
  );
}

export default FeedbackSystem;
