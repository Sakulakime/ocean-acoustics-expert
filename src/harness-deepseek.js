import {
  agentPath as standardAgentPath,
  inspectMarkdownAgent,
  planAgentFile,
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
 * DeepSeek-TUI (`dst`, DSH): a read-only agent in DSH's home folder. DSH's
 * filesystem skill provider scans `~/.agents/skills` itself (its
 * `agentsHome` root), so the router needs no entry of its own; a link under
 * `~/.dsh/skills` would list it twice.
 * @type {import("./install.js").Harness}
 */
export const DEEPSEEK_HARNESS = {
  name: "deepseek",
  label: "DeepSeek-TUI (dst)",
  configDir: (locations) => locations.deepseekDir,
  agentPath,
  units({ locations, template, variables }) {
    return [
      planAgentFile(
        agentPath(locations, template.name),
        renderMarkdownAgent(template, variables, {
          model: "inherit",
          tools: "[Read, Grep, Glob]",
        }),
      ),
    ];
  },
  inspectAgent: (text) => inspectMarkdownAgent(text, ["name", "description"]),
};
