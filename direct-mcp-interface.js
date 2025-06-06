#!/usr/bin/env node

/**
 * Direct MCP Tools Interface
 * Allows calling MCP tool handlers directly in this environment
 */

import { z } from 'zod';
import { initializeProjectStructure, getProjectState, isProjectInitialized } from './src/file-management/project-structure.js';
import { discoverCapabilities, generateTaskRecommendations } from './src/ai-coordination/capability-discovery.js';
import { generateNextTask, advancePhase, markDeliverableComplete, getCurrentWorkflowState, getDeliverableDirectory } from './src/workflow-logic/workflow-engine.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * MCP Tool: taskmaster_init_project
 */
export async function taskmaster_init_project({ projectName, description = '', availableTools }) {
    try {
        const projectRoot = process.cwd();
        
        // Check if already initialized
        if (await isProjectInitialized(projectRoot)) {
            return {
                success: false,
                message: 'Project already initialized',
                nextAction: 'Use taskmaster_get_current_task to continue'
            };
        }

        // Initialize project structure
        await initializeProjectStructure(projectRoot);
        
        // Discover AI capabilities
        const capabilities = await discoverCapabilities(availableTools, projectRoot);
        const recommendations = generateTaskRecommendations(capabilities);
        
        // Update project config
        const projectConfig = {
            name: projectName,
            description,
            version: '0.1.0',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Write config manually since writeProjectFile isn't in scope
        const configPath = path.join(projectRoot, '.taskmaster/project/config.json');
        await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2));

        return {
            success: true,
            message: `Project "${projectName}" initialized successfully`,
            capabilities: {
                strongSuits: recommendations.strongSuits,
                limitations: recommendations.possibleWithLimitations,
                notRecommended: recommendations.notRecommended
            },
            nextAction: 'Use taskmaster_get_current_task to start systematic development'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            nextAction: 'Check project permissions and try again'
        };
    }
}

/**
 * MCP Tool: taskmaster_get_current_task
 */
