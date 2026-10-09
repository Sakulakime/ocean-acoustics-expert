/**
 * Parser for the YAML subset used by the knowledge base's hand-edited files.
 *
 * Supported: block mappings, block sequences of scalars, flow sequences of
 * scalars (`[a, b]`), plain and quoted scalars and mapping keys, blank lines
 * and full-line comments. Scalars stay strings, and quotes are removed
 * without unescaping. Inline comments, flow mappings, mappings
 * inside sequences, quoted flow items containing commas and duplicate keys
 * raise YamlError, so an unsupported construct fails loudly instead of being
 * misread.
 */

/**
 * @param {string} text
 * @returns {unknown}
 * @throws {YamlError}
 */
export function parseYaml(text) {
  const lines = text
    .split(/\r?\n/)
    .map((raw, index) => ({ number: index + 1, indent: raw.search(/\S/), content: raw.trim() }))
    .filter((line) => line.content !== "" && !line.content.startsWith("#"));
  for (const line of lines) {
    if (/\s#/.test(line.content)) throw new YamlError(line, "inline comments are not supported");
  }
  if (lines.length === 0) return null;
  const [value, next] = parseBlock(lines, 0, lines[0].indent);
  if (next < lines.length) {
    throw new YamlError(lines[next], "unexpected indentation");
  }
  return value;
}

export class YamlError extends Error {
  constructor(line, message) {
    super(`line ${line.number}: ${message}`);
    this.name = "YamlError";
  }
}

function parseBlock(lines, start, indent) {
  return lines[start].content.startsWith("- ")
    ? parseSequence(lines, start, indent)
    : parseMapping(lines, start, indent);
}

function parseSequence(lines, start, indent) {
  const items = [];
  let i = start;
  while (i < lines.length && lines[i].indent === indent && lines[i].content.startsWith("- ")) {
    const item = lines[i].content.slice(2).trim();
    if (/^[^"'[\s][^:]*:(\s|$)/.test(item)) {
      throw new YamlError(lines[i], "mappings inside sequences are not supported");
    }
    items.push(parseScalar(item, lines[i]));
    i += 1;
  }
  return [items, i];
}

function parseMapping(lines, start, indent) {
  // A prototype-free object, so keys such as __proto__ are plain data.
  const mapping = Object.create(null);
  let i = start;
  while (i < lines.length && lines[i].indent === indent) {
    const line = lines[i];
    const match = line.content.match(/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^:]+?):(?:\s+(.*))?$/);
    if (!match) throw new YamlError(line, `expected "key: value", got "${line.content}"`);
    const [, rawKey, inline] = match;
    const key = unquote(rawKey);
    if (key in mapping) throw new YamlError(line, `duplicate key "${key}"`);
    i += 1;
    if (inline !== undefined && inline !== "") {
      mapping[key] = parseScalar(inline, line);
    } else if (i < lines.length && lines[i].indent > indent) {
      [mapping[key], i] = parseBlock(lines, i, lines[i].indent);
    } else {
      mapping[key] = null;
    }
  }
  return [mapping, i];
}

function parseScalar(text, line) {
  if (text.startsWith("{")) throw new YamlError(line, "flow mappings are not supported");
  if (!(text.startsWith("[") && text.endsWith("]"))) return unquote(text);
  const inner = text.slice(1, -1).trim();
  if (inner === "") return [];
  return inner.split(",").map((raw) => {
    const item = raw.trim();
    const opensQuote = /^["']/.test(item);
    const closesQuote = /["']$/.test(item);
    if (opensQuote !== closesQuote || (opensQuote && item.length < 2)) {
      throw new YamlError(line, "quoted flow items containing commas are not supported");
    }
    return unquote(item);
  });
}

function unquote(text) {
  const quoted = text.length >= 2 && /^(["']).*\1$/.test(text);
  return quoted ? text.slice(1, -1) : text;
}
