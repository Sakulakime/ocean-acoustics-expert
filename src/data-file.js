import { readFileSync } from "node:fs";

import { YamlError } from "./yaml.js";

/** Raised when a data file is missing, unreadable, or cannot be parsed. */
export class DataFileError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataFileError";
  }
}

/** File-system errors that mean "this file is not usable", not a program bug. */
const UNREADABLE_FILE_CODES = new Set(["ENOENT", "EISDIR", "EACCES"]);

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
