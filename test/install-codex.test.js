import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  installPaths,
  LEGACY_FILES,
  NEIGHBOUR_FILES,
  parseFrontmatter,
  runInstaller,
  snapshot,
  writeHome,
  writePackage,
} from "./helpers/install.js";
import { writeDirectory } from "./helpers/knowledge-base.js";

/** An absolute path as written in rendered files: not part of a word, unit or relative path. */
const ABSOLUTE_PATH = /(?<![\w.~)\]}])\/[^\s`'")\]]+/g;

/** A Codex config folder as found on a machine where Codex has run. */
const CODEX_CONFIG = { ".codex/config.toml": 'model = "gpt-5"\n' };

/** Legacy Codex files of the pre-installer setup, as found on the author's machine. */
const CODEX_LEGACY_FILES = {
  ".codex/agents/ocean-acoustics-expert.toml": [
    'name = "ocean-acoustics-expert"',
    'description = "old agent"',
    'developer_instructions = """',
    "- `/home/someone/.Codex/knowledge/ocean-acoustics/00-hub.md`",
    '"""',
    "",
  ].join("\n"),
  ".codex/skills/ocean-acoustics-expert/SKILL.md": "---\nname: ocean-acoustics-expert\n---\nMay snapshot\n",
  ".codex/skills/ocean-acoustics-expert/references/knowledge/00-hub.md": "# May hub\n",
};

/** Codex files near the legacy ones that belong to other tools and must survive. */
const CODEX_NEIGHBOUR_FILES = {
  ...CODEX_CONFIG,
  ".codex/agents/code-reviewer.toml": 'name = "code-reviewer"\ndescription = "x"\ndeveloper_instructions = "y"\n',
  ".codex/skills/critical-literature-review/SKILL.md": "---\nname: critical-literature-review\n---\n",
  ".codex/skills/.system/skill-creator/SKILL.md": "---\nname: skill-creator\n---\n",
};

/**
 * The Codex paths install writes or cleans up.
 * @param {string} home
 * @param {string} [codexDir] Codex's config folder; default `~/.codex`.
 */
function codexPaths(home, codexDir = join(home, ".codex")) {
  return {
    agent: join(codexDir, "agents", "ocean-acoustics-expert.toml"),
    staleSkill: join(codexDir, "skills", "ocean-acoustics-expert"),
  };
}

/** Python's tomllib (3.11+) when present; tests that parse TOML are skipped without it. */
const TOML_PARSER = {
  skip: spawnSync("python3", ["-I", "-c", "import tomllib"]).status === 0 ? false : "needs python3 with tomllib (3.11+)",
};

/**
 * Parse a TOML file with Python's standard library, a strict TOML 1.0 parser.
 * @param {string} path
 * @returns {any}
 */
function parseToml(path) {
  const script = "import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], 'rb'))))";
  const result = spawnSync("python3", ["-I", "-c", script, path], { encoding: "utf8" });
  assert.equal(result.status, 0, `${path} is not valid TOML: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

test("install renders a read-only Codex agent TOML that points at the installed copy", TOML_PARSER, (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, CODEX_CONFIG);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  const agent = parseToml(codexPaths(home).agent);
  assert.deepEqual(Object.keys(agent).sort(), ["description", "developer_instructions", "name", "sandbox_mode"]);
  assert.equal(agent.name, "ocean-acoustics-expert");
  assert.match(agent.description, /underwater acoustics/);
  assert.equal(agent.sandbox_mode, "read-only");
  const instructions = agent.developer_instructions;
  assert.match(instructions, new RegExp(`${paths.knowledge}/00-hub\\.md`));
  assert.match(instructions, new RegExp(paths.pathMap));
  assert.doesNotMatch(instructions, /\{\{/);
  for (const [path] of instructions.matchAll(ABSOLUTE_PATH)) {
    assert.ok(path.startsWith(`${paths.data}/`), `${path} is outside the installed copy`);
  }
  const claude = parseFrontmatter(readFileSync(paths.agent, "utf8"));
  assert.equal(agent.description, claude.frontmatter.description);
  assert.equal(instructions.trim(), claude.body.trim(), "Codex gets the same rules as Claude");
});

test("the Codex agent TOML holds quotes, backslashes and control characters in the template exactly", TOML_PARSER, async (t) => {
  const description = `Answers "quoted" questions about C:\\temp\\new, 'single' quotes and """triples"""`;
  const bodies = {
    "backslashes and triple double quotes": 'Read `{{knowledge_base}}/00-hub.md`.\nUse $\\alpha$ and \\\\server\\share.\n"""Quoted"""\tand tabbed.\n',
    "triple single quotes": "Read `{{knowledge_base}}/00-hub.md`.\nIt's '''odd''' and \\n is not a newline.\r\nCarriage return and \u0001 control.\nEnds with a quote'",
  };
  for (const [name, body] of Object.entries(bodies)) {
    await t.test(name, (st) => {
      const pkg = writePackage(st);
      writeFileSync(
        join(pkg, "agent", "ocean-acoustics-expert.md"),
        `---\nname: ocean-acoustics-expert\ndescription: "${description}"\n---\n\n${body}`,
      );
      const home = writeDirectory(st, CODEX_CONFIG);

      const result = runInstaller(pkg, home, ["install"]);

      assert.equal(result.status, 0, result.stderr);
      const agent = parseToml(codexPaths(home).agent);
      assert.equal(agent.description, description);
      assert.equal(agent.developer_instructions, body.replaceAll("{{knowledge_base}}", installPaths(home).knowledge));
    });
  }
});

test("install honours CODEX_HOME and gives Codex the shared router without a skill link", TOML_PARSER, (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, { "elsewhere/codex/config.toml": "" });
  const codexDir = join(home, "elsewhere", "codex");
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"], { CODEX_HOME: codexDir });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseToml(codexPaths(home, codexDir).agent).sandbox_mode, "read-only");
  assert.ok(lstatSync(join(paths.sharedSkill, "SKILL.md")).isFile(), "the router is in the shared skills folder");
  assert.equal(existsSync(join(codexDir, "skills")), false, "Codex gets no skill entry");
  assert.equal(existsSync(join(home, ".codex")), false);
  assert.equal(existsSync(join(home, ".claude")), false, "Claude is not present, so it is not installed");
  assert.deepEqual(JSON.parse(readFileSync(paths.manifest, "utf8")).harnesses, ["codex"]);
  assert.match(runInstaller(pkg, home, ["status"], { CODEX_HOME: codexDir }).stdout, /^harnesses: codex$/m);
});

test("install ignores a relative CODEX_HOME and uses ~/.codex", TOML_PARSER, (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, CODEX_CONFIG);

  const result = runInstaller(pkg, home, ["install"], { CODEX_HOME: "relative/codex" });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseToml(codexPaths(home).agent).name, "ocean-acoustics-expert");
});

