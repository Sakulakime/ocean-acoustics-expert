/**
 * Writers for the TOML 1.0 strings in generated agent files, and a reader for
 * the flat documents those files are. Each writer returns a TOML value that
 * parses back to exactly the given text.
 */

/** Characters a basic string escapes: control characters, `"`, `\\` and DEL. A multi-line string keeps line feeds and tabs raw. */
const ESCAPED = /[\u0000-\u001f"\\\u007f]/g;

/** Control characters a literal string cannot hold: all but tab and line feed. */
const LITERAL_UNSAFE = /[\u0000-\u0008\u000b-\u001f\u007f]/;

/** TOML's short escapes; any other control character becomes `\uXXXX`. */
const SHORT_ESCAPES = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': '\\"', "\\": "\\\\" };

/**
 * A single-line TOML basic string.
 * @param {string} value
 * @returns {string}
 */
export function tomlString(value) {
  return `"${escapeBasic(value, "")}"`;
}

/**
 * A multi-line TOML string. A literal string keeps the text verbatim,
 * backslashes included. Text a literal string cannot hold (a `'''`, a
 * trailing `'`, or a control character other than tab and line feed) goes
 * into a basic string with escapes instead.
 * @param {string} value
 * @returns {string} The string, starting with a line break that TOML drops.
 */
export function tomlMultilineString(value) {
  const literal = !value.includes("'''") && !value.endsWith("'") && !LITERAL_UNSAFE.test(value);
  return literal ? `'''\n${value}'''` : `"""\n${escapeBasic(value, "\n\t")}"""`;
}

/**
 * @param {string} value
 * @param {string} raw Characters to leave unescaped.
 * @returns {string} The value escaped for a basic string.
 */
function escapeBasic(value, raw) {
  return value.replace(ESCAPED, (char) => {
    if (raw.includes(char)) return char;
    return SHORT_ESCAPES[char] ?? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

/** Raised when text is not TOML that parseToml reads. */
export class TomlError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`);
    this.name = "TomlError";
  }
}

/**
 * Control characters no TOML string may hold raw: all but tab, line feed and
 * a carriage return that starts a line break.
 */
const RAW_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|\r(?!\n)/;

/** The escapes of a basic string other than `\uXXXX` and `\UXXXXXXXX`. */
const BASIC_ESCAPES = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", '"': '"', "\\": "\\" };

/**
 * Parse a TOML document of top-level `key = value` pairs, as agent files are.
 * Values are strings of all four kinds, booleans and decimal integers.
 * Tables, arrays, inline tables, floats, dates, dotted keys and duplicate keys
 * raise TomlError, so a construct outside this subset fails loudly instead of
 * being misread.
 * @param {string} text
 * @returns {Record<string, string|boolean|number>}
 * @throws {TomlError}
 */
export function parseToml(text) {
  const reader = new TomlReader(text);
  // A prototype-free object, so keys such as __proto__ are plain data.
  const document = Object.create(null);
  for (;;) {
    reader.skipSpaces();
    if (reader.done) return document;
    const start = reader.at;
    const char = reader.char;
    if (char === "#" || char === "\n" || char === "\r") {
      reader.endLine();
      continue;
    }
    if (char === "[") throw reader.error("tables are not supported");
    const key = reader.key();
    reader.skipSpaces();
    if (reader.char === ".") throw reader.error("dotted keys are not supported");
    if (reader.char !== "=") throw reader.error(`expected "=" after key "${key}"`);
    reader.at += 1;
    reader.skipSpaces();
    const value = reader.value();
    if (key in document) throw reader.error(`duplicate key "${key}"`, start);
    document[key] = value;
    reader.endLine();
  }
}

/** A cursor over a TOML text. */
class TomlReader {
  /** @param {string} text */
  constructor(text) {
    this.text = text;
    this.at = 0;
  }

  get done() {
    return this.at >= this.text.length;
  }

  /** @returns {string|undefined} The character at the cursor. */
  get char() {
    return this.text[this.at];
  }

  /**
   * @param {string} message
   * @param {number} [at] Where the problem is; default the cursor.
   */
  error(message, at = this.at) {
    return new TomlError(this.text.slice(0, at).split("\n").length, message);
  }

  /**
   * Match a sticky pattern at the cursor and move past the match.
   * @param {RegExp} sticky
   * @returns {string|null}
   */
  match(sticky) {
    sticky.lastIndex = this.at;
    const found = sticky.exec(this.text)?.[0] ?? null;
    if (found !== null) this.at += found.length;
    return found;
  }

  skipSpaces() {
    this.match(/[ \t]*/y);
  }

  /** Move past the rest of a line: spaces, a comment and the line break. */
  endLine() {
    this.skipSpaces();
    this.match(/#[^\n]*/y);
    if (this.done || this.match(/\r?\n/y) !== null) return;
    throw this.error(`expected the end of the line, got "${this.char}"`);
  }

  /** @returns {string} A bare or quoted key. */
  key() {
    if (this.char === '"') return this.basicString();
    if (this.char === "'") return this.literalString();
    const bare = this.match(/[A-Za-z0-9_-]+/y);
    if (bare === null) throw this.error(`expected a key, got "${this.char}"`);
    return bare;
  }

  /** @returns {string|boolean|number} */
  value() {
    if (this.text.startsWith('"""', this.at)) return this.multilineString('"');
    if (this.text.startsWith("'''", this.at)) return this.multilineString("'");
    if (this.char === '"') return this.basicString();
    if (this.char === "'") return this.literalString();
    const boolean = this.match(/(?:true|false)(?![\w-])/y);
    if (boolean !== null) return boolean === "true";
    const integer = this.match(/[+-]?(?:0|[1-9](?:_?\d)*)(?![\w.:+-])/y);
    if (integer !== null) return Number(integer.replaceAll("_", ""));
    throw this.error("expected a string, a boolean or an integer; arrays, tables, floats and dates are not supported");
  }

  /** @returns {string} A single-line string with escapes. */
  basicString() {
    const start = this.at;
    this.at += 1;
    let value = "";
    for (;;) {
      const char = this.char;
      if (char === undefined || char === "\n" || char === "\r") throw this.error("unterminated string", start);
      if (char === '"') {
        this.at += 1;
        return value;
      }
      if (char === "\\") {
        value += this.escape();
        continue;
      }
      this.checkRaw(char);
      value += char;
      this.at += 1;
    }
  }

  /** @returns {string} A single-line string taken verbatim. */
  literalString() {
    const start = this.at;
    const end = this.text.indexOf("'", start + 1);
    const value = end === -1 ? "" : this.text.slice(start + 1, end);
    if (end === -1 || /[\r\n]/.test(value)) throw this.error("unterminated string", start);
    this.checkRaw(value);
    this.at = end + 1;
    return value;
  }

  /**
   * A multi-line string: basic (`"""`, with escapes and line-ending
   * backslashes) or literal (`'''`, verbatim). A line break right after the
   * opening delimiter is dropped, and up to two quotes may sit just inside
   * the closing one.
   * @param {'"'|"'"} quote
   * @returns {string}
   */
  multilineString(quote) {
    const start = this.at;
    this.at += 3;
    this.match(/\r?\n/y);
    let value = "";
    for (;;) {
      if (this.done) throw this.error("unterminated multi-line string", start);
      if (this.text.startsWith(quote.repeat(3), this.at)) {
        const run = this.match(quote === '"' ? /"+/y : /'+/y);
        if (run.length > 5) throw this.error("too many quotes at the end of a multi-line string");
        return value + run.slice(3);
      }
      if (quote === '"' && this.char === "\\") {
        // A backslash ending a line trims the line break and the whitespace after it.
        if (this.match(/\\[ \t]*\r?\n[ \t\r\n]*/y) === null) value += this.escape();
        continue;
      }
      const char = this.text.startsWith("\r\n", this.at) ? "\r\n" : this.char;
      this.checkRaw(char);
      value += char;
      this.at += char.length;
    }
  }

  /** @returns {string} The character an escape at the cursor stands for. */
  escape() {
    const code = this.text[this.at + 1];
    if (code !== undefined && Object.hasOwn(BASIC_ESCAPES, code)) {
      this.at += 2;
      return BASIC_ESCAPES[code];
    }
    const length = { u: 4, U: 8 }[code] ?? 0;
    const digits = this.text.slice(this.at + 2, this.at + 2 + length);
    const point = length > 0 && /^[0-9A-Fa-f]+$/.test(digits) && digits.length === length ? parseInt(digits, 16) : -1;
    if (point < 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) {
      throw this.error(`invalid escape "\\${code ?? ""}${digits}"`);
    }
    this.at += 2 + length;
    return String.fromCodePoint(point);
  }

  /** @param {string} text Raw string content, which must not hold control characters. */
  checkRaw(text) {
    const control = text.match(RAW_CONTROL)?.[0];
    if (control === undefined) return;
    const code = control.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase();
    throw this.error(`control character U+${code} must be escaped`);
  }
}
