/**
 * Design to Architecture Transformer
 * Transforms design specifications into technical architecture
 */

import { BaseTransformer } from './base-transformer.js';

export class DesignToArchitectureTransformer extends BaseTransformer {
  /**
   * Transform design specifications into technical architecture
   * @param {object} analysis - Deliverable analysis from design phase
   * @param {string} targetPhase - Target phase for transformation (architecture)
   * @returns {object} Architecture transformation result
   */
  async transform(analysis, targetPhase) {
    try {
      const insights = this.extractCommonInsights(analysis);
      
      // Extract design insights with fallback handling
      const wireframes = analysis.insights.wireframes || {};
      const userFlows = analysis.insights.user_flows || {};
      const componentSpecs = analysis.insights.component_specifications || {};
      const designSystem = analysis.insights.design_system || {};
      
      // Transform into architecture specifications
      const systemDesign = this.generateSystemDesign(wireframes, componentSpecs, designSystem);
      const databaseSchema = this.generateDatabaseSchema(insights.requirements, componentSpecs);
      const apiSpecs = this.generateAPISpecs(userFlows, componentSpecs);
      const securityArchitecture = this.generateSecurityArchitecture(userFlows, systemDesign);
      const scalabilityPlan = this.generateScalabilityPlan(systemDesign, insights);
      
      const transformation = {
        type: 'design_to_architecture',
        insights,
        systemDesign,
        databaseSchema,
        apiSpecs,
        securityArchitecture,
        scalabilityPlan,
        techStack: this.generateTechStack({
          scalability: this.determineScalabilityNeeds(insights),
          security: this.determineSecurityNeeds(userFlows),
          performance: this.determinePerformanceNeeds(componentSpecs)
        }),
        decisions: this.generateDecisions(analysis, { systemDesign, databaseSchema, apiSpecs }),
        recommendations: this.generateRecommendations(analysis, targetPhase),
        transformedAt: new Date().toISOString()
      };

      return this.validateOutput(transformation);

    } catch (error) {
      console.error(`Design to Architecture transformation failed: ${error.message}`);
      throw new Error(`Transformation failed: ${error.message}`);
    }
  }

  /**
   * Generate system design based on wireframes and components
   * @param {object} wireframes - Wireframe specifications
   * @param {object} componentSpecs - Component specifications
   * @param {object} designSystem - Design system specifications
   * @returns {object} System design architecture
   */
  generateSystemDesign(wireframes, componentSpecs, designSystem) {
    const architecture = this.determineArchitecturePattern(componentSpecs);
    const frontendFramework = this.selectFrontendFramework(componentSpecs, designSystem);
    const backendFramework = this.selectBackendFramework(componentSpecs);
    
    return {
      architecture: architecture,
      patterns: this.generateArchitecturalPatterns(architecture),
      frontend: {
        framework: frontendFramework,
        components: this.mapComponentsToArchitecture(componentSpecs),
        stateManagement: this.selectStateManagement(componentSpecs),
        routing: this.generateRoutingStrategy(wireframes),
        styling: this.generateStylingStrategy(designSystem)
      },
      backend: {
        framework: backendFramework,
        services: this.generateBackendServices(componentSpecs),
        middleware: this.generateMiddleware(componentSpecs),
        authentication: this.generateAuthenticationStrategy(),
        dataLayer: this.generateDataLayerStrategy()
      },
      infrastructure: {
        hosting: this.selectHostingStrategy(),
        cdn: this.selectCDNStrategy(designSystem),
        monitoring: this.generateMonitoringStrategy(),
        logging: this.generateLoggingStrategy(),
        caching: this.generateCachingStrategy(componentSpecs)
      },
      integration: {
        apis: this.generateAPIIntegrationStrategy(),
        thirdParty: this.identifyThirdPartyIntegrations(componentSpecs),
        webhooks: this.generateWebhookStrategy()
      }
    };
  }

