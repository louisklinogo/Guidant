# TaskMaster Evolution Agent Guidelines

## Project Mission
TaskMaster is a **systematic workflow orchestrator** for AI coding agents. It solves AI agents' core problems: context loss, lack of systematic processes, poor research habits, and inconsistent execution. The goal is to make AI agents follow proper SDLC workflows while presenting only business decisions to users.

## Commands
- **Test**: `npm test` (all tests), `npm run test:watch` (watch mode)
- **Run MCP Server**: `npm run mcp-server`
- **Start**: `npm start` (main entry point)
- **Build**: `npm run build`
- **Dev**: `npm run dev`

## Core Principles
- **Systematic Over Speed**: Always enforce proper research → plan → implement → test cycles
- **Context Preservation**: Maintain complete project history and decision tracking
- **Business-Focused UX**: Hide technical complexity, present only business choices to users
- **Tool Usage Enforcement**: Require Tavily/Context7 research before major decisions
- **Quality Gates**: Block progression until requirements are met

## Code Style
- **ES Modules**: Use `import/export` syntax with `.js` extensions
- **JSDoc**: Document functions with `/**` style comments
- **Error Handling**: Use try/catch blocks, return `{ success, error, message }` objects
- **Imports**: Group by type - external packages first, then internal modules
- **Naming**: camelCase for variables/functions, PascalCase for classes, UPPER_CASE for constants
- **File Structure**: Group related functionality in modules, use barrel exports where appropriate

## Testing
- Uses Jest with ES modules (`--experimental-vm-modules`)
- Test files: `*.test.js` in `__tests__` directories
- Mock with `jest.fn()`, use `describe/it` structure
- Single test: `npm test -- --testNamePattern="specific test"`

## Project Structure
- Main logic in `src/` with domain-specific subdirectories
- MCP server tools in `mcp-server/src/tools/`
- Uses Zod for schema validation in MCP tools
- `.taskmaster/` directory stores all project state and context

## Development Priorities
1. **Phase 1**: Fix core MCP integration and file management reliability
2. **Phase 2**: Enhance workflow orchestration and AI coordination
3. **Phase 3**: Improve business decision translation and user experience
4. **Phase 4**: Add multi-project support and template systems

## What TaskMaster IS NOT
- Not a code generator or app builder
- Not trying to replace developers
- Not attempting "one-command app creation"
- Not building enterprise platforms or visual designers
- Not pursuing AI research or cutting-edge features

## What TaskMaster IS
- A workflow orchestrator that guides AI agents through systematic processes
- A context management system that prevents AI session amnesia
- A business decision translator that hides technical complexity
- A quality gate enforcer that ensures proper SDLC practices
