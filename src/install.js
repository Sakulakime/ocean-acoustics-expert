import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseArgs } from "node:util";

import { CLAUDE_HARNESS } from "./harness-claude.js";
import { OPENCODE_HARNESS } from "./harness-opencode.js";
import { newBackupDir } from "./fs-entries.js";
import { applyActions, describeAction, planInstall } from "./install-plan.js";
import { installLocations } from "./locations.js";
import { loadManifest, manifestText } from "./manifest.js";
import { isCheckout, PACKAGE_ROOT, packageVersion } from "./package-info.js";
import {
  describePathMap,
  flagName,
  renderMatlabConfig,
  renderPathMap,
  resolveLocalPaths,
  TOOLBOX_PATHS,
} from "./path-map.js";
import { readAgentTemplate, renderPlaceholders } from "./template.js";

/**
 * A coding-agent harness the expert can be installed into.
 * @typedef {object} Harness
 * @property {string} name
 * @property {(locations: import("./locations.js").Locations) => string} configDir
 *   Its user config folder; the harness counts as present when it exists.
 * @property {(context: HarnessContext) => import("./install-plan.js").Unit[]} units
 *   Its agent file, skill entries and legacy paths to clean up.
 */

/**
 * @typedef {object} HarnessContext
 * @property {import("./locations.js").Locations} locations
 * @property {import("./template.js").AgentTemplate} template
 * @property {Record<string, string|null>} variables Values for template placeholders.
 * @property {{name: string, path: string}[]} skills Canonical skill folders.
 */

/** @type {Harness[]} */
export const HARNESSES = [CLAUDE_HARNESS, OPENCODE_HARNESS];

const MODES = ["link", "copy"];

const AGENT_TEMPLATE = join(PACKAGE_ROOT, "agent", "ocean-acoustics-expert.md");
const SKILLS = join(PACKAGE_ROOT, "skills");
const KNOWLEDGE = join(PACKAGE_ROOT, "knowledge");
const MATLAB_HELPERS = join(PACKAGE_ROOT, "tools", "matlab");

/** The generated MATLAB configuration, written next to the helpers. */
const MATLAB_CONFIG = "oae_local_paths.m";

/**
 * Install the expert into the selected harnesses.
 * @param {string[]} args [--harness <name>]... [--mode link|copy] [--dry-run] [--at-2023 <dir>] [--at-2020 <dir>]
 * @returns {number} Exit code: 0 done, 1 failed, 2 usage error.
 */
