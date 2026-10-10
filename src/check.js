import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { DataFileError, readTextFiles } from "./data-file.js";
import {
  BUNDLED_KNOWLEDGE_BASE,
  conceptNotes,
  hasFallbackWindow,
  loadKnowledgeBase,
  noteExists,
  noteFrontmatter,
  parseWindowRef,
  sourcePdfReferences,
} from "./knowledge-base.js";
import { machinePathProblems } from "./machine-paths.js";
import {
  BUNDLED_ROUTE_SELECTION_CASES,
  evaluateCase,
  loadRouteSelectionCases,
} from "./route-selection.js";
import { YamlError } from "./yaml.js";

/**
 * A check rule inspects a loaded knowledge base and returns problem messages.
 * @typedef {(kb: import("./knowledge-base.js").KnowledgeBase) => string[]} Rule
 */

/** @type {Rule} */
function routeNotesExist(kb) {
  const problems = [];
  for (const [name, route] of kb.routes) {
    for (const note of route.notes) {
      if (!noteExists(kb, note)) problems.push(`route ${name}: note ${note} does not exist`);
    }
  }
  return problems;
}

/** @type {Rule} */
function conceptNotesExist(kb) {
  const problems = [];
  for (const concept of kb.concepts) {
    for (const note of conceptNotes(concept)) {
      if (!noteExists(kb, note)) problems.push(`concept ${concept.key}: note ${note} does not exist`);
    }
  }
  return problems;
}

/** @type {Rule} */
function conceptRoutesExist(kb) {
  return kb.concepts
    .filter((concept) => !kb.routes.has(concept.route))
    .map((concept) => `concept ${concept.key}: route ${concept.route} is not defined in the routing map`);
}

/** @type {Rule} */
function conceptFallbackWindowsResolve(kb) {
  const problems = [];
  for (const concept of kb.concepts) {
    for (const ref of concept.fallbackWindows) {
      if (!hasFallbackWindow(kb, ref)) {
        problems.push(`concept ${concept.key}: fallback window ${ref} is not defined in the routing map`);
      } else if (parseWindowRef(ref).route !== concept.route) {
        problems.push(`concept ${concept.key}: fallback window ${ref} does not belong to route ${concept.route}`);
      }
    }
  }
  return problems;
}

/** @type {Rule} */
function fallbackWindowsWellFormed(kb) {
  const problems = [];
  for (const [route, { fallbackWindows }] of kb.routes) {
    for (const [name, window] of fallbackWindows) {
      problems.push(...windowProblems(kb, window).map((problem) => `fallback window ${route}.${name}: ${problem}`));
    }
  }
  return problems;
}

/**
 * A fallback window is a PDF page range of the primary source, or a mapping
 * whose `source` is the source note of another book and whose `pages` are a
 * PDF page range of that book's PDF.
 * @param {import("./knowledge-base.js").KnowledgeBase} kb
 * @param {unknown} window
 * @returns {string[]}
 */
function windowProblems(kb, window) {
  if (typeof window === "string") return pageRangeProblems(window);
  const isOtherBookWindow =
    window !== null &&
    typeof window === "object" &&
    !Array.isArray(window) &&
    Object.keys(window).sort().join() === "pages,source" &&
    typeof window.source === "string" &&
    typeof window.pages === "string";
  if (!isOtherBookWindow) return ["expected a PDF page range, or a mapping of source and pages for another book"];
  return [...sourceNoteProblems(kb, window.source), ...pageRangeProblems(window.pages)];
}

/**
 * @param {import("./knowledge-base.js").KnowledgeBase} kb
 * @param {string} path
 * @returns {string[]} Why the note at this path is not a source note; empty when it is one.
 */
function sourceNoteProblems(kb, path) {
  if (!noteExists(kb, path)) return [`source note ${path} does not exist`];
  const { frontmatter, error } = parseNoteFrontmatter(kb, path);
  // Unparseable frontmatter is reported once, for every note, by noteFrontmattersParse.
  if (error) return [];
  return frontmatter?.type === "source-note" ? [] : [`${path} is not a source note (its frontmatter lacks type: source-note)`];
}

