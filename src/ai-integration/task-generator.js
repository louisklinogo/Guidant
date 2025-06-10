/**
 * AI-powered task generation for Guidant Evolution
 * Uses LLMs to generate intelligent, context-aware tasks
 * Enhanced with environment-based model configuration
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { createProviderConfig, getParametersForRole } from '../config/models.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * AI Task Generator with enhanced model configuration
 * Now uses Guidant's model configuration system
 */
class AITaskGenerator {
  constructor(role = 'main', options = {}) {
    try {
      // Use Guidant's model configuration system
      const config = createProviderConfig(role);
      const parameters = getParametersForRole(role);

      this.apiKey = config.key;
      this.model = config.model;
      this.baseUrl = config.baseUrl;
      this.provider = config.provider;
      this.role = role;

      // Use role-specific parameters
      this.maxTokens = parameters.maxTokens;
      this.temperature = parameters.temperature;

      // Allow manual overrides for backward compatibility
      if (options.apiKey) this.apiKey = options.apiKey;
      if (options.model) this.model = options.model;
      if (options.baseUrl) this.baseUrl = options.baseUrl;

    } catch (error) {
      console.warn(`Failed to load model configuration for role '${role}':`, error.message);

      // Fallback to legacy behavior for backward compatibility
      this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
      this.model = options.model || 'google/gemini-2.0-flash-exp:free';
      this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
      this.provider = 'openrouter';
      this.role = role;
      this.maxTokens = 1000;
      this.temperature = 0.7;
    }
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
          'HTTP-Referer': 'https://github.com/louisklinogo/Guidant',
          'X-Title': 'Guidant Evolution'
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
          max_tokens: this.maxTokens,
          temperature: this.temperature
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

    // Use enhanced prompt for implementation phase
    if (phase === 'implementation') {
      return this.buildImplementationPrompt(context);
    }

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
   * Build enhanced prompt for implementation phase tickets
   */
  buildImplementationPrompt(context) {
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
- Project: ${projectState.config.name || 'Software Development Project'}
- Current Phase: ${phase} (Implementation)
- Role: ${role}
- Target Deliverable: ${deliverable}
- Available Tools: ${availableTools.join(', ')}
- Completed: ${completedDeliverables.join(', ') || 'None'}
- Project Files: ${projectFiles.slice(0, 10).join(', ') || 'None'}

IMPLEMENTATION TICKET REQUIREMENTS:
Generate a comprehensive implementation ticket for the "${deliverable}" deliverable. This should be a production-ready, detailed ticket that a developer can implement immediately.

Return the response as a JSON object with this EXACT structure:
{
  "ticket_id": "IMPL-001",
  "title": "Implement [Feature Name]",
  "type": "Task",
  "parent_story": "Related Story Name",
  "parent_epic": "Related Epic Name",
  "priority": "High|Medium|Low",
  "complexity": "Low|Medium|High",
  "estimated_points": 5,
  "status": "Ready for Implementation",
  "description": "Detailed description of what needs to be implemented",
  "acceptance_criteria": [
    "Specific testable criteria 1",
    "Specific testable criteria 2"
  ],
  "technical_specifications": [
    "Technical requirement 1",
    "Technical requirement 2"
  ],
  "dependencies": [
    "Dependency 1",
    "Dependency 2"
  ],
  "implementation_guide": "Step-by-step implementation instructions",
  "code_examples": [
    {
      "language": "javascript",
      "description": "Example description",
      "code": "// Example code snippet"
    }
  ],
  "testing_requirements": [
    "Unit test requirement 1",
    "Integration test requirement 2"
  ],
  "tools": ["tool1", "tool2"],
  "estimatedDuration": 120
}

REQUIREMENTS:
- Make it specific to the ${deliverable} deliverable
- Include realistic acceptance criteria that can be tested
- Provide concrete technical specifications
- Include actual code examples relevant to the feature
- Specify comprehensive testing requirements
- Make the implementation guide actionable and detailed
- Use appropriate story/epic names related to the feature
- Set realistic complexity and point estimates

Focus on creating a ticket that a developer could pick up and implement immediately without additional clarification.
    `.trim();
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

        // Check if this is an implementation ticket format
        if (taskData.ticket_id && taskData.acceptance_criteria) {
          return {
            type: 'implementation_ticket',
            success: true,
            task: {
              ...taskData,
              // Ensure backward compatibility with existing task format
              title: taskData.title,
              description: taskData.description,
              steps: this.extractStepsFromImplementationGuide(taskData.implementation_guide),
              tools: taskData.tools || [],
              estimatedDuration: taskData.estimatedDuration || 120
            }
          };
        }

        // Standard task format
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
   * Extract steps from implementation guide text
   */
  extractStepsFromImplementationGuide(guide) {
    if (!guide) return ['Follow implementation guide'];

    // Try to extract numbered steps
    const stepMatches = guide.match(/\d+\.\s*([^\n]+)/g);
    if (stepMatches) {
      return stepMatches.map(step => step.replace(/^\d+\.\s*/, ''));
    }

    // Split by sentences as fallback
    return guide.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 6);
  }

  /**
   * Generate task using enhanced context (new method for BACKEND-003)
   */
  async generateTaskWithEnhancedContext(enhancedPrompt, context) {
    try {
      const response = await this.makeAPICall(enhancedPrompt);

      if (response && response.choices && response.choices[0]) {
        const content = response.choices[0].message?.content || response.choices[0].text;
        const task = this.parseTaskResponse(content);

        return {
          type: 'enhanced_ai_task',
          success: true,
          task: {
            ...task,
            enhancedContext: true,
            contextQuality: context.enhancedContext?.metadata?.contextQuality || 'unknown'
          },
          metadata: {
            provider: this.provider,
            model: this.model,
            enhancedContext: true,
            generatedAt: new Date().toISOString()
          }
        };
      }

      return this.fallbackTask(context);
    } catch (error) {
      console.error('Enhanced AI task generation failed:', error);
      return this.fallbackTask(context);
    }
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
 * Multi-provider AI task generation with intelligent fallbacks
 * Now uses Guidant's model configuration system
 */
export async function generateAITask(phase, role, deliverable, projectRoot) {
  // Try different roles in order of preference for task generation
  const roles = ['main', 'generation', 'fallback'];

  const context = await gatherProjectContext(projectRoot, phase, deliverable);
  context.role = role;

  // Try each role configuration
  for (const configRole of roles) {
    try {
      console.log(`Generating task using '${configRole}' role configuration...`);
      const generator = new AITaskGenerator(configRole);

      // Check if we have a valid API key for this configuration
      if (!generator.apiKey) {
        console.warn(`No API key available for '${configRole}' role (${generator.provider}), trying next...`);
        continue;
      }

      const result = await generator.generateTask(context);

      if (result && result.task) {
        console.log(`✅ Task generated successfully using '${configRole}' role (${generator.provider})`);
        return result;
      }
    } catch (error) {
      console.warn(`'${configRole}' role failed for task generation:`, error.message);
      continue;
    }
  }

  // Enhanced fallback with better task structure
  console.warn('All AI providers failed, using enhanced fallback task generation');
  return generateEnhancedFallbackTask(phase, role, deliverable, context);
}

/**
 * Generate enhanced fallback task when AI providers are unavailable
 */
function generateEnhancedFallbackTask(phase, role, deliverable, context) {
  const taskTemplates = {
    research_agent: {
      market_analysis: {
        title: 'Conduct Market Analysis Research',
        description: 'Research market conditions, competitors, and opportunities for the project',
        steps: [
          'Use web search tools to research the target market',
          'Identify 3-5 key competitors and analyze their offerings',
          'Document market size and growth trends',
          'Identify target audience and user personas',
          'Create market analysis report with findings'
        ]
      },
      user_personas: {
        title: 'Develop User Personas',
        description: 'Create detailed user personas based on research',
        steps: [
          'Research target user demographics and behaviors',
          'Interview or survey potential users if possible',
          'Create 2-3 primary user personas with goals and pain points',
          'Document user journey maps for each persona',
          'Validate personas with stakeholders'
        ]
      }
    },
    design_agent: {
      wireframes: {
        title: 'Create Application Wireframes',
        description: 'Design wireframes for key application screens',
        steps: [
          'Review user requirements and user stories',
          'Sketch initial layout concepts for main screens',
          'Create detailed wireframes using available tools',
          'Include navigation flow between screens',
          'Document component specifications and interactions'
        ]
      }
    },
    development_agent: {
      core_features: {
        title: 'Implement Core Features',
        description: 'Develop the main functionality of the application',
        steps: [
          'Set up project structure and dependencies',
          'Implement core business logic',
          'Create necessary database schemas or data structures',
          'Build user interface components',
          'Add error handling and validation',
          'Write unit tests for critical functionality'
        ]
      }
    }
  };

  // Enhanced implementation phase templates
  const implementationTemplates = {
    core_features: {
      ticket_id: 'IMPL-001',
      title: 'Implement Core Application Features',
      type: 'Task',
      parent_story: 'Core Application Development',
      parent_epic: 'Application Implementation',
      priority: 'High',
      complexity: 'High',
      estimated_points: 8,
      status: 'Ready for Implementation',
      description: 'Implement the core functionality and features of the application based on requirements and design specifications.',
      acceptance_criteria: [
        'All core features are implemented according to specifications',
        'Application handles user input validation correctly',
        'Error handling is implemented for all critical paths',
        'Core functionality is covered by unit tests',
        'Application performance meets requirements'
      ],
      technical_specifications: [
        'Use modern JavaScript/TypeScript for implementation',
        'Implement proper error handling and logging',
        'Follow established coding standards and patterns',
        'Ensure code is modular and maintainable',
        'Include comprehensive input validation'
      ],
      dependencies: [
        'Database schema design completed',
        'API specifications finalized',
        'UI/UX designs approved'
      ],
      implementation_guide: '1. Set up project structure and install dependencies\n2. Implement core business logic modules\n3. Create data access layer\n4. Build user interface components\n5. Add error handling and validation\n6. Write comprehensive tests\n7. Perform integration testing',
      code_examples: [
        {
          language: 'javascript',
          description: 'Example core feature implementation',
          code: '// Core feature implementation\nclass FeatureService {\n  async processData(input) {\n    try {\n      const validated = this.validateInput(input);\n      const result = await this.executeLogic(validated);\n      return { success: true, data: result };\n    } catch (error) {\n      this.logger.error(`Feature processing failed: ${error.message}`);\n      throw new Error(`Processing failed: ${error.message}`);\n    }\n  }\n}'
        }
      ],
      testing_requirements: [
        'Unit tests for all core business logic',
        'Integration tests for data flow',
        'Error handling test cases',
        'Performance tests for critical paths',
        'User acceptance tests for key features'
      ]
    },
    testing_suite: {
      ticket_id: 'IMPL-002',
      title: 'Implement Comprehensive Testing Suite',
      type: 'Task',
      parent_story: 'Quality Assurance Implementation',
      parent_epic: 'Application Testing',
      priority: 'High',
      complexity: 'Medium',
      estimated_points: 5,
      status: 'Ready for Implementation',
      description: 'Create a comprehensive testing suite including unit tests, integration tests, and end-to-end tests.',
      acceptance_criteria: [
        'Unit test coverage is above 80%',
        'Integration tests cover all API endpoints',
        'End-to-end tests cover critical user journeys',
        'Tests run automatically in CI/CD pipeline',
        'Test reports are generated and accessible'
      ],
      technical_specifications: [
        'Use Jest for unit and integration testing',
        'Implement test fixtures and mocks',
        'Set up test database for integration tests',
        'Configure test coverage reporting',
        'Implement parallel test execution'
      ],
      dependencies: [
        'Core features implementation completed',
        'CI/CD pipeline configured',
        'Test environment setup'
      ],
      implementation_guide: '1. Set up testing framework and configuration\n2. Write unit tests for all modules\n3. Create integration tests for APIs\n4. Implement end-to-end test scenarios\n5. Configure test coverage reporting\n6. Set up automated test execution',
      code_examples: [
        {
          language: 'javascript',
          description: 'Example unit test',
          code: 'describe("FeatureService", () => {\n  test("should process valid input successfully", async () => {\n    const service = new FeatureService();\n    const result = await service.processData({ valid: "data" });\n    expect(result.success).toBe(true);\n    expect(result.data).toBeDefined();\n  });\n});'
        }
      ],
      testing_requirements: [
        'Test the testing framework setup',
        'Validate test coverage reporting',
        'Verify CI/CD integration',
        'Test parallel execution performance'
      ]
    }
  };

  // Use enhanced implementation templates for implementation phase
  if (phase === 'implementation' && implementationTemplates[deliverable]) {
    const implementationTemplate = implementationTemplates[deliverable];
    return {
      type: 'implementation_ticket',
      task: {
        ...implementationTemplate,
        tools: context.availableTools || [],
        estimatedDuration: implementationTemplate.estimated_points * 25, // Convert story points to minutes
        phase,
        role,
        deliverable
      }
    };
  }

  const template = taskTemplates[role]?.[deliverable] || {
    title: `Complete ${deliverable}`,
    description: `Work on ${deliverable} deliverable for ${phase} phase`,
    steps: [
      'Analyze the requirements for this deliverable',
      'Research best practices and approaches',
      'Plan the implementation strategy',
      'Execute the work systematically',
      'Review and validate the results'
    ]
  };

  return {
    type: 'enhanced_fallback_task',
    task: {
      ...template,
      phase,
      role,
      deliverable,
      estimatedDuration: 45,
      priority: 'high',
      context: {
        projectType: context.projectType || 'Unknown',
        hasExistingCode: context.hasPackageJson || false,
        complexity: 'medium'
      }
    }
  };
}
