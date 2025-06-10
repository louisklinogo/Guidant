#!/usr/bin/env node

/**
 * Test MCP-004: Tool Categories System
 * Verifies that the tool categorization and lazy loading system works correctly
 */

import { FastMCP } from 'fastmcp';
import { 
    registerAllGuidantTools, 
    registerEssentialTools,
    registerAllGuidantToolsWithCategories,
    getToolCategoryManager,
    getLazyLoader,
    loadToolCategory
} from './mcp-server/src/tools/index.js';
import { TOOL_CATEGORIES } from './mcp-server/src/tools/shared/tool-categories.js';

async function testMCP004() {
    console.log('🧪 Testing MCP-004: Tool Categories System...\n');
    
    try {
        // Test 1: Tool Category Manager
        console.log('📋 Test 1: Tool Category Manager...');
        const categoryManager = getToolCategoryManager();
        
        console.log(`   • Total categories: ${Object.keys(TOOL_CATEGORIES).length}`);
        console.log(`   • Essential categories: ${categoryManager.getEssentialCategories().length}`);
        console.log(`   • Lazy load categories: ${categoryManager.getLazyLoadCategories().length}`);
        
        // Test tool-to-category mapping
        const testTool = 'guidant_get_current_task';
        const category = categoryManager.getCategoryForTool(testTool);
        console.log(`   • Tool '${testTool}' belongs to: ${category ? category.name : 'NOT FOUND'}`);
        
        // Test 2: Essential Tools Registration
        console.log('\n📋 Test 2: Essential Tools Registration...');
        const essentialServer = new FastMCP({
            name: 'Essential Test Server',
            version: '1.0.0',
            description: 'Test essential tools'
        });

        const registeredEssentialTools = [];
        const originalAddTool = essentialServer.addTool.bind(essentialServer);
        essentialServer.addTool = function(toolConfig) {
            registeredEssentialTools.push(toolConfig.name);
            return originalAddTool(toolConfig);
        };

        registerEssentialTools(essentialServer);
        
        const essentialCategory = TOOL_CATEGORIES.ESSENTIAL;
        console.log(`   • Expected essential tools: ${essentialCategory.tools.length}`);
        console.log(`   • Registered essential tools: ${registeredEssentialTools.length}`);
        console.log(`   • Essential category loaded: ${categoryManager.isCategoryLoaded('essential') ? '✅' : '❌'}`);
        
        // Test 3: Category-based Registration
        console.log('\n📋 Test 3: Category-based Registration...');
        const categoryServer = new FastMCP({
            name: 'Category Test Server',
            version: '1.0.0',
            description: 'Test category system'
        });

        const registeredCategoryTools = [];
        const originalCategoryAddTool = categoryServer.addTool.bind(categoryServer);
        categoryServer.addTool = function(toolConfig) {
            registeredCategoryTools.push(toolConfig.name);
            return originalCategoryAddTool(toolConfig);
        };

        // Test with lazy loading enabled
        await registerAllGuidantToolsWithCategories(categoryServer, {
            lazyLoad: true,
            preloadCategories: ['analysis'],
            loadAllImmediately: false
        });
        
        console.log(`   • Tools registered with categories: ${registeredCategoryTools.length}`);
        console.log(`   • Essential loaded: ${categoryManager.isCategoryLoaded('essential') ? '✅' : '❌'}`);
        console.log(`   • Analysis preloaded: ${categoryManager.isCategoryLoaded('analysis') ? '✅' : '❌'}`);
        console.log(`   • Intelligence lazy: ${categoryManager.isCategoryLoaded('intelligence') ? '✅' : '⏳'}`);
        
        // Test 4: Lazy Loading
        console.log('\n📋 Test 4: Lazy Loading...');
        const lazyLoader = getLazyLoader();
        
        if (!categoryManager.isCategoryLoaded('intelligence')) {
            console.log('   • Loading intelligence category on demand...');
            const loadSuccess = await loadToolCategory('intelligence', categoryServer);
            console.log(`   • Intelligence category loaded: ${loadSuccess ? '✅' : '❌'}`);
            console.log(`   • Intelligence now available: ${categoryManager.isCategoryLoaded('intelligence') ? '✅' : '❌'}`);
        } else {
            console.log('   • Intelligence category already loaded ✅');
        }
        
        // Test 5: Usage Metrics
        console.log('\n📋 Test 5: Usage Metrics...');
        
        // Simulate some tool usage
        categoryManager.recordToolUsage('guidant_get_current_task', 150, true);
        categoryManager.recordToolUsage('guidant_analyze_deliverable', 300, true);
        categoryManager.recordToolUsage('guidant_discover_agent', 200, false);
        
        const stats = categoryManager.getUsageStatistics();
        console.log(`   • Total tools tracked: ${stats.overview.totalTools}`);
        console.log(`   • Total calls recorded: ${stats.overview.totalCalls}`);
        console.log(`   • Most used tool: ${stats.mostUsedTools[0]?.name || 'None'}`);
        
        // Test 6: Category Status
        console.log('\n📋 Test 6: Category Status...');
        const status = lazyLoader.getCategoryStatus();
        console.log(`   • Categories loaded: ${status.summary.loaded}/${status.summary.total}`);
        console.log(`   • Essential categories: ${status.summary.essential}`);
        console.log(`   • Lazy load categories: ${status.summary.lazyLoad}`);
        
        status.categories.forEach(cat => {
            const statusIcon = cat.loaded ? '✅' : (cat.lazyLoad ? '⏳' : '❌');
            console.log(`     ${statusIcon} ${cat.name}: ${cat.toolCount} tools`);
        });
        
        // Test 7: Backward Compatibility
        console.log('\n📋 Test 7: Backward Compatibility...');
        const compatServer = new FastMCP({
            name: 'Compatibility Test Server',
            version: '1.0.0',
            description: 'Test backward compatibility'
        });

        const registeredCompatTools = [];
        const originalCompatAddTool = compatServer.addTool.bind(compatServer);
        compatServer.addTool = function(toolConfig) {
            registeredCompatTools.push(toolConfig.name);
            return originalCompatAddTool(toolConfig);
        };

        registerAllGuidantTools(compatServer);
        console.log(`   • Backward compatibility tools: ${registeredCompatTools.length}`);
        console.log(`   • Expected total: 27`);
        console.log(`   • Backward compatibility: ${registeredCompatTools.length === 27 ? '✅' : '❌'}`);
        
        // Final Results
        console.log('\n📊 MCP-004 Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'Tool Category Manager initialized', passed: !!categoryManager },
            { name: 'Essential tools registration', passed: registeredEssentialTools.length >= 5 },
            { name: 'Category-based registration', passed: registeredCategoryTools.length > 0 },
            { name: 'Lazy loading works', passed: categoryManager.isCategoryLoaded('intelligence') },
            { name: 'Usage metrics tracking', passed: stats.overview.totalCalls > 0 },
            { name: 'Category status reporting', passed: status.summary.total === 4 },
            { name: 'Backward compatibility', passed: registeredCompatTools.length === 27 }
        ];
        
        const passedTests = tests.filter(t => t.passed).length;
        const totalTests = tests.length;
        
        tests.forEach(test => {
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ MCP-004 implementation verified successfully!');
            console.log('🎉 Tool Categories System is working correctly');
        } else {
            console.log('❌ MCP-004 implementation has issues that need to be fixed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testMCP004();
