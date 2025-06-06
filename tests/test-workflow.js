import { discoverCapabilities } from './src/ai-coordination/capability-discovery.js';
import { generateNextTask, markDeliverableComplete } from './src/workflow-logic/workflow-engine.js';

async function testSystematicWorkflow() {
  console.log('🤖 Acting as AI Assistant with TaskMaster Evolution\n');
  
  // Step 1: Discover my capabilities
  const myTools = [
    'web_search', 'read_web_page', 'create_file', 'edit_file', 'read_file', 
    'list_directory', 'mermaid', 'Bash', 'get_diagnostics', 'tavily-search', 
    'tavily-extract', 'codebase_search_agent', 'Grep'
  ];
  
  console.log('🔍 Step 1: Discovering my capabilities...');
  const capabilities = await discoverCapabilities(myTools);
  
  for (const [role, analysis] of Object.entries(capabilities.roles)) {
    const confidence = Math.round(analysis.confidence * 100);
    const status = analysis.canFulfill ? `✓ ${confidence}%` : '✗ Missing tools';
    console.log(`   ${role}: ${status}`);
  }
  
  // Step 2: Get my first systematic task
  console.log('\n📋 Step 2: Getting my first systematic task...');
  const task = await generateNextTask(capabilities);
  
  if (task.type === 'task_ticket') {
    console.log(`   🎯 Assigned Role: ${task.role}`);
    console.log(`   📝 Task: ${task.ticket.title}`);
    console.log(`   📦 Deliverable: ${task.deliverable}`);
    console.log(`   ⏱️  Estimated Time: ${task.estimatedDuration} minutes`);
    console.log(`   🔧 Required Tools: ${task.requiredTools.join(', ')}`);
    
    console.log('\n   📋 My systematic steps:');
    task.ticket.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
    
    return task;
  }
}

testSystematicWorkflow();
