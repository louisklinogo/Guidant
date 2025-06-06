#!/usr/bin/env node

/**
 * Test script to simulate AI assistant interaction with TaskMaster Evolution
 */

import { discoverCapabilities } from './src/ai-coordination/capability-discovery.js';
import { generateNextTask, getCurrentWorkflowState, markDeliverableComplete } from './src/workflow-logic/workflow-engine.js';
import { initializeProjectStructure, isProjectInitialized, getProjectState } from './src/file-management/project-structure.js';

async function testWorkflow() {
	console.log('🧪 Testing TaskMaster Evolution Workflow\n');

	try {
		// Simulate available tools (what Claude would have)
		const availableTools = [
			'create_file', 'edit_file', 'read_file', 'list_directory',
			'web_search', 'read_web_page', 'tavily-search', 'mermaid', 
			'Bash', 'get_diagnostics'
		];

		console.log('1️⃣ Initializing project (simulating taskmaster_init_project)...');
		if (!(await isProjectInitialized())) {
			await initializeProjectStructure();
		}

		// Discover capabilities
		console.log('2️⃣ Discovering AI capabilities...');
		const capabilities = await discoverCapabilities(availableTools);
		console.log(`   Found ${Object.keys(capabilities.roles).length} role capabilities`);
		
		for (const [role, analysis] of Object.entries(capabilities.roles)) {
			const confidence = Math.round(analysis.confidence * 100);
			const status = analysis.canFulfill ? `✓ ${confidence}%` : '✗ Missing tools';
			console.log(`   ${role}: ${status}`);
		}

		console.log('\n3️⃣ Getting current task (simulating taskmaster_get_current_task)...');
		const task = await generateNextTask(capabilities);
		
		if (task.type === 'task_ticket') {
			console.log(`   📋 Task: ${task.ticket.title}`);
			console.log(`   🎯 Deliverable: ${task.deliverable}`);
			console.log(`   👤 Role: ${task.role}`);
			console.log(`   ⏱️  Estimated: ${task.estimatedDuration} minutes`);
			console.log(`   🔧 Tools: ${task.requiredTools.join(', ')}`);
			
			console.log('\n   📝 Steps:');
			task.ticket.steps.forEach((step, i) => {
				console.log(`   ${i + 1}. ${step}`);
			});

			if (task.ticket.limitations && task.ticket.limitations.length > 0) {
				console.log('\n   ⚠️  Limitations:');
				task.ticket.limitations.forEach(limitation => {
					console.log(`   - ${limitation}`);
				});
			}

			console.log('\n4️⃣ Simulating work completion...');
			console.log('   [AI would execute the task steps here]');

			// Simulate marking deliverable complete
			console.log(`   ✅ Marking "${task.deliverable}" as complete...`);
			await markDeliverableComplete(task.deliverable);

			console.log('\n5️⃣ Getting next task...');
			const nextTask = await generateNextTask(capabilities);
			
			if (nextTask.type === 'task_ticket') {
				console.log(`   📋 Next Task: ${nextTask.ticket.title}`);
				console.log(`   🎯 Next Deliverable: ${nextTask.deliverable}`);
			} else if (nextTask.type === 'phase_review') {
				console.log(`   🔍 Phase Review: ${nextTask.message}`);
			} else if (nextTask.type === 'phase_transition') {
				console.log(`   🚀 Phase Transition: ${nextTask.message}`);
			}
		} else {
			console.log(`   ❌ Cannot proceed: ${task.message}`);
		}

		console.log('\n6️⃣ Final project state...');
		const finalState = await getProjectState();
		console.log(`   Current Phase: ${finalState.phases.current}`);
		console.log(`   Project: ${finalState.config.name || 'Unnamed'}`);

		console.log('\n🎉 Workflow test completed successfully!');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error('Stack trace:', error.stack);
	}
}

// Run the test
testWorkflow();
