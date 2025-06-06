/**
 * Test Universal TaskMaster Evolution System
 * Demonstrates agent discovery, gap analysis, and tool configuration
 */

import { discoverAgent, globalAgentRegistry } from './src/agent-registry/agent-discovery.js';
import { analyzeAgentGaps } from './src/agent-registry/gap-analysis.js';
import { getConfigurationSuggestions, requestToolsForAgent } from './src/agent-registry/tool-configurator.js';

/**
 * Test different AI agent scenarios
 */
async function testUniversalTaskMaster() {
  console.log('🚀 Testing Universal TaskMaster Evolution System\n');

  // === Scenario 1: Claude (Current Agent) ===
  console.log('=== SCENARIO 1: CLAUDE AGENT ===');
  const claudeAgent = await discoverAgent({
    type: 'config',
    config: {
      identity: { name: 'Claude', type: 'anthropic_ai' },
      tools: ['create_file', 'edit_file', 'read_file', 'list_directory', 'web_search', 'read_web_page', 'tavily-search', 'mermaid', 'Bash', 'get_diagnostics'],
      capabilities: {
        strengths: ['code_generation', 'analysis', 'research'],
        limitations: ['no_direct_api_access', 'no_persistent_state']
      }
    }
  }, 'claude_current');

  console.log(`Agent: ${claudeAgent.identity.name}`);
  console.log(`Tools: ${claudeAgent.tools.length} available`);
  console.log(`Strongest Roles: ${claudeAgent.strongestRoles.join(', ')}\n`);

  // Analyze gaps for Claude
  const claudeGaps = await analyzeAgentGaps(claudeAgent);
  console.log(`Gap Score: ${claudeGaps.totalGapScore}/100`);
  console.log(`Top 3 Recommendations:`);
  claudeGaps.prioritizedRecommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec.name} (${rec.priority}) - Benefits: ${rec.benefitsRoles.join(', ')}`);
  });

  // Get configuration suggestions
  const claudeConfig = await getConfigurationSuggestions(claudeAgent);
  console.log(`\nConfiguration Plan: ${claudeConfig.implementationPlan.phases.length} phases`);
  console.log(`Time Estimate: ${claudeConfig.implementationPlan.totalTimeEstimate}\n`);

  // === Scenario 2: Enhanced GPT Agent ===
  console.log('=== SCENARIO 2: ENHANCED GPT AGENT ===');
  const gptAgent = await discoverAgent({
    type: 'config',
    config: {
      identity: { name: 'GPT-4', type: 'openai' },
      tools: ['create_file', 'edit_file', 'read_file', 'web_search', 'git', 'playwright', 'docker', 'database_query', 'slack_integration'],
      capabilities: {
        strengths: ['code_generation', 'system_integration', 'deployment'],
        limitations: ['limited_realtime_data']
      }
    }
  }, 'gpt_enhanced');

  console.log(`Agent: ${gptAgent.identity.name}`);
  console.log(`Tools: ${gptAgent.tools.length} available`);
  console.log(`Strongest Roles: ${gptAgent.strongestRoles.join(', ')}`);
  
  const gptGaps = await analyzeAgentGaps(gptAgent);
  console.log(`Gap Score: ${gptGaps.totalGapScore}/100`);
  
  // Show confidence comparison
  console.log(`\nRole Confidence Comparison:`);
  ['research', 'development', 'testing', 'deployment'].forEach(role => {
    const claudeConf = (claudeAgent.roleAnalysis[role]?.confidence * 100).toFixed(0);
    const gptConf = (gptAgent.roleAnalysis[role]?.confidence * 100).toFixed(0);
    console.log(`  ${role}: Claude ${claudeConf}% vs GPT ${gptConf}%`);
  });

  // === Scenario 3: Limited Agent Needs Help ===
  console.log('\n=== SCENARIO 3: LIMITED AGENT NEEDS HELP ===');
  const limitedAgent = await discoverAgent({
    type: 'config',
    config: {
      identity: { name: 'BasicBot', type: 'limited_ai' },
      tools: ['create_file', 'edit_file', 'read_file'],
      capabilities: {
        strengths: ['basic_file_operations'],
        limitations: ['no_web_access', 'no_system_access', 'no_testing_tools']
      }
    }
  }, 'basic_bot');

  console.log(`Agent: ${limitedAgent.identity.name}`);
  console.log(`Tools: ${limitedAgent.tools.length} available`);
  console.log(`Can fulfill roles: ${limitedAgent.strongestRoles.join(', ') || 'None fully'}`);

  const limitedGaps = await analyzeAgentGaps(limitedAgent);
  console.log(`Gap Score: ${limitedGaps.totalGapScore}/100 (higher = more gaps)`);

  // Request essential tools
  const toolRequest = await requestToolsForAgent(
    limitedAgent.id, 
    ['tavily-search', 'git', 'Bash'], 
    { taskType: 'development_project', urgency: 'high' }
  );

  console.log(`\nTool Request Generated:`);
  console.log(`Request ID: ${toolRequest.id}`);
  console.log(`Reasoning: ${toolRequest.reasoning.summary}`);
  console.log(`Urgency: ${toolRequest.reasoning.urgency}`);

  console.log(`\nConfiguration Instructions Preview:`);
  toolRequest.instructions.steps.slice(0, 2).forEach(step => {
    console.log(`- ${step.tool}: ${step.description}`);
  });

  // === Scenario 4: Specialized Agent ===
  console.log('\n=== SCENARIO 4: SPECIALIZED TESTING AGENT ===');
  const testingAgent = await discoverAgent({
    type: 'config',
    config: {
      identity: { name: 'TestMaster', type: 'specialized_testing' },
      tools: ['create_file', 'edit_file', 'read_file', 'playwright', 'jest', 'Bash', 'get_diagnostics', 'git'],
      capabilities: {
        strengths: ['e2e_testing', 'test_automation', 'quality_assurance'],
        limitations: ['limited_research_capabilities', 'no_deployment_tools']
      }
    }
  }, 'test_master');

  console.log(`Agent: ${testingAgent.identity.name}`);
  console.log(`Testing Confidence: ${(testingAgent.roleAnalysis.testing?.confidence * 100).toFixed(0)}%`);
  console.log(`Development Confidence: ${(testingAgent.roleAnalysis.development?.confidence * 100).toFixed(0)}%`);

  // === Summary ===
  console.log('\n=== UNIVERSAL TASKMASTER SUMMARY ===');
  const allAgents = globalAgentRegistry.listAgents();
  console.log(`Total Agents Discovered: ${allAgents.length}`);
  
  console.log(`\nBest Agent for Each Role:`);
  ['research', 'design', 'development', 'testing', 'deployment'].forEach(role => {
    const bestAgent = globalAgentRegistry.findBestAgentForRole(role);
    if (bestAgent) {
      const confidence = (bestAgent.roleAnalysis[role]?.confidence * 100).toFixed(0);
      console.log(`  ${role}: ${bestAgent.identity.name} (${confidence}% confidence)`);
    } else {
      console.log(`  ${role}: No capable agent found`);
    }
  });

  console.log('\n✅ Universal TaskMaster Evolution System Test Complete!');
  console.log('The system can now:');
  console.log('- Discover any AI agent\'s capabilities');
  console.log('- Analyze gaps and provide specific recommendations');
  console.log('- Generate tool configuration instructions');
  console.log('- Match optimal agents to project roles');
  console.log('- Request missing tools with detailed reasoning');
}

// Run the test
testUniversalTaskMaster().catch(console.error);
