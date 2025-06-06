#!/usr/bin/env node

/**
 * Test MCP server configuration
 */

import { spawn } from 'child_process';
import path from 'path';

async function testMCPConfig() {
    console.log('🧪 Testing MCP Server Configuration...\n');
    
    const serverPath = path.resolve('../mcp-server/server.js');
    console.log(`Server path: ${serverPath}`);
    
    // Test if server starts
    const server = spawn('node', [serverPath], {
        cwd: path.resolve('..'),
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });
    
    // Give server time to start
    setTimeout(() => {
        server.kill();
        
        console.log('📊 Test Results:');
        
        if (errorOutput && !errorOutput.includes('could not infer client capabilities')) {
            console.log('❌ Server failed to start');
            console.log('Error:', errorOutput);
        } else {
            console.log('✅ Server starts successfully');
            console.log('✅ Ready for MCP integration');
            
            if (errorOutput.includes('could not infer client capabilities')) {
                console.log('ℹ️  Warning about client capabilities is normal when testing');
            }
        }
        
        console.log('\n📝 To add to your AI assistant:');
        console.log('1. Add TaskMaster to your MCP configuration');
        console.log('2. Restart your AI assistant');
        console.log('3. You\'ll have access to all 11 tools:');
        
        const tools = [
            'taskmaster_init_project',
            'taskmaster_get_current_task', 
            'taskmaster_get_project_state',
            'taskmaster_report_progress',
            'taskmaster_advance_phase',
            'taskmaster_save_deliverable',
            'taskmaster_discover_agent',
            'taskmaster_analyze_gaps',
            'taskmaster_request_tools',
            'taskmaster_suggest_config',
            'taskmaster_list_agents'
        ];
        
        tools.forEach((tool, i) => {
            console.log(`   ${i + 1}. ${tool}`);
        });
        
    }, 2000);
}

testMCPConfig().catch(console.error);
