/**
 * Requirements to Design Transformer
 * Transforms requirements and user stories into design specifications
 */

import { BaseTransformer } from './base-transformer.js';

export class RequirementsToDesignTransformer extends BaseTransformer {
  /**
   * Transform requirements analysis into design specifications
   * @param {object} analysis - Deliverable analysis from requirements phase
   * @param {string} targetPhase - Target phase for transformation (design)
   * @returns {object} Design transformation result
   */
  async transform(analysis, targetPhase) {
    try {
      const insights = this.extractCommonInsights(analysis);
      
      // Extract requirements insights with fallback handling
      const functionalReqs = analysis.insights.prd_complete?.functional_requirements || 
                           analysis.insights.functional_requirements || [];
      const userStories = analysis.insights.user_stories?.stories || 
                         analysis.insights.user_stories || [];
      const featureSpecs = analysis.insights.feature_specifications || [];
      
      // Transform into design specifications
      const wireframes = this.generateWireframes(functionalReqs, userStories);
      const userFlows = this.generateUserFlows(userStories, featureSpecs);
      const componentSpecs = this.generateComponentSpecs(functionalReqs, featureSpecs);
      const designSystem = this.generateDesignSystem(componentSpecs);
      
      const transformation = {
        type: 'requirements_to_design',
        insights,
        wireframes,
        userFlows,
        componentSpecs,
        designSystem,
        techStack: this.generateTechStack({
          frontend: this.determineFrontendNeeds(functionalReqs),
          ui_framework: this.determineUIFrameworkNeeds(componentSpecs)
        }),
        decisions: this.generateDecisions(analysis, { wireframes, userFlows, componentSpecs }),
        recommendations: this.generateRecommendations(analysis, targetPhase),
        transformedAt: new Date().toISOString()
      };

      return this.validateOutput(transformation);

    } catch (error) {
      console.error(`Requirements to Design transformation failed: ${error.message}`);
      throw new Error(`Transformation failed: ${error.message}`);
    }
  }

  /**
   * Generate wireframes based on functional requirements and user stories
   * @param {array} functionalReqs - Functional requirements
   * @param {array} userStories - User stories
   * @returns {array} Generated wireframes
   */
  generateWireframes(functionalReqs, userStories) {
    const wireframes = [];
    
    // Generate wireframes from functional requirements
    functionalReqs.slice(0, 5).forEach((req, index) => {
      const reqTitle = typeof req === 'object' ? (req.title || req.name || `Requirement ${index + 1}`) : req;
      const reqDescription = typeof req === 'object' ? req.description : req;
      
      wireframes.push({
        id: `WF-${index + 1}`,
        title: `Wireframe for ${reqTitle}`,
        description: `Visual layout for ${reqDescription} functionality`,
        components: this.determineWireframeComponents(req),
        interactions: this.determineWireframeInteractions(req),
        priority: typeof req === 'object' ? req.priority || 'medium' : 'medium',
        responsiveBreakpoints: ['mobile', 'tablet', 'desktop'],
        accessibility: ['keyboard-navigation', 'screen-reader-friendly', 'high-contrast']
      });
    });

    // Add wireframes from user stories if not covered
    userStories.slice(0, 3).forEach((story, index) => {
      const storyTitle = typeof story === 'object' ? story.story || story.title : story;
      
      if (!wireframes.some(wf => wf.title.toLowerCase().includes(storyTitle.toLowerCase().substring(0, 20)))) {
        wireframes.push({
          id: `WF-US-${index + 1}`,
          title: `User Story Wireframe: ${storyTitle.substring(0, 50)}...`,
          description: `Interface design for user story: ${storyTitle}`,
          components: ['User Interface', 'Action Controls', 'Feedback Area'],
          interactions: ['User Input', 'System Response', 'Navigation'],
          priority: typeof story === 'object' ? story.priority || 'medium' : 'medium',
          responsiveBreakpoints: ['mobile', 'tablet', 'desktop'],
          accessibility: ['keyboard-navigation', 'screen-reader-friendly']
        });
      }
    });

    return wireframes;
  }

  /**
   * Generate user flows from user stories and feature specifications
   * @param {array} userStories - User stories
   * @param {array} featureSpecs - Feature specifications
   * @returns {array} Generated user flows
   */
  generateUserFlows(userStories, featureSpecs) {
    const userFlows = [];
    
    userStories.slice(0, 4).forEach((story, index) => {
      const storyContent = typeof story === 'object' ? story.story || story.title : story;
      const persona = typeof story === 'object' ? story.persona || 'User' : 'User';
      
      userFlows.push({
        id: `UF-${index + 1}`,
        title: `User Flow for ${persona}: ${storyContent.substring(0, 40)}...`,
        persona: persona,
        trigger: this.extractTrigger(storyContent),
        steps: this.generateFlowSteps(storyContent, story),
        decision_points: this.generateDecisionPoints(storyContent),
        exit_points: this.generateExitPoints(storyContent),
        error_handling: this.generateErrorHandling(storyContent),
        success_criteria: typeof story === 'object' ? story.acceptanceCriteria || ['Task completed successfully'] : ['Task completed successfully']
      });
    });

    return userFlows;
  }

