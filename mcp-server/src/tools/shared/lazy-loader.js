/**
 * Lazy Loading System for MCP Tools
 * Implements on-demand loading of tool categories to improve startup performance
 * 
 * MCP-004: Implement Tool Categories and Lazy Loading
 */

import { toolCategoryManager, TOOL_CATEGORIES } from './tool-categories.js';

/**
 * Lazy Loader for MCP Tools
 * Manages on-demand loading of tool categories and tracks performance
 */
export class LazyLoader {
    constructor() {
        this.loadingPromises = new Map(); // Track in-progress loads
        this.loadedModules = new Map(); // Cache loaded modules
        this.loadingMetrics = {
            totalLoads: 0,
            totalLoadTime: 0,
            averageLoadTime: 0,
            failedLoads: 0,
            cacheHits: 0
        };
    }

    /**
     * Load a tool category on demand
     * @param {string} categoryId - Category to load
     * @param {object} server - MCP server instance
     * @returns {Promise<boolean>} Success status
     */
    async loadCategory(categoryId, server) {
        const startTime = performance.now();
        const category = TOOL_CATEGORIES[categoryId.toUpperCase()];
        
        if (!category) {
            console.warn(`⚠️ Unknown category: ${categoryId}`);
            return false;
        }

        // Check if already loaded
        if (toolCategoryManager.isCategoryLoaded(categoryId)) {
            this.loadingMetrics.cacheHits++;
            console.log(`📦 Category '${category.name}' already loaded (cache hit)`);
            return true;
        }

        // Check if currently loading
        if (this.loadingPromises.has(categoryId)) {
            console.log(`⏳ Category '${category.name}' is already loading, waiting...`);
            return await this.loadingPromises.get(categoryId);
        }

        // Start loading
        const loadPromise = this._performCategoryLoad(categoryId, category, server, startTime);
        this.loadingPromises.set(categoryId, loadPromise);

        try {
            const result = await loadPromise;
            this.loadingPromises.delete(categoryId);
            return result;
        } catch (error) {
            this.loadingPromises.delete(categoryId);
            throw error;
        }
    }

    /**
     * Perform the actual category loading
     * @private
     */
    async _performCategoryLoad(categoryId, category, server, startTime) {
        try {
            console.log(`🔄 Lazy loading category: ${category.name} (${category.tools.length} tools)`);

            // Load the appropriate registration module based on category
            const registrationFunction = await this._getRegistrationFunction(categoryId);
            
            if (registrationFunction) {
                // Register tools for this category
                await registrationFunction(server);
                
                // Mark category as loaded
                toolCategoryManager.markCategoryLoaded(categoryId);
                
                // Update metrics
                const loadTime = performance.now() - startTime;
                this._updateLoadingMetrics(loadTime, true);
                
                console.log(`✅ Category '${category.name}' loaded successfully (${Math.round(loadTime)}ms)`);
                return true;
            } else {
                throw new Error(`No registration function found for category: ${categoryId}`);
            }

        } catch (error) {
            const loadTime = performance.now() - startTime;
            this._updateLoadingMetrics(loadTime, false);
            
            console.error(`❌ Failed to load category '${category.name}':`, error.message);
            return false;
        }
    }

    /**
     * Get the registration function for a category
     * @private
     */
    async _getRegistrationFunction(categoryId) {
        switch (categoryId.toLowerCase()) {
            case 'analysis':
                // Load analysis tools (deliverable + relationship)
                const { registerDeliverableAnalysisTools } = await import('../core/deliverable-analysis.js');
                const { registerRelationshipAnalysisTools } = await import('../core/relationship-analysis.js');
                
                return (server) => {
                    registerDeliverableAnalysisTools(server);
                    registerRelationshipAnalysisTools(server);
                    // Note: Quality validation is handled separately as it's already loaded
                };

            case 'intelligence':
                // Load intelligence tools (agent registry + workflow intelligence)
                const { registerAgentDiscoveryTools } = await import('../agent-registry/agent-discovery.js');
                const { registerCapabilityAnalysisTools } = await import('../agent-registry/capability-analysis.js');
                const { registerAdaptiveWorkflowTools } = await import('../workflow-intelligence/adaptive-tools.js');
                
                return (server) => {
                    registerAgentDiscoveryTools(server);
                    registerCapabilityAnalysisTools(server);
                    registerAdaptiveWorkflowTools(server);
                };

            case 'admin':
                // Admin tools are typically already loaded, but we can handle specific admin-only tools here
                return (server) => {
                    console.log('📋 Admin tools are already loaded with core registration');
                };

            default:
                return null;
        }
    }