  /**
   * Generate database schema based on requirements and components
   * @param {array} requirements - System requirements
   * @param {object} componentSpecs - Component specifications
   * @returns {object} Database schema design
   */
  generateDatabaseSchema(requirements, componentSpecs) {
    const entities = this.extractEntitiesFromComponents(componentSpecs);
    const relationships = this.generateEntityRelationships(entities, componentSpecs);
    
    return {
      type: this.selectDatabaseType(entities, requirements),
      entities: entities.map(entity => ({
        name: entity.name,
        fields: this.generateEntityFields(entity, componentSpecs),
        indexes: this.generateEntityIndexes(entity, componentSpecs),
        constraints: this.generateEntityConstraints(entity),
        triggers: this.generateEntityTriggers(entity)
      })),
      relationships: relationships,
      migrations: this.generateMigrationStrategy(entities),
      backup: this.generateBackupStrategy(),
      performance: {
        indexing: this.generateIndexingStrategy(entities),
        partitioning: this.generatePartitioningStrategy(entities),
        caching: this.generateDatabaseCachingStrategy()
      }
    };
  }

  /**
   * Generate API specifications based on user flows and components
   * @param {object} userFlows - User flow specifications
   * @param {object} componentSpecs - Component specifications
   * @returns {object} API specification
   */
  generateAPISpecs(userFlows, componentSpecs) {
    const endpoints = this.generateEndpointsFromFlows(userFlows, componentSpecs);
    
    return {
      version: 'v1',
      baseUrl: '/api/v1',
      authentication: this.generateAPIAuthentication(),
      endpoints: endpoints,
      documentation: {
        format: 'OpenAPI 3.0',
        interactive: true,
        examples: true
      },
      versioning: {
        strategy: 'URL versioning',
        deprecation: 'Gradual with notices'
      },
      rateLimit: this.generateRateLimitingStrategy(),
      cors: this.generateCORSStrategy(),
      validation: {
        input: 'JSON Schema validation',
        output: 'Response schema validation'
      },
      errorHandling: this.generateAPIErrorHandling(),
      testing: {
        unit: 'Jest with supertest',
        integration: 'API integration tests',
        contract: 'Pact testing'
      }
    };
  }

  /**
   * Generate security architecture
   * @param {object} userFlows - User flow specifications
   * @param {object} systemDesign - System design specifications
   * @returns {object} Security architecture
   */
  generateSecurityArchitecture(userFlows, systemDesign) {
    return {
      authentication: {
        strategy: 'JWT with refresh tokens',
        providers: ['local', 'oauth2'],
        mfa: this.requiresMFA(userFlows),
        sessionManagement: 'Stateless JWT'
      },
      authorization: {
        model: 'RBAC (Role-Based Access Control)',
        permissions: this.generatePermissions(userFlows),
        policies: this.generateSecurityPolicies()
      },
      dataProtection: {
        encryption: {
          atRest: 'AES-256',
          inTransit: 'TLS 1.3',
          keys: 'Key management service'
        },
        privacy: this.generatePrivacyControls(),
        compliance: this.identifyComplianceRequirements()
      },
      networkSecurity: {
        firewall: 'Application-level firewall',
        ddos: 'DDoS protection',
        monitoring: 'Real-time threat detection'
      },
      vulnerabilities: {
        scanning: 'Automated vulnerability scanning',
        dependencies: 'Dependency vulnerability checks',
        code: 'Static code analysis'
      }
    };
  }

  /**
   * Generate scalability plan
   * @param {object} systemDesign - System design specifications
   * @param {object} insights - System insights
   * @returns {object} Scalability plan
   */
  generateScalabilityPlan(systemDesign, insights) {
    return {
      horizontal: {
        loadBalancing: 'Application load balancer',
        autoScaling: 'Container-based auto-scaling',
        clustering: 'Multi-instance clustering'
      },
      vertical: {
        resourceMonitoring: 'CPU, memory, disk monitoring',
        alerting: 'Resource threshold alerts',
        optimization: 'Performance profiling'
      },
      database: {
        readReplicas: 'Read replica scaling',
        sharding: this.requiresSharding(insights),
        caching: 'Multi-level caching strategy'
      },
      cdn: {
        static: 'Static asset CDN',
        dynamic: 'Dynamic content caching',
        geographic: 'Geographic distribution'
      },
      monitoring: {
        performance: 'Application performance monitoring',
        capacity: 'Capacity planning metrics',
        prediction: 'Predictive scaling'
      }
    };
  }

  // Helper methods for architecture generation
  determineArchitecturePattern(componentSpecs) {
    const componentCount = Array.isArray(componentSpecs) ? componentSpecs.length : Object.keys(componentSpecs).length;
    const hasComplexInteractions = this.hasComplexComponentInteractions(componentSpecs);
    
    if (componentCount > 20 || hasComplexInteractions) {
      return 'Microservices';
    } else if (componentCount > 10) {
      return 'Modular Monolith';
    } else {
      return 'Monolithic';
    }
  }

