# Phase 3 Feature Mockups

This file contains ASCII mockups for the features proposed in the `phase-3-enhancements.md` plan.

---

### **Mockup 1: Proactive Workflow Intelligence (UX-007)**

This is how the `guidant status` command could look. It displays the current task, as `Taskmaster` does, but enhances it with a new "Proactive Guidance" section at the bottom.

```text
$ guidant status

┌───────────────────────────────────────────────────────────────────────────┐
│ 📂 Project: QuantumLeap CRM                                               │
│ ⏱️  Phase: 2 of 5 - Backend Implementation                                │
└───────────────────────────────────────────────────────────────────────────┘

┌─ SINGLE TASK FOCUS ──────────────────────────────────────────────────────┐
│                                                                           │
│ 🆔 Task: #12 - Implement User Authentication API                          │
│ 📝 Desc: Create endpoints for user registration, login, and logout.       │
│  статуS: In Progress                                                     │
│ 🔗 Depends on: #11 - Finalize Database Schema (✅ Done)                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ 💡 PROACTIVE GUIDANCE ───────────────────────────────────────────────────┐
│                                                                           │
│ 🟡 WARNING: This task has 3 subtasks, but none are 'in-progress'.         │
│            Consider starting a subtask to show progress.                  │
│                                                                           │
│ 🚀 SUGGESTION: The next logical task, #14, has a high complexity          │
│               score (8/10). You might want to break it down before        │
│               starting.                                                   │
│                                                                           │
│    👉 Run: guidant breakdown 14                                           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### **Mockup 2: AI-Powered Task Breakdown (UX-008)**

This mockup shows the user flow for the new `guidant breakdown` command. It demonstrates the AI interaction, the proposed subtasks, and the confirmation step.

```text
$ guidant breakdown 14

🤖 Analyzing task #14: "Integrate third-party payment gateway"...
⠋ [AI is thinking] Generating subtasks based on best practices...

┌─ AI-POWERED TASK BREAKDOWN ───────────────────────────────────────────────┐
│                                                                           │
│ The AI has proposed the following subtasks for "Integrate third-party     │
│ payment gateway":                                                         │
│                                                                           │
│    1. Research and select payment gateway provider (e.g., Stripe, Braintree). │
│    2. Create a new 'PaymentService' module.                               │
│    3. Implement API client for the selected gateway.                      │
│    4. Add 'create-payment-intent' endpoint.                               │
│    5. Secure endpoints and handle API keys safely.                        │
│    6. Add webhook handler to process payment status updates.              │
│    7. Write integration tests for the payment flow.                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

? Do you want to add these 7 subtasks to task #14? (Y/n) › Yes
? Would you like to scaffold empty files for these new subtasks? (y/N) › No

✅ Success! 7 new subtasks have been added to task #14.
```

---

### **Mockup 3: Interactive Workflow Dashboard (UX-009)**

This is a conceptual mockup of the interactive TUI dashboard. The user can navigate the task graph on the left with arrow keys, and the details for the selected task appear on the right.

```text
┌─ Guidant Interactive Dashboard ───────────────────────────────────────────┐
│                                                                           │
│ WORKFLOW GRAPH (Navigate with ↑↓)         TASK DETAILS (ID: #12)          │
│ ─────────────────────────                   ──────────────────────────   │
│                                             📝 Description:               │
│  [Phase 1: Planning]                        Create endpoints for user     │
│    ✅ #1 - Define requirements              registration, login, and      │
│    ✅ #2 - Design architecture              logout. Use JWT for session   │
│                                             management.                   │
│  [Phase 2: Backend]                                                       │
│    ✅ #11 - Finalize DB Schema              статуS: In Progress           │
│  > ➡️ #12 - Auth API                       🔗 Depends On: #11 (Done)     │
│    │  - ⚪ #12.1 - Register endpoint                                      │
│    │  - ⚪ #12.2 - Login endpoint          SUBTASKS:                     │
│    │  - ⚪ #12.3 - Logout endpoint         (3 total, 0 done)             │
│    │                                                                     │
│    ⚪ #14 - Payment Gateway                 Press [S] to change status    │
│    ⚪ #15 - User Profile API                Press [D] to see details      │
│                                                                           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
│ Press [Q] to Quit | [H] for Help                                          │
└───────────────────────────────────────────────────────────────────────────┘
```
