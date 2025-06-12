# Guidant UX/Workflow Enhancement Plan (Phase 3)
**Date**: 2025-06-11
**Status**: PLANNING
**Priority**: HIGH

## 🎯 **INTRODUCTION**

This document outlines the plan for Phase 3 of Guidant's UX and workflow enhancement, building upon the simplification and visual adoption work completed in Phases 1 and 2. The focus of this phase is to leverage Guidant's advanced capabilities to create a user experience that is not only as polished as Taskmaster's but significantly more powerful and assistive.

## 📋 **IMPLEMENTATION ROADMAP (PHASE 3)**

### **Phase 3: Intelligent Guidance & Proactive Assistance**
**Goal**: Evolve Guidant from a task orchestrator to a proactive AI development partner.
**Effort**: TBD
**Priority**: HIGH

---

## 🎯 **YAML TASK TICKETS**

### **UX-007: Implement Proactive Workflow Intelligence**
```yaml
ticket_id: UX-007
title: Implement Proactive Workflow Intelligence and Guidance
type: feature
priority: critical
complexity: high
phase: intelligent_guidance
estimated_hours: 20

description: |
  Go beyond TaskMaster's static 'next' command by implementing a proactive guidance system. Guidant will analyze the entire project state, task dependencies, and complexity scores to provide intelligent, actionable advice directly in the status view.

acceptance_criteria:
  - Status command displays contextual warnings and suggestions
  - System identifies potential blockers (e.g., high-complexity, un-started dependency)
  - System suggests relevant commands (e.g., 'guidant breakdown <task-id>')
  - Advice is presented clearly using the boxen UI system
  - The feature can be disabled with a '--no-advice' flag

technical_specifications:
  new_files:
    - src/workflow-intelligence/ProactiveAdvisor.js
  files_to_modify:
    - src/cli/commands/status.js
    - src/cli/utils/guidant-ui.js
  logic_flow: |
    1. 'guidant status' command is run.
    2. After displaying the primary task, it calls ProactiveAdvisor.js.
    3. The advisor analyzes all tasks, dependencies, and statuses.
    4. It generates a list of suggestions (e.g., { type: 'warning', message: 'Task X is a blocker...', suggestion: 'Run guidant breakdown X' }).
    5. The suggestions are formatted by guidant-ui.js and displayed.

solid_principles:
  - SRP: Advisor's sole responsibility is to analyze and suggest; UI's is to display.
  - OCP: The advisor can be extended with new rules without modifying existing ones.

dependencies: [UX-006]
blockers: []
```

### **UX-008: AI-Powered Task Breakdown and Scaffolding**
```yaml
ticket_id: UX-008
title: Create AI-Powered Task Breakdown and Scaffolding
type: feature
priority: high
complexity: high
phase: intelligent_guidance
estimated_hours: 16

description: |
  Leverage Guidant's AI integration to create a 'breakdown' command. This command will take a high-level task and use an AI model to decompose it into a detailed list of actionable subtasks, automatically populating the workflow.

acceptance_criteria:
  - New 'guidant breakdown <task-id>' command is created
  - The command uses an AI model to generate relevant, logical subtasks
  - Generated subtasks are automatically added to the specified parent task
  - User is prompted to review and confirm the new subtasks before they are saved
  - An option '--scaffold' can be added to generate empty files for the new subtasks

technical_specifications:
  new_files:
    - src/cli/commands/breakdown.js
    - src/ai-integration/prompts/task-breakdown-prompt.js
  files_to_modify:
    - src/workflow-logic/task-modifier.js # Add bulk subtask creation
    - src/file-management/scaffolder.js
  logic_flow: |
    1. 'guidant breakdown <task-id>' is run.
    2. The command retrieves the task details.
    3. It constructs a prompt using task-breakdown-prompt.js.
    4. The prompt is sent to the configured AI model.
    5. The AI's response (a list of subtasks) is parsed and validated.
    6. The user is shown the proposed subtasks and asked for confirmation.
    7. On confirmation, the subtasks are added to the workflow.

solid_principles:
  - SRP: The breakdown command's responsibility is to orchestrate the AI and workflow update.
  - DIP: The command depends on an abstract AI service, not a specific implementation.

dependencies: [UX-007]
blockers: []
```

### **UX-009: Interactive Workflow Dashboard**
```yaml
ticket_id: UX-009
title: Create an Interactive Workflow Dashboard with Ink
type: feature
priority: medium
complexity: very-high
phase: intelligent_guidance
estimated_hours: 30

description: |
  Upgrade the 'guidant dashboard' to be a fully interactive TUI application using Ink/React. This will provide a visual and navigable representation of the entire project workflow, far surpassing TaskMaster's static table views.

acceptance_criteria:
  - Dashboard displays tasks and their dependencies in a graph-like structure
  - User can navigate between tasks using arrow keys
  - Selecting a task displays its full details in a side panel
  - The dashboard updates in real-time as the workflow state changes
  - Key commands (e.g., set status, view details) can be triggered from the dashboard

technical_specifications:
  files_to_enhance:
    - src/ui/ink/components/DashboardApp.jsx
  new_components:
    - src/ui/ink/components/WorkflowGraph.jsx
    - src/ui/ink/components/TaskDetailView.jsx
    - src/ui/ink/hooks/useWorkflowState.js
  approach: |
    - Use Ink and React to build a TUI.
    - The main component, DashboardApp, will manage the overall layout.
    - WorkflowGraph will render the dependency tree.
    - TaskDetailView will display information for the currently selected task.
    - A custom hook, useWorkflowState, will manage the application's state and handle updates.

solid_principles:
  - SRP: Each React component has a single, well-defined rendering purpose.
  - OCP: The dashboard can be extended with new views or components without altering existing ones.

dependencies: [UX-006]
blockers: []
```