  /**
   * Generate component specifications from requirements and features
   * @param {array} functionalReqs - Functional requirements
   * @param {array} featureSpecs - Feature specifications
   * @returns {array} Generated component specifications
   */
  generateComponentSpecs(functionalReqs, featureSpecs) {
    const componentSpecs = [];
    const componentMap = new Map();

    // Generate components from functional requirements
    functionalReqs.slice(0, 6).forEach((req, index) => {
      const reqTitle = typeof req === 'object' ? (req.title || req.name || `Requirement ${index + 1}`) : req;
      const componentName = this.generateComponentName(reqTitle);
      
      if (!componentMap.has(componentName)) {
        componentMap.set(componentName, {
          id: `CS-${componentSpecs.length + 1}`,
          name: componentName,
          description: `Component for ${reqTitle} functionality`,
          type: this.determineComponentType(req),
          props: this.generateComponentProps(req),
          state: this.generateComponentState(req),
          methods: this.generateComponentMethods(req),
          styling: this.generateComponentStyling(req),
          accessibility: this.generateAccessibilityFeatures(req),
          priority: typeof req === 'object' ? req.priority || 'medium' : 'medium',
          dependencies: [],
          testingRequirements: this.generateTestingRequirements(req)
        });
        componentSpecs.push(componentMap.get(componentName));
      }
    });

    return componentSpecs;
  }