  selectFrontendFramework(componentSpecs, designSystem) {
    const hasComplexState = this.hasComplexStateManagement(componentSpecs);
    const hasDesignSystem = designSystem && Object.keys(designSystem).length > 0;
    
    if (hasComplexState && hasDesignSystem) {
      return this.projectConfig.defaultTechStack.frontend || 'React';
    } else if (hasComplexState) {
      return 'Vue.js';
    } else {
      return 'Vanilla JavaScript';
    }
  }

  selectBackendFramework(componentSpecs) {
    const requiresRealtime = this.requiresRealtimeFeatures(componentSpecs);
    const requiresHighPerformance = this.requiresHighPerformance(componentSpecs);
    
    if (requiresRealtime) {
      return 'Node.js/Express with Socket.io';
    } else if (requiresHighPerformance) {
      return 'Go/Gin';
    } else {
      return this.projectConfig.defaultTechStack.backend || 'Node.js/Express';
    }
  }

  generateArchitecturalPatterns(architecture) {
    const patterns = ['MVC (Model-View-Controller)'];
    
    if (architecture === 'Microservices') {
      patterns.push('API Gateway', 'Service Discovery', 'Circuit Breaker');
    }
    if (architecture === 'Modular Monolith') {
      patterns.push('Domain-Driven Design', 'Hexagonal Architecture');
    }
    
    patterns.push('Repository Pattern', 'Dependency Injection');
    return patterns;
  }

  mapComponentsToArchitecture(componentSpecs) {
    if (!Array.isArray(componentSpecs)) {
      componentSpecs = Object.values(componentSpecs);
    }
    
    return componentSpecs.slice(0, 8).map(spec => ({
      name: spec.name || 'UnnamedComponent',
      type: spec.type || 'functional',
      layer: this.determineComponentLayer(spec),
      dependencies: spec.dependencies || [],
      interfaces: this.generateComponentInterfaces(spec)
    }));
  }

  selectStateManagement(componentSpecs) {
    const hasGlobalState = this.requiresGlobalState(componentSpecs);
    const complexity = this.assessStateComplexity(componentSpecs);
    
    if (hasGlobalState && complexity === 'high') {
      return 'Redux Toolkit';
    } else if (hasGlobalState) {
      return 'Context API';
    } else {
      return 'Local State';
    }
  }

  generateRoutingStrategy(wireframes) {
    const routes = [];
    
    if (Array.isArray(wireframes)) {
      wireframes.forEach(wireframe => {
        routes.push({
          path: this.generateRoutePath(wireframe.title),
          component: wireframe.title.replace(/\s+/g, ''),
          protected: this.requiresAuthentication(wireframe)
        });
      });
    }
    
    return {
      type: 'Client-side routing',
      library: 'React Router',
      routes: routes,
      guards: ['Authentication guard', 'Authorization guard'],
      lazy: 'Code splitting for routes'
    };
  }

  generateStylingStrategy(designSystem) {
    if (designSystem && designSystem.components) {
      return {
        approach: 'Design System + CSS-in-JS',
        library: 'Styled Components',
        tokens: 'Design tokens',
        responsive: 'Mobile-first responsive design'
      };
    } else {
      return {
        approach: 'CSS Modules',
        preprocessor: 'SCSS',
        responsive: 'CSS Grid + Flexbox'
      };
    }
  }

  generateBackendServices(componentSpecs) {
    const services = ['AuthService', 'DataService'];

    if (this.requiresNotifications(componentSpecs)) {
      services.push('NotificationService');
    }
    if (this.requiresFileHandling(componentSpecs)) {
      services.push('FileService');
    }
    if (this.requiresEmailService(componentSpecs)) {
      services.push('EmailService');
    }

    return services;
  }

  generateMiddleware(componentSpecs) {
    return [
      'CORS middleware',
      'Rate limiting',
      'Request logging',
      'Error handling',
      'Authentication middleware',
      'Validation middleware'
    ];
  }

  generateAuthenticationStrategy() {
    return {
      primary: 'JWT tokens',
      refresh: 'Refresh token rotation',
      storage: 'HTTP-only cookies',
      expiration: '15 minutes access, 7 days refresh'
    };
  }

