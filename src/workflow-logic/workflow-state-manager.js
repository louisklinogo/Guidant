/**
 * @file Manages the state of the Guidant workflow.
 * @description This module is responsible for reading and interpreting the project's
 * current state from the file system, providing a clear snapshot to other services.
 */

import { readProjectFile } from '../file-management/project-structure.js';
import {
  PROJECT_PHASES,
  CURRENT_PHASE,
  QUALITY_GATES,
  CURRENT_ROLE
} from '../constants/paths.js';
import { PHASE_DEFINITIONS } from './phase-definitions.js';

/**
 * Get current workflow state by reading all relevant project files.
 * @param {string} [projectRoot=process.cwd()] - The root directory of the project.
 * @returns {Promise<object>} An object containing the complete current state of the workflow.
 */
export async function getCurrentWorkflowState(projectRoot = process.cwd()) {
  const [phases, currentPhase, qualityGates, currentRole] = await Promise.all([
    readProjectFile(PROJECT_PHASES, projectRoot),
    readProjectFile(CURRENT_PHASE, projectRoot),
    readProjectFile(QUALITY_GATES, projectRoot),
    readProjectFile(CURRENT_ROLE, projectRoot)
  ]);

  const phaseKey = currentPhase?.phase || 'concept';

  return {
    phases,
    currentPhase,
    qualityGates,
    currentRole,
    phaseDefinition: PHASE_DEFINITIONS[phaseKey]
  };
}

/**
 * Check if the current phase's required deliverables have been met.
 * @param {string} phase - The phase to check (e.g., 'implementation').
 * @param {string} [projectRoot=process.cwd()] - The root directory of the project.
 * @returns {Promise<{isComplete: boolean, missing: string[]}>} An object indicating completion status.
 */
export async function checkPhaseCompletion(phase, projectRoot = process.cwd()) {
  const qualityGates = await readProjectFile(QUALITY_GATES, projectRoot);
  const phaseDefinition = PHASE_DEFINITIONS[phase];

  if (!phaseDefinition || !phaseDefinition.requiredDeliverables) {
    console.warn(`No phase definition found for phase: ${phase}`);
    return { isComplete: true, missing: [] }; // Or handle as an error
  }

  const completedDeliverables = qualityGates[phase]?.completed || [];

  const missing = phaseDefinition.requiredDeliverables.filter(
    req => !completedDeliverables.includes(req)
  );

  return {
    isComplete: missing.length === 0,
    missing,
  };
}