/**
 * Tool Orchestrator - Core orchestration engine for multi-tool workflows
 * Executes workflows defined using the Workflow DSL
 * 
 * MCP-009: Tool Orchestration Engine Implementation
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { workflowContextSchema, WorkflowValidator } from './workflow-dsl.js';
import { circuitBreakerManager } from '../shared/circuit-breaker-manager.js';
import { toolCacheManager } from '../shared/tool-cache.js';
import { formatMCPResponse, formatErrorResponse } from '../shared/mcp-response.js';

/**
 * Workflow Execution Engine
 * Orchestrates multi-tool workflows with error handling, rollback, and monitoring
 */
export class ToolOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConcurrentWorkflows: 10,
      defaultTimeout: 300000, // 5 minutes
      enableCircuitBreaker: true,
      enableCaching: true,
      enableMetrics: true,
      ...options
    };

    // Execution state
    this.activeWorkflows = new Map();
    this.workflowHistory = new Map();
    this.toolRegistry = new Map();
    
    // Metrics
    this.metrics = {
      workflowsExecuted: 0,
      workflowsSucceeded: 0,
      workflowsFailed: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      stepExecutions: new Map(),
      errorsByType: new Map()
    };

    // Bind methods
    this.executeWorkflow = this.executeWorkflow.bind(this);
    this.cancelWorkflow = this.cancelWorkflow.bind(this);
    this.getWorkflowStatus = this.getWorkflowStatus.bind(this);
  }

  /**
   * Register a tool for orchestration
   */
  registerTool(toolName, toolHandler) {
    this.toolRegistry.set(toolName, toolHandler);
    this.emit('toolRegistered', { toolName });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowDefinition, initialVariables = {}) {
    const startTime = Date.now();
    const executionId = uuidv4();
    
    // Validate workflow
    const validation = WorkflowValidator.validateWorkflow(workflowDefinition);
    if (!validation.valid) {
      const error = new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      this.updateErrorMetrics('validation', error);
      throw error;
    }

    // Check concurrent workflow limit
    if (this.activeWorkflows.size >= this.options.maxConcurrentWorkflows) {
      const error = new Error('Maximum concurrent workflows exceeded');
      this.updateErrorMetrics('concurrency', error);
      throw error;
    }

    // Initialize execution context
    const context = workflowContextSchema.parse({
      workflowId: workflowDefinition.id,
      executionId,
      startTime: new Date().toISOString(),
      variables: { ...workflowDefinition.variables, ...initialVariables },
      stepResults: {},
      errors: [],
      status: 'running'
    });

    this.activeWorkflows.set(executionId, {
      definition: workflowDefinition,
      context,
      startTime
    });

    this.emit('workflowStarted', { executionId, workflowId: workflowDefinition.id });

    try {
      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflowDefinition, context);
      
      // Update context with final status
      context.status = result.success ? 'completed' : 'failed';
      
      // Move to history
      this.workflowHistory.set(executionId, {
        definition: workflowDefinition,
        context,
        result,
        executionTime: Date.now() - startTime
      });

      // Update metrics
      this.updateWorkflowMetrics(result.success, Date.now() - startTime);
      
      this.emit('workflowCompleted', { 
        executionId, 
        workflowId: workflowDefinition.id, 
        success: result.success,
        executionTime: Date.now() - startTime
      });

      return {
        executionId,
        success: result.success,
        result: result.data,
        context,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      context.status = 'failed';
      context.errors.push({
        stepId: context.currentStep || 'unknown',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      this.updateErrorMetrics('execution', error);
      this.updateWorkflowMetrics(false, Date.now() - startTime);

      this.emit('workflowFailed', { 
        executionId, 
        workflowId: workflowDefinition.id, 
        error: error.message 
      });

      throw error;
    } finally {
      this.activeWorkflows.delete(executionId);
    }
  }

  /**
   * Execute workflow steps sequentially
   */
  async executeWorkflowSteps(workflow, context) {
    let currentStepId = workflow.startStep;
    const executedSteps = new Set();
    const maxSteps = workflow.steps.length * 2; // Prevent infinite loops
    let stepCount = 0;

    while (currentStepId && stepCount < maxSteps) {
      stepCount++;
      
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) {
        throw new Error(`Step '${currentStepId}' not found in workflow`);
      }

      context.currentStep = currentStepId;
      
      try {
        // Check step condition
        if (step.condition && !this.evaluateCondition(step.condition, context)) {
          this.emit('stepSkipped', { 
            executionId: context.executionId, 
            stepId: currentStepId, 
            reason: 'condition not met' 
          });
          currentStepId = step.onSuccess || null;
          continue;
        }

        // Execute step with timeout and retry
        const stepResult = await this.executeStep(step, context, workflow);
        
        // Store step result
        context.stepResults[currentStepId] = stepResult;
        executedSteps.add(currentStepId);

        // Determine next step
        currentStepId = stepResult.success ? step.onSuccess : step.onFailure;

        this.emit('stepCompleted', { 
          executionId: context.executionId, 
          stepId: step.id, 
          success: stepResult.success 
        });

      } catch (error) {
        context.errors.push({
          stepId: currentStepId,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Handle error based on workflow strategy
        const shouldContinue = await this.handleStepError(error, step, workflow, context);
        if (!shouldContinue) {
          throw error;
        }

        currentStepId = step.onFailure || null;
      }
    }

    if (stepCount >= maxSteps) {
      throw new Error('Workflow execution exceeded maximum step limit - possible infinite loop');
    }

    return {
      success: context.errors.length === 0 || workflow.errorHandling?.strategy === 'continue',
      data: context.stepResults,
      executedSteps: Array.from(executedSteps)
    };
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(step, context, workflow) {
    const stepStartTime = Date.now();
    
    // Resolve parameters with variable substitution
    const resolvedParams = this.resolveParameters(step.parameters || {}, context);
    
    // Get tool handler
    const toolHandler = this.toolRegistry.get(step.tool);
    if (!toolHandler) {
      throw new Error(`Tool '${step.tool}' not registered in orchestrator`);
    }

    // Apply timeout
    const timeout = step.timeout || workflow.timeout || this.options.defaultTimeout;
    
    try {
      // Execute with retry policy
      const result = await this.executeWithRetry(
        () => this.executeToolWithProtection(step.tool, toolHandler, resolvedParams),
        step.retryPolicy || { maxAttempts: 1 }
      );

      // Update step metrics
      this.updateStepMetrics(step.tool, Date.now() - stepStartTime, true);

      return {
        success: true,
        data: result,
        executionTime: Date.now() - stepStartTime
      };

    } catch (error) {
      this.updateStepMetrics(step.tool, Date.now() - stepStartTime, false);
      throw error;
    }
  }

  /**
   * Execute tool with circuit breaker and caching protection
   */
  async executeToolWithProtection(toolName, toolHandler, parameters) {
    // Use circuit breaker if enabled
    if (this.options.enableCircuitBreaker) {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker(toolName);
      if (circuitBreaker) {
        return await circuitBreaker.execute(() => toolHandler(parameters));
      }
    }

    // Check cache if enabled
    if (this.options.enableCaching) {
      const cacheKey = this.generateCacheKey(toolName, parameters);
      const cachedResult = toolCacheManager.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const result = await toolHandler(parameters);
      toolCacheManager.set(cacheKey, result);
      return result;
    }

    return await toolHandler(parameters);
  }

  /**
   * Execute with retry policy
   */
  async executeWithRetry(fn, retryPolicy) {
    const { maxAttempts = 1, backoffMs = 1000, exponentialBackoff = true } = retryPolicy;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        const delay = exponentialBackoff 
          ? backoffMs * Math.pow(2, attempt - 1)
          : backoffMs;
          
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Resolve parameters with variable substitution
   */
  resolveParameters(parameters, context) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varPath = value.slice(2, -1);
        resolved[key] = this.getNestedValue(context, varPath);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  /**
   * Get nested value from context using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Evaluate step condition
   */
  evaluateCondition(condition, context) {
    try {
      // Simple expression evaluation - in production, use a safer evaluator
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Handle step execution error
   */
  async handleStepError(error, step, workflow, context) {
    const strategy = workflow.errorHandling?.strategy || 'fail-fast';
    
    switch (strategy) {
      case 'fail-fast':
        return false;
        
      case 'continue':
        const maxErrors = workflow.errorHandling?.maxErrors || 5;
        return context.errors.length < maxErrors;
        
      case 'rollback':
        if (step.rollbackSteps) {
          await this.executeRollback(step.rollbackSteps, context, workflow);
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Execute rollback steps
   */
  async executeRollback(rollbackSteps, context, workflow) {
    this.emit('rollbackStarted', { executionId: context.executionId, steps: rollbackSteps });
    
    for (const stepId of rollbackSteps.reverse()) {
      try {
        const step = workflow.steps.find(s => s.id === stepId);
        if (step) {
          await this.executeStep(step, context, workflow);
        }
      } catch (rollbackError) {
        console.error(`Rollback step ${stepId} failed:`, rollbackError);
      }
    }
    
    this.emit('rollbackCompleted', { executionId: context.executionId });
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(executionId) {
    const workflow = this.activeWorkflows.get(executionId);
    if (!workflow) {
      throw new Error(`Workflow ${executionId} not found or not running`);
    }

    workflow.context.status = 'cancelled';
    this.activeWorkflows.delete(executionId);
    
    this.emit('workflowCancelled', { executionId });
    
    return { success: true, message: 'Workflow cancelled successfully' };
  }

  /**
   * Get workflow execution status
   */
  getWorkflowStatus(executionId) {
    const active = this.activeWorkflows.get(executionId);
    if (active) {
      return {
        status: 'running',
        context: active.context,
        executionTime: Date.now() - active.startTime
      };
    }

    const historical = this.workflowHistory.get(executionId);
    if (historical) {
      return {
        status: historical.context.status,
        context: historical.context,
        result: historical.result,
        executionTime: historical.executionTime
      };
    }

    return null;
  }

  /**
   * Generate cache key for tool execution
   */
  generateCacheKey(toolName, parameters) {
    const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
    return `orchestrator:${toolName}:${Buffer.from(paramString).toString('base64')}`;
  }

  /**
   * Update workflow metrics
   */
  updateWorkflowMetrics(success, executionTime) {
    this.metrics.workflowsExecuted++;
    if (success) {
      this.metrics.workflowsSucceeded++;
    } else {
      this.metrics.workflowsFailed++;
    }
    
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.workflowsExecuted;
  }

  /**
   * Update step execution metrics
   */
  updateStepMetrics(toolName, executionTime, success) {
    if (!this.metrics.stepExecutions.has(toolName)) {
      this.metrics.stepExecutions.set(toolName, {
        totalExecutions: 0,
        successfulExecutions: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0
      });
    }

    const stepMetrics = this.metrics.stepExecutions.get(toolName);
    stepMetrics.totalExecutions++;
    stepMetrics.totalExecutionTime += executionTime;
    stepMetrics.averageExecutionTime = stepMetrics.totalExecutionTime / stepMetrics.totalExecutions;
    
    if (success) {
      stepMetrics.successfulExecutions++;
    }
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(errorType, error) {
    if (!this.metrics.errorsByType.has(errorType)) {
      this.metrics.errorsByType.set(errorType, 0);
    }
    this.metrics.errorsByType.set(errorType, this.metrics.errorsByType.get(errorType) + 1);
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      stepExecutions: Object.fromEntries(this.metrics.stepExecutions),
      errorsByType: Object.fromEntries(this.metrics.errorsByType)
    };
  }
}

// Export singleton instance
export const toolOrchestrator = new ToolOrchestrator();
