import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PACKAGE_NAME = "ocean-acoustics-expert";
const NUM = "(0|[1-9]\\d*)";
const PRE = "(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)";
// npm removes build metadata during publishing, so the release version must omit it.
const SEMVER = new RegExp(`^${NUM}\\.${NUM}\\.${NUM}(?:-(${PRE}(?:\\.${PRE})*))?$`);
const REQUIRED_FILES = [
  "knowledge/book-selection.md",
  "knowledge/topics/collins-pe-extensions.md",
  "knowledge/topics/colosi-stochastic-propagation.md",
  "knowledge/topics/etter-model-evaluation.md",
  "knowledge/topics/brekhovskikh-waveguide-approximations.md",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function options(args, withPack = false) {
  const result = { prerelease: "false" };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const allowed = ["--tag", "--prerelease", ...(withPack ? ["--pack-manifest"] : [])];
    if (!allowed.includes(key) || args[i + 1] === undefined) {
      throw new Error("Expected --tag <release-tag> and optional --prerelease true|false");
    }
    if (seen.has(key)) throw new Error(`Duplicate option ${key}`);
    seen.add(key);
    result[key.slice(2)] = args[i + 1];
  }
  if (!result.tag || !["true", "false"].includes(result.prerelease)) {
    throw new Error("A release tag and a boolean prerelease flag are required");
  }
  return result;
}

function plan({ tag, prerelease }) {
  const pkg = readJson("package.json");
  const version = tag.startsWith("v") ? tag.slice(1) : tag;
  if (!SEMVER.test(version) || version !== pkg.version) {
    throw new Error(`Release tag ${tag} must exactly match package version ${pkg.version}`);
  }
  if (pkg.name !== PACKAGE_NAME || pkg.private) throw new Error(`Expected public package ${PACKAGE_NAME}`);
  return {
    name: pkg.name,
    version,
    distTag: prerelease === "true" || SEMVER.exec(version)[4] ? "next" : "latest",
    spec: `${pkg.name}@${version}`,
  };
}

function checkPack(path) {
  const pkg = readJson("package.json");
  const packs = readJson(path);
  if (!Array.isArray(packs) || packs.length !== 1 || packs[0]?.name !== PACKAGE_NAME ||
      pkg.name !== PACKAGE_NAME || packs[0]?.version !== pkg.version || !Array.isArray(packs[0]?.files)) {
    throw new Error("Pack manifest must contain one package matching package.json");
  }
  const files = packs[0].files.map((entry) => entry?.path);
  for (const file of files) {
    if (typeof file !== "string" || /[\\:]/.test(file) || file.startsWith("/") ||
        file.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error(`Unsafe package path: ${file}`);
    }
    if (/\.pdf$/i.test(file) || file.split("/").some((part) =>
      part.startsWith(".") || /^(?:temp|credentials(?:\..*)?|oae_local_paths\.m)$/i.test(part))) {
      throw new Error(`Forbidden package path: ${file}`);
    }
  }
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required)) throw new Error(`Pack manifest is missing ${required}`);
  }
  return packs[0];
}

/** Read-only, bounded registry access; only structured E404 means absent. */
function npmView(spec, fields, missingAllowed = false) {
  const result = spawnSync("npm", [
    "view", spec, ...fields, "--json", "--registry=https://registry.npmjs.org",
    "--fetch-retries=0", "--fetch-timeout=15000",
  ], { encoding: "utf8", timeout: 20000, maxBuffer: 2 * 1024 * 1024 });
  if (result.error) throw new Error(`npm view failed (${result.error.code ?? "process error"})`);
  let data;
  try { data = JSON.parse(result.stdout); } catch {
    throw new Error(`npm view returned invalid JSON (exit ${result.status})`);
  }
  const code = data?.error?.code;
  if (result.status !== 0 || code) {
    if (missingAllowed && result.status !== 0 && code === "E404") return null;
    throw new Error(`npm view failed (${code ?? `exit ${result.status}`})`);
  }
  return data;
}

/** npm-compatible SemVer precedence, including numeric prerelease identifiers. */
function compareVersions(left, right) {
  const a = SEMVER.exec(left);
  const b = SEMVER.exec(right);
  if (!a || !b) throw new Error("Registry dist-tag contains an invalid version");
  for (let i = 1; i <= 3; i++) {
    const x = BigInt(a[i]);
    const y = BigInt(b[i]);
    if (x !== y) return x > y ? 1 : -1;
  }
  if (!a[4] || !b[4]) return a[4] === b[4] ? 0 : a[4] ? -1 : 1;
  const x = a[4].split(".");
  const y = b[4].split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined || y[i] === undefined) return x[i] === undefined ? -1 : 1;
    if (x[i] === y[i]) continue;
    const nx = /^\d+$/.test(x[i]);
    const ny = /^\d+$/.test(y[i]);
    if (nx !== ny) return nx ? -1 : 1;
    return nx ? BigInt(x[i]) > BigInt(y[i]) ? 1 : -1 : x[i] > y[i] ? 1 : -1;
  }
  return 0;
}

function registryState(args, verify = false) {
  const opts = options(args, true);
  const release = plan(opts);
  const pack = opts["pack-manifest"] ? checkPack(opts["pack-manifest"]) : null;
  if (pack && (typeof pack.integrity !== "string" || !pack.integrity.startsWith("sha512-"))) {
    throw new Error("Pack manifest has no SHA-512 integrity");
  }
  const record = npmView(release.spec, ["version", "dist.integrity"], true);
  if (record !== null && record?.version !== release.version) {
    throw new Error("Published version does not match the release");
  }
  if (record !== null && pack && record["dist.integrity"] !== pack.integrity) {
    throw new Error("Published artifact integrity differs; immutable version cannot be replaced");
  }
  if (verify && record === null) throw new Error("Release version is not published");
  const tags = npmView(release.name, ["dist-tags"], true) ?? {};
  if (typeof tags !== "object" || Array.isArray(tags)) throw new Error("Invalid registry dist-tags");
  const current = tags[release.distTag];
  const order = current === undefined ? null : compareVersions(current, release.version);
  if (verify && (order === null || order < 0)) {
    throw new Error(`Registry dist-tag ${release.distTag} is ${order === null ? "missing" : "behind"}; repair it before declaring synchronization complete`);
  }
  return {
    ...release,
    published: record !== null,
    publishTag: order !== null && order > 0 ? "backport" : release.distTag,
    ...(verify ? { verified: true } : {}),
  };
}

try {
  const [command, ...args] = process.argv.slice(2);
  let result;
  if (command === "plan") result = plan(options(args));
  else if (command === "check-pack" && args.length === 1) {
    const pack = checkPack(args[0]);
    result = { name: pack.name, version: pack.version, files: pack.files.length };
  } else if (command === "registry-state" || command === "verify") {
    result = registryState(args, command === "verify");
  } else throw new Error("Expected plan, check-pack, registry-state or verify");
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(`npm release: ${error.message}`);
  process.exitCode = 1;
}
