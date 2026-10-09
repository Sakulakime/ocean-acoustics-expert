import { splitFrontmatter } from "./template.js";
import { parseYaml, YamlError } from "./yaml.js";

/**
 * What doctor learns from reading an installed agent or skill file.
 * @typedef {object} Inspection
 * @property {any} [frontmatter] The parsed frontmatter, for a markdown file that has one.
 * @property {string|null} instructions The text the harness gives the model; null when there is none to read.
 * @property {string[]} problems Why the harness may not load the file as install meant.
 */

/**
 * Read an installed markdown agent or skill: YAML frontmatter holding the
 * given fields, then the instructions. Frontmatter outside the YAML subset
 * this package reads is reported as unparsed, not as invalid, since the
 * harness's own parser may still accept it.
 * @param {string} text
 * @param {string[]} required Frontmatter fields that must be non-empty strings.
 * @returns {Inspection}
 */
export function inspectMarkdown(text, required) {
  const parts = splitFrontmatter(text);
  if (!parts) return { instructions: null, problems: ["has no YAML frontmatter"] };
  let frontmatter;
  try {
    frontmatter = parseYaml(parts.frontmatter);
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return { instructions: parts.body, problems: [`has frontmatter doctor cannot parse: ${error.message}`] };
  }
  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return { instructions: parts.body, problems: ["has frontmatter that is not a mapping"] };
  }
  const problems = missingFields(frontmatter, required).map((field) => `lacks ${field} in its frontmatter`);
  return { frontmatter, instructions: parts.body, problems };
}

/**
 * @param {Record<string, unknown>} record
 * @param {string[]} fields
 * @returns {string[]} The fields that are not non-empty strings in the record.
 */
export function missingFields(record, fields) {
  return fields.filter((field) => typeof record[field] !== "string" || record[field] === "");
}
