import { join } from "node:path";

import { inspectMarkdownAgent, planAgentFile } from "./harness-adapter.js";
import { renderPlaceholders } from "./template.js";

/**
 * Where the expert goes: DSH's own skills folder. DSH has no named agents
 * (its `/agents` lists the session's subagents), so the expert ships as a
 * skill the user runs as `/ocean-acoustics-expert`. The user DSH root is
 * scanned only by DSH, so no other harness sees it.
 * @param {import("./locations.js").Locations} locations
 * @param {string} name
 */
function agentPath(locations, name) {
  return join(locations.deepseekDir, "skills", name, "SKILL.md");
}

/**
 * DeepSeek-TUI (`dst`, DSH): the expert as a DSH skill. DSH's filesystem
 * skill provider scans `~/.agents/skills` itself (its `agentsHome` root), so
 * the router needs no entry of its own; a link here would list it twice.
 * @type {import("./install.js").Harness}
 */
export const DEEPSEEK_HARNESS = {
  name: "deepseek",
  label: "DeepSeek-TUI (dst)",
  configDir: (locations) => locations.deepseekDir,
  agentPath,
  units({ locations, template, variables }) {
    return [planAgentFile(agentPath(locations, template.name), renderDeepseekSkill(template, variables))];
  },
  inspectAgent: (text) => inspectMarkdownAgent(text, ["name", "description"]),
};

/**
 * What DSH needs on top of the shared rules. A skill runs in the main agent,
 * which has write, edit and shell tools and no per-skill allowlist, so the
 * read-only rule rests on these instructions. DSH's read tool takes UTF-8
 * text, not PDFs, so page ranges are printed with `pdftotext`, as in Codex.
 */
const HARNESS_NOTE = `## Harness note: DeepSeek-TUI

You run as a DSH skill inside the main agent, which can write files and run commands. While this skill is active, stay read-only: never write, edit, move or delete a file, and run no command except the \`pdftotext\` read below.

DSH's read tool does not read PDFs. To read a fallback window (step 5 of the retrieval order below), print only those pages as text with \`pdftotext -f <first page> -l <last page> -layout <pdf> -\`, where \`<pdf>\` is a book in \`{{knowledge_base}}/sources/\`. The final \`-\` prints to the terminal: never name an output file. Extracted equations can come out garbled; when one matters, say so and cite its page range.

`;

/**
 * @param {import("./template.js").AgentTemplate} template
 * @param {Record<string, string|null>} variables
 * @returns {string}
 */
function renderDeepseekSkill(template, variables) {
  return [
    "---",
    `name: ${template.name}`,
    `description: ${JSON.stringify(template.description)}`,
    "---",
    "",
    renderPlaceholders(HARNESS_NOTE + template.body, variables, "agent template"),
  ].join("\n");
}
