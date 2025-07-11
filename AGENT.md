# Guidant Evolution Agent Guidelines (Claude Sonnet 4 Optimized)

## Project Mission
Guidant is a **systematic workflow orchestrator** for AI coding agents that enforces SOLID principles and modern software engineering practices. It solves AI agents' core problems: context loss, lack of systematic processes, poor research habits, and inconsistent execution. The goal is to make AI agents follow proper SDLC workflows while presenting only business decisions to users.

**Note**: TaskMaster was the legacy version - all files/directories with "legacy" in the name refer to the old TaskMaster system.

## Commands
- **Test**: `bun test` (all tests), `bun test --watch` (watch mode)
- **Run MCP Server**: `bun run mcp-server`
- **Start**: `bun start` (main entry point)
- **Build**: `bun run build`
- **Dev**: `bun run dev`

## Core Principles

### Primary Engineering Principles
- **Systematic Over Speed**: Always enforce proper research → plan → implement → test cycles
- **Context Preservation**: Maintain complete project history and decision tracking
- **Business-Focused UX**: Hide technical complexity, present only business choices to users
- **Tool Usage Enforcement**: Require Tavily/Context7 research before major decisions
- **Quality Gates**: Block progression until requirements are met

### SOLID Principles Integration

#### Single Responsibility Principle (SRP)
- **One Purpose Per Module**: Each class/module should have exactly one reason to change
- **Function Granularity**: Functions should do one thing exceptionally well
- **Clear Separation**: Business logic, data access, and presentation layers must be distinct
- **Example**: `WorkflowOrchestrator` handles only workflow coordination, not file I/O

#### Open/Closed Principle (OCP)
- **Extension-Ready Architecture**: Design for adding new features without modifying existing code
- **Plugin Architecture**: Use interfaces and dependency injection for extensibility
- **Strategy Pattern**: Implement multiple algorithms (research tools, workflow types) as interchangeable strategies
- **Configuration-Driven**: Use config files to alter behavior without code changes

#### Liskov Substitution Principle (LSP)
- **Interface Contracts**: All implementations of an interface must be fully substitutable
- **Behavioral Consistency**: Subclasses must honor the contracts of their parent classes
- **Tool Abstraction**: Research tools (Tavily, Context7) must implement identical interfaces
- **Workflow Types**: Different workflow implementations must work identically from the orchestrator's perspective

#### Interface Segregation Principle (ISP)
- **Focused Interfaces**: Create small, specific interfaces rather than large, monolithic ones
- **Role-Based Design**: Define interfaces based on client needs, not implementation capabilities
- **Minimal Dependencies**: Clients should only depend on methods they actually use
- **Example**: Separate `IResearchProvider`, `IContextManager`, and `IWorkflowExecutor` interfaces

#### Dependency Inversion Principle (DIP)
- **Abstraction Dependencies**: High-level modules should not depend on low-level modules
- **Dependency Injection**: Use constructor injection to provide dependencies
- **Interface-Based Design**: Depend on abstractions, not concrete implementations
- **Inversion of Control**: Let the framework manage object lifecycle and dependencies

## Claude Sonnet 4 Optimization Guidelines

### Leverage Advanced Reasoning
- **Multi-Step Analysis**: Break complex problems into logical reasoning chains
- **Context Synthesis**: Use Claude's ability to maintain context across long conversations
- **Pattern Recognition**: Leverage Claude's pattern matching for code quality and architecture issues
- **Decision Trees**: Present complex technical decisions as structured decision trees

### Prompt Engineering Best Practices
- **Clear Instructions**: Use specific, actionable language with concrete examples
- **Structured Requests**: Format requests with clear sections and expected outputs
- **Context Framing**: Provide relevant background before asking for implementation
- **Output Formatting**: Specify desired response format (code blocks, documentation, etc.)

### Advanced Code Analysis
- **Architecture Review**: Request comprehensive architecture analysis before major changes
- **Code Quality Assessment**: Use Claude's ability to identify code smells and anti-patterns
- **Security Analysis**: Leverage security knowledge for vulnerability detection
- **Performance Optimization**: Request performance analysis and optimization suggestions

## Code Style & Architecture

### ES Modules & Modern JavaScript
- **ES Modules**: Use `import/export` syntax with `.js` extensions
- **Modern Syntax**: Leverage async/await, destructuring, template literals
- **Type Safety**: Use JSDoc for type hints, consider TypeScript for complex modules
- **Module Boundaries**: Clear separation between domain layers

### Documentation Standards
- **JSDoc**: Document all public APIs with `/**` style comments
- **Inline Comments**: Explain complex business logic and architectural decisions
- **README Files**: Maintain up-to-date documentation for each major module
- **Architecture Diagrams**: Use Mermaid diagrams to visualize system architecture

### Error Handling & Resilience
- **Structured Error Handling**: Use try/catch blocks with specific error types
- **Result Objects**: Return `{ success, error, message, data }` objects consistently
- **Graceful Degradation**: System should continue functioning when non-critical components fail
- **Circuit Breaker Pattern**: Implement failure isolation for external dependencies

