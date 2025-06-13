/**
 * @file Task Generation Service for Guidant
 * @description Handles all logic for generating tasks, including phase transitions and implementation tickets.
 */

import { generateAITask } from '../ai-integration/task-generator.js';
import { getCurrentWorkflowState, checkPhaseCompletion } from './workflow-state-manager.js';

// This function is a form of task generation, so it belongs here.
async function generatePhaseTransitionTask(state) {
  const currentPhase = state.currentPhase.phase;
  const nextPhase = state.phaseDefinition.nextPhase;

  if (!nextPhase || nextPhase === 'complete') {
    return {
      type: 'completion',
      message: 'Project is complete. No further phases.'
    };
  }

  return {
    type: 'phase_transition',
    message: `Ready to transition from ${currentPhase} to ${nextPhase}`,
    fromPhase: currentPhase,
    toPhase: nextPhase
  };
}

function findBestRole(availableRoles, capabilities) {
  if (!capabilities || !capabilities.roles) {
    return availableRoles[0];
  }
  const bestMatch = availableRoles.find(role => capabilities.roles.includes(role));
  return bestMatch || availableRoles[0];
}

async function generateTaskTicket(deliverable, role, capabilities, projectRoot) {
  console.log(`Generating AI task for deliverable: ${deliverable}`);
  const taskPrompt = `Create a detailed plan to produce the following deliverable: ${deliverable}. The current project phase is ${role}.`;
  const aiTask = await generateAITask(taskPrompt, capabilities, projectRoot);
  return {
    type: 'implementation_ticket',
    task: aiTask
  };
}

async function generatePhaseTask(state, capabilities, projectRoot) {
  const { phaseDefinition, currentPhase, qualityGates } = state;
  
  const bestRole = findBestRole(phaseDefinition.roles, capabilities);
  if (!bestRole) {
    return {
      type: 'capability_limitation',
      message: `Cannot proceed with ${currentPhase.phase} phase - missing required capabilities.`,
    };
  }

  const deliverable = phaseDefinition.requiredDeliverables.find(
    d => !qualityGates[currentPhase.phase]?.completed?.includes(d)
  );

  if (!deliverable) {
    return generatePhaseTransitionTask(state);
  }

  return generateTaskTicket(deliverable, bestRole, capabilities, projectRoot);
}

/**
 * Main entry point for generating the next task for the agent.
 * It determines if the current phase is complete and either generates a
 * transition task or a task for the current phase.
 * @param {object} capabilities - The capabilities of the current AI agent.
 * @param {string} [projectRoot=process.cwd()] - The root directory of the project.
 * @returns {Promise<object>} The next task for the agent.
 */
export async function generateNextTask(capabilities, projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  if (!state.phaseDefinition) {
    throw new Error(`Unknown phase: ${state.currentPhase.phase}`);
  }

  const phaseComplete = await checkPhaseCompletion(state.currentPhase.phase, projectRoot);
  
  if (phaseComplete.isComplete) {
    return generatePhaseTransitionTask(state);
  }

  return generatePhaseTask(state, capabilities, projectRoot);
}