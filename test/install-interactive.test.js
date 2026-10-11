import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { installPaths, runInstaller, snapshot, writeHome, writePackage } from "./helpers/install.js";
import { fakeTerminal } from "./helpers/terminal.js";

/** Environment variables that move install locations; cleared so the fake home decides. */
const LOCATION_VARIABLES = ["XDG_DATA_HOME", "XDG_CONFIG_HOME", "CLAUDE_CONFIG_DIR", "CODEX_HOME", "DSH_HOME"];

const DOWN = "\x1b[B";
const CTRL_C = "\x03";

/**
 * Run a fixture package's install in this process, on a fake terminal, with
 * the fake home as HOME. The fixture's own modules are imported, so install
 * links to and writes into the fixture, never this checkout.
 * @param {import("node:test").TestContext} t
 * @param {string} pkg
 * @param {string} home
 * @param {string[]} args Install arguments, after the command name.
 * @param {string[]} keys Typed one at a time once install is waiting.
 */
async function installInteractively(t, pkg, home, args, keys) {
  const saved = Object.fromEntries(["HOME", ...LOCATION_VARIABLES].map((name) => [name, process.env[name]]));
  t.after(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  process.env.HOME = home;
  for (const name of LOCATION_VARIABLES) delete process.env[name];
  const stdout = [];
  const stderr = [];
  t.mock.method(console, "log", (line) => stdout.push(line));
  t.mock.method(console, "error", (line) => stderr.push(line));

  const { runInstall } = await import(pathToFileURL(join(pkg, "src", "install.js")).href);
  const terminal = fakeTerminal();
  const status = runInstall(args, { terminal });
  await terminal.type(...keys);
  return { status: await status, screen: terminal.written(), stdout: stdout.join("\n"), stderr: stderr.join("\n") };
}

test("interactive install lists every harness, checks the ones present and installs the ones picked", async (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".dsh/settings.yaml": "{}\n" });

  // Claude Code and DeepSeek-TUI start checked; uncheck Claude Code, confirm, then go ahead.
  const result = await installInteractively(t, pkg, home, [], [" ", "\r", "y"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.screen, /Claude Code {2}\(found at ~\/\.claude\)/);
  assert.match(result.screen, /Codex {2}\(not found at ~\/\.codex\)/);
  assert.match(result.screen, /OpenCode {2}\(not found at ~\/\.config\/opencode\)/);
  assert.match(result.screen, /\[x\] DeepSeek-TUI \(dst\) {2}\(found at ~\/\.dsh\)/);
  assert.match(result.screen, /✔ Install into which harnesses\? DeepSeek-TUI \(dst\)/);
  assert.match(result.screen, /Go ahead\? \(Y\/n\) yes/);
  const manifest = JSON.parse(readFileSync(installPaths(home).manifest, "utf8"));
  assert.deepEqual(manifest.harnesses, ["deepseek"]);
  assert.ok(existsSync(join(home, ".dsh", "agents", "ocean-acoustics-expert.md")));
  assert.ok(!existsSync(installPaths(home).agent));
});

test("interactive install can pick a harness whose config folder is missing", async (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);

  // Move to Codex and check it; enter on the default answer goes ahead.
  const result = await installInteractively(t, pkg, home, [], [DOWN, " ", "\r", "\r"]);

  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(installPaths(home).manifest, "utf8"));
  assert.deepEqual(manifest.harnesses, ["claude", "codex"]);
  assert.ok(existsSync(join(home, ".codex", "agents", "ocean-acoustics-expert.toml")));
});

test("a re-run starts with the recorded harnesses checked", async (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".dsh/settings.yaml": "{}\n" });
  assert.equal(runInstaller(pkg, home, ["install", "--harness", "deepseek"]).status, 0);

  const result = await installInteractively(t, pkg, home, [], ["\r"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.screen, /\[ \] Claude Code/);
  assert.match(result.screen, /\[x\] DeepSeek-TUI/);
  assert.match(result.stdout, /installed and up to date; nothing to do/);
});

test("cancelling the harness choice or declining to go ahead changes nothing", async (t) => {
  for (const [what, keys] of [
    ["ctrl+c at the choice", [CTRL_C]],
    ["q at the choice", ["q"]],
    ["no at the confirmation", ["\r", "n"]],
    ["ctrl+c at the confirmation", ["\r", CTRL_C]],
  ]) {
    await t.test(what, async (t) => {
      const pkg = writePackage(t);
      const home = writeHome(t);
      const before = snapshot(home);

      const result = await installInteractively(t, pkg, home, [], keys);

      assert.equal(result.status, 130);
      assert.match(result.stderr, /Install cancelled; nothing was changed\./);
      assert.deepEqual(snapshot(home), before);
    });
  }
});

test("the confirmation names every path install backs up first", async (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, { ".claude/agents/ocean-acoustics-expert.md": "my own agent\n" });

  const result = await installInteractively(t, pkg, home, [], ["\r", "n"]);

  assert.equal(result.status, 130);
  assert.match(result.screen, /It first backs up 1 paths it did not write:\n {2}\S+\/\.claude\/agents\/ocean-acoustics-expert\.md/);
  assert.equal(readFileSync(join(home, ".claude", "agents", "ocean-acoustics-expert.md"), "utf8"), "my own agent\n");
});

test("--harness skips the choice and --yes skips every question", async (t) => {
  const pkg = writePackage(t);
  const picked = writeHome(t);
  const scripted = writeHome(t);

  const withHarness = await installInteractively(t, pkg, picked, ["--harness", "codex"], ["y"]);
  const withYes = await installInteractively(t, pkg, scripted, ["--yes"], []);

  assert.equal(withHarness.status, 0, withHarness.stderr);
  assert.doesNotMatch(withHarness.screen, /which harnesses/);
  assert.match(withHarness.screen, /Go ahead\?/);
  assert.equal(withYes.status, 0, withYes.stderr);
  assert.equal(withYes.screen, "");
});

test("a dry run asks which harnesses but never asks to go ahead", async (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const before = snapshot(home);

  const result = await installInteractively(t, pkg, home, ["--dry-run"], ["\r"]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.screen, /Go ahead\?/);
  assert.match(result.stdout, /Dry run: nothing was changed\./);
  assert.deepEqual(snapshot(home), before);
});
