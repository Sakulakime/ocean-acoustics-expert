import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
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

/** An absolute path as written in rendered files: not part of a word, unit or relative path. */
const ABSOLUTE_PATH = /(?<![\w.~)\]}])\/[^\s`'")\]]+/g;

/** OpenCode's config folder as found on the author's machine. */
const OPENCODE_CONFIG = { ".config/opencode/opencode.json": '{\n  "$schema": "https://opencode.ai/config.json"\n}\n' };

/** A hand-made OpenCode agent where install puts its own. */
const FOREIGN_AGENT = {
  ".config/opencode/agents/ocean-acoustics-expert.md": "---\ndescription: hand-made\nmode: subagent\n---\nhand-made agent\n",
};

/**
 * The OpenCode agent file inside a fake home (XDG config default).
 * @param {string} home
 */
function opencodeAgent(home) {
  return join(home, ".config", "opencode", "agents", "ocean-acoustics-expert.md");
}

test("install renders a read-only OpenCode subagent that points at the installed copy", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t, { ...OPENCODE_CONFIG, ...TOOLBOXES });
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--harness", "opencode", "--mode", "copy"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter, body } = parseFrontmatter(readFileSync(opencodeAgent(home), "utf8"));
  assert.match(frontmatter.description, /underwater acoustics/);
  assert.equal(frontmatter.mode, "subagent");
  assert.equal("tools" in frontmatter, false, "OpenCode ignores a Claude-style tools list");
  const { external_directory: externalDirectory, read, ...denials } = frontmatter.permission;
  assert.deepEqual(denials, { edit: "deny", bash: "deny", webfetch: "deny", websearch: "deny", task: "deny" });
  assert.deepEqual({ ...read }, { "*.pdf": "deny" }, "PDFs are blocked; OpenCode's own read defaults stay");
  assert.deepEqual(Object.entries(externalDirectory), [
    [`${paths.data}/**`, "allow"],
    [`${join(home, "Tools/AT/at_2023")}/**`, "allow"],
    [`${join(home, "Tools/AT/atWin10_2020_11_4")}/**`, "allow"],
  ]);
  assert.match(body, new RegExp(`${paths.knowledge}/00-hub\\.md`));
  assert.match(body.trimStart(), /^## Harness note: OpenCode\n/);
  assert.match(body, /replaces step 5 of the retrieval order/);
  assert.match(body, /name the book and the PDF page range/);
  assert.doesNotMatch(body, /\{\{/);
  for (const [path] of body.matchAll(ABSOLUTE_PATH)) {
    assert.ok(path.startsWith(`${paths.data}/`), `${path} is outside the installed copy`);
  }
});

test("in link mode the OpenCode agent may also read the folders the installed copy links to", (t) => {
  // OpenCode's grep reports matches under a symbolic link by their resolved paths.
  const pkg = writePackage(t);
  const home = writeHome(t, OPENCODE_CONFIG);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--harness", "opencode", "--mode", "link"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter } = parseFrontmatter(readFileSync(opencodeAgent(home), "utf8"));
  assert.deepEqual(Object.keys(frontmatter.permission.external_directory), [
    `${paths.data}/**`,
    `${readlinkSync(paths.knowledge)}/**`,
    `${readlinkSync(paths.matlab)}/**`,
  ]);
});

test("in copy mode without toolboxes the OpenCode agent may read only the data folder", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t, OPENCODE_CONFIG);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install", "--harness", "opencode", "--mode", "copy"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter } = parseFrontmatter(readFileSync(opencodeAgent(home), "utf8"));
  assert.deepEqual(Object.keys(frontmatter.permission.external_directory), [`${paths.data}/**`]);
});

test("OpenCode is detected by its config folder and reads the router from the shared skills folder", (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, OPENCODE_CONFIG);
  const paths = installPaths(home);

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(readFileSync(paths.manifest, "utf8")).harnesses, ["opencode"]);
  assert.ok(existsSync(opencodeAgent(home)));
  assert.ok(lstatSync(join(paths.sharedSkill, "SKILL.md")).isFile());
  assert.equal(existsSync(join(home, ".claude")), false);
  assert.deepEqual(readdirSync(join(home, ".config", "opencode")).sort(), ["agents", "opencode.json"]);
});

test("a dry run lists the OpenCode agent and changes nothing; the install then records it in the manifest", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...OPENCODE_CONFIG, ...FOREIGN_AGENT });
  const paths = installPaths(home);
  const before = { home: snapshot(home), pkg: snapshot(pkg) };

  const dryRun = runInstaller(pkg, home, ["install", "--dry-run"]);

  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
  const lines = dryRun.stdout.split("\n").map((line) => line.trim());
  const agent = opencodeAgent(home);
  assert.ok(lines.some((line) => line.startsWith(`backup  ${agent} -> ${paths.backups}/`)), dryRun.stdout);
  assert.ok(lines.includes(`write   ${agent}`), dryRun.stdout);

  const install = runInstaller(pkg, home, ["install"]);

  assert.equal(install.status, 0, install.stderr);
  const manifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
  assert.deepEqual(manifest.harnesses, ["claude", "opencode"]);
  const record = manifest.units.find((unit) => unit.path === agent);
  assert.equal(record?.kind, "file");
  assert.deepEqual(manifest.backups.map((backup) => backup.path), [agent]);
  assert.equal(readFileSync(manifest.backups[0].backup, "utf8"), Object.values(FOREIGN_AGENT)[0]);
});

test("re-running install with OpenCode is a no-op", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...OPENCODE_CONFIG, ...TOOLBOXES });
  runInstaller(pkg, home, ["install"]);
  const before = { home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) };

  const result = runInstaller(pkg, home, ["install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /up to date; nothing to do/);
  assert.deepEqual({ home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) }, before);
});

test("uninstall --restore returns a home with OpenCode to its exact pre-install state", async (t) => {
  for (const mode of ["link", "copy"]) {
    await t.test(`${mode} mode`, (st) => {
      const pkg = writePackage(st);
      const home = writeHome(st, { ...OPENCODE_CONFIG, ...FOREIGN_AGENT, ...LEGACY_FILES, ...NEIGHBOUR_FILES, ...TOOLBOXES });
      const before = { home: snapshot(home), pkg: snapshot(pkg) };
      assert.equal(runInstaller(pkg, home, ["install", "--mode", mode]).status, 0);
      assert.doesNotMatch(readFileSync(opencodeAgent(home), "utf8"), /hand-made/);

      const result = runInstaller(pkg, home, ["uninstall", "--restore"]);

      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
    });
  }
});

test("install puts the OpenCode agent under XDG_CONFIG_HOME when it is absolute", (t) => {
  const pkg = writePackage(t);
  const home = writeDirectory(t, { "elsewhere/config/opencode/opencode.json": "{}\n", ".config/opencode/opencode.json": "{}\n" });

  const absolute = runInstaller(pkg, home, ["install", "--harness", "opencode"], { XDG_CONFIG_HOME: join(home, "elsewhere", "config") });

  assert.equal(absolute.status, 0, absolute.stderr);
  assert.ok(existsSync(join(home, "elsewhere", "config", "opencode", "agents", "ocean-acoustics-expert.md")));
  assert.equal(existsSync(opencodeAgent(home)), false);
  assert.equal(runInstaller(pkg, home, ["uninstall"]).status, 0);

  const relative = runInstaller(pkg, home, ["install", "--harness", "opencode"], { XDG_CONFIG_HOME: "elsewhere/config" });

  assert.equal(relative.status, 0, relative.stderr);
  assert.ok(existsSync(opencodeAgent(home)));
});
