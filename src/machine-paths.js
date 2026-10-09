import { join } from "node:path";

import { textLines } from "./data-file.js";
import { LOGICAL_NAMES } from "./local-paths.js";

/**
 * An absolute machine path: a POSIX path of two or more segments
 * (`/home/me/x`), a Windows drive, UNC or environment-variable path (`C:\x`,
 * `\\server\share`, `%USERPROFILE%\x`), a home-relative path (`~/x`,
 * `$HOME/x`) or a file URI. A path never continues a word, number, closing
 * bracket or other path, so units (`m/s`), fractions (`(a+b)/c/d`), URLs
 * (`https://a/b`), relative paths (`../x/y`) and logical names
 * (`{{at_2020}}/Matlab`) are not machine paths.
 */
const ABSOLUTE_PATH =
  /(?<![\p{L}\p{N}_)\]}>.\/\\])(?:\/[\p{L}\p{N}_.~+-]+\/|[A-Za-z]:[\\/](?=[\p{L}\p{N}_.])|\\\\[\p{L}\p{N}_.$-]+\\|%\w+%[\\/]|~\/|\$\{?HOME\}?\/|file:\/\/)[^\s"'`)\]>|*,;]*/gu;

/** The conventional placeholder for a directory of the reader's choice. */
const PLACEHOLDER_PREFIX = "/path/to/";

/** A logical-name reference: `{{name}}`. Whatever sits between the braces must be a defined name. */
const LOGICAL_NAME_REFERENCE = /\{\{([^{}]*)\}\}/g;

/**
 * Find machine paths and undefined logical names in a set of texts. Book PDFs
 * must be named by their `sources/…` path inside the knowledge base and tools
 * by logical name (ADRs 0004, 0005).
 * @param {Map<string, string>} texts Text keyed by file name.
 * @param {string} [dir] Directory the file names are relative to, shown in messages.
 * @returns {string[]} Problems, each starting with "<file>:<line>:".
 */
export function machinePathProblems(texts, dir = "") {
  const defined = [...LOGICAL_NAMES].join(", ");
  const problems = [];
  for (const { file, lineNumber, line } of textLines(texts)) {
    const at = `${join(dir, file)}:${lineNumber}:`;
    for (const [path] of line.matchAll(ABSOLUTE_PATH)) {
      if (isPlaceholder(path)) continue;
      problems.push(`${at} absolute path ${path}; point at book PDFs by their sources/… path and name tools by logical name ({{name}})`);
    }
    for (const [reference, logicalName] of line.matchAll(LOGICAL_NAME_REFERENCE)) {
      if (LOGICAL_NAMES.has(logicalName)) continue;
      problems.push(`${at} undefined logical name ${reference}; defined names: ${defined}`);
    }
  }
  return problems;
}

/**
 * @param {string} path
 * @returns {boolean} Whether the path is a `/path/to/…` placeholder that stays below it.
 */
function isPlaceholder(path) {
  return path.startsWith(PLACEHOLDER_PREFIX) && !path.split("/").includes("..");
}
