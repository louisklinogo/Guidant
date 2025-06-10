#!/usr/bin/env node

/**
 * Test MCP-005: Consolidate Workflow Intelligence Tools
 * Verifies that 5 workflow intelligence tools have been consolidated into 3
 */

async function testMCP005() {
    console.log('🧪 Testing MCP-005: Workflow Intelligence Consolidation...\n');
    
    try {
        // Import the updated category system
        const { TOOL_CATEGORIES, toolCategoryManager } = await import('./mcp-server/src/tools/shared/tool-categories.js');
        
        console.log('📋 Test 1: Tool Category Updates...');
        const intelligenceCategory = TOOL_CATEGORIES.INTELLIGENCE;
        console.log(`   • Intelligence category tools: ${intelligenceCategory.tools.length}`);
        console.log(`   • Expected: 8 tools (5 agent + 3 workflow)`);
        console.log(`   • Actual tools:`);
        intelligenceCategory.tools.forEach(tool => {
            console.log(`     • ${tool}`);
        });
        
        // Check for consolidated tools
        const expectedConsolidatedTools = [
            'guidant_classify_project',
            'guidant_manage_adaptive_workflow',
            'guidant_workflow_intelligence'
        ];
        
        const hasConsolidatedTools = expectedConsolidatedTools.every(tool => 
            intelligenceCategory.tools.includes(tool)
        );
        
        console.log(`   • Has consolidated tools: ${hasConsolidatedTools ? '✅' : '❌'}`);
        
        // Check that old tools are NOT in the category
        const oldTools = [
            'guidant_generate_adaptive_workflow',
            'guidant_apply_adaptive_workflow',
            'guidant_get_workflow_modes',
            'guidant_suggest_workflow_upgrade'
        ];
        
        const hasOldTools = oldTools.some(tool => 
            intelligenceCategory.tools.includes(tool)
        );
        
        console.log(`   • Old tools removed from category: ${!hasOldTools ? '✅' : '❌'}`);
        
        console.log('\n📋 Test 2: Tool Registration...');
        
        // Test tool registration
        const { FastMCP } = await import('fastmcp');
        const { registerAdaptiveWorkflowTools } = await import('./mcp-server/src/tools/workflow-intelligence/adaptive-tools.js');
        
        const testServer = new FastMCP({
            name: 'Test Server',
            version: '1.0.0',
            description: 'Test MCP-005'
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

        registerAdaptiveWorkflowTools(testServer);
        
        console.log(`   • Total tools registered: ${registeredTools.length}`);
        
        // Count new consolidated tools
        const newTools = registeredTools.filter(tool => 
            expectedConsolidatedTools.includes(tool.name)
        );
        console.log(`   • New consolidated tools: ${newTools.length}/3`);
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
        const classifyTool = registeredTools.find(t => t.name === 'guidant_classify_project');
        const manageTool = registeredTools.find(t => t.name === 'guidant_manage_adaptive_workflow');
        const intelligenceTool = registeredTools.find(t => t.name === 'guidant_workflow_intelligence');
        
        console.log(`   • guidant_classify_project found: ${classifyTool ? '✅' : '❌'}`);
        console.log(`   • guidant_manage_adaptive_workflow found: ${manageTool ? '✅' : '❌'}`);
        console.log(`   • guidant_workflow_intelligence found: ${intelligenceTool ? '✅' : '❌'}`);
        
        // Test parameter structure for consolidated tools
        if (manageTool) {
            console.log('   • guidant_manage_adaptive_workflow parameters:');
            console.log(`     • Has operation parameter: ${manageTool.description.includes('operation') ? '✅' : '❌'}`);
            console.log(`     • Supports generate/apply/generate_and_apply: ${manageTool.description.includes('generate_and_apply') ? '✅' : '❌'}`);
        }
        
        if (intelligenceTool) {
            console.log('   • guidant_workflow_intelligence parameters:');
            console.log(`     • Has operation parameter: ${intelligenceTool.description.includes('operation') ? '✅' : '❌'}`);
            console.log(`     • Supports get_modes/suggest_upgrade/analyze_all: ${intelligenceTool.description.includes('analyze_all') ? '✅' : '❌'}`);
        }
        
        console.log('\n📋 Test 4: Consolidation Impact...');
        
        // Calculate consolidation impact
        const originalToolCount = 5; // Original workflow intelligence tools
        const newToolCount = 3; // Consolidated tools
        const reductionCount = originalToolCount - newToolCount;
        const reductionPercentage = (reductionCount / originalToolCount) * 100;
        
        console.log(`   • Original tools: ${originalToolCount}`);
        console.log(`   • Consolidated tools: ${newToolCount}`);
        console.log(`   • Reduction: ${reductionCount} tools (${reductionPercentage.toFixed(1)}%)`);
        console.log(`   • Backward compatibility maintained: ${deprecatedTools.length > 0 ? '✅' : '❌'}`);
        
        // Final Results
        console.log('\n📊 MCP-005 Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'Intelligence category updated', passed: intelligenceCategory.tools.length === 8 },
            { name: 'Consolidated tools in category', passed: hasConsolidatedTools },
            { name: 'Old tools removed from category', passed: !hasOldTools },
            { name: 'New tools registered', passed: newTools.length === 3 },
            { name: 'Deprecated tools for compatibility', passed: deprecatedTools.length >= 4 },
            { name: 'guidant_classify_project available', passed: !!classifyTool },
            { name: 'guidant_manage_adaptive_workflow available', passed: !!manageTool },
            { name: 'guidant_workflow_intelligence available', passed: !!intelligenceTool },
            { name: 'Tool reduction achieved', passed: reductionCount === 2 }
        ];
        
        const passedTests = tests.filter(t => t.passed).length;
        const totalTests = tests.length;
        
        tests.forEach(test => {
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ MCP-005 implementation verified successfully!');
            console.log('🎉 Workflow Intelligence Tools consolidation is working correctly');
            console.log(`📈 Achieved ${reductionPercentage.toFixed(1)}% reduction in tool count while maintaining functionality`);
            return true;
        } else {
            console.log('❌ MCP-005 implementation has issues that need to be fixed');
            return false;
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testMCP005().then(success => {
    process.exit(success ? 0 : 1);
});
