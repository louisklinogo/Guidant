/**
 * Project Type Configuration
 * Defines project types, tech stacks, and validation rules for transformers
 */

import { PROJECT_TYPES } from '../workflow-intelligence/project-classifier.js';

/**
 * Default tech stacks for different project types
 */
const DEFAULT_TECH_STACKS = {
  web_app: {
    frontend: 'React',
    backend: 'Node.js/Express',
    database: 'PostgreSQL',
    deployment: 'Vercel',
    cicd: 'GitHub Actions',
    containerization: 'Docker'
  },
  mobile_app: {
    frontend: 'React Native',
    backend: 'Node.js/Express',
    database: 'PostgreSQL',
    deployment: 'AWS',
    cicd: 'GitHub Actions',
    containerization: 'Docker'
  },
  api_service: {
    backend: 'Node.js/Express',
    database: 'PostgreSQL',
    deployment: 'AWS',
    cicd: 'GitHub Actions',
    containerization: 'Docker'
  },
  desktop_app: {
    frontend: 'Electron',
    backend: 'Node.js',
    database: 'SQLite',
    deployment: 'GitHub Releases',
    cicd: 'GitHub Actions'
  },
  prototype: {
    frontend: 'HTML/CSS/JS',
    backend: 'Node.js/Express',
    database: 'SQLite',
    deployment: 'Netlify',
    cicd: 'GitHub Actions'
  }
};

/**
 * Available technology options for each project type
 */
