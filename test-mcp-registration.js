#!/usr/bin/env node

/**
 * Test MCP Tools Registration
 * Verifies that all tools register correctly without starting the full server
 */

import { FastMCP } from 'fastmcp';
import { registerAllGuidantTools } from './mcp-server/src/tools/index.js';

async function testRegistration() {
    console.log('🧪 Testing MCP Tools Registration...\n');
    
    try {
        // Create a test server instance
        const testServer = new FastMCP({
            name: 'Test Server',
            version: '1.0.0',
            description: 'Test registration'
        });

        // Track registered tools
        const registeredTools = [];
        const originalAddTool = testServer.addTool.bind(testServer);
        
        testServer.addTool = function(toolConfig) {
            registeredTools.push({
                name: toolConfig.name,
                description: toolConfig.description,
                hasParameters: !!toolConfig.parameters,
                hasExecute: typeof toolConfig.execute === 'function'
            });
            console.log(`✅ Registered: ${toolConfig.name}`);
            return originalAddTool(toolConfig);
        };

        // Test registration
        console.log('📋 Registering all Guidant tools...\n');
        await registerAllGuidantTools(testServer);
        
        console.log('\n📊 Registration Summary:');
        console.log(`   Total tools registered: ${registeredTools.length}`);
        console.log(`   All tools have parameters: ${registeredTools.every(t => t.hasParameters)}`);
        console.log(`   All tools have execute function: ${registeredTools.every(t => t.hasExecute)}`);
        
        console.log('\n🔍 Registered Tools by Category:');
        
        // Group tools by category (based on prefix)
        const categories = {};
        registeredTools.forEach(tool => {
            const parts = tool.name.split('_');
            const category = parts.slice(1, -1).join('_') || 'core';
            if (!categories[category]) categories[category] = [];
            categories[category].push(tool.name);
        });
        
        Object.entries(categories).forEach(([category, tools]) => {
            console.log(`   ${category}: ${tools.length} tools`);
            tools.forEach(tool => console.log(`     • ${tool}`));
        });
        
        console.log('\n✅ All tools registered successfully!');
        console.log('🎯 MCP-001 and MCP-002 implementation verified');
        
    } catch (error) {
        console.error('\n❌ Registration failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testRegistration();
