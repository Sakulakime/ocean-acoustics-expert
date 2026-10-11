# ADR 001: Harness Adapter Abstraction

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture review recommendation

## Context

We currently support three coding-agent harnesses (Claude Code, Codex, OpenCode) with separate implementation files. Each harness has similar responsibilities but different implementations:

- `harness-claude.js` (70 lines) - Markdown agent config
- `harness-codex.js` (89 lines) - Markdown with extra logic
- `harness-opencode.js` (127 lines) - TOML config format

**Problems**:
1. Adding new platforms (Cursor, Windsurf, DeepSeek-TUI) requires duplicating similar patterns
2. ~40% code duplication across harness files
3. Testing each harness requires similar but separate test cases
4. No clear contract for what a harness adapter must provide

## Decision

We will introduce a **lightweight harness adapter interface** with these principles:

### 1. Interface over Framework

Define a clear interface/protocol that each harness must implement, but allow platform-specific logic to remain in dedicated files. This is **not** a heavy configuration-driven framework.

**Interface contract**:
```javascript
{
  name: string,
  configDir: (locations) => string,
  agentPath: (locations, name) => string,
  units: (context) => Unit[],
  inspectAgent: (text, locations) => Inspection
}
```

### 2. Shared Utilities

Extract common patterns into utility functions:
- Agent template rendering
- Skill installation planning
- Path resolution
- Inspection helpers

### 3. One-Step Migration

Rewrite all existing harnesses at once rather than incremental migration:
- Reduces confusion during transition
- All tests updated together
- Clear before/after boundary

### 4. Four Initial Platforms

1. **Claude Code** - Markdown agent in `~/.claude/agents/`
2. **Codex** - Markdown agent in `~/.codex/agents/`
3. **OpenCode** - TOML config in `~/.config/opencode/agents.toml`
4. **DeepSeek-TUI (dst)** - (Research needed: likely similar to Claude/Codex)

## Consequences

### Positive

- Clear contract makes adding new platforms straightforward
- Shared utilities reduce duplication by ~40%
- Better testability: unit tests for interface, integration tests per platform
- Each platform retains flexibility for special requirements

### Negative

- Still some duplication (intentional - flexibility over DRY)
- One-time migration effort affects all 172 tests
- Must research DeepSeek-TUI configuration before implementation

### Neutral

- Slightly more abstraction to understand for new contributors
- Trade-off: less code duplication vs. more indirection

## Implementation Plan

1. Research DeepSeek-TUI configuration format
2. Design `src/harness-adapter.js` with shared utilities
3. Rewrite all four harness files to use the new utilities
4. Add unit tests for the adapter utilities
5. Update integration tests to cover all four platforms
6. Verify all 172 existing tests still pass

## Related Decisions

- Complements the planned configuration management layer (Opportunity 5)
- Sets foundation for future platforms (Cursor, Windsurf, etc.)
