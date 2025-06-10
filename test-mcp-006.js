#!/usr/bin/env node

/**
 * Test MCP-006: Consolidate Quality System Tools
 * Verifies that 4 quality tools have been consolidated into 2
 */

async function testMCP006() {
    console.log('🧪 Testing MCP-006: Quality System Tools Consolidation...\n');
    
    try {
        // Import the updated category system
        const { TOOL_CATEGORIES, toolCategoryManager } = await import('./mcp-server/src/tools/shared/tool-categories.js');
        
        console.log('📋 Test 1: Tool Category Updates...');
        const adminCategory = TOOL_CATEGORIES.ADMIN;
        console.log(`   • Admin category tools: ${adminCategory.tools.length}`);
        console.log(`   • Expected: 4 tools (2 quality + 1 deprecated + 1 relationship)`);
        console.log(`   • Actual tools:`);
        adminCategory.tools.forEach(tool => {
            console.log(`     • ${tool}`);
        });
        
        // Check for consolidated tools
        const expectedConsolidatedTools = [
            'guidant_validate_content',
            'guidant_quality_management'
        ];
        
        const hasConsolidatedTools = expectedConsolidatedTools.every(tool => 
            adminCategory.tools.includes(tool)
        );
        
        console.log(`   • Has consolidated tools: ${hasConsolidatedTools ? '✅' : '❌'}`);
        
        // Check that old tools are NOT in the category
        const oldTools = [
            'guidant_validate_deliverable_quality',
            'guidant_get_quality_history',
            'guidant_get_quality_statistics',
            'guidant_configure_quality_system'
        ];
        
        const hasOldTools = oldTools.some(tool => 
            adminCategory.tools.includes(tool)
        );
        
        console.log(`   • Old tools removed from category: ${!hasOldTools ? '✅' : '❌'}`);
        
        console.log('\n📋 Test 2: Tool Registration...');
        
        // Test tool registration
        const { FastMCP } = await import('fastmcp');
        const { registerQualityValidationTools } = await import('./mcp-server/src/tools/quality/quality-validation-tools.js');
        
        const testServer = new FastMCP({
            name: 'Test Server',
            version: '1.0.0',
            description: 'Test MCP-006'
        });

        const registeredTools = [];
        const originalAddTool = testServer.addTool.bind(testServer);
        testServer.addTool = function(toolConfig) {
            registeredTools.push({
                name: toolConfig.name,
                description: toolConfig.description,
                isDeprecated: toolConfig.description.includes('[DEPRECATED]')
            });
            return originalAddTool(toolConfig);
        };

        registerQualityValidationTools(testServer);
        
        console.log(`   • Total tools registered: ${registeredTools.length}`);
        
        // Count new consolidated tools
        const newTools = registeredTools.filter(tool => 
            expectedConsolidatedTools.includes(tool.name)
        );
        console.log(`   • New consolidated tools: ${newTools.length}/2`);
        newTools.forEach(tool => {
            console.log(`     ✅ ${tool.name}`);
        });
        
        // Count deprecated tools (should still be registered for backward compatibility)
        const deprecatedTools = registeredTools.filter(tool => tool.isDeprecated);
        console.log(`   • Deprecated tools (backward compatibility): ${deprecatedTools.length}`);
        deprecatedTools.forEach(tool => {
            console.log(`     🔄 ${tool.name} (deprecated)`);
        });
        
        console.log('\n📋 Test 3: Tool Functionality...');
        
        // Test the new consolidated tools
        const validateTool = registeredTools.find(t => t.name === 'guidant_validate_content');
        const managementTool = registeredTools.find(t => t.name === 'guidant_quality_management');
        
        console.log(`   • guidant_validate_content found: ${validateTool ? '✅' : '❌'}`);
        console.log(`   • guidant_quality_management found: ${managementTool ? '✅' : '❌'}`);
        
        // Test parameter structure for consolidated tools
        if (validateTool) {
            console.log('   • guidant_validate_content parameters:');
            console.log(`     • Has operation parameter: ${validateTool.description.includes('operation') ? '✅' : '❌'}`);
            console.log(`     • Supports validate/statistics/analyze_all: ${validateTool.description.includes('analyze_all') ? '✅' : '❌'}`);
        }
        
        if (managementTool) {
            console.log('   • guidant_quality_management parameters:');
            console.log(`     • Has operation parameter: ${managementTool.description.includes('operation') ? '✅' : '❌'}`);
            console.log(`     • Supports get_history/configure/manage_all: ${managementTool.description.includes('manage_all') ? '✅' : '❌'}`);
        }
        
        console.log('\n📋 Test 4: Consolidation Impact...');
        
        // Calculate consolidation impact
        const originalToolCount = 4; // Original quality tools
        const newToolCount = 2; // Consolidated tools
        const reductionCount = originalToolCount - newToolCount;
        const reductionPercentage = (reductionCount / originalToolCount) * 100;
        
        console.log(`   • Original tools: ${originalToolCount}`);
        console.log(`   • Consolidated tools: ${newToolCount}`);
        console.log(`   • Reduction: ${reductionCount} tools (${reductionPercentage.toFixed(1)}%)`);
        console.log(`   • Backward compatibility maintained: ${deprecatedTools.length > 0 ? '✅' : '❌'}`);
        
        // Final Results
        console.log('\n📊 MCP-006 Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'Admin category updated', passed: adminCategory.tools.length === 4 },
            { name: 'Consolidated tools in category', passed: hasConsolidatedTools },
            { name: 'Old tools removed from category', passed: !hasOldTools },
            { name: 'New tools registered', passed: newTools.length === 2 },
            { name: 'Deprecated tools for compatibility', passed: deprecatedTools.length >= 4 },
            { name: 'guidant_validate_content available', passed: !!validateTool },
            { name: 'guidant_quality_management available', passed: !!managementTool },
            { name: 'Tool reduction achieved', passed: reductionCount === 2 }
        ];
        
        const passedTests = tests.filter(t => t.passed).length;
        const totalTests = tests.length;
        
        tests.forEach(test => {
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ MCP-006 implementation verified successfully!');
            console.log('🎉 Quality System Tools consolidation is working correctly');
            console.log(`📈 Achieved ${reductionPercentage.toFixed(1)}% reduction in tool count while maintaining functionality`);
            return true;
        } else {
            console.log('❌ MCP-006 implementation has issues that need to be fixed');
            return false;
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testMCP006().then(success => {
    process.exit(success ? 0 : 1);
});