  generateDataLayerStrategy() {
    return {
      orm: 'Prisma ORM',
      migrations: 'Automated migrations',
      seeding: 'Database seeding',
      transactions: 'ACID transactions'
    };
  }

  selectHostingStrategy() {
    return this.projectConfig.defaultTechStack.deployment || 'Vercel';
  }

  selectCDNStrategy(designSystem) {
    return designSystem && designSystem.components ? 'CloudFlare CDN' : 'Basic CDN';
  }

  generateMonitoringStrategy() {
    return {
      apm: 'Application Performance Monitoring',
      logs: 'Centralized logging',
      metrics: 'Custom metrics',
      alerts: 'Threshold-based alerts'
    };
  }

  generateLoggingStrategy() {
    return {
      levels: ['error', 'warn', 'info', 'debug'],
      format: 'Structured JSON logging',
      rotation: 'Daily log rotation',
      retention: '30 days'
    };
  }

  generateCachingStrategy(componentSpecs) {
    return {
      browser: 'Browser caching headers',
      application: 'Redis caching',
      database: 'Query result caching',
      cdn: 'Static asset caching'
    };
  }

  generateAPIIntegrationStrategy() {
    return {
      format: 'RESTful APIs',
      documentation: 'OpenAPI/Swagger',
      testing: 'API contract testing',
      monitoring: 'API health checks'
    };
  }

  identifyThirdPartyIntegrations(componentSpecs) {
    const integrations = [];

    if (this.requiresPayments(componentSpecs)) {
      integrations.push('Stripe API');
    }
    if (this.requiresAnalytics(componentSpecs)) {
      integrations.push('Google Analytics');
    }
    if (this.requiresEmailService(componentSpecs)) {
      integrations.push('SendGrid API');
    }

    return integrations;
  }

  generateWebhookStrategy() {
    return {
      security: 'HMAC signature verification',
      retry: 'Exponential backoff retry',
      logging: 'Webhook event logging',
      processing: 'Asynchronous processing'
    };
  }

  extractEntitiesFromComponents(componentSpecs) {
    const entities = new Set(['User', 'Session']);

    if (Array.isArray(componentSpecs)) {
      componentSpecs.forEach(spec => {
        if (spec.name && spec.name.includes('Data')) {
          entities.add('Data');
        }
        if (spec.name && spec.name.includes('Profile')) {
          entities.add('Profile');
        }
        if (spec.name && spec.name.includes('Settings')) {
          entities.add('Settings');
        }
      });
    }

    return Array.from(entities).map(name => ({ name, type: 'entity' }));
  }

  generateEntityRelationships(entities, componentSpecs) {
    const relationships = [];

    entities.forEach(entity => {
      if (entity.name === 'User') {
        relationships.push({ from: 'User', to: 'Session', type: 'one-to-many' });
        relationships.push({ from: 'User', to: 'Profile', type: 'one-to-one' });
      }
    });

    return relationships;
  }

  selectDatabaseType(entities, requirements) {
    const hasComplexRelations = entities.length > 5;
    const requiresACID = this.requiresACIDTransactions(requirements);

    if (hasComplexRelations && requiresACID) {
      return 'PostgreSQL';
    } else if (hasComplexRelations) {
      return 'MySQL';
    } else {
      return 'SQLite';
    }
  }

  generateEntityFields(entity, componentSpecs) {
    const baseFields = ['id', 'created_at', 'updated_at'];

    switch (entity.name.toLowerCase()) {
      case 'user':
        return [...baseFields, 'email', 'password_hash', 'first_name', 'last_name', 'is_active'];
      case 'session':
        return [...baseFields, 'user_id', 'token_hash', 'expires_at', 'ip_address'];
      case 'profile':
        return [...baseFields, 'user_id', 'bio', 'avatar_url', 'preferences'];
      default:
        return [...baseFields, `${entity.name.toLowerCase()}_data`];
    }
  }

  generateEntityIndexes(entity, componentSpecs) {
    const indexes = ['PRIMARY KEY (id)'];

    switch (entity.name.toLowerCase()) {
      case 'user':
        indexes.push('UNIQUE INDEX (email)', 'INDEX (is_active)');
        break;
      case 'session':
        indexes.push('INDEX (user_id)', 'INDEX (expires_at)');
        break;
      case 'profile':
        indexes.push('UNIQUE INDEX (user_id)');
        break;
    }

    return indexes;
  }

