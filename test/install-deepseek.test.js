import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { installPaths, parseFrontmatter, runInstaller, writeHome, writePackage } from "./helpers/install.js";

const EXPERT = join(".dsh", "skills", "ocean-acoustics-expert", "SKILL.md");
const DSH = { ".dsh/settings.yaml.imported": "{}\n" };

test("install puts the expert in DSH's skills folder as a skill that points at the installed copy", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, DSH);

  const result = runInstaller(pkg, home, ["install", "--harness", "deepseek"]);

  assert.equal(result.status, 0, result.stderr);
  const { frontmatter, body } = parseFrontmatter(readFileSync(join(home, EXPERT), "utf8"));
  assert.equal(frontmatter.name, "ocean-acoustics-expert");
  assert.equal(typeof frontmatter.description, "string");
  assert.ok(body.includes(join(installPaths(home).knowledge, "00-hub.md")));
  assert.ok(!existsSync(join(home, ".dsh", "agents")));
});

test("the DSH skill tells the agent to stay read-only and to print PDF page ranges with pdftotext", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, DSH);
  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  const { body } = parseFrontmatter(readFileSync(join(home, EXPERT), "utf8"));

  assert.match(body.trimStart(), /^## Harness note: DeepSeek-TUI/);
  assert.match(body, /stay read-only: never write, edit, move or delete a file/);
  const sources = join(installPaths(home).knowledge, "sources");
  assert.ok(body.includes(`pdftotext -f <first page> -l <last page> -layout <pdf> -`));
  assert.ok(body.includes(sources));
});

test("DeepSeek-TUI gets the router only through ~/.agents/skills, never a second copy", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, DSH);

  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  assert.ok(existsSync(join(installPaths(home).sharedSkill, "SKILL.md")));
  assert.deepEqual(readdirSync(join(home, ".dsh", "skills")), ["ocean-acoustics-expert"]);
});

test("install finds DeepSeek-TUI by ~/.dsh and honours an absolute DSH_HOME", (t) => {
  const pkg = writePackage(t);
  const detected = writeHome(t, DSH);
  const moved = writeHome(t);
  const dshHome = join(moved, "elsewhere", "dsh");

  assert.equal(runInstaller(pkg, detected, ["install"]).status, 0);
  const result = runInstaller(pkg, moved, ["install", "--harness", "deepseek"], { DSH_HOME: dshHome });

  assert.match(readFileSync(installPaths(detected).manifest, "utf8"), /"deepseek"/);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(dshHome, "skills", "ocean-acoustics-expert", "SKILL.md")));
  assert.ok(!existsSync(join(moved, EXPERT)));
});

test("doctor checks the DSH skill and uninstall removes it, leaving DSH's own files", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, DSH);
  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  const doctor = runInstaller(pkg, home, ["doctor"]);
  const uninstall = runInstaller(pkg, home, ["uninstall"]);

  assert.match(doctor.stdout, /OK +deepseek agent \S+\.dsh\/skills\/ocean-acoustics-expert\/SKILL\.md/);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.ok(!existsSync(join(home, ".dsh", "skills")));
  assert.ok(existsSync(join(home, ".dsh", "settings.yaml.imported")));
});
