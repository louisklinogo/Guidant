/**
 * Simple PRD Processor
 * Processes Product Requirements Documents and generates tasks
 */

import { generateAITask } from '../ai-integration/task-generator.js';
import { writeProjectFile, readProjectFile } from '../file-management/project-structure.js';
import { TASK_TICKETS } from '../constants/paths.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Process PRD content and generate tasks
 * @param {string} prdContent - The PRD content to process
 * @param {object} options - Processing options
 * @returns {object} Processing result with success status and task count
 */
export async function processPRDContent(prdContent, options = {}) {
  const { projectName, projectDescription, projectRoot = process.cwd() } = options;
  
  try {
    // Extract project information from PRD
    const prdAnalysis = analyzePRDContent(prdContent);
    
    // Generate tasks using AI
    const taskGenerationResult = await generateTasksFromPRD(
      prdContent, 
      prdAnalysis, 
      projectRoot
    );
    
    // Save tasks to project structure
    const savedTasks = await saveGeneratedTasks(
      taskGenerationResult.tasks, 
      projectRoot
    );
    
    // Update project description if extracted from PRD
    let enhancedDescription = projectDescription;
    if (prdAnalysis.description && prdAnalysis.description.length > projectDescription.length) {
      enhancedDescription = prdAnalysis.description;
      await updateProjectDescription(enhancedDescription, projectRoot);
    }
    
    return {
      success: true,
      taskCount: savedTasks.length,
      projectDescription: enhancedDescription,
      message: `Successfully generated ${savedTasks.length} tasks from PRD`,
      tasks: savedTasks,
      prdAnalysis
    };
    
  } catch (error) {
    console.error('PRD processing error:', error);
    
    // Try fallback task generation
    try {
      const fallbackTasks = await generateFallbackTasks(prdContent, projectRoot);
      const savedTasks = await saveGeneratedTasks(fallbackTasks, projectRoot);
      
      return {
        success: false,
        taskCount: savedTasks.length,
        message: `AI processing failed, generated ${savedTasks.length} basic tasks`,
        tasks: savedTasks,
        error: error.message
      };
    } catch (fallbackError) {
      return {
        success: false,
        taskCount: 0,
        message: 'PRD processing failed completely',
        error: error.message,
        fallbackError: fallbackError.message
      };
    }
  }
}

/**
 * Analyze PRD content to extract key information
 * @param {string} prdContent - The PRD content
 * @returns {object} Analysis results
 */
function analyzePRDContent(prdContent) {
  const analysis = {
    description: '',
    features: [],
    requirements: [],
    complexity: 'medium',
    estimatedTasks: 5
  };
  
  // Extract description (first paragraph or summary section)
  const lines = prdContent.split('\n').filter(line => line.trim());
  
  // Look for description in common patterns
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.length > 50 && !line.startsWith('#') && !line.includes(':')) {
      analysis.description = line;
      break;
    }
  }
  
  // Extract features (look for bullet points, numbered lists, or feature sections)
  const featurePatterns = [
    /^[-*+]\s+(.+)/,  // Bullet points
    /^\d+\.\s+(.+)/,  // Numbered lists
    /^feature[:\s]+(.+)/i,  // Feature: descriptions
  ];
  
  lines.forEach(line => {
    featurePatterns.forEach(pattern => {
      const match = line.match(pattern);
      if (match && match[1].length > 10) {
        analysis.features.push(match[1].trim());
      }
    });
  });
  
  // Extract requirements
  const requirementKeywords = ['must', 'should', 'require', 'need', 'implement'];
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (requirementKeywords.some(keyword => lowerLine.includes(keyword)) && line.length > 20) {
      analysis.requirements.push(line.trim());
    }
  });
  
  // Estimate complexity based on content length and feature count
  const wordCount = prdContent.split(/\s+/).length;
  const featureCount = analysis.features.length;
  
  if (wordCount > 1000 || featureCount > 10) {
    analysis.complexity = 'high';
    analysis.estimatedTasks = Math.min(15, Math.max(8, featureCount + 3));
  } else if (wordCount < 300 || featureCount < 3) {
    analysis.complexity = 'low';
    analysis.estimatedTasks = Math.max(3, featureCount + 1);
  } else {
    analysis.complexity = 'medium';
    analysis.estimatedTasks = Math.max(5, featureCount + 2);
  }
  
  return analysis;
}

