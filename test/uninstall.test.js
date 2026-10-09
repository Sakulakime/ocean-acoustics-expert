import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  installPaths,
  LEGACY_FILES,
  NEIGHBOUR_FILES,
  runInstaller,
  snapshot,
  TOOLBOXES,
  writeHome,
  writePackage,
} from "./helpers/install.js";

test("status prints the installed version, mode, harnesses, paths and a manifest summary", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...LEGACY_FILES, ...TOOLBOXES });
  const paths = installPaths(home);
  runInstaller(pkg, home, ["install"]);

  const result = runInstaller(pkg, home, ["status"]);

  assert.equal(result.status, 0, result.stderr);
  const version = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).version;
  assert.match(result.stdout, new RegExp(`^ocean-acoustics-expert ${version.replaceAll(".", "\\.")} is installed$`, "m"));
  assert.match(result.stdout, /^mode: link$/m);
  assert.match(result.stdout, /^harnesses: claude$/m);
  assert.match(result.stdout, new RegExp(`^data directory: ${paths.data}$`, "m"));
  assert.match(result.stdout, new RegExp(`^  knowledge_base: ${paths.knowledge}$`, "m"));
  assert.match(result.stdout, new RegExp(`^  at_2023: ${join(home, "Tools/AT/at_2023")}$`, "m"));
  assert.match(result.stdout, new RegExp(`^  authoring_root: ${pkg}$`, "m"));
  assert.match(result.stdout, /^manifest: \d+ files, 3 links, 6 backups$/m);
});

test("status says so when nothing is installed", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);

  const result = runInstaller(pkg, home, ["status"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ocean-acoustics-expert is not installed/);
});

test("uninstall removes exactly what install wrote and keeps the backups", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ...LEGACY_FILES, ...NEIGHBOUR_FILES });
  const paths = installPaths(home);
  const pkgBefore = snapshot(pkg);
  runInstaller(pkg, home, ["install"]);

  const result = runInstaller(pkg, home, ["uninstall"]);

  assert.equal(result.status, 0, result.stderr);
  for (const path of [paths.agent, paths.claudeSkill, paths.sharedSkill, paths.knowledge, paths.matlab, paths.pathMap, paths.manifest]) {
    assert.equal(existsSync(path) || isLink(path), false, `${path} is gone`);
  }
  assert.deepEqual(snapshot(pkg), pkgBefore);
  for (const [path, content] of Object.entries(NEIGHBOUR_FILES)) {
    assert.equal(readFileSync(join(home, path), "utf8"), content, `${path} is untouched`);
  }
  assert.equal(existsSync(join(home, ".claude/knowledge/ocean-acoustics")), false, "legacy stays cleaned up");
  const [backupDir] = readdirSync(paths.backups);
  assert.equal(readFileSync(join(paths.backups, backupDir, ".claude/agents/ocean-acoustics-expert.md"), "utf8"), LEGACY_FILES[".claude/agents/ocean-acoustics-expert.md"]);
});

test("uninstall --restore returns the home to its exact pre-install state", async (t) => {
  for (const mode of ["link", "copy"]) {
    await t.test(`${mode} mode`, (st) => {
      const pkg = writePackage(st);
      const home = writeHome(st, { ...LEGACY_FILES, ...NEIGHBOUR_FILES, ...TOOLBOXES });
      const before = { home: snapshot(home), pkg: snapshot(pkg) };
      assert.equal(runInstaller(pkg, home, ["install", "--mode", mode]).status, 0);

      const result = runInstaller(pkg, home, ["uninstall", "--restore"]);

      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual({ home: snapshot(home), pkg: snapshot(pkg) }, before);
    });
  }
});

test("uninstall --restore also undoes a re-install that replaced an edited file", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, LEGACY_FILES);
  const before = snapshot(home);
  runInstaller(pkg, home, ["install"]);
  writeFileSync(installPaths(home).agent, "my local edits\n");
  runInstaller(pkg, home, ["install"]);

  const result = runInstaller(pkg, home, ["uninstall", "--restore"]);

  assert.equal(result.status, 0, result.stderr);
  const after = snapshot(home);
  const backups = Object.keys(after).filter((path) => path.startsWith(".local/share/ocean-acoustics-expert/backups/"));
  assert.ok(backups.some((path) => path.endsWith(".claude/agents/ocean-acoustics-expert.md")), "the edited copy is kept");
  for (const path of backups) delete after[path];
  delete after[".local/share/ocean-acoustics-expert/backups"];
  delete after[".local/share/ocean-acoustics-expert"];
  delete after[".local/share"];
  delete after[".local"];
  assert.deepEqual(after, before);
  assert.match(result.stdout, /kept/);
});

test("uninstall says so when nothing is installed", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const before = snapshot(home);

  const result = runInstaller(pkg, home, ["uninstall"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /not installed; nothing to do/);
  assert.deepEqual(snapshot(home), before);
});

test("uninstall backs up installed files and links the user has changed before removing them", (t) => {
  const pkg = writePackage(t, { checkout: false });
  const home = writeHome(t);
  const paths = installPaths(home);
  runInstaller(pkg, home, ["install"]);
  writeFileSync(paths.agent, "my agent edits\n");
  writeFileSync(join(paths.knowledge, "00-hub.md"), "my hub edits\n");
  rmSync(paths.claudeSkill);
  symlinkSync(join(home, "my-router"), paths.claudeSkill);

  const result = runInstaller(pkg, home, ["uninstall"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(paths.agent), false);
  const after = snapshot(paths.backups);
  const backupOf = (path) => Object.keys(after).find((entry) => entry.endsWith(path));
  assert.equal(readFileSync(join(paths.backups, backupOf(".claude/agents/ocean-acoustics-expert.md")), "utf8"), "my agent edits\n");
  assert.equal(readFileSync(join(paths.backups, backupOf("knowledge/00-hub.md")), "utf8"), "my hub edits\n");
  assert.equal(readlinkSync(join(paths.backups, backupOf(".claude/skills/ocean-acoustics-router"))), join(home, "my-router"));
});

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}
