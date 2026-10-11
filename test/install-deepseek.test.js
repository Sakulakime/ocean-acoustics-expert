import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { installPaths, parseFrontmatter, runInstaller, writeHome, writePackage } from "./helpers/install.js";

const AGENT = join(".dsh", "agents", "ocean-acoustics-expert.md");

test("install renders a read-only DeepSeek-TUI agent in DSH's home that points at the installed copy", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".dsh/settings.yaml": "{}\n" });

  const result = runInstaller(pkg, home, ["install", "--harness", "deepseek"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter, body } = parseFrontmatter(readFileSync(join(home, AGENT), "utf8"));
  assert.equal(frontmatter.name, "ocean-acoustics-expert");
  assert.deepEqual(frontmatter.tools, ["Read", "Grep", "Glob"]);
  assert.ok(body.includes(join(installPaths(home).knowledge, "00-hub.md")));
});

test("DeepSeek-TUI gets no skill entry of its own, since DSH reads ~/.agents/skills", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".dsh/settings.yaml": "{}\n" });

  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  assert.ok(existsSync(join(installPaths(home).sharedSkill, "SKILL.md")));
  assert.ok(!existsSync(join(home, ".dsh", "skills")));
});

test("install finds DeepSeek-TUI by ~/.dsh and honours an absolute DSH_HOME", (t) => {
  const pkg = writePackage(t);
  const detected = writeHome(t, { ".dsh/settings.yaml": "{}\n" });
  const moved = writeHome(t);
  const dshHome = join(moved, "elsewhere", "dsh");

  assert.equal(runInstaller(pkg, detected, ["install"]).status, 0);
  const result = runInstaller(pkg, moved, ["install", "--harness", "deepseek"], { DSH_HOME: dshHome });

  assert.match(readFileSync(installPaths(detected).manifest, "utf8"), /"deepseek"/);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(dshHome, "agents", "ocean-acoustics-expert.md")));
  assert.ok(!existsSync(join(moved, AGENT)));
});

test("doctor checks the DeepSeek-TUI agent and uninstall removes it", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".dsh/settings.yaml": "{}\n" });
  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  const doctor = runInstaller(pkg, home, ["doctor"]);
  const uninstall = runInstaller(pkg, home, ["uninstall"]);

  assert.match(doctor.stdout, /OK +deepseek agent \S+\.dsh\/agents\/ocean-acoustics-expert\.md/);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.ok(!existsSync(join(home, AGENT)));
  assert.ok(existsSync(join(home, ".dsh", "settings.yaml")));
});