/**
 * Generate tasks from PRD using AI
 * @param {string} prdContent - The PRD content
 * @param {object} prdAnalysis - Analysis of the PRD
 * @param {string} projectRoot - Project root directory
 * @returns {object} Task generation result
 */
async function generateTasksFromPRD(prdContent, prdAnalysis, projectRoot) {
  // Create a structured prompt for AI task generation
  const taskPrompt = `
Based on the following Product Requirements Document, generate ${prdAnalysis.estimatedTasks} specific, actionable development tasks.

PRD Content:
${prdContent}

Requirements:
- Create tasks that cover the full development lifecycle
- Include setup, implementation, testing, and deployment tasks
- Make tasks specific and actionable
- Estimate duration for each task
- Identify required tools and dependencies
- Consider the complexity level: ${prdAnalysis.complexity}

Focus on practical implementation steps that a developer can execute.
`;

  try {
    // Use existing AI task generation with PRD context
    const aiResult = await generateAITask(
      'requirements', 
      'product_manager', 
      'task_breakdown', 
      projectRoot,
      { customPrompt: taskPrompt, prdContent, prdAnalysis }
    );
    
    if (aiResult.success && aiResult.task) {
      // Parse AI response to extract multiple tasks
      return parseAITaskResponse(aiResult.task, prdAnalysis);
    }
    
    throw new Error('AI task generation failed');
    
  } catch (error) {
    console.warn('AI task generation failed, using template-based approach:', error.message);
    return generateTemplateBasedTasks(prdAnalysis);
  }
}

/**
 * Parse AI response to extract multiple tasks
 * @param {object} aiTask - AI generated task response
 * @param {object} prdAnalysis - PRD analysis
 * @returns {object} Parsed tasks
 */
function parseAITaskResponse(aiTask, prdAnalysis) {
  // If AI returned a single task, break it down into multiple tasks
  const tasks = [];
  
  if (aiTask.steps && Array.isArray(aiTask.steps)) {
    // Convert steps into individual tasks
    aiTask.steps.forEach((step, index) => {
      tasks.push({
        id: `prd-task-${index + 1}`,
        title: step.title || `Task ${index + 1}: ${step.substring(0, 50)}...`,
        description: step.description || step,
        phase: 'requirements',
        priority: index < 2 ? 'high' : 'medium',
        estimatedDuration: 30 + (index * 15),
        source: 'prd',
        createdAt: new Date().toISOString()
      });
    });
  } else {
    // Single task - break down based on PRD analysis
    const baseTask = {
      title: aiTask.title || 'Implement PRD Requirements',
      description: aiTask.description || 'Implement the requirements from the PRD',
      phase: 'requirements',
      priority: 'high',
      estimatedDuration: aiTask.estimatedDuration || 60,
      source: 'prd',
      createdAt: new Date().toISOString()
    };
    
    tasks.push({ ...baseTask, id: 'prd-task-1' });
    
    // Add additional tasks based on features
    prdAnalysis.features.slice(0, 4).forEach((feature, index) => {
      tasks.push({
        id: `prd-task-${index + 2}`,
        title: `Implement: ${feature.substring(0, 50)}`,
        description: `Implement the feature: ${feature}`,
        phase: 'implementation',
        priority: 'medium',
        estimatedDuration: 45,
        source: 'prd',
        createdAt: new Date().toISOString()
      });
    });
  }
  
  return { tasks, source: 'ai' };
}

