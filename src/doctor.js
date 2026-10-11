import { readdirSync, readlinkSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { DataFileError, readDataFile } from "./data-file.js";
import { lstatOrNull, statOrNull, sameLinkTarget } from "./fs-entries.js";
import { opencodeSkillRoots } from "./harness-opencode.js";
import { inspectMarkdown } from "./inspection.js";
import { AGENT_TEMPLATE, HARNESSES } from "./install.js";
import { loadKnowledgeBase, noteExists, sourcePdfReferences } from "./knowledge-base.js";
import { installLocations } from "./locations.js";
import { loadManifest } from "./manifest.js";
import { flagName, TOOLBOX_PATHS } from "./path-map.js";
import { readAgentTemplate, splitFrontmatter } from "./template.js";
import { parseYaml } from "./yaml.js";

/**
 * An absolute path in agent instructions: not part of a word, unit, relative
 * path, URL (`https://…`) or closing HTML tag (`</div>`).
 */
const ABSOLUTE_PATH = /(?<![\w.~)\]}:/<])\/[^\s`'")\]]+/g;

/** How many notes a missing book PDF lists before it summarises the rest. */
const LISTED_NOTES = 5;

/** Folders the skill search skips instead of failing: unreadable, gone, or a link loop. */
const UNSEARCHABLE_CODES = new Set(["EACCES", "EPERM", "ENOENT", "ENOTDIR", "ELOOP"]);

/**
 * What every check reads and reports to.
 * @typedef {object} DoctorContext
 * @property {Report} report
 * @property {import("./locations.js").Locations} locations
 * @property {import("./manifest.js").Manifest} manifest
 */

/**
 * The checks in report order, each with what it covers, for a failure that
 * stops it part way.
 * @type {[string, (context: DoctorContext) => void][]}
 */
const CHECKS = [
  ["local path map", checkPathMap],
  ["symbolic links", checkLinks],
  ["agents", checkAgents],
  ["shared skills", checkSharedSkills],
  ["book PDFs", checkSourcePdfs],
  ["OpenCode skills", checkOpencodeSkills],
];

/**
 * Diagnose an installation in one step: the local path map, the symbolic
 * links, each harness's agent and the shared skills, the book PDFs the notes
 * point at, and duplicate skills in OpenCode. It reports problems and never
 * changes a file.
 * @param {string[]} args No options.
 * @returns {number} Exit code: 0 no problems, 1 problems found, 2 usage error.
 */
export function runDoctor(args) {
  if (args.length > 0) {
    console.error(`doctor takes no arguments, got: ${args.join(" ")}`);
    return 2;
  }
  const locations = installLocations();
  const loaded = loadManifest(locations.manifest);
  if (!loaded) return 1;
  const { manifest } = loaded;
  if (!manifest) {
    console.error("FAIL ocean-acoustics-expert is not installed; run install first");
    return 1;
  }

  console.log(
    `Checking ocean-acoustics-expert ${manifest.version}, installed in ${manifest.mode} mode for ${manifest.harnesses.join(", ")}`,
  );
  const context = { report: new Report(), locations, manifest };
  for (const [covers, check] of CHECKS) {
    try {
      check(context);
    } catch (error) {
      // A file-system call failed in a way the check does not expect, such as a
      // folder it may not read; the other checks still run.
      if (typeof error.syscall !== "string") throw error;
      context.report.fail(`${covers}: could not finish: ${error.message}`);
    }
  }
  console.log(context.report.summary());
  return context.report.problems > 0 ? 1 : 0;
}

/** Prints findings as they come and counts problems and warnings. */
class Report {
  problems = 0;
  warnings = 0;

  /** @param {string} message */
  ok(message) {
    console.log(`OK   ${message}`);
  }

  /** @param {string} message Something that works but may not be what the user wants. */
  warn(message) {
    this.warnings += 1;
    console.error(`WARN ${message}`);
  }

  /** @param {string} message Something that keeps the expert from working as installed. */
  fail(message) {
    this.problems += 1;
    console.error(`FAIL ${message}`);
  }

  summary() {
    const count = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;
    if (this.problems > 0) return `doctor found ${count(this.problems, "problem")}.`;
    return `doctor found no problems${this.warnings > 0 ? `; ${count(this.warnings, "warning")}` : ""}.`;
  }
}

/**
 * Every entry of the local path map exists. An unset toolbox only warns:
 * the expert works without it, but its solver helpers cannot run.
 * @param {DoctorContext} context
 */
function checkPathMap({ report, locations }) {
  let paths;
  try {
    paths = readDataFile(locations.pathMap, parseYaml);
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    report.fail(`cannot read the local path map: ${error.message}`);
    return;
  }
  if (paths === null || typeof paths !== "object" || Array.isArray(paths)) {
    report.fail(`local path map ${locations.pathMap} is not a mapping of names to paths`);
    return;
  }
  const before = report.problems;
  for (const [name, value] of Object.entries(paths)) {
    const toolbox = TOOLBOX_PATHS.find((entry) => entry.name === name);
    const reinstall = toolbox ? `; reinstall with --${flagName(toolbox)} <dir>` : "";
    if (typeof value === "string" && value !== "") {
      if (!statOrNull(value)) report.fail(`local path map: ${name} ${value} does not exist${reinstall}`);
    } else if (toolbox) {
      report.warn(`local path map: ${name} is not set on this machine${reinstall}`);
    } else {
      report.fail(`local path map: ${name} is not set`);
    }
  }
  if (report.problems === before) report.ok(`local path map ${locations.pathMap}: every entry that is set exists`);
}

/**
 * Every symbolic link install made is still that link and resolves: the
 * installed copy's links in link mode, and Claude's skill links.
 * @param {DoctorContext} context
 */
function checkLinks({ report, manifest }) {
  const links = manifest.units.filter((unit) => unit.kind === "link");
  const before = report.problems;
  for (const { path, target } of links) {
    const stats = lstatOrNull(path);
    if (!stats) report.fail(`symbolic link ${path} is missing`);
    else if (!stats.isSymbolicLink() || !sameLinkTarget(path, readlinkSync(path), target)) {
      report.fail(`${path} is no longer the symbolic link to ${target} that install made`);
    } else if (!statOrNull(path)) report.fail(`symbolic link ${path} -> ${target} does not resolve`);
  }
  if (links.length > 0 && report.problems === before) report.ok(`symbolic links: all ${links.length} resolve`);
}

/**
 * Each installed harness's agent parses and points at the installed copy.
 * Agents are looked for where each harness reads them now, which may differ
 * from where install put them if a config-folder variable has changed since.
 * @param {DoctorContext} context
 */
function checkAgents({ report, locations, manifest }) {
  const { name } = readAgentTemplate(AGENT_TEMPLATE);
  for (const harness of HARNESSES.filter((candidate) => manifest.harnesses.includes(candidate.name))) {
    const path = harness.agentPath(locations, name);
    checkInstalledFile(report, locations, `${harness.name} agent ${path}`, path, (text) =>
      harness.inspectAgent(text, locations),
    );
  }
}

/**
 * Each skill in the shared skills folder parses and points at the installed
 * copy. The router is the only shared skill, and it names the hub.
 * @param {DoctorContext} context
 */
function checkSharedSkills({ report, locations, manifest }) {
  for (const name of sharedSkillNames(locations, manifest)) {
    const path = join(locations.sharedSkills, name, "SKILL.md");
    checkInstalledFile(report, locations, `skill ${name} ${path}`, path, (text) =>
      inspectMarkdown(text, ["name", "description"]),
    );
  }
}

/**
 * @param {Report} report
 * @param {import("./locations.js").Locations} locations
 * @param {string} label What the file is, for messages.
 * @param {string} path
 * @param {(text: string) => import("./inspection.js").Inspection} inspect
 */
function checkInstalledFile(report, locations, label, path, inspect) {
  if (!statOrNull(path)) {
    report.fail(`${label} is missing`);
    return;
  }
  let text;
  try {
    text = readDataFile(path, (content) => content);
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    report.fail(`${label} cannot be read: ${error.message}`);
    return;
  }
  const { instructions, problems } = inspect(text);
  const all = [...problems, ...(instructions === null ? [] : pointingProblems(instructions, locations))];
  for (const problem of all) report.fail(`${label}: ${problem}`);
  if (all.length === 0) report.ok(label);
}

/**
 * Instructions point at the installed copy when they name its hub and no
 * absolute path outside the data folder, which holds the installed copy, the
 * path map and the MATLAB helpers.
 * @param {string} instructions
 * @param {import("./locations.js").Locations} locations
 * @returns {string[]}
 */
function pointingProblems(instructions, { dataDir, knowledgeBase }) {
  const problems = [];
  const hub = join(knowledgeBase, "00-hub.md");
  if (!instructions.includes(hub)) problems.push(`does not name the installed hub ${hub}`);
  const outside = new Set(
    Array.from(instructions.matchAll(ABSOLUTE_PATH), ([path]) => path).filter(
      (path) => path !== dataDir && !path.startsWith(`${dataDir}/`),
    ),
  );
  if (outside.size > 0) problems.push(`names paths outside the data folder ${dataDir}: ${[...outside].join(", ")}`);
  return problems;
}

/**
 * Every book PDF a note or data file points at is in the installed copy.
 * The package ships no books (ADR 0006): each user puts their own copies in
 * `sources/`. A missing one only warns, since the notes still answer without it.
 * @param {DoctorContext} context
 */
function checkSourcePdfs({ report, locations }) {
  let kb;
  try {
    kb = loadKnowledgeBase(locations.knowledgeBase);
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    report.fail(`cannot read the installed copy ${locations.knowledgeBase}: ${error.message}`);
    return;
  }
  /** @type {Map<string, string[]>} PDF path to the places that point at it. */
  const pdfs = new Map();
  for (const { file, lineNumber, path } of sourcePdfReferences(kb)) {
    pdfs.set(path, [...(pdfs.get(path) ?? []), `${file}:${lineNumber}`]);
  }
  const missing = [...pdfs].filter(([path]) => !noteExists(kb, path)).sort(([a], [b]) => a.localeCompare(b));
  for (const [path, places] of missing) {
    const listed = places.slice(0, LISTED_NOTES).join(", ");
    const rest = places.length > LISTED_NOTES ? ` and ${places.length - LISTED_NOTES} more` : "";
    report.warn(
      `book PDF ${path} is not in the installed copy; put your copy at ${join(locations.knowledgeBase, path)} for book fallbacks; notes pointing at it: ${listed}${rest}`,
    );
  }
  if (missing.length === 0) report.ok(`book PDFs the notes point at: ${pdfs.size}, all in the installed copy`);
}

/**
 * When OpenCode is installed: OpenCode loads one skill per name. The
 * expert's skills seen through links to one folder (Claude's skill links)
 * are harmless duplicates; the same name in another folder may shadow the
 * installed skill. Other skills' duplicates are not this package's concern.
 * @param {DoctorContext} context
 */
function checkOpencodeSkills({ report, locations, manifest }) {
  if (!manifest.harnesses.includes("opencode")) return;
  const names = new Set(sharedSkillNames(locations, manifest));
  /** @type {Map<string, string[]>} Skill name to the folders OpenCode finds it in. */
  const found = new Map();
  for (const root of opencodeSkillRoots(locations)) {
    for (const file of skillFiles(root.dir, root.hidden)) {
      const name = skillName(file);
      if (names.has(name)) found.set(name, [...(found.get(name) ?? []), dirname(file)]);
    }
  }
  for (const [name, dirs] of found) {
    const where = dirs.join(", ");
    const folders = new Set(dirs.map((dir) => realpathSync(dir)));
    if (dirs.length === 1) {
      report.ok(`OpenCode sees skill ${name} once (${where})`);
    } else if (folders.size === 1) {
      report.ok(`OpenCode sees skill ${name} ${dirs.length} times, all one folder (${where}); its duplicate-name warning is harmless`);
    } else {
      report.fail(
        `OpenCode sees skill ${name} in ${folders.size} different folders (${where}) and loads only one of them, in no fixed order; remove the ones install did not write`,
      );
    }
  }
}

/**
 * @param {import("./locations.js").Locations} locations
 * @param {import("./manifest.js").Manifest} manifest
 * @returns {string[]} Names of the skills install put in the shared skills folder.
 */
function sharedSkillNames(locations, manifest) {
  return manifest.units
    .filter((unit) => unit.kind === "tree" && dirname(unit.path) === locations.sharedSkills)
    .map((unit) => basename(unit.path));
}

/**
 * Every `SKILL.md` under a folder, following symbolic links, each real
 * folder entered once.
 * @param {string} root
 * @param {boolean} hidden Whether to enter hidden folders.
 * @returns {string[]} In path order.
 */
function skillFiles(root, hidden) {
  const files = [];
  const entered = new Set();
  const walk = (dir) => {
    let children;
    try {
      const real = realpathSync(dir);
      if (entered.has(real)) return;
      entered.add(real);
      children = readdirSync(dir).sort();
    } catch (error) {
      if (UNSEARCHABLE_CODES.has(error.code)) return;
      throw error;
    }
    for (const child of children) {
      if (!hidden && child.startsWith(".")) continue;
      const path = join(dir, child);
      let stats;
      try {
        stats = statSync(path);
      } catch (error) {
        if (UNSEARCHABLE_CODES.has(error.code)) continue;
        throw error;
      }
      if (stats.isDirectory()) walk(path);
      else if (stats.isFile() && child === "SKILL.md") files.push(path);
    }
  };
  walk(root);
  return files;
}

/**
 * @param {string} file A `SKILL.md`.
 * @returns {string|null} The `name` in its frontmatter, if it has one and can be read.
 */
function skillName(file) {
  let text;
  try {
    text = readDataFile(file, (content) => content);
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    return null;
  }
  const frontmatter = splitFrontmatter(text)?.frontmatter ?? "";
  return frontmatter.match(/^name:[ \t]*(["']?)(.*?)\1[ \t]*$/m)?.[2] ?? null;
}
