import { join } from "node:path";

import {
  agentPath as standardAgentPath,
  inspectMarkdownAgent,
  planAgentFile,
  planSkillLinks,
  renderMarkdownAgent,
} from "./harness-adapter.js";

/**
 * @param {import("./locations.js").Locations} locations
 * @param {string} name
 */
function agentPath(locations, name) {
  return standardAgentPath(locations.deepseekDir, name, ".md");
}

/**
 * DeepSeek-TUI: a read-only agent in the user agents folder, and each skill
 * as a symbolic link to its canonical folder in the shared skills folder.
 * Similar to Claude Code structure.
 * @type {import("./install.js").Harness}
 */
export const DEEPSEEK_HARNESS = {
  name: "deepseek",
  configDir: (locations) => locations.deepseekDir,
  agentPath,
  units({ locations, template, variables, skills }) {
    return [
      ...planSkillLinks(skills, join(locations.deepseekDir, "skills")),
      planAgentFile(
        agentPath(locations, template.name),
        renderMarkdownAgent(template, variables, {
          model: "inherit",
          tools: "[Read, Grep, Glob]",
        })
      ),
    ];
  },
  inspectAgent: (text) => inspectMarkdownAgent(text, ["name", "description"]),
};