/**
 * Generate template-based tasks when AI fails
 * @param {object} prdAnalysis - PRD analysis
 * @returns {object} Template-based tasks
 */
function generateTemplateBasedTasks(prdAnalysis) {
  const tasks = [
    {
      id: 'prd-task-1',
      title: 'Project Setup and Configuration',
      description: 'Set up the project structure, dependencies, and initial configuration',
      phase: 'concept',
      priority: 'high',
      estimatedDuration: 30,
      source: 'template'
    },
    {
      id: 'prd-task-2', 
      title: 'Requirements Analysis and Planning',
      description: 'Analyze the PRD requirements and create detailed implementation plan',
      phase: 'requirements',
      priority: 'high',
      estimatedDuration: 45,
      source: 'template'
    }
  ];
  
  // Add feature-based tasks
  prdAnalysis.features.slice(0, 3).forEach((feature, index) => {
    tasks.push({
      id: `prd-task-${index + 3}`,
      title: `Implement: ${feature.substring(0, 50)}`,
      description: `Implement the feature: ${feature}`,
      phase: 'implementation',
      priority: 'medium',
      estimatedDuration: 60,
      source: 'template'
    });
  });
  
  // Add testing and deployment tasks
  tasks.push({
    id: `prd-task-${tasks.length + 1}`,
    title: 'Testing and Quality Assurance',
    description: 'Implement comprehensive testing for all features',
    phase: 'implementation',
    priority: 'medium',
    estimatedDuration: 45,
    source: 'template'
  });
  
  return { tasks, source: 'template' };
}

/**
 * Generate fallback tasks when everything else fails
 * @param {string} prdContent - PRD content
 * @param {string} projectRoot - Project root
 * @returns {Array} Basic fallback tasks
 */
async function generateFallbackTasks(prdContent, projectRoot) {
  return [
    {
      id: 'fallback-task-1',
      title: 'Review PRD and Plan Implementation',
      description: `Review the provided PRD and create a detailed implementation plan. PRD length: ${prdContent.length} characters.`,
      phase: 'requirements',
      priority: 'high',
      estimatedDuration: 30,
      source: 'fallback',
      createdAt: new Date().toISOString()
    },
    {
      id: 'fallback-task-2',
      title: 'Begin Implementation',
      description: 'Start implementing the core features described in the PRD',
      phase: 'implementation', 
      priority: 'medium',
      estimatedDuration: 60,
      source: 'fallback',
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Save generated tasks to the project structure
 * @param {Array} tasks - Generated tasks
 * @param {string} projectRoot - Project root directory
 * @returns {Array} Saved tasks with file paths
 */
async function saveGeneratedTasks(tasks, projectRoot) {
  const savedTasks = [];
  
  for (const task of tasks) {
    try {
      const taskTicket = {
        ...task,
        id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: task.createdAt || new Date().toISOString(),
        status: 'pending',
        aiGenerated: task.source === 'ai',
        prdGenerated: true
      };
      
      // Save to task tickets directory
      const ticketPath = path.join(projectRoot, TASK_TICKETS, `${taskTicket.id}.json`);
      await fs.writeFile(ticketPath, JSON.stringify(taskTicket, null, 2));
      
      savedTasks.push({
        ...taskTicket,
        filePath: ticketPath
      });
      
    } catch (error) {
      console.warn(`Failed to save task ${task.id}:`, error.message);
    }
  }
  
  return savedTasks;
}

/**
 * Update project description with enhanced description from PRD
 * @param {string} description - Enhanced description
 * @param {string} projectRoot - Project root directory
 */
async function updateProjectDescription(description, projectRoot) {
  try {
    const config = await readProjectFile('PROJECT_CONFIG', projectRoot);
    config.description = description;
    config.lastModified = new Date().toISOString();
    await writeProjectFile('PROJECT_CONFIG', config, projectRoot);
  } catch (error) {
    console.warn('Failed to update project description:', error.message);
  }
}
