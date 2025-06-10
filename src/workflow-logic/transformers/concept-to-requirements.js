/**
 * Concept to Requirements Transformer
 * Transforms market research and concept validation into detailed requirements
 */

import { BaseTransformer } from './base-transformer.js';

export class ConceptToRequirementsTransformer extends BaseTransformer {
  async transform(analysis, targetPhase) {
    const insights = this.extractCommonInsights(analysis);
    
    // Extract specific insights from concept phase deliverables
    const marketAnalysis = analysis.insights.market_analysis || {};
    const userPersonas = analysis.insights.user_personas || {};
    const competitorResearch = analysis.insights.competitor_research || {};

    // Transform into requirements
    const functionalRequirements = this.generateFunctionalRequirements(marketAnalysis, userPersonas);
    const nonFunctionalRequirements = this.generateNonFunctionalRequirements(competitorResearch);
    const userStories = this.generateUserStories(userPersonas, functionalRequirements);
    const featureSpecs = this.generateFeatureSpecifications(functionalRequirements, competitorResearch);
    
    // Generate tech stack guidance based on requirements
    const techStackGuidance = this.generateTechStack({
      scalability: this.determineScalabilityNeeds(marketAnalysis),
      realtime: this.determineRealtimeNeeds(functionalRequirements),
      ai: this.determineAINeeds(functionalRequirements)
    });

    const transformation = {
      type: 'concept_to_requirements',
      insights,
      functionalRequirements,
      nonFunctionalRequirements,
      userStories,
      featureSpecs,
      techStack: techStackGuidance,
      decisions: this.generateDecisions(analysis, { 
        functionalRequirements, 
        nonFunctionalRequirements, 
        techStack: techStackGuidance 
      }),
      recommendations: this.generateRecommendations(analysis, targetPhase),
      transformedAt: new Date().toISOString()
    };

    return this.validateOutput(transformation);
  }

  generateFunctionalRequirements(marketAnalysis, userPersonas) {
    const requirements = [];
    
    // Extract requirements from market analysis
    if (marketAnalysis.opportunities) {
      marketAnalysis.opportunities.forEach(opportunity => {
        requirements.push({
          id: `FR-${requirements.length + 1}`,
          title: `Address ${opportunity}`,
          description: `System must provide functionality to address market opportunity: ${opportunity}`,
          priority: 'high',
          source: 'market_analysis'
        });
      });
    }
    
    // Extract requirements from user personas
    if (userPersonas.needs) {
      userPersonas.needs.forEach(need => {
        requirements.push({
          id: `FR-${requirements.length + 1}`,
          title: `Support ${need}`,
          description: `System must support user need: ${need}`,
          priority: 'medium',
          source: 'user_personas'
        });
      });
    }
    
    // Add common functional requirements
    const commonRequirements = [
      {
        id: `FR-${requirements.length + 1}`,
        title: 'User Authentication',
        description: 'System must provide secure user authentication and authorization',
        priority: 'high',
        source: 'standard'
      },
      {
        id: `FR-${requirements.length + 2}`,
        title: 'Data Management',
        description: 'System must provide CRUD operations for core entities',
        priority: 'high',
        source: 'standard'
      },
      {
        id: `FR-${requirements.length + 3}`,
        title: 'User Interface',
        description: 'System must provide intuitive user interface',
        priority: 'medium',
        source: 'standard'
      }
    ];
    
    requirements.push(...commonRequirements);
    return requirements;
  }

  generateNonFunctionalRequirements(competitorResearch) {
    const requirements = [];
    
    // Performance requirements based on competitor analysis
    if (competitorResearch.performance_benchmarks) {
      requirements.push({
        id: `NFR-${requirements.length + 1}`,
        title: 'Response Time',
        description: 'System must respond to user requests within 2 seconds',
        category: 'performance',
        priority: 'high'
      });
    }
    
    // Scalability requirements
    requirements.push({
      id: `NFR-${requirements.length + 1}`,
      title: 'Scalability',
      description: 'System must support concurrent users based on market size',
      category: 'scalability',
      priority: 'medium'
    });
    
    // Security requirements
    requirements.push({
      id: `NFR-${requirements.length + 1}`,
      title: 'Data Security',
      description: 'System must protect user data with industry-standard encryption',
      category: 'security',
      priority: 'high'
    });
    
    // Usability requirements
    requirements.push({
      id: `NFR-${requirements.length + 1}`,
      title: 'Usability',
      description: 'System must be usable by target user personas without training',
      category: 'usability',
      priority: 'medium'
    });
    
    return requirements;
  }

