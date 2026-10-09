import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Root of this package: the project checkout, or the unpacked npm package. */
export const PACKAGE_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** @returns {string} The package version from package.json. */
export function packageVersion() {
  return JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")).version;
}

/**
 * @returns {boolean} Whether the package runs from a git checkout (a `.git`
 *   directory, or a `.git` file in a worktree), which link mode requires.
 */
export function isCheckout() {
  return existsSync(join(PACKAGE_ROOT, ".git"));
}