export function runInstall(args) {
  let options;
  try {
    ({ values: options } = parseArgs({
      args,
      options: {
        harness: { type: "string", multiple: true },
        mode: { type: "string" },
        "dry-run": { type: "boolean" },
        ...Object.fromEntries(TOOLBOX_PATHS.map((entry) => [flagName(entry), { type: "string" }])),
      },
    }));
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  const locations = installLocations();
  const loaded = loadManifest(locations.manifest);
  if (!loaded) return 1;
  const previous = loaded.manifest;

  const mode = options.mode ?? previous?.mode ?? (isCheckout() ? "link" : "copy");
  const usageError = modeError(mode, previous);
  if (usageError) {
    console.error(usageError);
    return 2;
  }
  const harnesses = selectHarnesses(options.harness ?? previous?.harnesses, locations);
  if (typeof harnesses === "string") {
    console.error(harnesses);
    return 2;
  }

  const overrides = Object.fromEntries(TOOLBOX_PATHS.map((entry) => [entry.name, options[flagName(entry)]]));
  const { paths, warnings } = resolveLocalPaths({
    mode,
    locations,
    authoringRoot: PACKAGE_ROOT,
    overrides,
    previous: previous?.paths,
  });
  for (const warning of warnings) console.error(`warning: ${warning}`);

  let plan;
  try {
    plan = planInstall({
      units: installUnits({ mode, locations, paths, harnesses }),
      dataDir: locations.dataDir,
      backupDir: newBackupDir(locations.backups),
      home: locations.home,
      previous,
    });
  } catch (error) {
    if (typeof error.code !== "string") throw error;
    console.error(`FAIL ${error.message}`);
    return 1;
  }
  const version = packageVersion();
  const manifest = manifestText({
    version,
    mode,
    harnesses: harnesses.map((harness) => harness.name),
    paths,
    units: plan.units,
    createdDirs: plan.createdDirs,
    backups: plan.backups,
  });
  if (plan.actions.length === 0 && previous && manifestText(previous) === manifest) {
    console.log(`ocean-acoustics-expert ${version} is installed and up to date; nothing to do.`);
    return 0;
  }
  const actions = [...plan.actions, { op: "write", path: locations.manifest, content: manifest }];

  if (options["dry-run"]) {
    console.log("Dry run: nothing was changed.");
    console.log(["Local path map:", ...describePathMap(paths)].join("\n"));
    console.log("Install would:");
    for (const action of actions) console.log(`  ${describeAction(action)}`);
    return 0;
  }
  console.log(["Local path map:", ...describePathMap(paths)].join("\n"));
  for (const action of actions) {
    console.log(describeAction(action));
    try {
      applyActions([action]);
    } catch (error) {
      if (typeof error.code !== "string") throw error;
      console.error(`FAIL ${error.message}`);
      return 1;
    }
  }
  const names = harnesses.map((harness) => harness.name).join(", ");
  console.log(`Installed ocean-acoustics-expert ${version} in ${mode} mode for ${names}.`);
  return 0;
}

/**
 * @param {string} mode
 * @param {import("./manifest.js").Manifest|null} previous
 * @returns {string|null} Why the mode cannot be used, if it cannot.
 */
function modeError(mode, previous) {
  if (!MODES.includes(mode)) return `--mode must be one of: ${MODES.join(", ")}`;
  if (mode === "link" && !isCheckout()) {
    return `link mode needs a git checkout of ocean-acoustics-expert, and ${PACKAGE_ROOT} is not one; use --mode copy`;
  }
  if (previous && previous.mode !== mode) {
    return `installed in ${previous.mode} mode; run uninstall before installing in ${mode} mode`;
  }
  return null;
}

/**
 * @param {string[]|undefined} names Requested harness names; default: the harnesses present.
 * @param {import("./locations.js").Locations} locations
 * @returns {Harness[]|string} The harnesses, or a usage error.
 */
function selectHarnesses(names, locations) {
  const supported = HARNESSES.map((harness) => harness.name).join(", ");
  if (!names) {
    const present = HARNESSES.filter((harness) => existsSync(harness.configDir(locations)));
    return present.length > 0 ? present : `no supported harness found; pass --harness (supported: ${supported})`;
  }
  const harnesses = [];
  for (const name of new Set(names)) {
    const harness = HARNESSES.find((candidate) => candidate.name === name);
    if (!harness) return `harness ${name} is not supported (supported: ${supported})`;
    harnesses.push(harness);
  }
  return harnesses;
}

/**
 * Everything an install owns, in install order: the installed copy and the
 * MATLAB helpers, the generated configuration, the canonical skills, then
 * each harness's files.
 * @returns {import("./install-plan.js").Unit[]}
 */
function installUnits({ mode, locations, paths, harnesses }) {
  const variables = { ...paths, local_path_map: locations.pathMap };
  const units =
    mode === "link"
      ? [
          { kind: "link", path: locations.knowledgeBase, target: KNOWLEDGE },
          { kind: "link", path: locations.matlabHelpers, target: MATLAB_HELPERS },
        ]
      : [
          { kind: "tree", path: locations.knowledgeBase, files: packageFiles(KNOWLEDGE) },
          {
            kind: "tree",
            path: locations.matlabHelpers,
            files: packageFiles(MATLAB_HELPERS).filter((file) => file.relative !== MATLAB_CONFIG),
          },
        ];
  // In link mode the helpers folder is the checkout's, where the config is git-ignored.
  const matlabDir = mode === "link" ? MATLAB_HELPERS : locations.matlabHelpers;
  units.push(
    { kind: "file", path: join(matlabDir, MATLAB_CONFIG), content: renderMatlabConfig(paths) },
    { kind: "file", path: locations.pathMap, content: renderPathMap(paths) },
  );

  const skills = readdirSync(SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, path: join(locations.sharedSkills, entry.name) }));
  for (const skill of skills) {
    const files = packageFiles(join(SKILLS, skill.name)).map(({ relative: file, source }) => ({
      relative: file,
      content: renderPlaceholders(readFileSync(source, "utf8"), variables, `skill ${skill.name}`),
    }));
    units.push({ kind: "tree", path: skill.path, files });
  }

  const template = readAgentTemplate(AGENT_TEMPLATE);
  for (const harness of harnesses) units.push(...harness.units({ locations, template, variables, skills }));
  return units;
}

/**
 * Every file under a package folder, skipping hidden entries.
 * @param {string} root
 * @returns {{relative: string, source: string}[]} In path order; relative paths use "/".
 */
function packageFiles(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .map((source) => ({ relative: relative(root, source).split(sep).join("/"), source }))
    .filter((file) => !file.relative.split("/").some((part) => part.startsWith(".")))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}
