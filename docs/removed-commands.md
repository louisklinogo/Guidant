# Removed Commands Documentation - UX-003 Streamlining

## Overview
As part of UX-003: Streamline CLI Commands to Essential Set, the following commands were removed to reduce cognitive load and follow TaskMaster's proven single-focus approach.

## Removed Commands

### 1. Command Aliases (aliases.js)
**Removed**: All command aliases and shortcuts
**Reason**: Reduces cognitive load by eliminating multiple ways to do the same thing

**Previously Available Aliases:**
- `s`, `st` → `status`
- `d`, `dash` → `dashboard` 
- `i` → `init`
- `h` → `health`
- `tc`, `caps` → `test-capabilities`
- `c`, `class` → `classify`
- `l`, `live` → `live`
- `q`, `quick` → quick actions

**Migration**: Use full command names instead
- `guidant s` → `guidant status`
- `guidant d` → `guidant dashboard`
- `guidant tc` → Use `guidant status` (includes capability info)

### 2. Test Capabilities Command
**Removed**: `test-capabilities` standalone command
**Reason**: Functionality integrated into `status` command

**Previously**: `guidant test-capabilities`
**Migration**: `guidant status` (includes AI capability analysis)

### 3. Legacy Dashboard Commands
**Removed**: `live` and `interactive` commands
**Reason**: Replaced by intelligent dashboard that auto-detects optimal mode

**Previously**: 
- `guidant live`
- `guidant interactive`

**Migration**: `guidant dashboard` (automatically adapts)

### 4. Separate Adaptive Commands
**Consolidated**: `classify`, `modes`, `upgrade` → `adaptive` with subcommands
**Reason**: Single command with clear subcommands reduces command proliferation

**Previously**:
- `guidant classify`
- `guidant modes` 
- `guidant upgrade`

**Migration**:
- `guidant adaptive classify`
- `guidant adaptive modes`
- `guidant adaptive upgrade`

## Current Essential Commands (6 Total)

1. **`guidant init`** - Project initialization
2. **`guidant status`** - Current state and next task
3. **`guidant dashboard`** - Single intelligent dashboard
4. **`guidant health`** - System health check
5. **`guidant adaptive`** - Workflow management (with subcommands)
6. **`guidant help`** - Contextual help

## Benefits of Streamlining

### Reduced Cognitive Load
- 15+ commands → 6 essential commands (60% reduction)
- No decision paralysis about which command to use
- Clear, single purpose for each command

### Improved Discoverability
- Easier to learn and remember
- Consistent command patterns
- Better help system

### TaskMaster Alignment
- Follows proven single-focus approach
- Eliminates redundant functionality
- Maintains essential capabilities

## Rollback Information

If needed, removed commands can be restored from Git history:
- **Aliases**: `src/cli/commands/aliases.js`
- **Test Capabilities**: `src/cli/commands/test-capabilities.js`
- **Legacy Dashboard**: Dashboard command registration in `dashboard/index.js`

All functionality is preserved in the streamlined commands - no features were lost, only consolidated for better UX.
