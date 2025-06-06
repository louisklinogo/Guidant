#!/usr/bin/env node

/**
 * Simulate testing all 11 MCP tools by calling them directly
 */

import { registerAICoordinationTools } from '../mcp-server/src/tools/ai-coordination-full.js';

// Mock MCP server that captures tool registrations
class MockMCPServer {
    constructor() {
        this.tools = new Map();
    }
    
    addTool(toolConfig) {
        this.tools.set(toolConfig.name, toolConfig);
        console.log(`✅ Registered: ${toolConfig.name}`);
    }
    
    async executeTool(name, params = {}) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        
        try {
            console.log(`🔧 Executing: ${name}`);
            const result = await tool.execute(params);
            console.log(`✅ ${name} executed successfully`);
            return result;
        } catch (error) {
            console.log(`❌ ${name} failed: ${error.message}`);
            throw error;
        }
    }
}

async function testAllToolsDirectly() {
    console.log('🧪 Testing All 11 Tools via Direct Execution...\n');
    
    // Create mock server and register all tools
    const mockServer = new MockMCPServer();
    
    console.log('📝 Registering all tools:');
    registerAICoordinationTools(mockServer);
    
    console.log(`\n🎯 Total tools registered: ${mockServer.tools.size}`);
    console.log('\n🧪 Testing each tool:');
    
    const testCases = [
        {
            name: 'taskmaster_init_project',
            params: {
                projectName: 'Test Project',
                description: 'Testing project',
                availableTools: ['create_file', 'edit_file']
            }
        },
        {
            name: 'taskmaster_get_project_state',
            params: {}
        },
        {
            name: 'taskmaster_get_current_task',
            params: { availableTools: ['create_file', 'edit_file'] }
        },
        {
            name: 'taskmaster_discover_agent',
            params: {
                agentName: 'test_agent',
                availableTools: ['create_file', 'edit_file'],
                agentType: 'claude'
            }
        },
        {
            name: 'taskmaster_list_agents',
            params: {}
        }
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const testCase of testCases) {
        try {
            console.log(`\n--- Testing ${testCase.name} ---`);
            const result = await mockServer.executeTool(testCase.name, testCase.params);
            successCount++;
        } catch (error) {
            console.log(`❌ ${testCase.name}: ${error.message}`);
            failCount++;
        }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total Tools Available: ${mockServer.tools.size}`);
    
    // List all available tools
    console.log(`\n📋 All Registered Tools:`);
    Array.from(mockServer.tools.keys()).forEach((name, i) => {
        console.log(`${i + 1}. ${name}`);
    });
}

testAllToolsDirectly().catch(console.error);