const AVAILABLE_OPTIONS = {
  web_app: {
    frontend: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js'],
    backend: ['Node.js/Express', 'Python/Django', 'Python/FastAPI', 'Go/Gin', 'Java/Spring'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
    deployment: ['Vercel', 'Netlify', 'AWS', 'Google Cloud', 'Azure'],
    cicd: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI'],
    containerization: ['Docker', 'Podman'],
    vector_db: ['Pinecone', 'Weaviate', 'Chroma'],
    ai_framework: ['OpenAI', 'Anthropic', 'Hugging Face']
  },
  mobile_app: {
    frontend: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    backend: ['Node.js/Express', 'Python/Django', 'Go/Gin'],
    database: ['PostgreSQL', 'MongoDB', 'Firebase'],
    deployment: ['AWS', 'Google Cloud', 'Firebase'],
    cicd: ['GitHub Actions', 'Bitrise', 'App Center']
  },
  api_service: {
    backend: ['Node.js/Express', 'Python/FastAPI', 'Go/Gin', 'Rust/Actix'],
    database: ['PostgreSQL', 'MongoDB', 'Redis'],
    deployment: ['AWS', 'Google Cloud', 'Azure'],
    cicd: ['GitHub Actions', 'GitLab CI'],
    containerization: ['Docker', 'Kubernetes']
  },
  desktop_app: {
    frontend: ['Electron', 'Tauri', 'Qt', 'GTK'],
    backend: ['Node.js', 'Python', 'Rust', 'C++'],
    database: ['SQLite', 'PostgreSQL'],
    deployment: ['GitHub Releases', 'Microsoft Store', 'Mac App Store']
  },
  prototype: {
    frontend: ['HTML/CSS/JS', 'React', 'Vue.js'],
    backend: ['Node.js/Express', 'Python/Flask'],
    database: ['SQLite', 'JSON files'],
    deployment: ['Netlify', 'Vercel', 'GitHub Pages']
  }
};

/**
 * Project type configurations with workflow characteristics
 */
const PROJECT_TYPE_CONFIGS = {
  web_app: {
    name: 'Web Application',
    description: 'Full-stack web application',
    complexity: 'standard',
    phases: ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'],
    defaultTechStack: DEFAULT_TECH_STACKS.web_app,
    availableOptions: AVAILABLE_OPTIONS.web_app,
    qualityLevel: 'standard',
    scalabilityRequirements: 'medium',
    securityRequirements: 'high'
  },
  mobile_app: {
    name: 'Mobile Application',
    description: 'Native or cross-platform mobile app',
    complexity: 'standard',
    phases: ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'],
    defaultTechStack: DEFAULT_TECH_STACKS.mobile_app,
    availableOptions: AVAILABLE_OPTIONS.mobile_app,
    qualityLevel: 'high',
    scalabilityRequirements: 'high',
    securityRequirements: 'high'
  },
  api_service: {
    name: 'API Service',
    description: 'Backend API service or microservice',
    complexity: 'standard',
    phases: ['concept', 'requirements', 'architecture', 'implementation', 'deployment'],
    defaultTechStack: DEFAULT_TECH_STACKS.api_service,
    availableOptions: AVAILABLE_OPTIONS.api_service,
    qualityLevel: 'high',
    scalabilityRequirements: 'high',
    securityRequirements: 'high'
  },
  desktop_app: {
    name: 'Desktop Application',
    description: 'Cross-platform desktop application',
    complexity: 'standard',
    phases: ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'],
    defaultTechStack: DEFAULT_TECH_STACKS.desktop_app,
    availableOptions: AVAILABLE_OPTIONS.desktop_app,
    qualityLevel: 'standard',
    scalabilityRequirements: 'low',
    securityRequirements: 'medium'
  },
  prototype: {
    name: 'Prototype',
    description: 'Quick proof-of-concept or MVP',
    complexity: 'simple',
    phases: ['concept', 'design', 'implementation'],
    defaultTechStack: DEFAULT_TECH_STACKS.prototype,
    availableOptions: AVAILABLE_OPTIONS.prototype,
    qualityLevel: 'basic',
    scalabilityRequirements: 'low',
    securityRequirements: 'low'
  }
};

/**
 * Get project type configuration
 * @param {string} projectType - Project type identifier
 * @returns {object} Project configuration
 */
export function getProjectTypeConfig(projectType = 'web_app') {
  const config = PROJECT_TYPE_CONFIGS[projectType];
  
  if (!config) {
    console.warn(`Unknown project type: ${projectType}, using web_app default`);
    return PROJECT_TYPE_CONFIGS.web_app;
  }
  
  return config;
}

/**
 * Validate tech stack against project type
 * @param {string} projectType - Project type identifier
 * @param {object} techStack - Tech stack to validate
 * @returns {object} Validation result
 */
export function validateTechStack(projectType, techStack) {
  const config = getProjectTypeConfig(projectType);
  const errors = [];
  const warnings = [];
  
  // Check if all required components are present
  const requiredComponents = ['frontend', 'backend', 'database', 'deployment'];
  
  for (const component of requiredComponents) {
    if (!techStack[component] && config.defaultTechStack[component]) {
      warnings.push(`Missing ${component}, will use default: ${config.defaultTechStack[component]}`);
    }
  }
  
  // Validate each component against available options
  for (const [component, value] of Object.entries(techStack)) {
    if (value && config.availableOptions[component]) {
      if (!config.availableOptions[component].includes(value)) {
        errors.push(`Invalid ${component}: ${value}. Available options: ${config.availableOptions[component].join(', ')}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get transformation rules for project type
 * @param {string} projectType - Project type identifier
 * @returns {object} Transformation rules
 */
export function getTransformationRules(projectType) {
  const config = getProjectTypeConfig(projectType);
  
  return {
    phases: config.phases,
    qualityLevel: config.qualityLevel,
    scalabilityRequirements: config.scalabilityRequirements,
    securityRequirements: config.securityRequirements,
    complexity: config.complexity,
    transformationRules: {
      concept_to_requirements: {
        minRequirements: config.complexity === 'simple' ? 3 : 5,
        includeNonFunctional: config.qualityLevel !== 'basic',
        includeSecurityRequirements: config.securityRequirements !== 'low'
      },
      requirements_to_design: {
        includeWireframes: config.phases.includes('design'),
        includeDesignSystem: config.qualityLevel === 'high',
        includeAccessibility: config.qualityLevel !== 'basic'
      },
      design_to_architecture: {
        includeScalability: config.scalabilityRequirements !== 'low',
        includeSecurity: config.securityRequirements !== 'low',
        includePerformance: config.qualityLevel === 'high'
      },
      architecture_to_implementation: {
        includeTestingSuite: config.qualityLevel !== 'basic',
        includeDocumentation: true,
        includeCICD: config.phases.includes('deployment')
      },
      implementation_to_deployment: {
        includeMonitoring: config.qualityLevel !== 'basic',
        includeScaling: config.scalabilityRequirements !== 'low',
        includeBackup: config.qualityLevel === 'high'
      }
    }
  };
}

/**
 * Get available project types
 * @returns {array} List of available project types
 */
export function getAvailableProjectTypes() {
  return Object.keys(PROJECT_TYPE_CONFIGS).map(key => ({
    id: key,
    ...PROJECT_TYPE_CONFIGS[key]
  }));
}

/**
 * Suggest project type based on description
 * @param {string} description - Project description
 * @returns {string} Suggested project type
 */
export function suggestProjectType(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('mobile') || desc.includes('app store') || desc.includes('ios') || desc.includes('android')) {
    return 'mobile_app';
  }
  
  if (desc.includes('api') || desc.includes('service') || desc.includes('microservice') || desc.includes('backend')) {
    return 'api_service';
  }
  
  if (desc.includes('desktop') || desc.includes('electron') || desc.includes('native app')) {
    return 'desktop_app';
  }
  
  if (desc.includes('prototype') || desc.includes('mvp') || desc.includes('proof of concept') || desc.includes('quick')) {
    return 'prototype';
  }
  
  // Default to web app
  return 'web_app';
}

/**
 * Get tech stack recommendations based on requirements
 * @param {string} projectType - Project type
 * @param {object} requirements - Project requirements
 * @returns {object} Recommended tech stack
 */
export function getRecommendedTechStack(projectType, requirements = {}) {
  const config = getProjectTypeConfig(projectType);
  const techStack = { ...config.defaultTechStack };
  
  // Apply requirement-based modifications
  if (requirements.scalability === 'high') {
    if (config.availableOptions.deployment?.includes('AWS')) {
      techStack.deployment = 'AWS';
    }
    if (config.availableOptions.database?.includes('PostgreSQL')) {
      techStack.database = 'PostgreSQL';
    }
  }
  
  if (requirements.realtime === true) {
    if (config.availableOptions.backend?.includes('Node.js/Express')) {
      techStack.backend = 'Node.js/Express';
    }
  }
  
  if (requirements.ai === true) {
    if (config.availableOptions.vector_db) {
      techStack.vector_db = config.availableOptions.vector_db[0];
    }
    if (config.availableOptions.ai_framework) {
      techStack.ai_framework = config.availableOptions.ai_framework[0];
    }
  }
  
  return techStack;
}
