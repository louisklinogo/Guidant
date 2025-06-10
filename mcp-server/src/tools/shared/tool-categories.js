/**
 * Tool Categories System
 * Organizes MCP tools into logical categories for better management and lazy loading
 * 
 * MCP-004: Implement Tool Categories and Lazy Loading
 */

/**
 * Tool Category Definitions
 * ESSENTIAL: Core tools needed for basic workflow operation
 * ANALYSIS: Content and deliverable analysis tools
 * INTELLIGENCE: Smart workflow and project intelligence tools
 * ADMIN: Administrative and configuration tools
 */
export const TOOL_CATEGORIES = {
    ESSENTIAL: {
        id: 'essential',
        name: 'Essential',
        description: 'Core tools required for basic workflow operation',
        priority: 1,
        lazyLoad: false, // Always loaded
        tools: [
            'guidant_init_project',
            'guidant_get_current_task',
            'guidant_report_progress',
            'guidant_advance_phase',
            'guidant_save_deliverable'
        ]
    },
    ANALYSIS: {
        id: 'analysis',
        name: 'Analysis',
        description: 'Content analysis, insight extraction, and quality assessment',
        priority: 2,
        lazyLoad: true,
        tools: [
            'guidant_analyze_deliverable',
            'guidant_analyze_phase',
            'guidant_extract_insights',
            'guidant_analyze_project_relationships',
            'guidant_get_deliverable_relationships',
            'guidant_analyze_change_impact',
            'guidant_validate_deliverable_quality'
        ]
    },
    INTELLIGENCE: {
        id: 'intelligence',
        name: 'Intelligence',
        description: 'Smart project classification and adaptive workflow generation',
        priority: 3,
        lazyLoad: true,
        tools: [
            'guidant_discover_agent',
            'guidant_list_agents',
            'guidant_analyze_gaps',
            'guidant_request_tools',
            'guidant_suggest_config',
            'guidant_classify_project',
            'guidant_manage_adaptive_workflow',
            'guidant_workflow_intelligence'
        ]
    },
    ADMIN: {
        id: 'admin',
        name: 'Administrative',
        description: 'System configuration, monitoring, and administrative tools',
        priority: 4,
        lazyLoad: true,
        tools: [
            'guidant_get_project_state', // Deprecated but still available
            'guidant_validate_content',
            'guidant_quality_management',
            'guidant_get_relationship_system_health'
        ]
    }
};

/**
 * Tool Category Manager
 * Manages tool categorization, lazy loading, and usage metrics
 */
export class ToolCategoryManager {
    constructor() {
        this.loadedCategories = new Set(['essential']); // Essential always loaded
        this.toolUsageMetrics = new Map();
        this.categoryUsageMetrics = new Map();
        this.toolToCategory = new Map();
        
        // Initialize tool-to-category mapping
        this.initializeToolMapping();
        
        // Initialize usage metrics
        this.initializeMetrics();
    }

    /**
     * Initialize tool-to-category mapping for fast lookups
     */
    initializeToolMapping() {
        Object.values(TOOL_CATEGORIES).forEach(category => {
            category.tools.forEach(toolName => {
                this.toolToCategory.set(toolName, category);
            });
        });
    }

    /**
     * Initialize usage metrics tracking
     */
    initializeMetrics() {
        Object.values(TOOL_CATEGORIES).forEach(category => {
            this.categoryUsageMetrics.set(category.id, {
                totalCalls: 0,
                totalExecutionTime: 0,
                errorCount: 0,
                lastUsed: null,
                averageExecutionTime: 0
            });
        });
    }

    /**
     * Get category for a specific tool
     * @param {string} toolName - Name of the tool
     * @returns {object|null} Category object or null if not found
     */
    getCategoryForTool(toolName) {
        return this.toolToCategory.get(toolName) || null;
    }

    /**
     * Check if a category should be lazy loaded
     * @param {string} categoryId - Category identifier
     * @returns {boolean} True if category should be lazy loaded
     */
    shouldLazyLoad(categoryId) {
        const category = TOOL_CATEGORIES[categoryId.toUpperCase()];
        return category ? category.lazyLoad : false;
    }

    /**
     * Check if a category is currently loaded
     * @param {string} categoryId - Category identifier
     * @returns {boolean} True if category is loaded
     */
    isCategoryLoaded(categoryId) {
        return this.loadedCategories.has(categoryId.toLowerCase());
    }

    /**
     * Mark a category as loaded
     * @param {string} categoryId - Category identifier
     */
    markCategoryLoaded(categoryId) {
        this.loadedCategories.add(categoryId.toLowerCase());
    }

