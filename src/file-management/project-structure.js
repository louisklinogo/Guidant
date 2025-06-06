/**
 * Project structure management for Guidant Evolution
 * Creates and manages the .guidant/ directory system
 */

import fs from 'fs/promises';
import path from 'path';
import { 
  GUIDANT_DIR,
  PROJECT_CONFIG,
  PROJECT_PHASES,
  PROJECT_METADATA,
  CURRENT_PHASE,
  QUALITY_GATES,
  DEPENDENCIES,
  DECISIONS,
  RESEARCH,
  SESSIONS,
  USER_FEEDBACK,
  WIREFRAMES_DIR,
  ARCHITECTURE_DIR,
  IMPLEMENTATION_DIR,
  DEPLOYMENT_DIR,
  PROGRESS_REPORTS_DIR,
  QUALITY_REPORTS_DIR,
  BUSINESS_REPORTS_DIR,
  AI_CAPABILITIES,
  CURRENT_ROLE,
  TASK_TICKETS
} from '../constants/paths.js';

/**
 * Initialize the complete .guidant/ directory structure
 */
export async function initializeProjectStructure(projectRoot = process.cwd()) {
  const guidantPath = path.join(projectRoot, GUIDANT_DIR);
  
  // Create directory structure
  const directories = [
    'project',
    'workflow', 
    'context',
    'deliverables',
    'deliverables/research',
    'deliverables/requirements',
    'deliverables/wireframes',
    'deliverables/architecture',
    'deliverables/implementation',
    'deliverables/deployment',
    'reports',
    'reports/progress-reports',
    'reports/quality-reports', 
    'reports/business-reports',
    'ai',
    'ai/task-tickets'
  ];

  for (const dir of directories) {
    await fs.mkdir(path.join(guidantPath, dir), { recursive: true });
  }

  // Initialize default configuration files
  await initializeDefaultFiles(projectRoot);
  
  return guidantPath;
}

/**
 * Create default configuration files with initial structure
 */
async function initializeDefaultFiles(projectRoot) {
  const defaultFiles = {
    [PROJECT_CONFIG]: {
      name: '',
      description: '',
      version: '0.1.0',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    
    [PROJECT_PHASES]: {
      current: 'concept',
      phases: {
        concept: { status: 'active', startedAt: new Date().toISOString() },
        requirements: { status: 'pending' },
        design: { status: 'pending' },
        architecture: { status: 'pending' },
        implementation: { status: 'pending' },
        deployment: { status: 'pending' }
      }
    },

    [PROJECT_METADATA]: {
      targetUsers: [],
      businessGoals: [],
      technicalRequirements: [],
      constraints: []
    },

    [CURRENT_PHASE]: {
      phase: 'concept',
      role: 'research_agent',
      currentTask: null,
      progress: 0,
      startedAt: new Date().toISOString()
    },

    [QUALITY_GATES]: {
      concept: { required: ['user_research', 'market_analysis'], status: 'pending' },
      requirements: { required: ['prd_complete', 'user_stories'], status: 'pending' },
      design: { required: ['wireframes', 'user_flows'], status: 'pending' },
      architecture: { required: ['system_design', 'tech_stack'], status: 'pending' },
      implementation: { required: ['core_features', 'testing'], status: 'pending' },
      deployment: { required: ['production_ready', 'monitoring'], status: 'pending' }
    },

    [DEPENDENCIES]: {
      tasks: [],
      blockers: [],
      dependencies: []
    },

    [DECISIONS]: [],
    [RESEARCH]: {},
    [SESSIONS]: [],
    [USER_FEEDBACK]: [],
    [AI_CAPABILITIES]: {},
    [CURRENT_ROLE]: {}
  };

  for (const [filePath, content] of Object.entries(defaultFiles)) {
    const fullPath = path.join(projectRoot, filePath);
    await fs.writeFile(fullPath, JSON.stringify(content, null, 2));
  }
}

/**
 * Read any JSON file from the project structure
 */
export async function readProjectFile(filePath, projectRoot = process.cwd()) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

/**
 * Write any JSON file to the project structure
 */
export async function writeProjectFile(filePath, data, projectRoot = process.cwd()) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Failed to write ${filePath}: ${error.message}`);
  }
}

/**
 * Check if project is already initialized
 */
export async function isProjectInitialized(projectRoot = process.cwd()) {
  try {
    const guidantPath = path.join(projectRoot, GUIDANT_DIR);
    await fs.access(guidantPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current project state summary
 */
export async function getProjectState(projectRoot = process.cwd()) {
  const [config, phases, currentPhase, capabilities] = await Promise.all([
    readProjectFile(PROJECT_CONFIG, projectRoot),
    readProjectFile(PROJECT_PHASES, projectRoot),
    readProjectFile(CURRENT_PHASE, projectRoot),
    readProjectFile(AI_CAPABILITIES, projectRoot)
  ]);

  return {
    config,
    phases,
    currentPhase,
    capabilities,
    isInitialized: true
  };
}
