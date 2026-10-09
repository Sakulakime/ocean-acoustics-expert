import { createHash } from "node:crypto";
import { cpSync, lstatSync, readlinkSync, statSync, symlinkSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

/** File-system errors that mean "nothing is there". */
const MISSING_CODES = new Set(["ENOENT", "ENOTDIR"]);

/** @returns {import("node:fs").Stats|null} The entry itself, without following a link. */
export function lstatOrNull(path) {
  return orNullWhenMissing(() => lstatSync(path));
}

/** @returns {import("node:fs").Stats|null} The entry, following links. */
export function statOrNull(path) {
  return orNullWhenMissing(() => statSync(path));
}

/**
 * @template T
 * @param {() => T} stat
 * @returns {T|null}
 */
function orNullWhenMissing(stat) {
  try {
    return stat();
  } catch (error) {
    if (MISSING_CODES.has(error.code)) return null;
    throw error;
  }
}

/**
 * Copy a file, folder or symbolic link exactly: links stay links with their
 * original targets, even when those targets do not exist, and modification
 * times of files are kept.
 * @param {string} from
 * @param {string} to Must not exist.
 */
export function copyVerbatim(from, to) {
  if (lstatSync(from).isSymbolicLink()) {
    symlinkSync(readlinkSync(from), to);
    return;
  }
  cpSync(from, to, { recursive: true, verbatimSymlinks: true, preserveTimestamps: true, errorOnExist: true, force: false });
}

/**
 * @param {Buffer} content
 * @returns {string}
 */
export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * A new, timestamped backup folder inside the backups folder; it is created
 * only when the first backup goes into it.
 * @param {string} backupsRoot
 * @returns {string}
 */
export function newBackupDir(backupsRoot) {
  return join(backupsRoot, new Date().toISOString().replaceAll(":", "-"));
}

/**
 * Where a path's backup goes inside a backup folder: its path relative to the
 * home, or under `_root/` when it lies outside the home.
 * @param {string} path
 * @param {string} backupDir
 * @param {string} home
 * @returns {string}
 */
export function backupLocation(path, backupDir, home) {
  const inHome = relative(home, path);
  const name = inHome && !inHome.startsWith("..") && !isAbsolute(inHome) ? inHome : join("_root", path);
  return join(backupDir, name);
}