  generateEntityConstraints(entity) {
    const constraints = [];

    switch (entity.name.toLowerCase()) {
      case 'user':
        constraints.push('CHECK (email LIKE "%@%")', 'CHECK (LENGTH(password_hash) >= 60)');
        break;
      case 'session':
        constraints.push('FOREIGN KEY (user_id) REFERENCES users(id)');
        break;
      case 'profile':
        constraints.push('FOREIGN KEY (user_id) REFERENCES users(id)');
        break;
    }

    return constraints;
  }

  generateEntityTriggers(entity) {
    return [
      `UPDATE ${entity.name.toLowerCase()}_updated_at BEFORE UPDATE`,
      `LOG_${entity.name.toUpperCase()}_CHANGES AFTER UPDATE`
    ];
  }

  generateMigrationStrategy(entities) {
    return {
      tool: 'Database migration tool',
      versioning: 'Sequential versioning',
      rollback: 'Automatic rollback on failure',
      testing: 'Migration testing in staging'
    };
  }

  generateBackupStrategy() {
    return {
      frequency: 'Daily automated backups',
      retention: '30 days',
      testing: 'Monthly restore testing',
      encryption: 'Encrypted backups'
    };
  }

  generateIndexingStrategy(entities) {
    return {
      primary: 'B-tree indexes on primary keys',
      foreign: 'Indexes on foreign keys',
      search: 'Full-text search indexes',
      composite: 'Composite indexes for common queries'
    };
  }

  generatePartitioningStrategy(entities) {
    return {
      strategy: 'Date-based partitioning',
      tables: entities.filter(e => e.name.toLowerCase().includes('log')),
      maintenance: 'Automated partition maintenance'
    };
  }

  generateDatabaseCachingStrategy() {
    return {
      query: 'Query result caching',
      connection: 'Connection pooling',
      prepared: 'Prepared statement caching'
    };
  }

  // Additional helper methods for API and security generation
  generateEndpointsFromFlows(userFlows, componentSpecs) {
    const endpoints = [];
    const entities = ['user', 'data', 'session'];

    entities.forEach(entity => {
      ['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
        endpoints.push({
          path: `/api/v1/${entity}${method === 'GET' ? 's' : ''}`,
          method,
          description: `${method} operation for ${entity}`,
          authentication: method !== 'GET',
          validation: method === 'POST' || method === 'PUT',
          rateLimit: this.getEndpointRateLimit(method)
        });
      });
    });

