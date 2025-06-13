/**
 * @file Defines the phases of the Guidant software development lifecycle.
 * @description This file contains the canonical definition for all project phases,
 * their requirements, and transitions. It is used throughout the application to ensure
 * a consistent understanding of the workflow.
 */

export const PHASE_DEFINITIONS = {
  concept: {
    name: 'Concept & Research',
    description: 'Initial idea validation and market research',
    roles: ['research_agent'],
    requiredDeliverables: ['market_analysis', 'user_personas', 'competitor_research'],
    nextPhase: 'requirements'
  },
  
  requirements: {
    name: 'Requirements Analysis', 
    description: 'Detailed feature specification and PRD creation',
    roles: ['research_agent', 'business_analyst'],
    requiredDeliverables: ['prd_complete', 'user_stories', 'feature_specifications'],
    nextPhase: 'design'
  },
  
  design: {
    name: 'Design & UX',
    description: 'User interface and experience design',
    roles: ['design_agent'],
    requiredDeliverables: ['wireframes', 'user_flows', 'component_specifications'],
    nextPhase: 'architecture'
  },
  
  architecture: {
    name: 'Technical Architecture',
    description: 'System design and technology planning',
    roles: ['architecture_agent'],
    requiredDeliverables: ['system_design', 'database_schema', 'api_specification'],
    nextPhase: 'implementation'
  },
  
  implementation: {
    name: 'Development',
    description: 'Code implementation and testing',
    roles: ['development_agent'],
    requiredDeliverables: ['core_features', 'testing_suite', 'documentation'],
    nextPhase: 'deployment'
  },
  
  deployment: {
    name: 'Deployment & Launch',
    description: 'Production setup and monitoring',
    roles: ['deployment_agent'],
    requiredDeliverables: ['production_environment', 'monitoring_setup', 'user_documentation'],
    nextPhase: 'complete'
  }
};
