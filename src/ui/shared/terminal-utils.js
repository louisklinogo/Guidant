/**
 * Terminal Utilities
 * Shared utilities for terminal UI components
 */

import chalk from 'chalk';

/**
 * Get terminal width with fallback
 */
export function getTerminalWidth() {
  return process.stdout.columns || 100;
}

/**
 * Calculate available width accounting for padding and borders
 */
export function getAvailableWidth(padding = 10) {
  return getTerminalWidth() - padding;
}

/**
 * Calculate dynamic column width based on percentage
 */
export function calculateColumnWidth(percentage, totalWidth = null) {
  const width = totalWidth || getAvailableWidth();
  return Math.floor(width * (percentage / 100));
}

/**
 * Color gradients from legacy analysis
 */
export const gradients = {
  cool: ['#00b4d8', '#0077b6', '#03045e'], // Blue gradient
  warm: ['#fb8b24', '#e36414', '#9a031e']  // Orange/red gradient
};

/**
 * Status color configuration (proven from legacy)
 */
export const statusConfig = {
  done: { color: chalk.green, icon: '✅', tableIcon: '✓' },
  completed: { color: chalk.green, icon: '✅', tableIcon: '✓' },
  pending: { color: chalk.yellow, icon: '⏱️', tableIcon: '○' },
  'in-progress': { color: chalk.hex('#FFA500'), icon: '🔄', tableIcon: '►' },
  deferred: { color: chalk.gray, icon: '⏱️', tableIcon: 'x' },
  blocked: { color: chalk.red, icon: '❌', tableIcon: '!' },
  review: { color: chalk.magenta, icon: '👀', tableIcon: '?' },
  cancelled: { color: chalk.gray, icon: '❌', tableIcon: '✗' }
};

/**
 * Get colored status string
 */
export function getStatusWithColor(status, forTable = false) {
  if (!status) {
    return chalk.gray('❓ unknown');
  }

  const config = statusConfig[status.toLowerCase()] || {
    color: chalk.red,
    icon: '❌',
    tableIcon: '✗'
  };

  const icon = forTable ? config.tableIcon : config.icon;
  return config.color(`${icon} ${status}`);
}

/**
 * Standard boxen configuration for professional appearance
 */
export function getBoxenConfig(type = 'default') {
  const configs = {
    default: {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      margin: { top: 1, bottom: 0 }
    },
    header: {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      margin: { top: 0, bottom: 1 }
    },
    section: {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      margin: { top: 1, bottom: 0 }
    },
    compact: {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      margin: { top: 0, bottom: 0 }
    }
  };

  return configs[type] || configs.default;
}

/**
 * Standard table configuration for consistent appearance
 */
export function getTableConfig(colWidths = null) {
  return {
    colWidths,
    chars: {
      mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '',
      top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
      bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      left: '', right: '', middle: ' '
    },
    style: { 
      head: [], 
      border: [], 
      'padding-left': 4, 
      'padding-top': 0,
      'padding-bottom': 0,
      compact: true 
    },
    wordWrap: true
  };
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Priority color mapping
 */
export const priorityColors = {
  high: chalk.red.bold,
  medium: chalk.yellow,
  low: chalk.gray
};

/**
 * Get colored priority string
 */
export function getPriorityWithColor(priority) {
  const color = priorityColors[priority?.toLowerCase()] || chalk.white;
  return color(priority || 'medium');
}
