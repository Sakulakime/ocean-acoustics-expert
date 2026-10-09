import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  installPaths,
  LEGACY_FILES,
  NEIGHBOUR_FILES,
  parseFrontmatter,
  runInstaller,
  snapshot,
  TOOLBOXES,
  writeHome,
  writePackage,
} from "./helpers/install.js";
import { writeDirectory } from "./helpers/knowledge-base.js";
import { parseYaml } from "../src/yaml.js";

/** An absolute path as written in rendered files: not part of a word, unit or relative path. */
const ABSOLUTE_PATH = /(?<![\w.~)\]}])\/[^\s`'")\]]+/g;

test("install renders a read-only Claude agent that points at the installed copy", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter, body } = parseFrontmatter(readFileSync(paths.agent, "utf8"));
  assert.equal(frontmatter.name, "ocean-acoustics-expert");
  assert.match(frontmatter.description, /underwater acoustics/);
  assert.deepEqual(frontmatter.tools, ["Read", "Grep", "Glob"]);
  assert.equal(frontmatter.model, "inherit");
  assert.match(body, new RegExp(`${paths.knowledge}/00-hub\\.md`));
  assert.match(body, new RegExp(paths.pathMap));
  assert.doesNotMatch(body, /\{\{/);
  for (const [path] of body.matchAll(ABSOLUTE_PATH)) {
    assert.ok(path.startsWith(`${paths.data}/`), `${path} is outside the installed copy`);
  }
});

test("link mode links the installed copy to the authoring copy and records the authoring root", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--mode", "link"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readlinkSync(paths.knowledge), join(pkg, "knowledge"));
  assert.equal(readlinkSync(paths.matlab), join(pkg, "tools", "matlab"));
  const pathMap = parseYaml(readFileSync(paths.pathMap, "utf8"));
  assert.equal(pathMap.knowledge_base, paths.knowledge);
  assert.equal(pathMap.matlab_helpers, paths.matlab);
  assert.equal(pathMap.authoring_root, pkg);
  assert.equal(JSON.parse(readFileSync(paths.manifest, "utf8")).mode, "link");
});

test("install defaults to link mode in a checkout and to copy mode elsewhere", (t) => {
  for (const checkout of [true, false]) {
    const pkg = writePackage(t, { checkout });
    const home = writeHome(t);

    const result = runInstaller(pkg, home, ["install"]);

    assert.equal(result.status, 0, result.stderr);
    const mode = JSON.parse(readFileSync(installPaths(home).manifest, "utf8")).mode;
    assert.equal(mode, checkout ? "link" : "copy");
  }
});

test("link mode refuses to run outside a checkout and changes nothing", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  const before = snapshot(home);

  const result = runInstaller(pkg, home, ["install", "--mode", "link"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /link mode needs a git checkout/);
  assert.deepEqual(snapshot(home), before);
});

test("copy mode copies the knowledge base and the MATLAB helpers and records no authoring root", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--mode", "copy"]);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(lstatSync(paths.knowledge).isDirectory());
  assert.deepEqual(snapshot(paths.knowledge), snapshot(join(pkg, "knowledge")));
  const helper = "run_ram.m";
  assert.equal(readFileSync(join(paths.matlab, helper), "utf8"), readFileSync(join(pkg, "tools", "matlab", helper), "utf8"));
  assert.ok(existsSync(join(paths.matlab, "oae_local_paths.m")));
  const pathMap = parseYaml(readFileSync(paths.pathMap, "utf8"));
  assert.equal(pathMap.knowledge_base, paths.knowledge);
  assert.equal("authoring_root" in pathMap, false);
});

test("install places the router skill canonically and gives Claude a symlink to it", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(lstatSync(paths.sharedSkill).isDirectory());
  const skill = readFileSync(join(paths.sharedSkill, "SKILL.md"), "utf8");
  assert.equal(parseFrontmatter(skill).frontmatter.name, "ocean-acoustics-router");
  assert.match(skill, new RegExp(`${paths.knowledge}/routing-map\\.yaml`));
  assert.doesNotMatch(skill, /\{\{/);
  assert.ok(lstatSync(paths.claudeSkill).isSymbolicLink());
  assert.equal(realpathSync(paths.claudeSkill), realpathSync(paths.sharedSkill));
});

test("install detects the toolbox trees and writes them to the path map and the MATLAB config", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, TOOLBOXES);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /warning/);
  const pathMap = parseYaml(readFileSync(paths.pathMap, "utf8"));
  assert.equal(pathMap.at_2020, join(home, "Tools/AT/atWin10_2020_11_4"));
  assert.equal(pathMap.at_2023, join(home, "Tools/AT/at_2023"));
  const config = readFileSync(join(pkg, "tools", "matlab", "oae_local_paths.m"), "utf8");
  assert.match(config, /^function paths = oae_local_paths\( \)$/m);
  assert.match(config, new RegExp(`paths\\.at_2020 = '${join(home, "Tools/AT/atWin10_2020_11_4")}';`));
  assert.match(config, new RegExp(`paths\\.at_2023 = '${join(home, "Tools/AT/at_2023")}';`));
});

test("install takes toolbox locations from flags over detection", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...TOOLBOXES, "Elsewhere/at2020/.keep": "" });
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--at-2020", join(home, "Elsewhere/at2020")]);

  assert.equal(result.status, 0, result.stderr);
  const pathMap = parseYaml(readFileSync(paths.pathMap, "utf8"));
  assert.equal(pathMap.at_2020, join(home, "Elsewhere/at2020"));
  assert.equal(pathMap.at_2023, join(home, "Tools/AT/at_2023"));
});

test("install keeps an earlier flag value when re-run without the flag", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...TOOLBOXES, "Elsewhere/at2020/.keep": "" });

  runInstaller(pkg, home, ["install", "--at-2020", join(home, "Elsewhere/at2020")]);
  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseYaml(readFileSync(installPaths(home).pathMap, "utf8")).at_2020, join(home, "Elsewhere/at2020"));
});

test("install warns and leaves a toolbox unset when it finds none or several", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, {
    "Tools/AT/at_2023/RAM/ram.exe": "elf",
    "Backup/at_2023/RAM/ram.exe": "elf",
  });
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /warning: at_2020 not found under .*; reinstall with --at-2020 <dir>/);
  assert.match(result.stderr, /warning: at_2023 is ambiguous \(.*Backup\/at_2023, .*Tools\/AT\/at_2023\); reinstall with --at-2023 <dir>/);
  const pathMap = parseYaml(readFileSync(paths.pathMap, "utf8"));
  assert.equal(pathMap.at_2020, null);
  assert.equal(pathMap.at_2023, null);
  assert.match(readFileSync(join(pkg, "tools", "matlab", "oae_local_paths.m"), "utf8"), /paths\.at_2020 = '';/);
});

test("install backs up and cleans up the legacy setup, leaving neighbouring files alone", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...LEGACY_FILES, ...NEIGHBOUR_FILES });
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  const [backupDir] = readdirSync(paths.backups);
  assert.match(backupDir, /^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d\.\d{3}Z$/);
  for (const [path, content] of Object.entries(LEGACY_FILES)) {
    assert.equal(readFileSync(join(paths.backups, backupDir, path), "utf8"), content, `backup of ${path}`);
  }
  assert.equal(existsSync(join(home, ".claude/knowledge/ocean-acoustics")), false);
  assert.equal(existsSync(join(home, ".claude/hooks/tests/ocean-acoustics-route-selection-regression.js")), false);
  assert.equal(existsSync(join(home, ".claude/hooks/tests/fixtures/underwater-route-selection-cases.json")), false);
  assert.ok(lstatSync(paths.claudeSkill).isSymbolicLink());
  assert.doesNotMatch(readFileSync(join(paths.sharedSkill, "SKILL.md"), "utf8"), /\.Codex/);
  assert.doesNotMatch(readFileSync(paths.agent, "utf8"), /old agent/);
  for (const [path, content] of Object.entries(NEIGHBOUR_FILES)) {
    assert.equal(readFileSync(join(home, path), "utf8"), content, `${path} is untouched`);
  }
});

test("the manifest lists every file, link and backup the install made", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, LEGACY_FILES);
  const paths = installPaths(home);

  runInstaller(pkg, home, ["install"]);

  const manifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
  const recorded = manifest.units.map((unit) => unit.path);
  for (const path of [paths.knowledge, paths.matlab, paths.pathMap, paths.sharedSkill, paths.claudeSkill, paths.agent]) {
    assert.ok(recorded.includes(path), `${path} is in the manifest`);
  }
  assert.ok(recorded.includes(join(pkg, "tools", "matlab", "oae_local_paths.m")));
  assert.deepEqual(
    manifest.backups.map((backup) => backup.path).sort(),
    [
      ".agents/skills/ocean-acoustics-router",
      ".claude/agents/ocean-acoustics-expert.md",
      ".claude/hooks/tests/fixtures/underwater-route-selection-cases.json",
      ".claude/hooks/tests/ocean-acoustics-route-selection-regression.js",
      ".claude/knowledge/ocean-acoustics",
      ".claude/skills/ocean-acoustics-router",
    ].map((path) => join(home, path)),
  );
  for (const backup of manifest.backups) assert.ok(existsSync(backup.backup), `${backup.backup} exists`);
});

test("a dry run lists every write, link, backup and removal and changes nothing", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, LEGACY_FILES);
  const paths = installPaths(home);
  const before = { home: snapshot(home), pkg: snapshot(pkg) };

  const result = runInstaller(pkg, home, ["install", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
  const lines = result.stdout.split("\n").map((line) => line.trim());
  assert.ok(lines.includes(`knowledge_base: ${paths.knowledge}`), result.stdout);
  assert.ok(lines.includes("at_2020: (not set)"), result.stdout);
  assert.ok(lines.includes(`write   ${paths.agent}`), result.stdout);
  assert.ok(lines.includes(`write   ${paths.pathMap}`), result.stdout);
  assert.ok(lines.includes(`write   ${paths.manifest}`), result.stdout);
  assert.ok(lines.includes(`link    ${paths.knowledge} -> ${join(pkg, "knowledge")}`), result.stdout);
  assert.ok(lines.includes(`link    ${paths.claudeSkill} -> ../../.agents/skills/ocean-acoustics-router`), result.stdout);
  assert.ok(lines.includes(`remove  ${join(home, ".claude/knowledge/ocean-acoustics")}`), result.stdout);
  assert.ok(lines.some((line) => line.startsWith(`backup  ${join(home, ".claude/knowledge/ocean-acoustics")} -> ${paths.backups}/`)), result.stdout);
});

test("re-running install with nothing changed is a no-op", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...LEGACY_FILES, ...TOOLBOXES });
  runInstaller(pkg, home, ["install"]);
  const before = { home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) };

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /up to date; nothing to do/);
  assert.deepEqual({ home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) }, before);
});

test("re-running install in copy mode is a no-op too", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  runInstaller(pkg, home, ["install"]);
  const before = snapshot(home, { mtimes: true });

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /up to date; nothing to do/);
  assert.deepEqual(snapshot(home, { mtimes: true }), before);
});

test("install backs up an installed file the user has edited before replacing it", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);
  runInstaller(pkg, home, ["install"]);
  writeFileSync(paths.agent, "my local edits\n");

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(readFileSync(paths.agent, "utf8"), /my local edits/);
  const [backupDir] = readdirSync(paths.backups);
  assert.equal(readFileSync(join(paths.backups, backupDir, ".claude/agents/ocean-acoustics-expert.md"), "utf8"), "my local edits\n");
});

test("install refuses harnesses it does not support and needs one to be present", (t) => {
  const pkg = writePackage(t);
  const bare = writeDirectory(t, { "notes.txt": "no harness here\n" });
  const before = snapshot(bare);

  const unsupported = runInstaller(pkg, bare, ["install", "--harness", "gemini"]);
  const none = runInstaller(pkg, bare, ["install"]);

  assert.equal(unsupported.status, 2);
  assert.match(unsupported.stderr, /harness gemini is not supported \(supported: [^)]*\bclaude\b[^)]*\)/);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /no supported harness found; pass --harness \(supported: [^)]*\bclaude\b[^)]*\)/);
  assert.deepEqual(snapshot(bare), before);
});

test("install refuses to switch modes over an existing install", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  runInstaller(pkg, home, ["install", "--mode", "link"]);
  const before = snapshot(home);

  const result = runInstaller(pkg, home, ["install", "--mode", "copy"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /installed in link mode; run uninstall before installing in copy mode/);
  assert.deepEqual(snapshot(home), before);
});

test("install honours XDG_DATA_HOME and CLAUDE_CONFIG_DIR", (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, { "elsewhere/claude/settings.json": "{}\n" });
  const env = { XDG_DATA_HOME: join(home, "elsewhere", "data"), CLAUDE_CONFIG_DIR: join(home, "elsewhere", "claude") };

  const result = runInstaller(pkg, home, ["install"], env);

  assert.equal(result.status, 0, result.stderr);
  const data = join(home, "elsewhere", "data", "ocean-acoustics-expert");
  assert.ok(lstatSync(join(data, "knowledge")).isSymbolicLink());
  const agent = readFileSync(join(home, "elsewhere", "claude", "agents", "ocean-acoustics-expert.md"), "utf8");
  assert.match(agent, new RegExp(`${data}/knowledge/00-hub\\.md`));
  assert.equal(realpathSync(join(home, "elsewhere", "claude", "skills", "ocean-acoustics-router")), realpathSync(join(home, ".agents", "skills", "ocean-acoustics-router")));
  assert.equal(existsSync(join(home, ".claude")), false);
});

test("install backs up an installed link the user has pointed elsewhere", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);
  runInstaller(pkg, home, ["install"]);
  rmSync(paths.claudeSkill);
  symlinkSync(join(home, "my-router"), paths.claudeSkill);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(realpathSync(paths.claudeSkill), realpathSync(paths.sharedSkill));
  const [backupDir] = readdirSync(paths.backups);
  assert.equal(readlinkSync(join(paths.backups, backupDir, ".claude/skills/ocean-acoustics-router")), join(home, "my-router"));
});
