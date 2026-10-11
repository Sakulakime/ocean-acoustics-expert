import { join } from "node:path";

import {
  agentPath as standardAgentPath,
  inspectMarkdownAgent,
  planAgentFile,
  planLegacyCleanup,
  planSkillLinks,
  renderMarkdownAgent,
} from "./harness-adapter.js";

/**
 * Legacy paths of the hand-made Claude setup, relative to Claude's config
 * folder. The agent file and the router skill folder are replaced by install
 * output instead. The forced-skill-eval suite next to the regression test
 * belongs to Claude Scholar and stays.
 */
const LEGACY_PATHS = [
  "knowledge/ocean-acoustics",
  "hooks/tests/ocean-acoustics-route-selection-regression.js",
  "hooks/tests/fixtures/underwater-route-selection-cases.json",
];

/**
 * @param {import("./locations.js").Locations} locations
 * @param {string} name
 */
function agentPath(locations, name) {
  return standardAgentPath(locations.claudeDir, name, ".md");
}

/**
 * Claude Code: a read-only agent in the user agents folder, and each skill
 * as a symbolic link to its canonical folder in the shared skills folder.
 * @type {import("./install.js").Harness}
 */
export const CLAUDE_HARNESS = {
  name: "claude",
  label: "Claude Code",
  configDir: (locations) => locations.claudeDir,
  agentPath,
  units({ locations, template, variables, skills }) {
    return [
      ...planLegacyCleanup(LEGACY_PATHS, locations.claudeDir),
      ...planSkillLinks(skills, join(locations.claudeDir, "skills")),
      planAgentFile(
        agentPath(locations, template.name),
        renderMarkdownAgent(template, variables, {
          model: "inherit",
          color: "cyan",
          tools: "[Read, Grep, Glob]",
        })
      ),
    ];
  },
  inspectAgent: (text) => inspectMarkdownAgent(text, ["name", "description"]),
};
