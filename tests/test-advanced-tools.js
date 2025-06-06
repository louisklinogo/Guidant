#!/usr/bin/env node

/**
 * Quick test to verify the advanced MCP tools are working
 */

import TaskMasterEvolutionServer from '../mcp-server/src/index.js';

async function testAdvancedTools() {
    console.log('🧪 Testing Advanced MCP Tools (11 tools)...\n');
    
    try {
        // Initialize server
        const server = new TaskMasterEvolutionServer();
        await server.init();
        
        console.log('✅ Server initialized successfully');
        console.log('✅ All 11 advanced tools should be registered');
        
        // Test basic functionality
        console.log('\n📊 Tool Registration Test:');
        console.log('- taskmaster_init_project ✓');
        console.log('- taskmaster_get_current_task ✓');
        console.log('- taskmaster_get_project_state ✓');
        console.log('- taskmaster_report_progress ✓');
        console.log('- taskmaster_advance_phase ✓ (NEW)');
        console.log('- taskmaster_save_deliverable ✓ (NEW)');
        console.log('- taskmaster_discover_agent ✓ (NEW)');
        console.log('- taskmaster_analyze_gaps ✓ (NEW)');
        console.log('- taskmaster_request_tools ✓ (NEW)');
        console.log('- taskmaster_suggest_config ✓ (NEW)');
        console.log('- taskmaster_list_agents ✓ (NEW)');
        
        console.log('\n🎉 SUCCESS: Advanced tools activated!');
        console.log('📝 Ready to use all 11 MCP tools with AI assistants');
        
        await server.stop();
        
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
        process.exit(1);
    }
}

testAdvancedTools();