    return endpoints;
  }

  generateAPIAuthentication() {
    return {
      type: 'Bearer Token (JWT)',
      header: 'Authorization',
      expiration: '15 minutes',
      refresh: 'Refresh token mechanism'
    };
  }

  generateRateLimitingStrategy() {
    return {
      global: '1000 requests per hour',
      authenticated: '5000 requests per hour',
      endpoints: {
        '/auth/login': '5 requests per minute',
        '/auth/register': '3 requests per minute'
      }
    };
  }

  generateCORSStrategy() {
    return {
      origins: ['http://localhost:3000', 'https://yourdomain.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    };
  }

  generateAPIErrorHandling() {
    return {
      format: 'RFC 7807 Problem Details',
      logging: 'Structured error logging',
      monitoring: 'Error rate monitoring',
      responses: {
        400: 'Bad Request - Invalid input',
        401: 'Unauthorized - Authentication required',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error - Server error'
      }
    };
  }

  requiresMFA(userFlows) {
    if (!Array.isArray(userFlows)) return false;
    return userFlows.some(flow =>
      flow.title && flow.title.toLowerCase().includes('admin') ||
      flow.persona && flow.persona.toLowerCase().includes('admin')
    );
  }

  generatePermissions(userFlows) {
    const permissions = ['read', 'write', 'delete'];

    if (this.hasAdminFlows(userFlows)) {
      permissions.push('admin', 'manage_users', 'system_config');
    }

    return permissions;
  }

  generateSecurityPolicies() {
    return [
      'Password complexity requirements',
      'Account lockout after failed attempts',
      'Session timeout policies',
      'Data access logging',
      'Regular security audits'
    ];
  }

  generatePrivacyControls() {
    return {
      dataMinimization: 'Collect only necessary data',
      retention: 'Automatic data deletion policies',
      consent: 'Explicit user consent',
      portability: 'Data export functionality',
      deletion: 'Right to be forgotten'
    };
  }

  identifyComplianceRequirements() {
    return ['GDPR compliance', 'Data encryption standards', 'Audit trail requirements'];
  }

  requiresSharding(insights) {
    return insights.requirements && insights.requirements.some(req =>
      typeof req === 'string' && req.toLowerCase().includes('scale') ||
      typeof req === 'object' && req.scalability === 'high'
    );
  }

  // Component analysis helper methods
  hasComplexComponentInteractions(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.dependencies && spec.dependencies.length > 2
    );
  }

  hasComplexStateManagement(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.state && spec.state.length > 3
    );
  }

  requiresRealtimeFeatures(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.description && spec.description.toLowerCase().includes('real-time')
    );
  }

  requiresHighPerformance(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.description && spec.description.toLowerCase().includes('performance')
    );
  }

  determineComponentLayer(spec) {
    if (spec.type === 'display') return 'presentation';
    if (spec.type === 'form' || spec.type === 'input') return 'interaction';
    if (spec.type === 'navigation') return 'routing';
    return 'business';
  }

  generateComponentInterfaces(spec) {
    return {
      props: spec.props || [],
      events: spec.methods ? spec.methods.filter(m => m.startsWith('on')) : [],
      slots: spec.type === 'layout' ? ['header', 'content', 'footer'] : []
    };
  }

  requiresGlobalState(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.length > 5 && componentSpecs.some(spec =>
      spec.state && spec.state.includes('shared')
    );
  }

  assessStateComplexity(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return 'low';
    const totalStateItems = componentSpecs.reduce((total, spec) =>
      total + (spec.state ? spec.state.length : 0), 0
    );

    if (totalStateItems > 20) return 'high';
    if (totalStateItems > 10) return 'medium';
    return 'low';
  }

  generateRoutePath(title) {
    return '/' + title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }

  requiresAuthentication(wireframe) {
    return wireframe.title && (
      wireframe.title.toLowerCase().includes('profile') ||
      wireframe.title.toLowerCase().includes('dashboard') ||
      wireframe.title.toLowerCase().includes('settings')
    );
  }

  // Feature detection helper methods
  requiresNotifications(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.name && spec.name.toLowerCase().includes('notification')
    );
  }

  requiresFileHandling(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.name && (spec.name.toLowerCase().includes('upload') ||
                   spec.name.toLowerCase().includes('file'))
    );
  }

  requiresEmailService(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.name && spec.name.toLowerCase().includes('email')
    );
  }

  requiresPayments(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.name && (spec.name.toLowerCase().includes('payment') ||
                   spec.name.toLowerCase().includes('checkout'))
    );
  }

  requiresAnalytics(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return false;
    return componentSpecs.some(spec =>
      spec.name && spec.name.toLowerCase().includes('analytics')
    );
  }

  requiresACIDTransactions(requirements) {
    if (!Array.isArray(requirements)) return false;
    return requirements.some(req =>
      typeof req === 'string' && req.toLowerCase().includes('transaction') ||
      typeof req === 'object' && req.consistency === 'strong'
    );
  }

  hasAdminFlows(userFlows) {
    if (!Array.isArray(userFlows)) return false;
    return userFlows.some(flow =>
      flow.persona && flow.persona.toLowerCase().includes('admin')
    );
  }

  getEndpointRateLimit(method) {
    const limits = {
      'GET': '100 per minute',
      'POST': '20 per minute',
      'PUT': '20 per minute',
      'DELETE': '10 per minute'
    };
    return limits[method] || '50 per minute';
  }

  // Scalability assessment methods
  determineScalabilityNeeds(insights) {
    if (insights.requirements && insights.requirements.some(req =>
      typeof req === 'string' && req.toLowerCase().includes('scale') ||
      typeof req === 'object' && req.scalability === 'high'
    )) {
      return 'high';
    }
    return 'medium';
  }

  determineSecurityNeeds(userFlows) {
    if (!Array.isArray(userFlows)) return 'medium';
    const hasAuthFlows = userFlows.some(flow =>
      flow.title && flow.title.toLowerCase().includes('auth')
    );
    return hasAuthFlows ? 'high' : 'medium';
  }

  determinePerformanceNeeds(componentSpecs) {
    if (!Array.isArray(componentSpecs)) return 'medium';
    return componentSpecs.length > 10 ? 'high' : 'medium';
  }
}