test("install detects Claude and Codex together, and --harness picks one of them", (t) => {
  const pkg = writePackage(t);
  const detected = writeHome(t, CODEX_CONFIG);
  const picked = writeHome(t, CODEX_CONFIG);

  const detectedRun = runInstaller(pkg, detected, ["install"]);
  const pickedRun = runInstaller(pkg, picked, ["install", "--harness", "codex"]);

  assert.equal(detectedRun.status, 0, detectedRun.stderr);
  assert.deepEqual(JSON.parse(readFileSync(installPaths(detected).manifest, "utf8")).harnesses, ["claude", "codex"]);
  assert.ok(existsSync(codexPaths(detected).agent));
  assert.ok(existsSync(installPaths(detected).agent));
  assert.equal(pickedRun.status, 0, pickedRun.stderr);
  assert.ok(existsSync(codexPaths(picked).agent));
  assert.equal(existsSync(installPaths(picked).agent), false);
  assert.equal(existsSync(installPaths(picked).claudeSkill), false);
});

test("install backs up and cleans up the legacy Codex agent and skill snapshot, leaving neighbours alone", TOML_PARSER, (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...CODEX_LEGACY_FILES, ...CODEX_NEIGHBOUR_FILES });
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  const [backupDir] = readdirSync(paths.backups);
  for (const [path, content] of Object.entries(CODEX_LEGACY_FILES)) {
    assert.equal(readFileSync(join(paths.backups, backupDir, path), "utf8"), content, `backup of ${path}`);
  }
  assert.equal(existsSync(codexPaths(home).staleSkill), false);
  const agent = parseToml(codexPaths(home).agent);
  assert.equal(agent.sandbox_mode, "read-only");
  assert.doesNotMatch(agent.developer_instructions, /\.Codex/);
  for (const [path, content] of Object.entries(CODEX_NEIGHBOUR_FILES)) {
    assert.equal(readFileSync(join(home, path), "utf8"), content, `${path} is untouched`);
  }
});

