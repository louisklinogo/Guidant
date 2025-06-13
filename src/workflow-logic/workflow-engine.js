/**
 * @file Workflow Orchestration Engine
 * @description Manages high-level phase progression and task sequencing by orchestrating
 * the other workflow services.
 */

import { writeProjectFile } from '../file-management/project-structure.js';
import { PROJECT_PHASES, CURRENT_PHASE, QUALITY_GATES } from '../constants/paths.js';
import { PhaseTransitionEngine } from './phase-transition-engine.js';
import { getCurrentWorkflowState } from './workflow-state-manager.js';
import { generateNextTask as generateNextTaskFromService } from './task-generation-service.js';
import { PHASE_DEFINITIONS } from './phase-definitions.js';

/**
 * The main entry point for the agent to get its next task.
 * This function is now a simple pass-through to the Task Generation Service.
 */
export const generateNextTask = generateNextTaskFromService;

/**
 * Advance to the next phase using the PhaseTransitionEngine.
 * This is the primary function for changing project phases.
 */
export async function advancePhase(projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  const currentPhase = state.currentPhase.phase;
  const nextPhase = state.phaseDefinition.nextPhase;

  if (!nextPhase || nextPhase === 'complete') {
    return {
      success: true,
      message: 'Project is already in the final phase.'
    };
  }

  try {
    console.log(`Invoking PhaseTransitionEngine to move from ${currentPhase} to ${nextPhase}...`);
    const transitionEngine = new PhaseTransitionEngine(projectRoot);
    const result = await transitionEngine.executeTransition(currentPhase, nextPhase);

    if (!result.success) {
      throw new Error(result.error || 'Phase transition failed during execution.');
    }

    const updatedPhases = {
      ...state.phases,
      current: nextPhase,
      phases: {
        ...state.phases.phases,
        [currentPhase]: { ...state.phases.phases[currentPhase], status: 'completed', completedAt: new Date().toISOString() },
        [nextPhase]: { ...state.phases.phases[nextPhase], status: 'active', startedAt: new Date().toISOString() },
      },
    };
    await writeProjectFile(PROJECT_PHASES, updatedPhases, projectRoot);

    await writeProjectFile(CURRENT_PHASE, {
      phase: nextPhase,
      role: null,
      currentTask: null,
      progress: 0,
      startedAt: new Date().toISOString(),
    }, projectRoot);

    console.log('Phase transition successful. Workflow engine state updated.');

    return {
      success: true,
      message: `Advanced to ${PHASE_DEFINITIONS[nextPhase].name} phase.`,
      nextPhase,
      transformation: result.transformation,
      enhancedContext: result.enhancedContext,
    };

  } catch (error) {
    console.error(`Critical error in advancePhase: ${error.message}`);
    return {
      success: false,
      message: `Failed to transition to ${nextPhase} phase.`,
      error: error.message,
    };
  }
}

/**
 * Mark a specific deliverable as complete for the current phase.
 */
export async function markDeliverableComplete(deliverable, projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  const qualityGates = state.qualityGates;
  const currentPhase = state.currentPhase.phase;
  
  const updated = {
    ...qualityGates,
    [currentPhase]: {
      ...(qualityGates[currentPhase] || {}),
      completed: [...(qualityGates[currentPhase]?.completed || []), deliverable],
      lastUpdated: new Date().toISOString()
    }
  };

  await writeProjectFile(QUALITY_GATES, updated, projectRoot);
  
  return { success: true, deliverable, phase: currentPhase };
}