import { createHash } from "node:crypto";
import { cpSync, lstatSync, readlinkSync, statSync, symlinkSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, win32 } from "node:path";

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
 * original targets on POSIX. Windows directory links retain their resolved
 * destinations as junctions; relative targets are resolved before relocation.
 * Modification times of files are kept.
 * @param {string} from
 * @param {string} to Must not exist.
 * @param {{linkType?: "dir"|"junction"}} [options] Retain a directory link type if its target disappeared before restore.
 */
export function copyVerbatim(from, to, { linkType } = {}) {
  if (lstatSync(from).isSymbolicLink()) {
    const target = readlinkSync(from);
    const directory = linkType === "junction" || linkType === "dir" || statOrNull(from)?.isDirectory() === true;
    if (process.platform === "win32" && directory) {
      symlinkSync(linkDestination(from, target), to, "junction");
    } else {
      symlinkSync(target, to, directory ? "dir" : "file");
    }
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

/** Compare lexical link destinations, never realpaths (aliases may be user changes). */
export function sameLinkTarget(path, first, second) {
  if (typeof first !== "string" || typeof second !== "string") return false;
  return linkDestination(path, first) === linkDestination(path, second);
}

/** Resolve a target relative to its original link, including Windows readlink prefixes. */
function linkDestination(path, target) {
  if (/^[A-Za-z]:|^\\/.test(path)) {
    target = target.replace(/^\\\\\?\\|^\\\?\?\\/, "");
    if (target.startsWith("UNC\\")) target = `\\\\${target.slice(4)}`;
    return win32.resolve(win32.dirname(path), target).replace(/^[A-Z]:/, (drive) => drive.toLowerCase());
  }
  return resolve(dirname(path), target);
}
