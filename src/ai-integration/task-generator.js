/**
 * AI-powered task generation for TaskMaster Evolution
 * Uses LLMs to generate intelligent, context-aware tasks
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * OpenRouter API client for task generation
 */
class AITaskGenerator {
  constructor(apiKey, model = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Generate intelligent task with context awareness
   */
  async generateTask(context) {
    const prompt = this.buildPrompt(context);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/taskmaster-evolution',
          'X-Title': 'TaskMaster Evolution'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert project manager and software architect specialized in AI workflow systems. Generate specific, actionable tasks for software development projects.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseResponse(data.choices[0].message.content);
      
    } catch (error) {
      console.error('AI task generation failed:', error);
      return this.fallbackTask(context);
    }
  }

  /**
   * Build context-aware prompt for task generation
   */
  buildPrompt(context) {
    const { 
      phase, 
      role, 
      deliverable, 
      projectState, 
      availableTools, 
      completedDeliverables = [],
      projectFiles = []
    } = context;

    return `
CONTEXT:
- Project: ${projectState.config.name || 'TaskMaster Evolution AI Workflow Framework'}
- Current Phase: ${phase}
- Role: ${role}
- Target Deliverable: ${deliverable}
- Available Tools: ${availableTools.join(', ')}
- Completed: ${completedDeliverables.join(', ') || 'None'}

PROJECT FILES:
${projectFiles.slice(0, 10).map(f => `- ${f}`).join('\n')}

TASK REQUEST:
Generate a specific, actionable task for completing "${deliverable}" in the ${phase} phase.

REQUIREMENTS:
1. Provide concrete steps (3-6 specific actions)
2. Reference project context and existing files where relevant
3. Include estimated duration in minutes
4. Make it specific to THIS project, not generic advice
5. Consider the available tools when suggesting implementation approaches

RESPONSE FORMAT (JSON):
{
  "title": "Specific task title",
  "description": "Context-aware description referencing this project",
  "steps": [
    "Specific action 1 with details",
    "Specific action 2 with details", 
    "Specific action 3 with details"
  ],
  "estimatedDuration": 45,
  "reasoning": "Why this task makes sense given the context"
}`;
  }

  /**
   * Parse AI response into structured task
   */
  parseResponse(content) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const taskData = JSON.parse(jsonMatch[0]);
        return {
          type: 'ai_generated_task',
          success: true,
          task: taskData
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // Fallback: extract information from text
    return {
      type: 'ai_generated_task',
      success: true,
      task: {
        title: 'AI-suggested task',
        description: content.substring(0, 200),
        steps: ['Review AI suggestions', 'Implement recommended approach'],
        estimatedDuration: 30,
        reasoning: 'Generated from AI text response'
      }
    };
  }

  /**
   * Fallback task when AI fails
   */
  fallbackTask(context) {
    return {
      type: 'fallback_task',
      success: false,
      task: {
        title: `Work on ${context.deliverable}`,
        description: `Complete the ${context.deliverable} deliverable for ${context.phase} phase`,
        steps: [
          'Research requirements',
          'Implement solution',
          'Document results'
        ],
        estimatedDuration: 30,
        reasoning: 'Fallback due to AI generation failure'
      }
    };
  }
}

/**
 * Generate context for AI task generation
 */
export async function gatherProjectContext(projectRoot, currentPhase, targetDeliverable) {
  const { getProjectState } = await import('../file-management/project-structure.js');
  const { glob } = await import('glob');
  
  try {
    // Get project state
    const projectState = await getProjectState(projectRoot);
    
    // Get project files for context
    const projectFiles = await glob('**/*.{js,ts,json,md}', {
      cwd: projectRoot,
      ignore: ['node_modules/**', '.git/**', '.guidant/**']
    });

    // Get completed deliverables
    const completedDeliverables = Object.entries(projectState.phases.phases)
      .filter(([_, phase]) => phase.status === 'completed')
      .map(([name]) => name);

    return {
      phase: currentPhase,
      deliverable: targetDeliverable,
      projectState,
      projectFiles: projectFiles.slice(0, 20), // Limit for prompt size
      completedDeliverables,
      availableTools: projectState.capabilities?.tools || []
    };
  } catch (error) {
    console.error('Failed to gather project context:', error);
    return {
      phase: currentPhase,
      deliverable: targetDeliverable,
      projectState: { config: { name: 'Unknown Project' } },
      projectFiles: [],
      completedDeliverables: [],
      availableTools: []
    };
  }
}

/**
 * Main function to generate AI-powered task
 */
export async function generateAITask(phase, role, deliverable, projectRoot) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.warn('No OPENROUTER_API_KEY found, using fallback task generation');
    return {
      type: 'fallback_task',
      task: {
        title: `Complete ${deliverable}`,
        description: `Work on ${deliverable} deliverable for ${phase} phase`,
        steps: ['Research and implement the required deliverable'],
        estimatedDuration: 30
      }
    };
  }

  const context = await gatherProjectContext(projectRoot, phase, deliverable);
  context.role = role;

  const generator = new AITaskGenerator(apiKey);
  return await generator.generateTask(context);
}
