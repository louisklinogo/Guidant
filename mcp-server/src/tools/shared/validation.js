/**
 * Common Validation Schemas
 * Shared Zod schemas for MCP tool parameters
 */

import { z } from 'zod';

// Common parameter schemas
export const projectNameSchema = z.string().describe('Name of the project');
export const projectDescriptionSchema = z.string().optional().describe('Project description');
export const availableToolsSchema = z.array(z.string()).describe('List of tools available to the AI assistant');
export const prdContentSchema = z.string().optional().describe('PRD (Product Requirements Document) content to process');

// Agent-related schemas
export const agentIdSchema = z.string().describe('Agent ID from discovery');
export const agentNameSchema = z.string().optional().describe('Name/identifier for this agent session');
export const agentTypeSchema = z.string().optional().describe('Type of AI agent (claude, gpt, copilot, etc.)');

// Project target schema
export const targetProjectSchema = z.object({
	name: z.string(),
	type: z.string().optional(),
	phases: z.array(z.string()).optional()
}).optional().describe('Target project to optimize for');

// Work status schema
export const workStatusSchema = z.enum(['in_progress', 'completed', 'blocked', 'review']).describe('Current status of the work');

// Context schema for tool requests
export const toolRequestContextSchema = z.object({
	taskType: z.string().optional(),
	urgency: z.enum(['low', 'medium', 'high']).optional(),
	projectPhase: z.string().optional()
}).optional().describe('Context for why tools are needed');

// File-related schemas
export const filenameSchema = z.string().describe('Filename to save as');
export const directorySchema = z.string().optional().describe('Subdirectory within deliverables (e.g., wireframes, architecture)');
export const contentSchema = z.string().describe('Content to save');

// Deliverable schema
export const deliverableSchema = z.string().describe('The deliverable that was worked on');
export const workCompletedSchema = z.string().describe('Description of work completed');
export const filesCreatedSchema = z.array(z.string()).optional().describe('List of files created or modified');
export const blockersSchema = z.array(z.string()).optional().describe('Any blockers encountered');
export const nextStepsSchema = z.string().optional().describe('Planned next steps');

// Confirmation schema
export const confirmationSchema = z.boolean().describe('Confirm that current phase is complete and ready to advance');
