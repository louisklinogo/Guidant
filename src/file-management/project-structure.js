/**
 * Project structure management for Guidant Evolution
 * Creates and manages the .guidant/ directory system
 */

import fs from 'fs/promises';
import path from 'path';
import {
  writeJSONFile,
  readJSONFile,
  updateJSONFile,
  withFileLock,
  getFileHealth,
  repairFileFromBackup
} from './reliable-file-manager.js';
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
    const result = await writeJSONFile(fullPath, content, {
      backup: false, // No backup needed for initial files
      validate: true
    });

    if (!result.success) {
      throw new Error(`Failed to create default file ${filePath}: ${result.error}`);
    }
  }
}

/**
 * Read any JSON file from the project structure with reliability features
 */
export async function readProjectFile(filePath, projectRoot = process.cwd()) {
  const fullPath = path.join(projectRoot, filePath);

  const result = await readJSONFile(fullPath, {
    backup: true,
    validate: true,
    retries: 3
  });

  if (!result.success) {
    throw new Error(`Failed to read ${filePath}: ${result.error}`);
  }

  return result.data;
}

/**
 * Write any JSON file to the project structure with reliability features
 */
export async function writeProjectFile(filePath, data, projectRoot = process.cwd()) {
  const fullPath = path.join(projectRoot, filePath);

  const result = await writeJSONFile(fullPath, data, {
    backup: true,
    validate: true,
    atomic: true,
    retries: 3
  });

  if (!result.success) {
    throw new Error(`Failed to write ${filePath}: ${result.error}`);
  }

  return result;
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

/**
 * Update project file safely with merge operation
 */
export async function updateProjectFile(filePath, updateFn, projectRoot = process.cwd()) {
  const fullPath = path.join(projectRoot, filePath);

  const result = await updateJSONFile(fullPath, updateFn, {
    backup: true,
    validate: true,
    atomic: true,
    retries: 3
  });

  if (!result.success) {
    throw new Error(`Failed to update ${filePath}: ${result.error}`);
  }

  return result;
}

/**
 * Safely write to project file with file locking
 */
export async function writeProjectFileWithLock(filePath, data, projectRoot = process.cwd()) {
  const fullPath = path.join(projectRoot, filePath);

  return await withFileLock(fullPath, async () => {
    return await writeProjectFile(filePath, data, projectRoot);
  });
}

/**
 * Check health of all project files
 */
export async function checkProjectHealth(projectRoot = process.cwd()) {
  const criticalFiles = [
    PROJECT_CONFIG,
    PROJECT_PHASES,
    CURRENT_PHASE,
    QUALITY_GATES,
    DECISIONS,
    SESSIONS
  ];

  const health = {
    overall: 'healthy',
    files: {},
    issues: [],
    recommendations: []
  };

  for (const filePath of criticalFiles) {
    const fullPath = path.join(projectRoot, filePath);
    const fileHealth = await getFileHealth(fullPath);

    health.files[filePath] = fileHealth;

    if (!fileHealth.exists) {
      health.issues.push({
        type: 'missing_file',
        file: filePath,
        severity: 'high',
        message: `Critical file missing: ${filePath}`
      });
      health.overall = 'critical';
    } else if (!fileHealth.isValid) {
      health.issues.push({
        type: 'corrupted_file',
        file: filePath,
        severity: 'high',
        message: `File corrupted: ${filePath} - ${fileHealth.validationError}`
      });
      health.overall = 'critical';
    } else if (!fileHealth.hasBackup) {
      health.issues.push({
        type: 'no_backup',
        file: filePath,
        severity: 'medium',
        message: `No backup available for: ${filePath}`
      });
      if (health.overall === 'healthy') {
        health.overall = 'warning';
      }
    }
  }

  // Generate recommendations
  if (health.issues.length === 0) {
    health.recommendations.push('All project files are healthy');
  } else {
    const corruptedFiles = health.issues.filter(i => i.type === 'corrupted_file');
    const missingFiles = health.issues.filter(i => i.type === 'missing_file');

    if (corruptedFiles.length > 0) {
      health.recommendations.push('Run repairProjectFiles() to restore corrupted files from backup');
    }

    if (missingFiles.length > 0) {
      health.recommendations.push('Run initializeProjectStructure() to recreate missing files');
    }
  }

  return health;
}

/**
 * Repair corrupted project files from backups
 */
export async function repairProjectFiles(projectRoot = process.cwd()) {
  const health = await checkProjectHealth(projectRoot);
  const corruptedFiles = health.issues.filter(i => i.type === 'corrupted_file');

  const results = {
    attempted: corruptedFiles.length,
    successful: 0,
    failed: 0,
    details: []
  };

  for (const issue of corruptedFiles) {
    const fullPath = path.join(projectRoot, issue.file);
    const repairResult = await repairFileFromBackup(fullPath);

    results.details.push({
      file: issue.file,
      success: repairResult.success,
      message: repairResult.success ? 'Restored from backup' : repairResult.error
    });

    if (repairResult.success) {
      results.successful++;
    } else {
      results.failed++;
    }
  }

  return results;
}
