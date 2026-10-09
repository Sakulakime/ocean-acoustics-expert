import { createHash } from "node:crypto";
import { cpSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { runCli } from "./cli.js";
import { MINIMAL_KNOWLEDGE_BASE, writeDirectory } from "./knowledge-base.js";
import { parseYaml } from "../../src/yaml.js";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Package parts copied into a fixture package; the knowledge base is a small fixture instead. */
const PACKAGE_PARTS = ["bin", "src", "agent", "skills", "tools", "package.json"];

/**
 * Write a copy of this package with a minimal knowledge base to a temp
 * directory, so installs never touch the real checkout.
 * @param {import("node:test").TestContext} t
 * @param {{checkout?: boolean, knowledge?: Record<string, string>}} [options] Whether the
 *   copy looks like a git checkout, and knowledge-base files replacing or adding to the minimal ones.
 * @returns {string} The package root.
 */
export function writePackage(t, { checkout = true, knowledge = {} } = {}) {
  const files = { ...MINIMAL_KNOWLEDGE_BASE, "sources/book.pdf": "%PDF-1.4\n", ...knowledge };
  const root = writeDirectory(
    t,
    Object.fromEntries(Object.entries(files).map(([path, content]) => [join("knowledge", path), content])),
  );
  for (const part of PACKAGE_PARTS) {
    cpSync(join(REPO_ROOT, part), join(root, part), {
      recursive: true,
      filter: (source) => !source.endsWith("oae_local_paths.m"),
    });
  }
  if (checkout) mkdirSync(join(root, ".git"));
  return root;
}

/**
 * Write a fake home directory that has a Claude Code config folder.
 * @param {import("node:test").TestContext} t
 * @param {Record<string, string>} [files] Extra files, relative to the home.
 * @returns {string}
 */
export function writeHome(t, files = {}) {
  return writeDirectory(t, { ".claude/settings.json": "{}\n", ...files });
}

/** Legacy files of the pre-installer setup, as found on the author's machine. */
export const LEGACY_FILES = {
  ".claude/agents/ocean-acoustics-expert.md": "---\nname: ocean-acoustics-expert\n---\nold agent\n",
  ".claude/skills/ocean-acoustics-router/SKILL.md": "---\nname: ocean-acoustics-router\n---\nold router\n",
  ".claude/knowledge/ocean-acoustics/00-hub.md": "# old hub\n",
  ".claude/knowledge/ocean-acoustics/chapters/ch01-fundamentals.md": "# old chapter\n",
  ".agents/skills/ocean-acoustics-router/SKILL.md": "Hub: `/home/someone/.Codex/knowledge/ocean-acoustics/00-hub.md`\n",
  ".claude/hooks/tests/ocean-acoustics-route-selection-regression.js": "// old regression\n",
  ".claude/hooks/tests/fixtures/underwater-route-selection-cases.json": "{}\n",
};

/** Toolbox trees as laid out on the author's machine, with look-alikes that must not match. */
export const TOOLBOXES = {
  "Tools/AT/atWin10_2020_11_4/linux-bin/bellhop.exe": "elf",
  "Tools/AT/atWin10_2020_11_4/Matlab/Plot/plotshd.m": "% plotshd",
  "Tools/AT/atWin10_2020_11_4/RAM/ram.exe": "elf",
  "Tools/AT/at_2023/RAM/ram.exe": "elf",
  "Tools/AT/at_2023/Matlab/Plot/plotshd.m": "% plotshd",
  "Tools/AT/at_2024_12_25/RAM/ram.exe": "elf",
  "Tools/AT/OMesh2KRAKEN/atWin10_2020_11_4/RAM/ram.exe": "elf",
};

/** Files near the legacy ones that belong to other tools and must survive. */
export const NEIGHBOUR_FILES = {
  ".claude/agents/other-agent.md": "---\nname: other-agent\n---\n",
  ".claude/hooks/tests/skill-forced-eval-underwater-regression.js": "// Claude Scholar's own suite\n",
  ".claude/hooks/tests/fixtures/underwater-routing-cases.json": "{}\n",
  ".agents/skills/other-skill/SKILL.md": "---\nname: other-skill\n---\n",
};

/**
 * Run the CLI of a fixture package with an isolated home and environment.
 * @param {string} pkg Package root from writePackage.
 * @param {string} home Fake home directory.
 * @param {string[]} args
 * @param {Record<string, string>} [env] Extra environment variables.
 */
export function runInstaller(pkg, home, args, env = {}) {
  return runCli(args, {
    bin: join(pkg, "bin", "ocean-acoustics-expert.js"),
    env: { PATH: process.env.PATH ?? "", HOME: home, ...env },
  });
}

/**
 * The installer's per-user paths inside a fake home (XDG defaults).
 * @param {string} home
 */
export function installPaths(home) {
  const data = join(home, ".local", "share", "ocean-acoustics-expert");
  return {
    data,
    knowledge: join(data, "knowledge"),
    matlab: join(data, "matlab"),
    pathMap: join(data, "local-paths.yaml"),
    manifest: join(data, "manifest.json"),
    backups: join(data, "backups"),
    agent: join(home, ".claude", "agents", "ocean-acoustics-expert.md"),
    claudeSkill: join(home, ".claude", "skills", "ocean-acoustics-router"),
    sharedSkill: join(home, ".agents", "skills", "ocean-acoustics-router"),
  };
}

/**
 * Split a markdown file into its parsed YAML frontmatter and body.
 * @param {string} text
 * @returns {{frontmatter: any, body: string}}
 */
export function parseFrontmatter(text) {
  const match = text.match(/^---\n([^]*?)\n---\n([^]*)$/);
  if (!match) throw new Error("no frontmatter");
  return { frontmatter: parseYaml(match[1]), body: match[2] };
}

/**
 * Describe every entry under a directory: its type, file contents (hashed)
 * and symlink targets, optionally with file modification times.
 * @param {string} root
 * @param {{mtimes?: boolean}} [options]
 * @returns {Record<string, string>} Relative path to description.
 */
export function snapshot(root, { mtimes = false } = {}) {
  const entries = {};
  const walk = (relative) => {
    for (const name of readdirSync(join(root, relative)).sort()) {
      const path = join(relative, name);
      const stats = lstatSync(join(root, path));
      if (stats.isSymbolicLink()) {
        entries[path] = `link ${readlinkSync(join(root, path))}`;
      } else if (stats.isDirectory()) {
        entries[path] = "dir";
        walk(path);
      } else {
        const hash = createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
        entries[path] = `file ${hash}${mtimes ? ` ${stats.mtimeMs}` : ""}`;
      }
    }
  };
  walk("");
  return entries;
}
