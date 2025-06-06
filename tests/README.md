# TaskMaster Evolution Tests

This directory contains all test files for TaskMaster Evolution.

## Test Structure

- **`*.test.js`** - Jest unit tests with ES modules
- **`test-*.js`** - Integration and manual tests

## Current Tests

### Unit Tests
- `context-manager.test.js` - Context management functionality

### Integration Tests  
- `test-advanced-tools.js` - Test all 11 MCP tools activation
- `test-tools-simulation.js` - Simulate MCP tool execution
- `test-all-11-tools.js` - Verify tool registration
- `test-mcp-config.js` - Test MCP server configuration

### Legacy Tests
- `test-mcp-connection.js` - MCP connection testing
- `test-mcp-integration.js` - MCP integration validation
- `test-simple-mcp.js` - Basic MCP functionality
- `test-universal-taskmaster.js` - Universal agent testing
- `test-workflow.js` - Workflow engine testing

## Running Tests

```bash
# Run all Jest tests
npm test

# Watch mode
npm run test:watch

# Run specific integration test
node tests/test-advanced-tools.js

# Run MCP configuration test
node tests/test-mcp-config.js
```

## Test Guidelines

- All test files MUST be in `tests/` directory (never in root)
- Use ES modules syntax (`import/export`)
- Follow naming convention: `test-feature-name.js` or `feature.test.js`
- Include descriptive output for integration tests
- Mock external dependencies when possible

## Notes

- Jest configuration supports ES modules via `--experimental-vm-modules`
- Integration tests can be run directly with Node.js
- MCP tools are tested both in isolation and integration scenarios
