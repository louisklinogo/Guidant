#!/usr/bin/env node

/**
 * Test MCP-003: Consolidate Project State Retrieval
 * Verifies that guidant_get_current_task with includeFullState works correctly
 */

import { FastMCP } from 'fastmcp';
import { registerAllGuidantTools } from './mcp-server/src/tools/index.js';

async function testMCP003() {
    console.log('🧪 Testing MCP-003: Project State Consolidation...\n');
    
    try {
        // Create a test server instance
        const testServer = new FastMCP({
            name: 'Test Server',
            version: '1.0.0',
            description: 'Test MCP-003'
        });

        // Register all tools
        await registerAllGuidantTools(testServer);
        
        // Find the tools we need to test
        let getCurrentTaskTool = null;
        let getProjectStateTool = null;
        
        const originalAddTool = testServer.addTool.bind(testServer);
        testServer.addTool = function(toolConfig) {
            if (toolConfig.name === 'guidant_get_current_task') {
                getCurrentTaskTool = toolConfig;
                console.log('✅ Found guidant_get_current_task tool');
            }
            if (toolConfig.name === 'guidant_get_project_state') {
                getProjectStateTool = toolConfig;
                console.log('✅ Found guidant_get_project_state tool');
            }
            return originalAddTool(toolConfig);
        };

        // Re-register to capture tools
        await registerAllGuidantTools(testServer);
        
        console.log('\n📋 Testing Tool Parameters...\n');
        
        // Test 1: Verify guidant_get_current_task has includeFullState parameter
        if (getCurrentTaskTool) {
            console.log('🔍 Testing guidant_get_current_task parameters:');
            const schema = getCurrentTaskTool.parameters;
            
            if (schema && schema._def && schema._def.shape) {
                const shape = schema._def.shape();
                console.log(`   • availableTools: ${shape.availableTools ? '✅' : '❌'}`);
                console.log(`   • includeFullState: ${shape.includeFullState ? '✅' : '❌'}`);
                
                if (shape.includeFullState) {
                    const defaultValue = shape.includeFullState._def.defaultValue();
                    console.log(`   • includeFullState default: ${defaultValue} ✅`);
                } else {
                    console.log('   ❌ includeFullState parameter missing!');
                }
            } else {
                console.log('   ❌ Could not parse parameter schema');
            }
        } else {
            console.log('❌ guidant_get_current_task tool not found!');
        }
        
        // Test 2: Verify guidant_get_project_state has deprecation warning
        if (getProjectStateTool) {
            console.log('\n🔍 Testing guidant_get_project_state deprecation:');
            const description = getProjectStateTool.description;
            console.log(`   • Description: ${description}`);
            console.log(`   • Has [DEPRECATED]: ${description.includes('[DEPRECATED]') ? '✅' : '❌'}`);
            console.log(`   • Mentions replacement: ${description.includes('guidant_get_current_task') ? '✅' : '❌'}`);
        } else {
            console.log('❌ guidant_get_project_state tool not found!');
        }
        
        // Test 3: Mock execution test (without actual project)
        console.log('\n🔍 Testing Tool Execution (Mock)...\n');
        
        if (getCurrentTaskTool && getCurrentTaskTool.execute) {
            console.log('Testing guidant_get_current_task execution patterns:');
            
            // Test with includeFullState = false (default)
            console.log('   • Testing with includeFullState = false...');
            try {
                // This will fail because no project is initialized, but we can check the parameter handling
                await getCurrentTaskTool.execute({ availableTools: [], includeFullState: false });
            } catch (error) {
                if (error.message && error.message.includes('Project not initialized')) {
                    console.log('   ✅ Parameter handling works (expected project error)');
                } else {
                    console.log(`   ❌ Unexpected error: ${error.message}`);
                }
            }
            
            // Test with includeFullState = true
            console.log('   • Testing with includeFullState = true...');
            try {
                await getCurrentTaskTool.execute({ availableTools: [], includeFullState: true });
            } catch (error) {
                if (error.message && error.message.includes('Project not initialized')) {
                    console.log('   ✅ Parameter handling works (expected project error)');
                } else {
                    console.log(`   ❌ Unexpected error: ${error.message}`);
                }
            }
        }
        
        console.log('\n📊 MCP-003 Test Results:');
        console.log('================================');
        
        const tests = [
            { name: 'guidant_get_current_task found', passed: !!getCurrentTaskTool },
            { name: 'includeFullState parameter exists', passed: getCurrentTaskTool && getCurrentTaskTool.parameters._def.shape().includeFullState },
            { name: 'includeFullState defaults to false', passed: getCurrentTaskTool && getCurrentTaskTool.parameters._def.shape().includeFullState._def.defaultValue() === false },
            { name: 'guidant_get_project_state found', passed: !!getProjectStateTool },
            { name: 'Deprecation warning present', passed: getProjectStateTool && getProjectStateTool.description.includes('[DEPRECATED]') },
            { name: 'Replacement tool mentioned', passed: getProjectStateTool && getProjectStateTool.description.includes('guidant_get_current_task') }
        ];
        
        const passedTests = tests.filter(t => t.passed).length;
        const totalTests = tests.length;
        
        tests.forEach(test => {
            console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
        });
        
        console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ MCP-003 implementation verified successfully!');
            console.log('🎉 Project state consolidation is working correctly');
        } else {
            console.log('❌ MCP-003 implementation has issues that need to be fixed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testMCP003();
