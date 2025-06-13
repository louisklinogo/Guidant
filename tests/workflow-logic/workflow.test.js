/**
 * @file Test suite for the refactored workflow logic.
 * @description This file contains unit tests for the workflow state manager, task generation service,
 * and the main workflow engine to ensure they function correctly after the refactoring.
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock dependencies before importing the modules under test
const mockReadProjectFile = mock(() => Promise.resolve({}));
const mockWriteProjectFile = mock(() => Promise.resolve(true));
mock.module('../../src/file-management/project-structure.js', () => ({
  readProjectFile: mockReadProjectFile,
  writeProjectFile: mockWriteProjectFile,
}));

mock.module('../../src/ai-integration/task-generator.js', () => ({
  generateAITask: mock(() => Promise.resolve({ success: true, task: { ticket_id: 'ai-gen-task' } })),
}));

// Import the modules we want to test
import * as StateManager from '../../src/workflow-logic/workflow-state-manager.js';
import * as TaskService from '../../src/workflow-logic/task-generation-service.js';
import * as WorkflowEngine from '../../src/workflow-logic/workflow-engine.js';

describe('Guidant Workflow Logic Suite', () => {

  // To be populated with mock data
  let mockFileContents;

  beforeEach(() => {
    // Reset mocks and state before each test
    mockFileContents = {
      'current-phase.json': { phase: 'concept' },
      'quality-gates.json': { concept: { completed: [] } },
      'project-phases.json': { current: 'concept', phases: { concept: { status: 'active' } } },
      'current-role.json': { role: 'research_agent' }
    };

    // Mock the file system reads to return our controlled state
    mockReadProjectFile.mockImplementation(async (filePath) => {
      const normalized = filePath.replace(/\\\\/g, '/');
      const fileName = normalized.split('/').pop();
      console.log('[mock readProjectFile] requested', fileName);
      return mockFileContents[fileName] || {};
    });
  });

  describe('WorkflowStateManager', () => {
    it('should correctly identify when a phase is not complete', async () => {
      // Explicitly set the state for this test: one deliverable is done.
      mockFileContents['quality-gates.json'] = { 
        concept: { completed: ['market_analysis'] } 
      };

      const completion = await StateManager.checkPhaseCompletion('concept');
      
      expect(completion.isComplete).toBe(false);
      expect(completion.missing.length).toBe(2);
      expect(completion.missing).toContainEqual('user_personas');
      expect(completion.missing).toContainEqual('competitor_research');
    });

    it('should correctly identify when a phase is complete', async () => {
      // Explicitly set the state for this test: all deliverables are done.
      mockFileContents['quality-gates.json'] = {
        concept: {
          completed: [
            'market_analysis',
            'user_personas',
            'competitor_research'
          ]
        }
      };
      const completion = await StateManager.checkPhaseCompletion('concept');
      expect(completion.isComplete).toBe(true);
      expect(completion.missing).toEqual([]);
    });
  });

  describe('TaskGenerationService', () => {
    it('should generate an implementation ticket when the phase is not complete', async () => {
      const nextTask = await TaskService.generateNextTask({ roles: ['research_agent'] });
      expect(nextTask.type).toBe('implementation_ticket');
      expect(nextTask.task).toBeDefined();
    });

    it('should generate a phase transition task when the phase is complete', async () => {
      // Explicitly set the state for this test: all deliverables are done.
      mockFileContents['quality-gates.json'] = {
        concept: {
          completed: [
            'market_analysis',
            'user_personas',
            'competitor_research'
          ]
        }
      };
      const nextTask = await TaskService.generateNextTask({ roles: ['research_agent'] });
      expect(nextTask.type).toBe('phase_transition');
      expect(nextTask.toPhase).toBe('requirements');
    });
  });

  describe('WorkflowEngine', () => {
    it('should successfully mark a deliverable as complete', async () => {
      const result = await WorkflowEngine.markDeliverableComplete('market_analysis');
      expect(result.success).toBe(true);
      expect(result.deliverable).toBe('market_analysis');
    });

    // More tests for advancePhase will be added here
    it.todo('should successfully advance to the next phase');
  });

});
