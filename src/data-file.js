import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { YamlError } from "./yaml.js";

/** Raised when a data file is missing, unreadable, or cannot be parsed. */
export class DataFileError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataFileError";
  }
}

/** File-system errors that mean "this file is not usable", not a program bug. */
const UNREADABLE_FILE_CODES = new Set(["ENOENT", "ENOTDIR", "EISDIR", "EACCES"]);

/**
 * Read and parse a data file, turning only expected failures into DataFileError.
 * @template T
 * @param {string} path
 * @param {(text: string) => T} parse
 * @param {string} [label] Name used in error messages; defaults to the path.
 * @returns {T}
 * @throws {DataFileError}
 */
export function readDataFile(path, parse, label = path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (!UNREADABLE_FILE_CODES.has(error.code)) throw error;
    throw new DataFileError(`${label}: ${error.message}`);
  }
  try {
    return parse(text);
  } catch (error) {
    if (!(error instanceof YamlError || error instanceof SyntaxError)) throw error;
    throw new DataFileError(`${label}: ${error.message}`);
  }
}

/**
 * Read the text of every file under a directory whose name a pattern accepts,
 * skipping hidden entries (such as editor or OS metadata) and hidden directories.
 * @param {string} root
 * @param {RegExp} include Tested against each file name.
 * @returns {Map<string, string>} Text keyed by "/"-separated path relative to root, in path order.
 * @throws {DataFileError}
 */
export function readTextFiles(root, include) {
  let entries;
  try {
    entries = readdirSync(root, { recursive: true, withFileTypes: true });
  } catch (error) {
    if (!UNREADABLE_FILE_CODES.has(error.code)) throw error;
    throw new DataFileError(`${root}: ${error.message}`);
  }
  const names = entries
    .filter((entry) => entry.isFile() && include.test(entry.name))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"))
    .filter((name) => !name.split("/").some((part) => part.startsWith(".")))
    .sort();
  return new Map(names.map((name) => [name, readDataFile(join(root, name), (text) => text, name)]));
}

/**
 * The lines of a set of texts, numbered from 1.
 * @param {Map<string, string>} texts Text keyed by file name.
 * @returns {Generator<{file: string, lineNumber: number, line: string}>}
 */
export function* textLines(texts) {
  for (const [file, text] of texts) {
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) yield { file, lineNumber: index + 1, line: lines[index] };
  }
}
