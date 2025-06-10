#!/usr/bin/env node

/**
 * Test MCP-004: Tool Categories System (Core Functionality)
 */

async function testCategories() {
    console.log('🧪 Testing MCP-004: Tool Categories Core Functionality...\n');
    
    try {
        // Import the category system
        const { TOOL_CATEGORIES, toolCategoryManager } = await import('./mcp-server/src/tools/shared/tool-categories.js');
        const { lazyLoader } = await import('./mcp-server/src/tools/shared/lazy-loader.js');
        
        console.log('📋 Test 1: Category Definitions...');
        console.log(`   • Total categories: ${Object.keys(TOOL_CATEGORIES).length}`);
        
        Object.values(TOOL_CATEGORIES).forEach(category => {
            console.log(`   • ${category.name}: ${category.tools.length} tools (${category.lazyLoad ? 'lazy' : 'essential'})`);
        });
        
        console.log('\n📋 Test 2: Tool Category Manager...');
        const essentialCategories = toolCategoryManager.getEssentialCategories();
        const lazyCategories = toolCategoryManager.getLazyLoadCategories();
        
        console.log(`   • Essential categories: ${essentialCategories.length}`);
        console.log(`   • Lazy load categories: ${lazyCategories.length}`);
        
        // Test tool-to-category mapping
        const testTools = [
            'guidant_get_current_task',
            'guidant_analyze_deliverable',
            'guidant_discover_agent',
            'guidant_get_quality_statistics'
        ];
        
        console.log('\n📋 Test 3: Tool-to-Category Mapping...');
        testTools.forEach(toolName => {
            const category = toolCategoryManager.getCategoryForTool(toolName);
            console.log(`   • ${toolName} → ${category ? category.name : 'NOT FOUND'}`);
        });
        
        console.log('\n📋 Test 4: Usage Metrics...');
        // Simulate tool usage
        toolCategoryManager.recordToolUsage('guidant_get_current_task', 150, true);
        toolCategoryManager.recordToolUsage('guidant_analyze_deliverable', 300, true);
        toolCategoryManager.recordToolUsage('guidant_discover_agent', 200, false);
        
        const stats = toolCategoryManager.getUsageStatistics();
        console.log(`   • Total calls recorded: ${stats.overview.totalCalls}`);
        console.log(`   • Most used tools: ${stats.mostUsedTools.map(t => t.name).join(', ')}`);
        
        Object.entries(stats.categoryStats).forEach(([categoryId, stat]) => {
            console.log(`   • ${categoryId}: ${stat.calls} calls, ${stat.avgExecutionTime}ms avg, ${stat.errorRate.toFixed(1)}% errors`);
        });
        
        console.log('\n📋 Test 5: Category Status...');
        const status = lazyLoader.getCategoryStatus();
        console.log(`   • Categories defined: ${status.summary.total}`);
        console.log(`   • Essential categories: ${status.summary.essential}`);
        console.log(`   • Lazy load categories: ${status.summary.lazyLoad}`);
        
        status.categories.forEach(cat => {
            const loadType = cat.lazyLoad ? 'lazy' : 'essential';
            console.log(`   • ${cat.name}: ${cat.toolCount} tools (${loadType})`);
        });
        
        console.log('\n📋 Test 6: Category Loading Logic...');
        
        // Test essential category loading
        const essentialCategory = TOOL_CATEGORIES.ESSENTIAL;
        console.log(`   • Essential category should not lazy load: ${!essentialCategory.lazyLoad ? '✅' : '❌'}`);
        
        // Test analysis category loading
        const analysisCategory = TOOL_CATEGORIES.ANALYSIS;
        console.log(`   • Analysis category should lazy load: ${analysisCategory.lazyLoad ? '✅' : '❌'}`);
        
        // Test tool categorization
        const essentialTool = 'guidant_get_current_task';
        const analysisTool = 'guidant_analyze_deliverable';
        
        const essentialToolCategory = toolCategoryManager.getCategoryForTool(essentialTool);
        const analysisToolCategory = toolCategoryManager.getCategoryForTool(analysisTool);
        
        console.log(`   • ${essentialTool} in essential: ${essentialToolCategory?.id === 'essential' ? '✅' : '❌'}`);
        console.log(`   • ${analysisTool} in analysis: ${analysisToolCategory?.id === 'analysis' ? '✅' : '❌'}`);
        
        // Final Results
        console.log('\n📊 MCP-004 Core Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'Category definitions loaded', passed: Object.keys(TOOL_CATEGORIES).length === 4 },
            { name: 'Essential categories identified', passed: essentialCategories.length === 1 },
            { name: 'Lazy categories identified', passed: lazyCategories.length === 3 },
            { name: 'Tool-to-category mapping works', passed: testTools.every(tool => toolCategoryManager.getCategoryForTool(tool)) },
            { name: 'Usage metrics tracking', passed: stats.overview.totalCalls === 3 },
            { name: 'Category status reporting', passed: status.summary.total === 4 },
            { name: 'Essential category logic', passed: !essentialCategory.lazyLoad },
            { name: 'Lazy category logic', passed: analysisCategory.lazyLoad },
            { name: 'Tool categorization correct', passed: essentialToolCategory?.id === 'essential' && analysisToolCategory?.id === 'analysis' }
        ];
        
        const passedTests = tests.filter(t => t.passed).length;
        const totalTests = tests.length;
        
        tests.forEach(test => {
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ MCP-004 core functionality verified successfully!');
            console.log('🎉 Tool Categories System foundation is working correctly');
            return true;
        } else {
            console.log('❌ MCP-004 core functionality has issues that need to be fixed');
            return false;
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testCategories().then(success => {
    process.exit(success ? 0 : 1);
});