  generateUserStories(userPersonas, functionalRequirements) {
    const userStories = [];
    
    // Generate stories from personas
    if (userPersonas.personas) {
      userPersonas.personas.forEach(persona => {
        functionalRequirements.slice(0, 3).forEach(req => {
          userStories.push({
            id: `US-${userStories.length + 1}`,
            persona: persona.name || 'User',
            story: `As a ${persona.name || 'user'}, I want to ${req.title.toLowerCase()} so that I can achieve my goals`,
            acceptanceCriteria: [
              `Given I am a ${persona.name || 'user'}`,
              `When I ${req.title.toLowerCase()}`,
              `Then I should be able to complete the task successfully`
            ],
            priority: req.priority,
            estimatedEffort: 'medium'
          });
        });
      });
    }
    
    // Add default user stories if none generated
    if (userStories.length === 0) {
      const defaultStories = [
        {
          id: 'US-1',
          persona: 'End User',
          story: 'As an end user, I want to register and login so that I can access the system',
          acceptanceCriteria: [
            'Given I am a new user',
            'When I provide valid registration information',
            'Then I should be able to create an account and login'
          ],
          priority: 'high',
          estimatedEffort: 'medium'
        },
        {
          id: 'US-2',
          persona: 'End User',
          story: 'As an end user, I want to manage my data so that I can control my information',
          acceptanceCriteria: [
            'Given I am logged in',
            'When I access my profile',
            'Then I should be able to view and edit my information'
          ],
          priority: 'medium',
          estimatedEffort: 'small'
        }
      ];
      userStories.push(...defaultStories);
    }
    
    return userStories;
  }

  generateFeatureSpecifications(functionalRequirements, competitorResearch) {
    const features = [];
    
    // Group requirements into features
    const featureGroups = this.groupRequirementsByFeature(functionalRequirements);
    
    Object.entries(featureGroups).forEach(([featureName, requirements]) => {
      features.push({
        name: featureName,
        description: `Feature encompassing ${requirements.length} related requirements`,
        requirements: requirements.map(req => req.id),
        priority: this.calculateFeaturePriority(requirements),
        complexity: this.estimateComplexity(requirements),
        dependencies: [],
        competitorComparison: this.getCompetitorComparison(featureName, competitorResearch)
      });
    });
    
    return features;
  }

  groupRequirementsByFeature(requirements) {
    const groups = {
      'Authentication': [],
      'Data Management': [],
      'User Interface': [],
      'Core Functionality': []
    };
    
    requirements.forEach(req => {
      if (req.title.toLowerCase().includes('auth') || req.title.toLowerCase().includes('login')) {
        groups['Authentication'].push(req);
      } else if (req.title.toLowerCase().includes('data') || req.title.toLowerCase().includes('crud')) {
        groups['Data Management'].push(req);
      } else if (req.title.toLowerCase().includes('interface') || req.title.toLowerCase().includes('ui')) {
        groups['User Interface'].push(req);
      } else {
        groups['Core Functionality'].push(req);
      }
    });
    
    return groups;
  }

  calculateFeaturePriority(requirements) {
    const priorities = requirements.map(req => req.priority);
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  estimateComplexity(requirements) {
    const count = requirements.length;
    if (count >= 3) return 'high';
    if (count >= 2) return 'medium';
    return 'low';
  }

  getCompetitorComparison(featureName, competitorResearch) {
    if (competitorResearch.features && competitorResearch.features[featureName]) {
      return competitorResearch.features[featureName];
    }
    return 'No competitor data available';
  }

  determineScalabilityNeeds(marketAnalysis) {
    if (marketAnalysis.market_size === 'large' || marketAnalysis.growth_potential === 'high') {
      return 'high';
    }
    return 'medium';
  }

  determineRealtimeNeeds(functionalRequirements) {
    return functionalRequirements.some(req => 
      req.description.toLowerCase().includes('real-time') || 
      req.description.toLowerCase().includes('live') ||
      req.description.toLowerCase().includes('instant')
    );
  }

  determineAINeeds(functionalRequirements) {
    return functionalRequirements.some(req => 
      req.description.toLowerCase().includes('ai') || 
      req.description.toLowerCase().includes('machine learning') ||
      req.description.toLowerCase().includes('intelligent') ||
      req.description.toLowerCase().includes('recommendation')
    );
  }
}
