/**
 * Progress Bar Component
 * Multi-colored progress bars with status breakdown (from legacy analysis)
 */

import chalk from 'chalk';
import { statusConfig } from '../shared/terminal-utils.js';

/**
 * Create sophisticated progress bar with status breakdown
 * Based on proven legacy implementation (lines 106-221)
 */
export function createProgressBar(percent, length = 30, statusBreakdown = null) {
  // Adjust the percent to treat deferred and cancelled as complete
  const effectivePercent = statusBreakdown
    ? Math.min(
        100,
        percent +
          (statusBreakdown.deferred || 0) +
          (statusBreakdown.cancelled || 0)
      )
    : percent;

  // Calculate how many characters to fill for "true completion"
  const trueCompletedFilled = Math.round((percent * length) / 100);

  // Calculate how many characters to fill for "effective completion" (including deferred/cancelled)
  const effectiveCompletedFilled = Math.round(
    (effectivePercent * length) / 100
  );

  // The "deferred/cancelled" section (difference between true and effective)
  const deferredCancelledFilled =
    effectiveCompletedFilled - trueCompletedFilled;

  // Set the empty section (remaining after effective completion)
  const empty = length - effectiveCompletedFilled;

  // Determine color based on percentage for the completed section
  let completedColor;
  if (percent < 25) {
    completedColor = chalk.red;
  } else if (percent < 50) {
    completedColor = chalk.hex('#FFA500'); // Orange
  } else if (percent < 75) {
    completedColor = chalk.yellow;
  } else if (percent < 100) {
    completedColor = chalk.green;
  } else {
    completedColor = chalk.hex('#006400'); // Dark green
  }

  // Create colored sections
  const completedSection = completedColor('█'.repeat(trueCompletedFilled));

  // Gray section for deferred/cancelled items
  const deferredCancelledSection = chalk.gray(
    '█'.repeat(deferredCancelledFilled)
  );

  // If we have a status breakdown, create a multi-colored remaining section
  let remainingSection = '';

  if (statusBreakdown && empty > 0) {
    // Status colors (matching the statusConfig colors)
    const statusColors = {
      pending: chalk.yellow,
      'in-progress': chalk.hex('#FFA500'), // Orange
      blocked: chalk.red,
      review: chalk.magenta
      // Deferred and cancelled are treated as part of the completed section
    };

    // Calculate proportions for each status
    const totalRemaining = Object.entries(statusBreakdown)
      .filter(
        ([status]) =>
          !['deferred', 'cancelled', 'done', 'completed'].includes(status)
      )
      .reduce((sum, [_, val]) => sum + val, 0);

    // If no remaining tasks with tracked statuses, just use gray
    if (totalRemaining <= 0) {
      remainingSection = chalk.gray('░'.repeat(empty));
    } else {
      // Track how many characters we've added
      let addedChars = 0;

      // Add each status section proportionally
      for (const [status, percentage] of Object.entries(statusBreakdown)) {
        // Skip statuses that are considered complete
        if (['deferred', 'cancelled', 'done', 'completed'].includes(status))
          continue;

        // Calculate how many characters this status should fill
        const statusChars = Math.round((percentage / totalRemaining) * empty);

        // Make sure we don't exceed the total length due to rounding
        const actualChars = Math.min(statusChars, empty - addedChars);

        // Add colored section for this status
        const colorFn = statusColors[status] || chalk.gray;
        remainingSection += colorFn('░'.repeat(actualChars));

        addedChars += actualChars;
      }

      // If we have any remaining space due to rounding, fill with gray
      if (addedChars < empty) {
        remainingSection += chalk.gray('░'.repeat(empty - addedChars));
      }
    }
  } else {
    // Default to gray for the empty section if no breakdown provided
    remainingSection = chalk.gray('░'.repeat(empty));
  }

  // Effective percentage text color should reflect the highest category
  const percentTextColor =
    percent === 100
      ? chalk.hex('#006400') // Dark green for 100%
      : effectivePercent === 100
        ? chalk.gray // Gray for 100% with deferred/cancelled
        : completedColor; // Otherwise match the completed color

  // Build the complete progress bar
  return `${completedSection}${deferredCancelledSection}${remainingSection} ${percentTextColor(`${effectivePercent.toFixed(0)}%`)}`;
}

/**
 * Create simple progress bar without status breakdown
 */
export function createSimpleProgressBar(percent, length = 30) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;

  let color;
  if (percent < 25) color = chalk.red;
  else if (percent < 50) color = chalk.hex('#FFA500');
  else if (percent < 75) color = chalk.yellow;
  else color = chalk.green;

  const filledSection = color('█'.repeat(filled));
  const emptySection = chalk.gray('░'.repeat(empty));

  return `${filledSection}${emptySection} ${color(`${percent.toFixed(0)}%`)}`;
}

/**
 * Render progress section with title and breakdown
 */
export function renderProgressSection(title, data, options = {}) {
  const {
    length = 30,
    showBreakdown = true,
    compact = false
  } = options;

  const { percent, statusBreakdown, total, completed } = data;

  console.log(chalk.cyan.bold(title));

  if (showBreakdown && statusBreakdown) {
    // Show detailed breakdown
    const progressBar = createProgressBar(percent, length, statusBreakdown);
    console.log(`Progress: ${progressBar}`);

    if (!compact) {
      // Show status counts
      const statusCounts = Object.entries(statusBreakdown)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => {
          const config = statusConfig[status] || { color: chalk.gray, icon: '?' };
          return `${config.color(config.icon)} ${status}: ${count}`;
        })
        .join('  ');

      if (statusCounts) {
        console.log(statusCounts);
      }
    }
  } else {
    // Simple progress bar
    const progressBar = createSimpleProgressBar(percent, length);
    console.log(`Progress: ${progressBar}`);
  }

  if (total !== undefined && completed !== undefined) {
    console.log(chalk.gray(`Completed: ${completed}/${total} (${percent.toFixed(1)}%)`));
  }

  console.log(); // Add spacing
}