  /**
   * Generate design system specifications
   * @param {array} componentSpecs - Component specifications
   * @returns {object} Design system specification
   */
  generateDesignSystem(componentSpecs) {
    return {
      colorPalette: {
        primary: ['#007bff', '#0056b3', '#004085'],
        secondary: ['#6c757d', '#545b62', '#3d4449'],
        success: ['#28a745', '#1e7e34', '#155724'],
        warning: ['#ffc107', '#d39e00', '#b08800'],
        error: ['#dc3545', '#bd2130', '#a71e2a'],
        neutral: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da']
      },
      typography: {
        fontFamily: {
          primary: 'Inter, system-ui, sans-serif',
          monospace: 'Monaco, Consolas, monospace'
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      },
      components: componentSpecs.map(spec => ({
        name: spec.name,
        variants: this.generateComponentVariants(spec),
        states: spec.state || []
      }))
    };
  }

  // Helper methods for component generation
  determineWireframeComponents(req) {
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;
    const components = ['Header', 'Navigation'];
    
    if (reqText.toLowerCase().includes('form') || reqText.toLowerCase().includes('input')) {
      components.push('Form', 'Input Fields', 'Submit Button');
    }
    if (reqText.toLowerCase().includes('list') || reqText.toLowerCase().includes('table')) {
      components.push('Data Table', 'Pagination');
    }
    if (reqText.toLowerCase().includes('auth') || reqText.toLowerCase().includes('login')) {
      components.push('Login Form', 'Authentication');
    }
    
    components.push('Content Area', 'Footer');
    return components;
  }

  determineWireframeInteractions(req) {
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;
    const interactions = ['Click', 'Navigation'];
    
    if (reqText.toLowerCase().includes('form')) {
      interactions.push('Form Submit', 'Input Validation');
    }
    if (reqText.toLowerCase().includes('search')) {
      interactions.push('Search', 'Filter');
    }
    if (reqText.toLowerCase().includes('drag') || reqText.toLowerCase().includes('drop')) {
      interactions.push('Drag and Drop');
    }
    
    return interactions;
  }

  extractTrigger(storyContent) {
    if (storyContent.toLowerCase().includes('login') || storyContent.toLowerCase().includes('sign in')) {
      return 'User needs to authenticate';
    }
    if (storyContent.toLowerCase().includes('create') || storyContent.toLowerCase().includes('add')) {
      return 'User wants to create new content';
    }
    if (storyContent.toLowerCase().includes('view') || storyContent.toLowerCase().includes('see')) {
      return 'User wants to view information';
    }
    return 'User initiates action';
  }

  generateFlowSteps(storyContent, story) {
    const steps = ['User enters system'];
    
    if (storyContent.toLowerCase().includes('login')) {
      steps.push('User provides credentials', 'System validates credentials');
    }
    if (storyContent.toLowerCase().includes('form')) {
      steps.push('User fills out form', 'User submits form');
    }
    if (storyContent.toLowerCase().includes('search')) {
      steps.push('User enters search criteria', 'System returns results');
    }
    
    steps.push('User completes action', 'System provides feedback');
    return steps;
  }

  generateDecisionPoints(storyContent) {
    const decisions = [];
    
    if (storyContent.toLowerCase().includes('auth') || storyContent.toLowerCase().includes('login')) {
      decisions.push('Valid credentials?', 'User authorized?');
    }
    if (storyContent.toLowerCase().includes('form')) {
      decisions.push('Valid input?', 'Required fields completed?');
    }
    
    decisions.push('Action successful?');
    return decisions;
  }

  generateExitPoints(storyContent) {
    return ['Success', 'Error', 'Cancel', 'Timeout'];
  }

  generateErrorHandling(storyContent) {
    return [
      'Display error message',
      'Provide recovery options',
      'Log error for debugging',
      'Graceful degradation'
    ];
  }

  generateComponentName(reqTitle) {
    return reqTitle
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('') + 'Component';
  }

  determineComponentType(req) {
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;

    if (reqText.toLowerCase().includes('form')) return 'form';
    if (reqText.toLowerCase().includes('button')) return 'interactive';
    if (reqText.toLowerCase().includes('display') || reqText.toLowerCase().includes('show')) return 'display';
    if (reqText.toLowerCase().includes('input')) return 'input';
    if (reqText.toLowerCase().includes('navigation')) return 'navigation';

    return 'functional';
  }

  generateComponentProps(req) {
    const baseProps = ['className', 'id'];
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;

    if (reqText.toLowerCase().includes('data')) {
      baseProps.push('data', 'loading', 'error');
    }
    if (reqText.toLowerCase().includes('action') || reqText.toLowerCase().includes('click')) {
      baseProps.push('onClick', 'onAction');
    }
    if (reqText.toLowerCase().includes('form')) {
      baseProps.push('onSubmit', 'validation', 'initialValues');
    }

    return baseProps;
  }

  generateComponentState(req) {
    const baseState = ['isLoading'];
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;

    if (reqText.toLowerCase().includes('form')) {
      baseState.push('formData', 'errors', 'isValid');
    }
    if (reqText.toLowerCase().includes('active') || reqText.toLowerCase().includes('select')) {
      baseState.push('isActive', 'isSelected');
    }
    if (reqText.toLowerCase().includes('error')) {
      baseState.push('hasError', 'errorMessage');
    }

    return baseState;
  }

  generateComponentMethods(req) {
    const baseMethods = ['render'];
    const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;

    if (reqText.toLowerCase().includes('form')) {
      baseMethods.push('handleSubmit', 'validateInput', 'resetForm');
    }
    if (reqText.toLowerCase().includes('action')) {
      baseMethods.push('handleAction', 'executeAction');
    }
    if (reqText.toLowerCase().includes('data')) {
      baseMethods.push('fetchData', 'updateData');
    }

    return baseMethods;
  }

  generateComponentStyling(req) {
    return {
      layout: 'flexbox',
      responsive: true,
      theme: 'system',
      customizable: true
    };
  }

  generateAccessibilityFeatures(req) {
    return [
      'ARIA labels',
      'Keyboard navigation',
      'Screen reader support',
      'High contrast mode',
      'Focus management'
    ];
  }

  generateTestingRequirements(req) {
    return [
      'Unit tests for all methods',
      'Integration tests for user interactions',
      'Accessibility testing',
      'Visual regression testing'
    ];
  }

  generateComponentVariants(spec) {
    const variants = ['default'];

    if (spec.type === 'interactive') {
      variants.push('primary', 'secondary', 'outline');
    }
    if (spec.type === 'display') {
      variants.push('compact', 'detailed');
    }
    if (spec.type === 'form') {
      variants.push('inline', 'stacked');
    }

    return variants;
  }

  determineFrontendNeeds(functionalReqs) {
    // Analyze requirements to suggest frontend framework
    const hasComplexUI = functionalReqs.some(req => {
      const reqText = typeof req === 'object' ? (req.description || req.title || '') : req;
      return reqText.toLowerCase().includes('interactive') ||
             reqText.toLowerCase().includes('dynamic') ||
             reqText.toLowerCase().includes('real-time');
    });

    return hasComplexUI ? 'react' : 'vanilla';
  }

  determineUIFrameworkNeeds(componentSpecs) {
    // Determine if a UI framework is needed based on component complexity
    const complexComponents = componentSpecs.filter(spec =>
      spec.type === 'interactive' || spec.dependencies.length > 0
    );

    return complexComponents.length > 3 ? 'material-ui' : 'custom';
  }
}