export async function taskmaster_get_current_task({ availableTools = [] }) {
    try {
        const projectRoot = process.cwd();
        
        if (!(await isProjectInitialized(projectRoot))) {
            return {
                success: false,
                message: 'Project not initialized',
                nextAction: 'Use taskmaster_init_project first'
            };
        }

        // Get or update capabilities if tools provided
        let capabilities;
        if (availableTools.length > 0) {
            capabilities = await discoverCapabilities(availableTools, projectRoot);
        } else {
            const state = await getProjectState(projectRoot);
            capabilities = state.capabilities;
        }

        // Generate next task
        const task = await generateNextTask(capabilities, projectRoot);
        
        return {
            success: true,
            task,
            currentState: await getCurrentWorkflowState(projectRoot)
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * MCP Tool: taskmaster_report_progress
 */
export async function taskmaster_report_progress({ deliverable, workCompleted, filesCreated = [], status, blockers = [], nextSteps = '' }) {
    try {
        const projectRoot = process.cwd();
        
        // Log the work session
        const workLog = {
            deliverable,
            workCompleted,
            filesCreated,
            status,
            blockers,
            nextSteps,
            timestamp: new Date().toISOString()
        };

        // Read current sessions and add new entry
        const sessionsPath = path.join(projectRoot, '.taskmaster/context/sessions.json');
        const sessionsContent = await fs.readFile(sessionsPath, 'utf8');
        const sessions = JSON.parse(sessionsContent);
        sessions.push(workLog);
        await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2));

        // If completed, mark deliverable as complete
        if (status === 'completed') {
            await markDeliverableComplete(deliverable, projectRoot);
        }

        // Check if phase should advance
        const state = await getCurrentWorkflowState(projectRoot);
        
        let nextTask = null;
        if (status === 'completed') {
            // Get next task in same phase
            const capabilities = state.capabilities || await discoverCapabilities([], projectRoot);
            nextTask = await generateNextTask(capabilities, projectRoot);
        }

        return {
            success: true,
            message: 'Progress reported successfully',
            workLogged: workLog,
            nextTask: nextTask?.type === 'task_ticket' ? nextTask : null,
            readyToAdvance: nextTask?.type === 'phase_review' || nextTask?.type === 'phase_transition'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * MCP Tool: taskmaster_advance_phase
 */
export async function taskmaster_advance_phase({ confirmAdvancement }) {
    try {
        if (!confirmAdvancement) {
            return {
                success: false,
                message: 'Phase advancement not confirmed'
            };
        }

        const projectRoot = process.cwd();
        const result = await advancePhase(projectRoot);
        
        if (result.success) {
            // Get next task for new phase
            const state = await getProjectState(projectRoot);
            const capabilities = state.capabilities;
            const nextTask = await generateNextTask(capabilities, projectRoot);
            
            return {
                success: true,
                message: result.message,
                nextPhase: result.nextPhase,
                nextTask: nextTask?.type === 'task_ticket' ? nextTask : null
            };
        }

        return result;
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * MCP Tool: taskmaster_save_deliverable
 */
export async function taskmaster_save_deliverable({ deliverable, content, filename, directory = '' }) {
    try {
        const projectRoot = process.cwd();
        
        // Get current phase to determine appropriate directory
        const workflowState = await getCurrentWorkflowState(projectRoot);
        const currentPhase = workflowState.currentPhase.phase;
        
        // Use provided directory or auto-detect based on phase
        const targetDirectory = directory || getDeliverableDirectory(currentPhase);
        
        const basePath = path.join(projectRoot, '.taskmaster', 'deliverables');
        const fullDirectory = path.join(basePath, targetDirectory);
        const filePath = path.join(fullDirectory, filename);

        // Ensure directory exists
        await fs.mkdir(fullDirectory, { recursive: true });
        
        // Save content
        await fs.writeFile(filePath, content, 'utf8');

        return {
            success: true,
            message: `Deliverable "${deliverable}" saved successfully`,
            filePath: path.relative(projectRoot, filePath),
            savedTo: `deliverables/${targetDirectory}/`,
            nextAction: 'Use taskmaster_report_progress to mark as completed'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * MCP Tool: taskmaster_get_project_state
 */
export async function taskmaster_get_project_state() {
    try {
        const projectRoot = process.cwd();
        
        if (!(await isProjectInitialized(projectRoot))) {
            return {
                success: false,
                message: 'Project not initialized',
                nextAction: 'Use taskmaster_init_project first'
            };
        }

        const state = await getProjectState(projectRoot);
        const workflowState = await getCurrentWorkflowState(projectRoot);
        
        // Calculate overall progress
        const phaseCount = Object.keys(workflowState.phases.phases).length;
        const completedCount = Object.values(workflowState.phases.phases).filter(phase => phase.status === 'completed').length;
        const overallProgress = Math.round((completedCount / phaseCount) * 100);
        
        return {
            success: true,
            projectState: state,
            workflowState,
            summary: {
                currentPhase: workflowState.currentPhase.phase,
                currentRole: workflowState.currentRole.role,
                overallProgress,
                nextMilestone: {
                    phase: workflowState.currentPhase.phase,
                    nextPhase: workflowState.phaseDefinition?.nextPhase,
                    description: workflowState.phaseDefinition?.description
                }
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// CLI interface for testing
if (process.argv[2]) {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    switch (command) {
        case 'init':
            const result = await taskmaster_init_project({
                projectName: args[0] || 'Test Project',
                description: args[1] || 'Testing MCP tools',
                availableTools: ['web_search', 'create_file', 'edit_file', 'read_file', 'tavily-search', 'mermaid']
            });
            console.log(JSON.stringify(result, null, 2));
            break;
            
        case 'task':
            const task = await taskmaster_get_current_task({
                availableTools: ['web_search', 'create_file', 'edit_file', 'read_file', 'tavily-search', 'mermaid']
            });
            console.log(JSON.stringify(task, null, 2));
            break;
            
        case 'status':
            const status = await taskmaster_get_project_state();
            console.log(JSON.stringify(status, null, 2));
            break;
            
        default:
            console.log('Usage: node direct-mcp-interface.js [init|task|status] [args...]');
    }
}
