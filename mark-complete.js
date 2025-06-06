import { markDeliverableComplete, generateNextTask } from './src/workflow-logic/workflow-engine.js';
import { readProjectFile } from './src/file-management/project-structure.js';
import { AI_CAPABILITIES } from './src/constants/paths.js';

async function markUserPersonasComplete() {
  console.log('✅ Marking user_personas as complete...');
  await markDeliverableComplete('user_personas');
  
  const capabilities = await readProjectFile(AI_CAPABILITIES);
  const nextTask = await generateNextTask(capabilities);
  
  if (nextTask.type === 'task_ticket') {
    console.log(`\n🎯 Next Task: ${nextTask.ticket.title}`);
    console.log(`📦 Deliverable: ${nextTask.deliverable}`);
  } else if (nextTask.type === 'phase_review') {
    console.log(`\n🔍 ${nextTask.message}`);
  }
}

markUserPersonasComplete();
