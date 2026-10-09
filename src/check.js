import { parseArgs } from "node:util";

import { DataFileError } from "./data-file.js";
import {
  BUNDLED_KNOWLEDGE_BASE,
  conceptNotes,
  hasFallbackWindow,
  loadKnowledgeBase,
  noteExists,
  parseWindowRef,
} from "./knowledge-base.js";
import {
  BUNDLED_ROUTE_SELECTION_CASES,
  evaluateCase,
  loadRouteSelectionCases,
} from "./route-selection.js";

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

const RULES = [
  routeNotesExist,
  conceptRoutesExist,
  conceptNotesExist,
  conceptFallbackWindowsResolve,
  hubReferencesExist,
];

/**
 * Validate the knowledge base, then run route-selection cases against it.
 * @param {string[]} args Command arguments: [--kb <dir>] [--cases <file>].
 *   Without --kb the bundled authoring copy and its bundled cases are checked;
 *   with --kb, route-selection cases run only when --cases is given.
 * @returns {number} Exit code: 0 pass, 1 problems found, 2 usage error.
 */
export function runCheck(args) {
  let options;
  try {
    ({ values: options } = parseArgs({
      args,
      options: { kb: { type: "string" }, cases: { type: "string" } },
    }));
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  const root = options.kb ?? BUNDLED_KNOWLEDGE_BASE;
  const casesPath = options.cases ?? (options.kb ? null : BUNDLED_ROUTE_SELECTION_CASES);
  const kb = loadOrReport(() => loadKnowledgeBase(root), `knowledge base ${root}`);
  const cases = casesPath
    ? loadOrReport(() => loadRouteSelectionCases(casesPath), `route-selection cases ${casesPath}`)
    : [];
  if (kb === null || cases === null) return 1;

  const problems = RULES.flatMap((rule) => rule(kb));
  for (const routeCase of cases) {
    for (const problem of evaluateCase(routeCase, kb)) {
      problems.push(`route-selection "${routeCase.name}": ${problem}`);
    }
  }

  for (const problem of problems) console.error(`FAIL ${problem}`);
  if (problems.length > 0) return 1;

  console.log(`OK knowledge base ${kb.root}`);
  if (casesPath) console.log(`OK ${cases.length} route-selection cases passed`);
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
