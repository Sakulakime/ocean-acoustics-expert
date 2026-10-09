import { readFileSync } from "node:fs";

import { parseYaml, YamlError } from "./yaml.js";

/**
 * A harness-neutral agent template: identity in the frontmatter, the
 * instructions in the body. Harness adapters add their own frontmatter.
 * @typedef {object} AgentTemplate
 * @property {string} name
 * @property {string} description
 * @property {string} body Markdown instructions with `{{variable}}` placeholders.
 */

/**
 * What an installed agent or skill file holds, as doctor reads it.
 * @typedef {object} InstalledFile
 * @property {any} [frontmatter] The parsed frontmatter, for markdown files that have one.
 * @property {string|null} instructions The text the harness gives the model; null when unreadable.
 * @property {string[]} problems Why the harness may not load the file as it should.
 */

/** A markdown file's YAML frontmatter block and the text after it. */
const FRONTMATTER = /^---\r?\n([^]*?)\r?\n---\r?\n([^]*)$/;

/**
 * @param {string} text
 * @returns {{frontmatter: string, body: string}|null} Null when the text does not start with a frontmatter block.
 */
export function splitFrontmatter(text) {
  const match = text.match(FRONTMATTER);
  return match ? { frontmatter: match[1], body: match[2] } : null;
}

/**
 * @param {string} path
 * @returns {AgentTemplate}
 */
export function readAgentTemplate(path) {
  const parts = splitFrontmatter(readFileSync(path, "utf8"));
  if (!parts) throw new Error(`${path}: agent template has no frontmatter`);
  const { name, description } = /** @type {any} */ (parseYaml(parts.frontmatter));
  if (!name || !description) throw new Error(`${path}: agent template needs a name and a description`);
  return { name, description, body: parts.body.replace(/^\r?\n/, "") };
}

/**
 * Read an installed markdown agent or skill: YAML frontmatter holding the
 * given fields, then the instructions.
 * @param {string} text
 * @param {string[]} required Frontmatter fields that must be non-empty strings.
 * @returns {InstalledFile}
 */
export function inspectMarkdown(text, required) {
  const parts = splitFrontmatter(text);
  if (!parts) return { instructions: null, problems: ["has no YAML frontmatter"] };
  let frontmatter;
  try {
    frontmatter = parseYaml(parts.frontmatter);
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return { instructions: parts.body, problems: [`has frontmatter that is not valid YAML: ${error.message}`] };
  }
  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return { instructions: parts.body, problems: ["has frontmatter that is not a mapping"] };
  }
  const problems = required
    .filter((field) => typeof frontmatter[field] !== "string" || frontmatter[field] === "")
    .map((field) => `lacks ${field} in its frontmatter`);
  return { frontmatter, instructions: parts.body, problems };
}

/**
 * Replace every `{{variable}}` in a template text.
 * @param {string} text
 * @param {Record<string, string|null>} variables
 * @param {string} label Template name used in error messages.
 * @returns {string}
 * @throws {Error} When the text uses a variable that is undefined or unset.
 */
export function renderPlaceholders(text, variables, label) {
  return text.replace(/\{\{([^{}]*)\}\}/g, (placeholder, name) => {
    const value = Object.hasOwn(variables, name) ? variables[name] : null;
    if (value === null) throw new Error(`${label}: ${placeholder} has no value at install time`);
    return value;
  });
}
