import { mkdirSync, readdirSync, readlinkSync, rmdirSync, rmSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { parseArgs } from "node:util";

import { backupLocation, copyVerbatim, lstatOrNull, newBackupDir, sameLinkTarget } from "./fs-entries.js";
import { isUnchangedFile } from "./install-plan.js";
import { installLocations } from "./locations.js";
import { loadManifest } from "./manifest.js";

/**
 * Remove exactly what install wrote, as listed in the manifest. Entries the
 * user has changed since are backed up first. With `--restore`, put back
 * what install backed up, so the machine returns to its state before the
 * first install.
 * @param {string[]} args [--restore]
 * @returns {number} Exit code: 0 done, 1 failed, 2 usage error.
 */
export function runUninstall(args) {
  let options;
  try {
    ({ values: options } = parseArgs({ args, options: { restore: { type: "boolean" } } }));
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const locations = installLocations();
  const loaded = loadManifest(locations.manifest);
  if (!loaded) return 1;
  const { manifest } = loaded;
  if (!manifest) {
    console.log("ocean-acoustics-expert is not installed; nothing to do.");
    return 0;
  }

  try {
    const backupDir = newBackupDir(locations.backups);
    for (const unit of [...manifest.units].reverse()) removeUnit(unit, backupDir, locations.home);
    // Emptied folders go before restoring, so a legacy folder can come back in their place.
    removeEmptyDirs(manifest.createdDirs);
    if (options.restore) restoreBackups(manifest.backups, locations.backups);
    rmSync(locations.manifest, { force: true });
    removeEmptyDirs(manifest.createdDirs);
  } catch (error) {
    if (typeof error.code !== "string") throw error;
    console.error(`FAIL ${error.message}`);
    return 1;
  }
  if (lstatOrNull(locations.backups)) console.log(`Backups are kept in ${locations.backups}.`);
  console.log(`Uninstalled ocean-acoustics-expert ${manifest.version}${options.restore ? " and restored the backups" : ""}.`);
  return 0;
}

/**
 * Remove an installed unit's files and links. One the user has changed since
 * install is backed up first. Directories go later, with the created ones.
 * @param {import("./install-plan.js").UnitRecord} unit
 * @param {string} backupDir Folder for backups of changed entries.
 * @param {string} home
 */
function removeUnit(unit, backupDir, home) {
  const entries =
    unit.kind === "tree"
      ? unit.files.map((file) => ({ path: join(unit.path, file.relative), sha256: file.sha256 }))
      : [unit];
  for (const entry of entries) {
    if (!lstatOrNull(entry.path)) continue;
    const unchanged =
      unit.kind === "link" ? isLinkTo(entry.path, unit.target) : isUnchangedFile(entry.path, entry.sha256);
    if (!unchanged) {
      const to = backupLocation(entry.path, backupDir, home);
      mkdirSync(dirname(to), { recursive: true });
      copyVerbatim(entry.path, to);
      console.log(`backup  ${entry.path} -> ${to}`);
    }
    rmSync(entry.path, { recursive: true, force: true });
    console.log(`remove  ${entry.path}`);
  }
}

/**
 * @param {string} path
 * @param {string} target
 * @returns {boolean} Whether the path is a symbolic link to the target.
 */
function isLinkTo(path, target) {
  return lstatOrNull(path)?.isSymbolicLink() === true && sameLinkTarget(path, readlinkSync(path), target);
}

/**
 * Put back the earliest backup of each path, which holds its state before the
 * first install. Later backups (of files edited after an install) are kept.
 * @param {{path: string, backup: string, linkType?: "dir"|"junction"}[]} backups In the order they were taken.
 * @param {string} backupsRoot Folder holding the backup folders; emptied folders in it are removed.
 */
function restoreBackups(backups, backupsRoot) {
  const earliest = new Map();
  for (const entry of backups) if (!earliest.has(entry.path)) earliest.set(entry.path, entry);
  for (const [path, { backup, linkType }] of [...earliest].reverse()) {
    if (lstatOrNull(path)) {
      console.log(`left    ${path}: something else is there now; its backup stays at ${backup}`);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    copyVerbatim(backup, path, { linkType });
    rmSync(backup, { recursive: true, force: true });
    removeEmptyAncestors(dirname(backup), backupsRoot);
    console.log(`restore ${path} <- ${backup}`);
  }
}

/**
 * Remove empty folders from a folder up to and including a root.
 * @param {string} dir
 * @param {string} root
 */
function removeEmptyAncestors(dir, root) {
  for (let current = dir; current === root || current.startsWith(`${root}${sep}`); current = dirname(current)) {
    if (!removeIfEmpty(current)) return;
  }
}

/**
 * Remove the directories install created, deepest first, when empty.
 * @param {string[]} dirs
 */
function removeEmptyDirs(dirs) {
  const depth = (path) => path.split(sep).length;
  for (const dir of [...dirs].sort((a, b) => depth(b) - depth(a))) removeIfEmpty(dir);
}

/**
 * @param {string} dir
 * @returns {boolean} Whether the directory was empty and is now gone.
 */
function removeIfEmpty(dir) {
  if (lstatOrNull(dir)?.isDirectory() !== true || readdirSync(dir).length > 0) return false;
  rmdirSync(dir);
  return true;
}
