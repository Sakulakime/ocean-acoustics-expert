# Harness Adapter Implementation Plan

## Goal
Introduce a lightweight harness adapter interface to reduce duplication and make adding new platforms straightforward.

## Design Principles
1. **Interface over Framework** - Define clear contracts, not heavy abstraction
2. **Preserve Flexibility** - Each platform can have special logic
3. **Extract Common Patterns** - Shared utilities for repetitive tasks
4. **Test at Multiple Levels** - Unit tests for utilities, integration for platforms

## Implementation Steps

### Phase 1: Create Shared Utilities (New File)

Create `src/harness-adapter.js` with shared utilities:

```javascript
// Utility functions that all harnesses need:
- renderAgentFile(template, variables, skills) 
  → Generate agent markdown/config from template
  
- planSharedSkills(skills, sharedSkillsDir)
  → Plan skill installation to shared location
  
- planAgentFile(agentPath, content, previous)
  → Plan agent file write with backup logic
  
- inspectMarkdownAgent(text, locations)
  → Common inspection for Markdown-based agents
  
- agentPathInConfig(configDir, agentName)
  → Standard agent path resolution
```

### Phase 2: Rewrite Existing Harnesses

Rewrite all four harness files to use the new utilities:

#### `harness-claude.js` (Target: ~40 lines, down from 70)
- Use: `renderAgentFile`, `planSharedSkills`, `inspectMarkdownAgent`
- Keep: Claude-specific config dir resolution

#### `harness-codex.js` (Target: ~50 lines, down from 89)
- Use: `renderAgentFile`, `planSharedSkills`, `inspectMarkdownAgent`
- Keep: Codex-specific paths and legacy cleanup

#### `harness-opencode.js` (Target: ~80 lines, down from 127)
- Use: `planSharedSkills`, helper functions for TOML parsing
- Keep: TOML-specific logic (different from Markdown platforms)

#### `harness-deepseek.js` (New: ~40 lines)
- Similar to Claude/Codex structure
- Config dir: `~/.deepseek/` (based on convention)
- Agent format: AGENTS.md (based on web search results)

### Phase 3: Update Tests

#### Add Unit Tests
Create `test/harness-adapter.test.js`:
- Test `renderAgentFile` with various templates
- Test `planSharedSkills` planning logic
- Test `inspectMarkdownAgent` parsing
- Test path resolution utilities

#### Update Integration Tests
- `test/install-codex.test.js` - Verify still works
- `test/install-opencode.test.js` - Verify still works
- `test/install.test.js` - Add Claude cases, verify all
- Create `test/install-deepseek.test.js` - New platform tests

### Phase 4: Update Documentation

- Update `README.md` - Add DeepSeek-TUI support
- Update `README.zh-CN.md` - Add DeepSeek-TUI support
- Create `docs/adding-new-platform.md` - Guide for future platforms

## Harness Interface Contract

Every harness file must export an object with:

```javascript
export const HARNESS_NAME = {
  name: string,                    // e.g., "Claude Code"
  
  configDir: (locations) => string,
  // Returns the harness config directory
  // Existence check determines if harness is present
  
  agentPath: (locations, name) => string,
  // Returns path where agent file goes
  
  units: (context) => Unit[],
  // Returns install units: agent file, skills, legacy paths
  // Context: { locations, template, variables, skills, linkTargets }
  
  inspectAgent: (text, locations) => Inspection
  // Parses installed agent for doctor
  // Returns: { instructions, warnings }
};
```

## File Size Targets

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `harness-claude.js` | 70 | ~40 | 43% |
| `harness-codex.js` | 89 | ~50 | 44% |
| `harness-opencode.js` | 127 | ~80 | 37% |
| `harness-deepseek.js` | N/A | ~40 | New |
| **Total harness code** | 286 | 210 | 27% |
| `harness-adapter.js` | N/A | ~150 | Shared utilities |
| **Net change** | 286 | 360 | +26% (acceptable for better structure) |

## Risk Mitigation

1. **All tests must pass** - 172 existing tests are regression suite
2. **One platform at a time** - Rewrite and test each harness individually
3. **Keep old files** - Don't delete until all tests pass
4. **DeepSeek validation** - May need to adjust based on actual config format

## Success Criteria

- [ ] All 172 existing tests pass
- [ ] New unit tests for adapter utilities (target: 20+ tests)
- [ ] DeepSeek-TUI installation works end-to-end
- [ ] Code duplication reduced by ~30%
- [ ] Clear guide for adding future platforms
