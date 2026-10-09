import { copyFileSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { backupLocation, copyVerbatim, lstatOrNull, sha256, statOrNull } from "./fs-entries.js";

/**
 * One thing the installer owns, at a root path:
 * - `file`: a rendered file;
 * - `link`: a symbolic link;
 * - `tree`: a folder of rendered or copied files;
 * - `absent`: a legacy path that must not exist.
 * @typedef {{kind: "file", path: string, content: string}
 *   | {kind: "link", path: string, target: string}
 *   | {kind: "tree", path: string, files: TreeFile[]}
 *   | {kind: "absent", path: string}} Unit
 * @typedef {{relative: string, content?: string, source?: string}} TreeFile
 *   A tree file is either rendered (content) or copied from the package (source).
 */

/**
 * What the manifest records about an installed unit, so a later run can tell
 * the installer's own, unchanged output from everything else.
 * @typedef {{kind: "file", path: string, sha256: string}
 *   | {kind: "link", path: string, target: string}
 *   | {kind: "tree", path: string, files: {relative: string, sha256: string}[]}} UnitRecord
 */

/**
 * @typedef {{op: "mkdir", path: string}
 *   | {op: "backup", path: string, to: string}
 *   | {op: "remove", path: string}
 *   | {op: "write", path: string, content: string}
 *   | {op: "copy", path: string, source: string}
 *   | {op: "link", path: string, target: string}} Action
 */

/**
 * @typedef {object} InstallPlan
 * @property {Action[]} actions In the order they must run.
 * @property {UnitRecord[]} units Records of the installed units.
 * @property {string[]} createdDirs Directories the installer created, now and before.
 * @property {{path: string, backup: string}[]} backups Backups taken, now and before.
 */

/**
 * Plan the actions that bring the file system to the given units. Anything
 * the plan would overwrite or remove is backed up first, unless it is the
 * installer's own, unchanged output from an earlier run.
 * @param {object} input
 * @param {Unit[]} input.units In install order.
 * @param {string} input.dataDir Created first; the manifest and backups live there.
 * @param {string} input.backupDir Folder for this run's backups.
 * @param {string} input.home Backups mirror paths relative to it.
 * @param {import("./manifest.js").Manifest|null} input.previous Manifest of the earlier install, if any.
 * @returns {InstallPlan}
 */
export function planInstall({ units, dataDir, backupDir, home, previous }) {
  const planner = new Planner(backupDir, home);
  planner.ensureDir(dataDir);
  const previousUnits = new Map((previous?.units ?? []).map((record) => [record.path, record]));
  const records = [];
  for (const unit of units) {
    const record = planner.plan(unit, previousUnits.get(unit.path));
    if (record) records.push(record);
    previousUnits.delete(unit.path);
  }
  return {
    actions: planner.actions,
    units: [...records, ...previousUnits.values()],
    createdDirs: [...new Set([...(previous?.createdDirs ?? []), ...planner.newDirs])],
    backups: [...(previous?.backups ?? []), ...planner.backups],
  };
}

/**
 * Accumulates actions while tracking the file system as the actions so far
 * would leave it: planned directories exist, planned removals are gone.
 */
class Planner {
  /**
   * @param {string} backupDir
   * @param {string} home
   */
  constructor(backupDir, home) {
    this.backupDir = backupDir;
    this.home = home;
    /** @type {Action[]} */
    this.actions = [];
    /** @type {Set<string>} Directories this plan creates; they count as existing. */
    this.newDirs = new Set();
    /** @type {Set<string>} Paths this plan removes; they and their contents count as gone. */
    this.removed = new Set();
    /** @type {{path: string, backup: string}[]} */
    this.backups = [];
  }

  /**
   * @param {Unit} unit
   * @param {UnitRecord|undefined} previous The record of whatever an earlier install put at the unit's path.
   * @returns {UnitRecord|null} Null for an absent unit, which leaves nothing installed.
   */
  plan(unit, previous) {
    const same = previous?.kind === unit.kind ? previous : undefined;
    switch (unit.kind) {
      case "file":
        return this.planFile(unit, same);
      case "link":
        return this.planLink(unit, same);
      case "tree":
        return this.planTree(unit, same);
      case "absent":
        if (this.entryAt(unit.path)) this.backupAndRemove(unit.path);
        return null;
    }
  }

  /**
   * @param {Extract<Unit, {kind: "file"}>} unit
   * @param {Extract<UnitRecord, {kind: "file"}>|undefined} previous
   * @returns {UnitRecord}
   */
  planFile(unit, previous) {
    const content = Buffer.from(unit.content);
    this.placeFile(unit.path, content, previous?.sha256, { op: "write", path: unit.path, content: unit.content });
    return { kind: "file", path: unit.path, sha256: sha256(content) };
  }

  /**
   * @param {Extract<Unit, {kind: "link"}>} unit
   * @param {Extract<UnitRecord, {kind: "link"}>|undefined} previous
   * @returns {UnitRecord}
   */
  planLink(unit, previous) {
    const record = { kind: "link", path: unit.path, target: unit.target };
    const stats = this.entryAt(unit.path);
    const target = stats?.isSymbolicLink() ? readlinkSync(unit.path) : null;
    if (target === unit.target && previous) return record;
    if (target !== null && target === previous?.target) this.remove(unit.path);
    else if (stats) this.backupAndRemove(unit.path);
    this.ensureDir(dirname(unit.path));
    this.actions.push({ op: "link", path: unit.path, target: unit.target });
    return record;
  }

  /**
   * @param {Extract<Unit, {kind: "tree"}>} unit
   * @param {Extract<UnitRecord, {kind: "tree"}>|undefined} previous
   * @returns {UnitRecord}
   */
  planTree(unit, previous) {
    const stats = this.entryAt(unit.path);
    const isOurs = Boolean(stats?.isDirectory() && previous);
    if (stats && !isOurs) this.backupAndRemove(unit.path);
    this.ensureDir(unit.path);
    const installed = new Map(isOurs ? previous.files.map((file) => [file.relative, file.sha256]) : []);
    const files = [];
    for (const file of unit.files) {
      const path = join(unit.path, file.relative);
      const content = file.content === undefined ? readFileSync(file.source) : Buffer.from(file.content);
      files.push({ relative: file.relative, sha256: sha256(content) });
      const action =
        file.content === undefined
          ? { op: "copy", path, source: file.source }
          : { op: "write", path, content: file.content };
      this.placeFile(path, content, installed.get(file.relative), action);
    }
    // Files an earlier install put here that the unit no longer has.
    const wanted = new Set(unit.files.map((file) => file.relative));
    for (const [relativePath, recorded] of installed) {
      const path = join(unit.path, relativePath);
      if (wanted.has(relativePath) || !this.entryAt(path)) continue;
      if (isUnchangedFile(path, recorded)) this.remove(path);
      else this.backupAndRemove(path);
    }
    return { kind: "tree", path: unit.path, files };
  }

  /**
   * Plan putting content at a path, unless it is already there. An earlier
   * install's file is replaced; it is backed up first if it has been edited
   * since. Anything else at the path is backed up and removed.
   * @param {string} path
   * @param {Buffer} content
   * @param {string|undefined} recorded Hash of the file an earlier install wrote there.
   * @param {Action} action The write or copy that puts the content there.
   */
  placeFile(path, content, recorded, action) {
    const stats = this.entryAt(path);
    if (stats?.isFile() && recorded !== undefined) {
      const current = readFileSync(path);
      if (current.equals(content)) return;
      if (sha256(current) !== recorded) this.backup(path);
    } else if (stats) {
      this.backupAndRemove(path);
    }
    this.ensureDir(dirname(path));
    this.actions.push(action);
  }

  /**
   * The entry at a path as the plan so far leaves it.
   * @param {string} path
   * @returns {import("node:fs").Stats|null}
   */
  entryAt(path) {
    return this.isRemoved(path) ? null : lstatOrNull(path);
  }

  /**
   * Plan creating a directory and its missing ancestors, outermost first.
   * @param {string} dir
   */
  ensureDir(dir) {
    const missing = [];
    for (let current = dir; !this.dirExists(current); current = dirname(current)) missing.unshift(current);
    for (const path of missing) {
      this.actions.push({ op: "mkdir", path });
      this.newDirs.add(path);
    }
  }

  /**
   * @param {string} dir
   * @returns {boolean} Whether the directory exists once the plan so far has run.
   */
  dirExists(dir) {
    if (this.newDirs.has(dir) || dirname(dir) === dir) return true;
    if (this.isRemoved(dir)) return false;
    return statOrNull(dir)?.isDirectory() === true;
  }

  /**
   * @param {string} path
   * @returns {boolean} Whether the plan removes the path or one of its ancestors.
   */
  isRemoved(path) {
    for (let current = path; dirname(current) !== current; current = dirname(current)) {
      if (this.removed.has(current)) return true;
    }
    return false;
  }

  /** @param {string} path Copied into this run's backup folder. */
  backup(path) {
    const to = backupLocation(path, this.backupDir, this.home);
    this.actions.push({ op: "backup", path, to });
    this.backups.push({ path, backup: to });
  }

  /** @param {string} path Removed with everything under it. */
  remove(path) {
    this.actions.push({ op: "remove", path });
    this.removed.add(path);
  }

  /** @param {string} path */
  backupAndRemove(path) {
    this.backup(path);
    this.remove(path);
  }
}

/**
 * @param {string} path
 * @param {string} recorded
 * @returns {boolean} Whether the path is a regular file whose content has the recorded hash.
 */
export function isUnchangedFile(path, recorded) {
  return lstatOrNull(path)?.isFile() === true && sha256(readFileSync(path)) === recorded;
}

/**
 * Carry out planned actions in order.
 * @param {Action[]} actions
 */
export function applyActions(actions) {
  for (const action of actions) {
    switch (action.op) {
      case "mkdir":
        mkdirSync(action.path, { recursive: true });
        break;
      case "backup":
        mkdirSync(dirname(action.to), { recursive: true });
        copyVerbatim(action.path, action.to);
        break;
      case "remove":
        rmSync(action.path, { recursive: true, force: true });
        break;
      case "write":
        writeFileSync(action.path, action.content);
        break;
      case "copy":
        copyFileSync(action.source, action.path);
        break;
      case "link":
        symlinkSync(action.target, action.path);
        break;
    }
  }
}

/**
 * One line per action, for dry runs and install output.
 * @param {Action} action
 * @returns {string}
 */
export function describeAction(action) {
  switch (action.op) {
    case "mkdir":
      return `mkdir   ${action.path}`;
    case "backup":
      return `backup  ${action.path} -> ${action.to}`;
    case "remove":
      return `remove  ${action.path}`;
    case "write":
      return `write   ${action.path}`;
    case "copy":
      return `copy    ${action.source} -> ${action.path}`;
    case "link":
      return `link    ${action.path} -> ${action.target}`;
  }
}
