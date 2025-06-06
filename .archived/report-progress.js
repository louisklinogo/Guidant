import { markDeliverableComplete, generateNextTask } from '../src/workflow-logic/workflow-engine.js';
import { readProjectFile } from '../src/file-management/project-structure.js';
import { AI_CAPABILITIES } from '../src/constants/paths.js';

async function reportProgress() {
  console.log('📊 Reporting Progress to TaskMaster...\n');
  
  // Mark market analysis as complete
  console.log('✅ Marking market_analysis deliverable as complete...');
  await markDeliverableComplete('market_analysis');
  
  // Get capabilities for next task
  const capabilities = await readProjectFile(AI_CAPABILITIES);
  
  // Get next task
  console.log('📋 Getting next systematic task...');
  const nextTask = await generateNextTask(capabilities);
  
  if (nextTask.type === 'task_ticket') {
    console.log(`\n🎯 Next Assignment:`);
    console.log(`   Role: ${nextTask.role}`);
    console.log(`   Task: ${nextTask.ticket.title}`);
    console.log(`   Deliverable: ${nextTask.deliverable}`);
    console.log(`   Estimated Time: ${nextTask.estimatedDuration} minutes`);
    console.log(`   Tools Required: ${nextTask.requiredTools.join(', ')}`);
    
    console.log('\n📋 Next Systematic Steps:');
    nextTask.ticket.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
    
    if (nextTask.ticket.limitations?.length > 0) {
      console.log('\n⚠️  Limitations to consider:');
      nextTask.ticket.limitations.forEach(limitation => {
        console.log(`   - ${limitation}`);
      });
    }
  } else if (nextTask.type === 'phase_review') {
    console.log(`\n🔍 ${nextTask.message}`);
    console.log('   All concept phase deliverables completed!');
  }
}

reportProgress();
