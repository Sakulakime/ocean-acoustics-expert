import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { LOCAL_PATHS } from "./local-paths.js";

/** Path-map entries that install detects on the machine: the toolbox trees. */
export const TOOLBOX_PATHS = LOCAL_PATHS.filter((entry) => entry.detect);

/** How deep below the home folder the toolbox search looks. */
const SEARCH_DEPTH = 5;

/** Folders the search skips instead of failing: unreadable, or gone while searching. */
const UNSEARCHABLE_CODES = new Set(["EACCES", "EPERM", "ENOENT", "ENOTDIR"]);

/**
 * The command-line flag that overrides a detected entry, without dashes.
 * @param {import("./local-paths.js").LocalPath} entry
 */
export function flagName(entry) {
  return entry.name.replaceAll("_", "-");
}

/**
 * Resolve every entry of the local path map for an install. Each toolbox
 * location comes from its flag, else the previous install, else a search of
 * the home folder; one that cannot be settled is left unset with a warning.
 * @param {object} input
 * @param {"link"|"copy"} input.mode
 * @param {import("./locations.js").Locations} input.locations
 * @param {string} input.authoringRoot Project checkout, recorded in link mode.
 * @param {Record<string, string|undefined>} input.overrides Flag values by logical name.
 * @param {Record<string, string|null>|undefined} input.previous Path map of the earlier install.
 * @returns {{paths: Record<string, string|null>, warnings: string[]}} Paths in schema order.
 */
export function resolveLocalPaths({ mode, locations, authoringRoot, overrides, previous }) {
  const warnings = [];
  const unsettled = TOOLBOX_PATHS.filter((entry) => !overrides[entry.name] && !previous?.[entry.name]);
  const candidates = unsettled.length > 0 ? findToolboxes(locations.home, unsettled) : new Map();
  const values = {
    knowledge_base: locations.knowledgeBase,
    matlab_helpers: locations.matlabHelpers,
    authoring_root: mode === "link" ? authoringRoot : undefined,
  };
  for (const entry of TOOLBOX_PATHS) {
    const override = overrides[entry.name];
    if (override) {
      values[entry.name] = resolve(override);
      if (!existsSync(values[entry.name])) warnings.push(`${entry.name} ${values[entry.name]} does not exist`);
    } else if (previous?.[entry.name]) {
      values[entry.name] = previous[entry.name];
    } else {
      values[entry.name] = settle(entry, candidates.get(entry.name) ?? [], locations.home, warnings);
    }
  }
  const paths = {};
  for (const entry of LOCAL_PATHS) {
    if (values[entry.name] !== undefined) paths[entry.name] = values[entry.name];
  }
  return { paths, warnings };
}

/**
 * Pick the one candidate the search found, or warn that there is none or
 * that the choice is ambiguous.
 * @param {import("./local-paths.js").LocalPath} entry
 * @param {string[]} found Candidate folders.
 * @param {string} home Where the search looked.
 * @param {string[]} warnings Receives the warning.
 * @returns {string|null}
 */
function settle(entry, found, home, warnings) {
  if (found.length === 1) return found[0];
  const flag = `--${flagName(entry)} <dir>`;
  if (found.length === 0) warnings.push(`${entry.name} not found under ${home}; reinstall with ${flag}`);
  else warnings.push(`${entry.name} is ambiguous (${found.join(", ")}); reinstall with ${flag}`);
  return null;
}

/**
 * Search the home folder for toolbox trees, skipping hidden folders,
 * node_modules and symbolic links.
 * @param {string} home
 * @param {import("./local-paths.js").LocalPath[]} entries
 * @returns {Map<string, string[]>} Matching folders by logical name, in path order.
 */
function findToolboxes(home, entries) {
  const found = new Map(entries.map((entry) => [entry.name, []]));
  const walk = (dir, depth) => {
    let children;
    try {
      children = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (UNSEARCHABLE_CODES.has(error.code)) return;
      throw error;
    }
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!child.isDirectory() || child.name.startsWith(".") || child.name === "node_modules") continue;
      const path = join(dir, child.name);
      for (const entry of entries) {
        const { nameIncludes, files } = entry.detect;
        if (child.name.includes(nameIncludes) && files.every((file) => existsSync(join(path, file)))) {
          found.get(entry.name).push(path);
        }
      }
      if (depth < SEARCH_DEPTH) walk(path, depth + 1);
    }
  };
  walk(home, 1);
  return found;
}

/**
 * The local path map as indented `name: value` lines, for people to read.
 * @param {Record<string, string|null>} paths
 * @returns {string[]}
 */
export function describePathMap(paths) {
  return Object.entries(paths).map(([name, value]) => `  ${name}: ${value ?? "(not set)"}`);
}

/**
 * The generated `local-paths.yaml`.
 * @param {Record<string, string|null>} paths
 * @returns {string}
 */
export function renderPathMap(paths) {
  const lines = [
    "# Local path map of ocean-acoustics-expert, written by install; reinstall to change it.",
    "# Notes name machine-specific locations by logical name ({{name}}); each key resolves one.",
  ];
  for (const [name, value] of Object.entries(paths)) {
    if (value === null) {
      const entry = TOOLBOX_PATHS.find((candidate) => candidate.name === name);
      lines.push(`# ${name} is not set on this machine; reinstall with --${flagName(entry)} <dir>`, `${name}:`);
    } else {
      lines.push(`${name}: ${JSON.stringify(value)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

/**
 * The generated MATLAB configuration `oae_local_paths.m`, which the solver
 * helpers read their toolbox locations from.
 * @param {Record<string, string|null>} paths
 * @returns {string}
 */
export function renderMatlabConfig(paths) {
  const flags = TOOLBOX_PATHS.map((entry) => `--${flagName(entry)}`).join(" / ");
  const fields = TOOLBOX_PATHS.map(
    (entry) => `    paths.${entry.name} = '${(paths[entry.name] ?? "").replaceAll("'", "''")}';`,
  );
  return [
    "function paths = oae_local_paths( )",
    "% OAE_LOCAL_PATHS  Acoustics Toolbox locations on this machine.",
    "%",
    "%   Written by ocean-acoustics-expert install from its local path map; do",
    `%   not edit. Reinstall with ${flags} to change a location.`,
    "%   run_bellhop, run_kraken and run_ram read their toolbox locations here.",
    "",
    ...fields,
    "end",
    "",
  ].join("\n");
}
