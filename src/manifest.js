import { existsSync } from "node:fs";

import { DataFileError, readDataFile } from "./data-file.js";

/**
 * Record of an installation, kept in the data directory. It lists every
 * file, link and backup, so status, uninstall and later installs know
 * exactly what the installer owns.
 * @typedef {object} Manifest
 * @property {string} version Package version that wrote it.
 * @property {"link"|"copy"} mode
 * @property {string[]} harnesses
 * @property {Record<string, string|null>} paths The local path map.
 * @property {import("./install-plan.js").UnitRecord[]} units
 * @property {string[]} createdDirs Directories the installer created.
 * @property {{path: string, backup: string, linkType?: "dir"|"junction"}[]} backups Original path and its backup.
 */

/**
 * Read the manifest, reporting an unreadable one as a failure.
 * @param {string} path
 * @returns {{manifest: Manifest|null}|null} The manifest, null inside when
 *   nothing is installed; null itself after reporting an unreadable manifest.
 */
export function loadManifest(path) {
  try {
    return { manifest: existsSync(path) ? readDataFile(path, JSON.parse) : null };
  } catch (error) {
    if (!(error instanceof DataFileError)) throw error;
    console.error(`FAIL cannot read the install manifest: ${error.message}`);
    return null;
  }
}

/**
 * @param {Manifest} manifest
 * @returns {string}
 */
export function manifestText(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * @param {Manifest} manifest
 * @returns {{files: number, links: number, backups: number}} How many of each the install made.
 */
export function manifestCounts(manifest) {
  let files = 0;
  let links = 0;
  for (const unit of manifest.units) {
    if (unit.kind === "file") files += 1;
    else if (unit.kind === "tree") files += unit.files.length;
    else if (unit.kind === "link") links += 1;
  }
  return { files, links, backups: manifest.backups.length };
}
