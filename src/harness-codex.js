import { agentPath as standardAgentPath, planAgentFile, planLegacyCleanup } from "./harness-adapter.js";
import { missingFields } from "./inspection.js";
import { renderPlaceholders } from "./template.js";
import { parseToml, TomlError, tomlMultilineString, tomlString } from "./toml.js";

/**
 * Legacy paths of the hand-made Codex setup, relative to Codex's config
 * folder: the May snapshot of the expert as a Codex skill, which the router
 * in the shared skills folder supersedes. The broken agent TOML from Codex's
 * `/import` sits at the agent file's own path, so the rendered agent
 * replaces it instead.
 */
const LEGACY_PATHS = ["skills/ocean-acoustics-expert"];

/** Fields Codex needs to load an agent role. */
const REQUIRED_FIELDS = ["name", "description", "developer_instructions"];

/**
 * @param {import("./locations.js").Locations} locations
 * @param {string} name
 */
function agentPath(locations, name) {
  return standardAgentPath(locations.codexDir, name, ".toml");
}

/**
 * Codex: an agent TOML in the user agents folder, confined to the read-only
 * sandbox, since Codex has no per-tool allowlist. Codex reads the skills
 * straight from the shared skills folder, so it gets no skill entries.
 * @type {import("./install.js").Harness}
 */
export const CODEX_HARNESS = {
  name: "codex",
  label: "Codex",
  configDir: (locations) => locations.codexDir,
  agentPath,
  units({ locations, template, variables }) {
    return [
      ...planLegacyCleanup(LEGACY_PATHS, locations.codexDir),
      planAgentFile(agentPath(locations, template.name), renderCodexAgent(template, variables)),
    ];
  },
  inspectAgent(text) {
    let agent;
    try {
      agent = parseToml(text);
    } catch (error) {
      if (!(error instanceof TomlError)) throw error;
      // The reader takes a subset of TOML, so the file may still be TOML that Codex reads.
      return { instructions: null, problems: [`is TOML doctor cannot parse: ${error.message}`] };
    }
    const missing = missingFields(agent, REQUIRED_FIELDS);
    return {
      instructions: missing.includes("developer_instructions") ? null : /** @type {string} */ (agent.developer_instructions),
      problems: missing.map((field) => `lacks ${field}`),
    };
  },
};

/**
 * What Codex needs on top of the shared rules: it has no page-range PDF
 * reader, but its read-only sandbox lets it print pages as text.
 */
const HARNESS_NOTE = `## Harness note: Codex

Codex has no page-range PDF reader. To read a fallback window (step 5 of the retrieval order below), print only those pages as text with \`pdftotext -f <first page> -l <last page> -layout <pdf> -\`, where \`<pdf>\` is a book in \`{{knowledge_base}}/sources/\`. The final \`-\` prints to the terminal: never name an output file, and never write files. Extracted equations can come out garbled; when one matters, say so and cite its page range.

`;

/**
 * @param {import("./template.js").AgentTemplate} template
 * @param {Record<string, string|null>} variables
 * @returns {string}
 */
function renderCodexAgent(template, variables) {
  const instructions = renderPlaceholders(HARNESS_NOTE + template.body, variables, "agent template");
  return [
    "# Codex agent of ocean-acoustics-expert, written by install from its agent template; reinstall to change it.",
    `name = ${tomlString(template.name)}`,
    `description = ${tomlString(template.description)}`,
    'sandbox_mode = "read-only"',
    `developer_instructions = ${tomlMultilineString(instructions)}`,
    "",
  ].join("\n");
}