### Import Organization
```javascript
// External packages first
import fs from 'fs/promises';
import path from 'path';

// Internal modules by layer (domain, infrastructure, application)
import { WorkflowOrchestrator } from './domain/workflow/WorkflowOrchestrator.js';
import { FileSystemAdapter } from './infrastructure/FileSystemAdapter.js';
import { ResearchService } from './application/ResearchService.js';
```

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserData`, `workflowConfig`)
- **Classes/Interfaces**: PascalCase (`WorkflowOrchestrator`, `IResearchProvider`)
- **Constants**: UPPER_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Files**: kebab-case for modules (`workflow-orchestrator.js`), PascalCase for classes (`WorkflowOrchestrator.js`)

## Testing Strategy

### Test Architecture
- **Bun Test**: Native Bun test runner with built-in TypeScript support
- **Test Location**: All test files in `tests/` directory structure mirroring `src/`
- **Test Categories**: Unit tests, integration tests, end-to-end tests
- **Mock Strategy**: Mock external dependencies, test business logic in isolation

### Test Structure
```javascript
import { describe, it, expect, mock } from 'bun:test';

describe('WorkflowOrchestrator', () => {
  describe('when starting a new workflow', () => {
    it('should validate prerequisites before execution', () => {
      // Arrange, Act, Assert pattern
    });
  });
});
```

### Testing Commands
- **All Tests**: `bun test`
- **Watch Mode**: `bun test --watch`
- **Coverage**: `bun test --coverage`
- **Specific Test**: `bun test --grep "specific test name"`

## Project Structure & Organization

### Directory Architecture
```
src/
├── domain/           # Business logic and entities
│   ├── workflow/     # Workflow orchestration domain
│   ├── context/      # Context management domain
│   └── research/     # Research coordination domain
├── application/      # Application services and use cases
├── infrastructure/   # External dependencies and adapters
└── interfaces/       # API and UI interfaces

mcp-server/
├── src/
│   ├── tools/        # MCP server tools
│   └── schemas/      # Zod validation schemas

tests/                # Mirror src/ structure
├── unit/
├── integration/
└── e2e/

.guidant/            # Project state and context
logs/                # Work completion logs
```

### State Management
- **Project Context**: Stored in `.guidant/` directory
- **Session State**: Maintained in memory during execution
- **Historical Data**: Preserved in structured logs
- **Configuration**: Environment-specific settings in config files

## Development Workflow

### Phase-Based Development
1. **Phase 1**: ✅ **COMPLETE** - Core MCP integration and file management reliability
2. **Phase 2**: Enhanced workflow orchestration with SOLID architecture
3. **Phase 3**: Business decision translation and improved UX
4. **Phase 4**: Multi-project support and template systems

### Research-First Approach
- **Tool Requirements**: Must use Tavily/Context7 before architectural decisions
- **Documentation Review**: Research existing patterns and best practices
- **Validation Process**: Verify assumptions with external sources
- **Decision Documentation**: Record rationale for all major technical decisions

### Quality Gates
- **Code Review**: Automated analysis for SOLID principle violations
- **Test Coverage**: Minimum 80% coverage for business logic
- **Documentation**: All public APIs must be documented
- **Performance**: No regressions in critical path performance

## Work Completion Logging

### Enhanced Logging Requirements
**MANDATORY**: After completing any significant work session, create a comprehensive log in `logs/`.

#### Log File Structure
- **Filename**: `{phase/feature}-{YYYY-MM-DD}-{HH-mm-ss}.md`
- **Format**: Use current date and time for precise session tracking
- **Example**: `phase2-workflow-enhancement-2025-06-09-14-30-45.md`
- **Template**: Use structured template for consistency

#### Required Sections
```markdown
# {Phase/Feature} - {YYYY-MM-DD HH:mm:ss}

## Session Info
- **Start Time**: {HH:mm:ss}
- **End Time**: {HH:mm:ss}
- **Duration**: {X hours Y minutes}
- **Agent**: Claude Sonnet 4

## Executive Summary
Brief overview for stakeholders

## Technical Implementation
### Architecture Changes
### SOLID Principles Application
### Code Quality Improvements

## Files Modified
### Created
- `path/to/file.js` - Description of purpose
### Modified
- `path/to/file.js` - What was changed and why
### Deleted
- `path/to/file.js` - Reason for removal

## Testing Evidence
### Unit Tests
### Integration Tests
### Manual Testing

## Research Conducted
### External Sources
### Best Practices Applied
### Alternative Approaches Considered

## Issues & Resolutions
### Problems Encountered
### Solutions Implemented
### Lessons Learned

## Impact Assessment
### System Improvements
### Technical Debt Changes
### Performance Impact

## Next Steps
### Immediate Actions
### Future Considerations
### Risk Mitigation
```

### Logging Triggers
- Completion of development phases
- Major architectural changes
- SOLID principle refactoring
- Critical bug resolutions
- Performance optimizations
- New feature implementations

## What Guidant IS and IS NOT

### What Guidant IS
- A **systematic workflow orchestrator** that enforces proper software engineering practices
- A **context management system** with long-term memory and decision tracking
- A **business decision translator** that abstracts technical complexity
- A **quality enforcement system** that ensures SOLID principles and best practices
- A **research-driven development tool** that requires validation before implementation

### What Guidant IS NOT
- Not a code generator or automated app builder
- Not attempting to replace human developers
- Not pursuing "one-command app creation" solutions
- Not building enterprise platforms or visual designers
- Not focused on AI research or experimental features
- Not ignoring established software engineering principles

## Success Metrics
- **Context Retention**: Zero loss of project context between sessions
- **Code Quality**: 100% adherence to SOLID principles in new code
- **Research Compliance**: All major decisions backed by external research
- **Documentation Coverage**: Complete documentation for all public APIs
- **Test Coverage**: Minimum 80% for business logic, 60% overall
- **Performance**: No degradation in critical workflow execution times