    /**
     * Load multiple categories
     * @param {Array<string>} categoryIds - Categories to load
     * @param {object} server - MCP server instance
     * @returns {Promise<object>} Load results
     */
    async loadCategories(categoryIds, server) {
        const results = {
            successful: [],
            failed: [],
            alreadyLoaded: []
        };

        const loadPromises = categoryIds.map(async (categoryId) => {
            try {
                if (toolCategoryManager.isCategoryLoaded(categoryId)) {
                    results.alreadyLoaded.push(categoryId);
                    return { categoryId, success: true, cached: true };
                }

                const success = await this.loadCategory(categoryId, server);
                if (success) {
                    results.successful.push(categoryId);
                } else {
                    results.failed.push(categoryId);
                }
                return { categoryId, success, cached: false };
            } catch (error) {
                results.failed.push(categoryId);
                return { categoryId, success: false, error: error.message };
            }
        });

        await Promise.all(loadPromises);
        return results;
    }

    /**
     * Load category when a specific tool is requested
     * @param {string} toolName - Name of the requested tool
     * @param {object} server - MCP server instance
     * @returns {Promise<boolean>} Success status
     */
    async loadCategoryForTool(toolName, server) {
        const category = toolCategoryManager.getCategoryForTool(toolName);
        
        if (!category) {
            console.warn(`⚠️ Tool '${toolName}' not found in any category`);
            return false;
        }

        if (!category.lazyLoad) {
            // Tool is in essential category, should already be loaded
            return true;
        }

        return await this.loadCategory(category.id, server);
    }

    /**
     * Preload categories based on usage patterns
     * @param {object} server - MCP server instance
     * @param {Array<string>} priorityCategories - Categories to preload
     * @returns {Promise<void>}
     */
    async preloadCategories(server, priorityCategories = ['analysis']) {
        console.log('🚀 Preloading priority categories...');
        
        const results = await this.loadCategories(priorityCategories, server);
        
        if (results.successful.length > 0) {
            console.log(`✅ Preloaded categories: ${results.successful.join(', ')}`);
        }
        
        if (results.failed.length > 0) {
            console.warn(`⚠️ Failed to preload categories: ${results.failed.join(', ')}`);
        }
    }

    /**
     * Update loading metrics
     * @private
     */
    _updateLoadingMetrics(loadTime, success) {
        this.loadingMetrics.totalLoads++;
        
        if (success) {
            this.loadingMetrics.totalLoadTime += loadTime;
            this.loadingMetrics.averageLoadTime = this.loadingMetrics.totalLoadTime / 
                (this.loadingMetrics.totalLoads - this.loadingMetrics.failedLoads);
        } else {
            this.loadingMetrics.failedLoads++;
        }
    }

    /**
     * Get loading performance metrics
     * @returns {object} Loading metrics
     */
    getLoadingMetrics() {
        return {
            ...this.loadingMetrics,
            successRate: this.loadingMetrics.totalLoads > 0 ? 
                ((this.loadingMetrics.totalLoads - this.loadingMetrics.failedLoads) / this.loadingMetrics.totalLoads) * 100 : 0,
            loadedCategories: Array.from(toolCategoryManager.loadedCategories),
            cacheHitRate: this.loadingMetrics.totalLoads > 0 ? 
                (this.loadingMetrics.cacheHits / this.loadingMetrics.totalLoads) * 100 : 0
        };
    }

    /**
     * Reset loading metrics
     */
    resetMetrics() {
        this.loadingMetrics = {
            totalLoads: 0,
            totalLoadTime: 0,
            averageLoadTime: 0,
            failedLoads: 0,
            cacheHits: 0
        };
    }

    /**
     * Get status of all categories
     * @returns {object} Category status information
     */
    getCategoryStatus() {
        const categories = toolCategoryManager.getAllCategories();
        
        return {
            categories: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                toolCount: cat.tools.length,
                lazyLoad: cat.lazyLoad,
                loaded: toolCategoryManager.isCategoryLoaded(cat.id),
                loading: this.loadingPromises.has(cat.id)
            })),
            summary: {
                total: categories.length,
                loaded: categories.filter(cat => toolCategoryManager.isCategoryLoaded(cat.id)).length,
                loading: this.loadingPromises.size,
                essential: categories.filter(cat => !cat.lazyLoad).length,
                lazyLoad: categories.filter(cat => cat.lazyLoad).length
            }
        };
    }
}

// Export singleton instance
export const lazyLoader = new LazyLoader();
