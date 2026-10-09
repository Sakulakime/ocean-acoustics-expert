/**
 * Writers for the TOML 1.0 strings in generated agent files. Each returns a
 * TOML value that parses back to exactly the given text.
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