test("the manifest records the Codex agent and the backups of the legacy Codex files", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...CODEX_LEGACY_FILES, ...CODEX_NEIGHBOUR_FILES });

  runInstaller(pkg, home, ["install"]);

  const manifest = JSON.parse(readFileSync(installPaths(home).manifest, "utf8"));
  const agent = manifest.units.find((unit) => unit.path === codexPaths(home).agent);
  assert.equal(agent?.kind, "file");
  assert.match(agent.sha256, /^[0-9a-f]{64}$/);
  const backedUp = manifest.backups.map((backup) => backup.path);
  assert.ok(backedUp.includes(codexPaths(home).agent), "the legacy agent is backed up");
  assert.ok(backedUp.includes(codexPaths(home).staleSkill), "the skill snapshot is backed up");
  assert.equal(manifest.units.some((unit) => unit.path === codexPaths(home).staleSkill), false, "absent paths are not owned");
});

test("a dry run lists the Codex writes, backups and removals and changes nothing", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...CODEX_LEGACY_FILES, ...CODEX_NEIGHBOUR_FILES });
  const paths = installPaths(home);
  const before = { home: snapshot(home), pkg: snapshot(pkg) };

  const result = runInstaller(pkg, home, ["install", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
  const lines = result.stdout.split("\n").map((line) => line.trim());
  const { agent, staleSkill } = codexPaths(home);
  assert.ok(lines.includes(`write   ${agent}`), result.stdout);
  assert.ok(lines.includes(`remove  ${staleSkill}`), result.stdout);
  for (const path of [agent, staleSkill]) {
    assert.ok(lines.some((line) => line.startsWith(`backup  ${path} -> ${paths.backups}/`)), `backup of ${path}`);
  }
});

test("re-running install over Claude and Codex with nothing changed is a no-op", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...LEGACY_FILES, ...CODEX_LEGACY_FILES, ...CODEX_NEIGHBOUR_FILES });
  runInstaller(pkg, home, ["install"]);
  const before = { home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) };

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /up to date; nothing to do/);
  assert.deepEqual({ home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) }, before);
});

test("install backs up a Codex agent the user has edited before replacing it", TOML_PARSER, (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, CODEX_CONFIG);
  const paths = installPaths(home);
  runInstaller(pkg, home, ["install"]);
  writeFileSync(codexPaths(home).agent, "# my local edits\n");

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseToml(codexPaths(home).agent).sandbox_mode, "read-only");
  const [backupDir] = readdirSync(paths.backups);
  assert.equal(readFileSync(join(paths.backups, backupDir, ".codex/agents/ocean-acoustics-expert.toml"), "utf8"), "# my local edits\n");
});

test("uninstall removes the Codex agent and the folders install made for it", (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, CODEX_CONFIG);
  const before = snapshot(home);
  runInstaller(pkg, home, ["install"]);

  const result = runInstaller(pkg, home, ["uninstall"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(codexPaths(home).agent), false);
  assert.deepEqual(snapshot(home), before);
});

test("uninstall --restore returns a home with Claude and Codex to its exact pre-install state", async (t) => {
  for (const mode of ["link", "copy"]) {
    await t.test(`${mode} mode`, (st) => {
      const pkg = writePackage(st);
      const home = writeHome(st, { ...LEGACY_FILES, ...NEIGHBOUR_FILES, ...CODEX_LEGACY_FILES, ...CODEX_NEIGHBOUR_FILES });
      const before = { home: snapshot(home), pkg: snapshot(pkg) };
      assert.equal(runInstaller(pkg, home, ["install", "--mode", mode]).status, 0);

      const result = runInstaller(pkg, home, ["uninstall", "--restore"]);

      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
    });
  }
});