/** A PDF page range: first and last page, inclusive. */
const PAGE_RANGE = /^(\d+)-(\d+)$/;

/**
 * @param {string} pages
 * @returns {string[]}
 */
function pageRangeProblems(pages) {
  const match = pages.match(PAGE_RANGE);
  const valid = match !== null && Number(match[1]) >= 1 && Number(match[1]) <= Number(match[2]);
  return valid ? [] : [`${JSON.stringify(pages)} is not a PDF page range such as 20-39`];
}

/**
 * Backticked relative references in the hub: anything containing a slash
 * (`chapters/ch01.md`, `solvers/`, `../x.js`), or a bare `.md`/`.yaml` name.
 * Bare format names such as `.env` or `ram.in` are not references.
 */
const HUB_REFERENCE = /`((?!\/)(?:[\w.-]+\/[\w./-]*|[\w.-]+\.(?:md|ya?ml)))`/g;

/** @type {Rule} */
function hubReferencesExist(kb) {
  const references = new Set([...kb.hub.matchAll(HUB_REFERENCE)].map((match) => match[1]));
  return [...references]
    .filter((reference) => !noteExists(kb, reference))
    .map((reference) => `hub: reference ${reference} does not exist`);
}

/** @type {Rule} */
function noMachinePaths(kb) {
  return machinePathProblems(kb.texts);
}

/** @type {Rule} */
function sourcePdfsExist(kb) {
  return sourcePdfReferences(kb)
    .filter((reference) => !noteExists(kb, reference.path))
    .map(({ file, lineNumber, path }) => `${file}:${lineNumber}: source PDF ${path} does not exist`);
}

/**
 * @param {import("./knowledge-base.js").KnowledgeBase} kb
 * @param {string} path
 * @returns {{frontmatter?: unknown, error?: YamlError}} The note's parsed frontmatter,
 *   or the error that stopped check parsing it.
 */
function parseNoteFrontmatter(kb, path) {
  try {
    return { frontmatter: noteFrontmatter(kb, path) };
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return { error };
  }
}

/**
 * @param {import("./knowledge-base.js").KnowledgeBase} kb
 * @returns {{path: string, frontmatter?: unknown, error?: YamlError}[]} Every Markdown note's parse result.
 */
function parsedNoteFrontmatters(kb) {
  return [...kb.texts.keys()]
    .filter((path) => path.endsWith(".md"))
    .map((path) => ({ path, ...parseNoteFrontmatter(kb, path) }));
}

/** @type {Rule} */
function noteFrontmattersParse(kb) {
  return parsedNoteFrontmatters(kb)
    .filter(({ error }) => error)
    .map(({ path, error }) => `${path} has frontmatter check cannot parse: ${error.message}`);
}

/**
 * A chapter note deepened with key equations (`status: deepened`) cites, in
 * every major subsection, at least one equation of its chapter by number.
 * @type {Rule}
 */
function deepenedChapterNotesCiteEquations(kb) {
  const problems = [];
  for (const { path, frontmatter } of parsedNoteFrontmatters(kb)) {
    if (frontmatter?.type !== "chapter-note" || frontmatter.status !== "deepened") continue;
    const { chapter } = frontmatter;
    if (!/^\d+$/.test(String(chapter))) {
      problems.push(`${path}: a deepened chapter note needs its chapter number in the frontmatter, such as chapter: 5`);
      continue;
    }
    const equationNumber = new RegExp(`\\(${chapter}\\.\\d+\\)`);
    const subsections = majorSubsections(kb.texts.get(path));
    if (subsections.length === 0) {
      problems.push(`${path}: a deepened chapter note needs major subsections, as ### headings under ## Major subsections`);
    }
    for (const { heading, body } of subsections) {
      if (!equationNumber.test(body)) {
        problems.push(`${path}: major subsection "${heading}" cites no equation of chapter ${chapter}, such as (${chapter}.1)`);
      }
    }
  }
  return problems;
}