    /**
     * Get tools by category
     * @param {string} categoryId - Category identifier
     * @returns {Array} Array of tool names in the category
     */
    getToolsByCategory(categoryId) {
        const category = TOOL_CATEGORIES[categoryId.toUpperCase()];
        return category ? [...category.tools] : [];
    }

    /**
     * Get all categories sorted by priority
     * @returns {Array} Array of category objects sorted by priority
     */
    getAllCategories() {
        return Object.values(TOOL_CATEGORIES).sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get categories that should be loaded immediately
     * @returns {Array} Array of non-lazy-loaded categories
     */
    getEssentialCategories() {
        return Object.values(TOOL_CATEGORIES).filter(cat => !cat.lazyLoad);
    }

    /**
     * Get categories that can be lazy loaded
     * @returns {Array} Array of lazy-loaded categories
     */
    getLazyLoadCategories() {
        return Object.values(TOOL_CATEGORIES).filter(cat => cat.lazyLoad);
    }

    /**
     * Record tool usage for metrics
     * @param {string} toolName - Name of the tool used
     * @param {number} executionTime - Execution time in milliseconds
     * @param {boolean} success - Whether the execution was successful
     */
    recordToolUsage(toolName, executionTime, success = true) {
        const category = this.getCategoryForTool(toolName);
        if (!category) return;

        // Update tool metrics
        if (!this.toolUsageMetrics.has(toolName)) {
            this.toolUsageMetrics.set(toolName, {
                totalCalls: 0,
                totalExecutionTime: 0,
                errorCount: 0,
                lastUsed: null,
                averageExecutionTime: 0
            });
        }

        const toolMetrics = this.toolUsageMetrics.get(toolName);
        toolMetrics.totalCalls++;
        toolMetrics.totalExecutionTime += executionTime;
        toolMetrics.lastUsed = new Date().toISOString();
        toolMetrics.averageExecutionTime = toolMetrics.totalExecutionTime / toolMetrics.totalCalls;
        
        if (!success) {
            toolMetrics.errorCount++;
        }

        // Update category metrics
        const categoryMetrics = this.categoryUsageMetrics.get(category.id);
        if (categoryMetrics) {
            categoryMetrics.totalCalls++;
            categoryMetrics.totalExecutionTime += executionTime;
            categoryMetrics.lastUsed = new Date().toISOString();
            categoryMetrics.averageExecutionTime = categoryMetrics.totalExecutionTime / categoryMetrics.totalCalls;
            
            if (!success) {
                categoryMetrics.errorCount++;
            }
        }
    }

    /**
     * Get usage metrics for a specific tool
     * @param {string} toolName - Name of the tool
     * @returns {object|null} Usage metrics or null if not found
     */
    getToolMetrics(toolName) {
        return this.toolUsageMetrics.get(toolName) || null;
    }

    /**
     * Get usage metrics for a specific category
     * @param {string} categoryId - Category identifier
     * @returns {object|null} Usage metrics or null if not found
     */
    getCategoryMetrics(categoryId) {
        return this.categoryUsageMetrics.get(categoryId) || null;
    }

    /**
     * Get comprehensive usage statistics
     * @returns {object} Complete usage statistics
     */
    getUsageStatistics() {
        const totalTools = this.toolUsageMetrics.size;
        const totalCalls = Array.from(this.toolUsageMetrics.values())
            .reduce((sum, metrics) => sum + metrics.totalCalls, 0);
        
        const mostUsedTools = Array.from(this.toolUsageMetrics.entries())
            .sort((a, b) => b[1].totalCalls - a[1].totalCalls)
            .slice(0, 5)
            .map(([name, metrics]) => ({ name, calls: metrics.totalCalls }));

        const categoryStats = Object.fromEntries(
            Array.from(this.categoryUsageMetrics.entries())
                .map(([id, metrics]) => [id, {
                    calls: metrics.totalCalls,
                    avgExecutionTime: Math.round(metrics.averageExecutionTime),
                    errorRate: metrics.totalCalls > 0 ? (metrics.errorCount / metrics.totalCalls) * 100 : 0
                }])
        );

        return {
            overview: {
                totalTools,
                totalCalls,
                loadedCategories: Array.from(this.loadedCategories)
            },
            mostUsedTools,
            categoryStats,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Reset all usage metrics
     */
    resetMetrics() {
        this.toolUsageMetrics.clear();
        this.initializeMetrics();
    }
}

// Export singleton instance
export const toolCategoryManager = new ToolCategoryManager();
