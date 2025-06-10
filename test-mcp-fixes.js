#!/usr/bin/env node

/**
 * Test script to verify MCP tool fixes
 */

import { guidant_init_project, guidant_get_project_state, guidant_discover_agent } from './direct-mcp-interface.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testProjectRoot = path.join(__dirname, 'test-project');

async function testMCPFixes() {
  console.log('🧪 Testing MCP Tool Fixes\n');
  
  try {
    // Test 1: Project State (should fail - not initialized)
    console.log('1. Testing guidant_get_project_state...');
    const stateResult = await guidant_get_project_state({ projectRoot: testProjectRoot });
    console.log('✅ Project state check:', stateResult.success === false ? 'PASS' : 'FAIL');
    
    // Test 2: Project Initialization with explicit path
    console.log('\n2. Testing guidant_init_project with explicit path...');
    const initResult = await guidant_init_project({
      projectName: 'Test Project',
      description: 'Testing MCP fixes',
      availableTools: ['codebase-retrieval', 'str-replace-editor', 'view'],
      projectRoot: testProjectRoot
    });
    console.log('✅ Project initialization:', initResult.success ? 'PASS' : 'FAIL');
    if (!initResult.success) {
      console.log('❌ Error:', initResult.error);
    }
    
    // Test 3: Agent Discovery (schema validation)
    console.log('\n3. Testing guidant_discover_agent...');
    const agentResult = await guidant_discover_agent({
      agentName: 'Test Agent',
      availableTools: ['codebase-retrieval', 'str-replace-editor', 'view', 'web-search'],
      agentType: 'claude'
    });
    console.log('✅ Agent discovery:', agentResult.success ? 'PASS' : 'FAIL');
    if (!agentResult.success) {
      console.log('❌ Error:', agentResult.error);
    }
    
    // Test 4: Project State (should succeed now)
    if (initResult.success) {
      console.log('\n4. Testing guidant_get_project_state after initialization...');
      const stateResult2 = await guidant_get_project_state({ projectRoot: testProjectRoot });
      console.log('✅ Project state after init:', stateResult2.success ? 'PASS' : 'FAIL');
    }
    
    console.log('\n🎉 MCP Tool Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMCPFixes();
