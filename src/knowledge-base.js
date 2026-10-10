import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readDataFile, readTextFiles, textLines } from "./data-file.js";
import { splitFrontmatter } from "./template.js";
import { parseYaml } from "./yaml.js";

/** The knowledge base shipped with this package (the authoring copy when run from a checkout). */
export const BUNDLED_KNOWLEDGE_BASE = fileURLToPath(new URL("../knowledge/", import.meta.url));

/**
 * @typedef {object} Route
 * @property {string[]} notes Note paths relative to the knowledge-base root.
 * @property {Map<string, unknown>} fallbackWindows Window name to the routing
 *   map's value as written: a PDF page range of the primary source, or a
 *   mapping of `source` (another book's source note) and `pages`.
 */

/**
 * @typedef {object} Concept
 * @property {string} key
 * @property {string[]} aliases
 * @property {string} route Name of the route the concept belongs to.
 * @property {string[]} primaryNotes
 * @property {string[]} secondaryNotes
 * @property {string[]} fallbackWindows Window references of the form "route.window".
 */

/**
 * @typedef {object} KnowledgeBase
 * @property {string} root
 * @property {string} hub Text of the hub note.
 * @property {Map<string, Route>} routes
 * @property {Concept[]} concepts
 * @property {Map<string, string>} texts Text of every note and data file,
 *   keyed by path relative to the root, in path order.
 */

/** Extensions of the files that make up a knowledge base's text. */
const TEXT_FILE = /\.(?:md|ya?ml|json)$/;

/**
 * Load the parts of a knowledge base that checks reason about.
 * @param {string} root Knowledge-base root directory.
 * @returns {KnowledgeBase}
 * @throws {import("./data-file.js").DataFileError}
 */
export function loadKnowledgeBase(root) {
  const read = (name, parse) => readDataFile(join(root, name), parse, name);
  const hub = read("00-hub.md", (text) => text);
  const routingMap = read("routing-map.yaml", parseYaml);
  // The concept index is JSON, which is valid YAML; it is parsed as JSON.
  const conceptIndex = read("concept-index.yaml", JSON.parse);
  return {
    root,
    hub,
    routes: toRoutes(routingMap?.routes),
    concepts: (conceptIndex?.concepts ?? []).map(toConcept),
    texts: readTextFiles(root, TEXT_FILE),
  };
}

/**
 * @param {KnowledgeBase} kb
 * @param {string} relativePath
 * @returns {boolean}
 */
export function noteExists(kb, relativePath) {
  return existsSync(join(kb.root, relativePath));
}

/**
 * @param {KnowledgeBase} kb
 * @param {string} relativePath A note's path relative to the root.
 * @returns {unknown} The note's parsed YAML frontmatter; null when the note
 *   is not among the knowledge base's texts or has no frontmatter.
 * @throws {import("./yaml.js").YamlError} When the frontmatter is outside the YAML subset.
 */
export function noteFrontmatter(kb, relativePath) {
  const text = kb.texts.get(relativePath);
  const frontmatter = text === undefined ? undefined : splitFrontmatter(text)?.frontmatter;
  return frontmatter === undefined ? null : parseYaml(frontmatter);
}

/**
 * @param {Concept} concept
 * @returns {string[]} Primary notes followed by secondary notes.
 */
export function conceptNotes(concept) {
  return [...concept.primaryNotes, ...concept.secondaryNotes];
}

/**
 * Split a "route.window" reference.
 * @param {string} ref
 * @returns {{route: string, window: string}|null} Null when the reference has no dot.
 */
export function parseWindowRef(ref) {
  const dot = ref.indexOf(".");
  return dot === -1 ? null : { route: ref.slice(0, dot), window: ref.slice(dot + 1) };
}

/**
 * @param {KnowledgeBase} kb
 * @param {string} ref A "route.window" reference.
 * @returns {boolean} Whether the routing map defines that fallback window.
 */
export function hasFallbackWindow(kb, ref) {
  const parsed = parseWindowRef(ref);
  return Boolean(parsed && kb.routes.get(parsed.route)?.fallbackWindows.has(parsed.window));
}

/**
 * A `source_pdf` or `primary_source_pdf` field. Its value, optionally quoted,
 * is the path of a book PDF relative to the root.
 */
const SOURCE_PDF_FIELD = /^\s*(?:primary_)?source_pdf:\s*(["']?)(.+?)\1\s*$/;

/**
 * A book PDF mentioned in text (ADR 0005): `sources/<file>.pdf`, relative to
 * the root, written alone or behind `{{knowledge_base}}/`. Under any other
 * prefix (a URL, another logical name, a longer path) it is not a book PDF.
 * PDF file names have no spaces, so a mention ends at the first space.
 */
const SOURCE_PDF_MENTION =
  /(?<=^|[^\w./-]|\{\{knowledge_base\}\}\/)sources\/[\p{L}\p{N}_.\/-]+\.pdf(?![\w-]|\.\w)/giu;

/**
 * The book PDFs the notes and data files point at, through a source PDF field
 * or a mention in text, in path and line order; each at most once per line.
 * @param {KnowledgeBase} kb
 * @returns {{file: string, lineNumber: number, path: string}[]} Each path is relative to the root.
 */
export function sourcePdfReferences(kb) {
  const references = [];
  for (const { file, lineNumber, line } of textLines(kb.texts)) {
    const paths = new Set(Array.from(line.matchAll(SOURCE_PDF_MENTION), ([path]) => path));
    const field = line.match(SOURCE_PDF_FIELD);
    if (field) paths.add(field[2]);
    for (const path of paths) references.push({ file, lineNumber, path });
  }
  return references;
}

function toRoutes(rawRoutes) {
  const routes = new Map();
  for (const [name, route] of Object.entries(rawRoutes ?? {})) {
    routes.set(name, {
      notes: route?.notes ?? [],
      fallbackWindows: new Map(Object.entries(route?.fallback_windows ?? {})),
    });
  }
  return routes;
}

function toConcept(raw) {
  return {
    key: raw.key,
    aliases: raw.aliases ?? [],
    route: raw.bucket,
    primaryNotes: raw.primary_notes ?? [],
    secondaryNotes: raw.secondary_notes ?? [],
    fallbackWindows: raw.fallback_windows ?? [],
  };
}