/**
 * @param {string} text A chapter note.
 * @returns {{heading: string, body: string}[]} The `###` subsections under `## Major subsections`.
 */
function majorSubsections(text) {
  const subsections = [];
  let inMajorSubsections = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) inMajorSubsections = line.trim() === "## Major subsections";
    else if (inMajorSubsections && line.startsWith("### ")) subsections.push({ heading: line.slice(4).trim(), body: "" });
    else if (inMajorSubsections && subsections.length > 0) subsections.at(-1).body += `${line}\n`;
  }
  return subsections;
}

const RULES = [
  routeNotesExist,
  conceptRoutesExist,
  conceptNotesExist,
  conceptFallbackWindowsResolve,
  fallbackWindowsWellFormed,
  hubReferencesExist,
  noMachinePaths,
  sourcePdfsExist,
  noteFrontmattersParse,
  deepenedChapterNotesCiteEquations,
];

/** The MATLAB solver helpers shipped with this package. */
const BUNDLED_MATLAB_HELPERS = fileURLToPath(new URL("../tools/matlab/", import.meta.url));

/**
 * Shipped MATLAB helper files: sources, README and the example configuration.
 * The local configuration oae_local_paths.m holds this machine's paths by
 * design; it is git-ignored and never packaged, so it is not checked.
 */
const MATLAB_HELPER_FILE = /^(?!oae_local_paths\.m$).*\.(?:m|md|example)$/;

/**
 * Validate the knowledge base, then run route-selection cases against it.
 * @param {string[]} args Command arguments: [--kb <dir>] [--cases <file>] [--helpers <dir>].
 *   Without --kb the bundled authoring copy, its bundled cases and the bundled
 *   MATLAB helpers are checked; with --kb, route-selection cases run only when
 *   --cases is given and MATLAB helpers are linted only when --helpers is given.
 * @returns {number} Exit code: 0 pass, 1 problems found, 2 usage error.
 */
export function runCheck(args) {
  let options;
  try {
    ({ values: options } = parseArgs({
      args,
      options: { kb: { type: "string" }, cases: { type: "string" }, helpers: { type: "string" } },
    }));
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  const root = options.kb ?? BUNDLED_KNOWLEDGE_BASE;
  const casesPath = options.cases ?? (options.kb ? null : BUNDLED_ROUTE_SELECTION_CASES);
  const helpersPath = options.helpers ?? (options.kb ? null : BUNDLED_MATLAB_HELPERS);
  const kb = loadOrReport(() => loadKnowledgeBase(root), `knowledge base ${root}`);
  const cases = casesPath
    ? loadOrReport(() => loadRouteSelectionCases(casesPath), `route-selection cases ${casesPath}`)
    : [];
  const helpers = helpersPath
    ? loadOrReport(() => readTextFiles(helpersPath, MATLAB_HELPER_FILE), `MATLAB helpers ${helpersPath}`)
    : new Map();
  if (kb === null || cases === null || helpers === null) return 1;

  const problems = RULES.flatMap((rule) => rule(kb));
  problems.push(...machinePathProblems(helpers, options.helpers ?? "tools/matlab"));
  for (const routeCase of cases) {
    for (const problem of evaluateCase(routeCase, kb)) {
      problems.push(`route-selection "${routeCase.name}": ${problem}`);
    }
  }

  for (const problem of problems) console.error(`FAIL ${problem}`);
  if (problems.length > 0) return 1;

  console.log(`OK knowledge base ${kb.root}`);
  if (casesPath) console.log(`OK ${cases.length} route-selection cases passed`);
  if (helpersPath) console.log(`OK MATLAB helpers ${helpersPath}`);
  return 0;
}

/**
 * Run a loader, reporting an unusable data file as a failure instead of crashing.
 * @template T
 * @param {() => T} load
 * @param {string} what Description used in the failure message.
 * @returns {T|null} The loaded value, or null after reporting the failure.
 */
function loadOrReport(load, what) {
  try {
    return load();
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    console.error(`FAIL cannot load ${what}: ${error.message}`);
    return null;
  }
}
