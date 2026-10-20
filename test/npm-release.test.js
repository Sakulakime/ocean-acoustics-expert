import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { writeDirectory } from "./helpers/knowledge-base.js";

const HELPER = fileURLToPath(new URL("../scripts/npm-release.mjs", import.meta.url));
const REGISTRY_FIXTURE = {
  skip: process.platform === "win32" ? "POSIX npm stub; release jobs run on Linux" : false,
};
const NOTES = [
  "knowledge/book-selection.md",
  "knowledge/topics/collins-pe-extensions.md",
  "knowledge/topics/colosi-stochastic-propagation.md",
  "knowledge/topics/etter-model-evaluation.md",
  "knowledge/topics/brekhovskikh-waveguide-approximations.md",
];

function fixture(t, manifest = {}) {
  return writeDirectory(t, {
    "package.json": JSON.stringify({ name: "ocean-acoustics-expert", version: "0.2.0", ...manifest }),
  });
}

function run(root, args, env = {}) {
  return spawnSync(process.execPath, [HELPER, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function resultOf(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("release plan validates the tag and chooses the stable npm dist-tag", (t) => {
  const root = fixture(t);
  assert.deepEqual(resultOf(run(root, ["plan", "--tag", "v0.2.0"])), {
    name: "ocean-acoustics-expert",
    version: "0.2.0",
    distTag: "latest",
    spec: "ocean-acoustics-expert@0.2.0",
  });
});

test("release plan keeps prereleases off latest and rejects invalid release metadata", async (t) => {
  for (const [name, manifest, args, expected] of [
    ["semantic prerelease", { version: "0.3.0-beta.1" }, ["--tag", "v0.3.0-beta.1"], "next"],
    ["GitHub prerelease", {}, ["--tag", "v0.2.0", "--prerelease", "true"], "next"],
    ["mismatch", {}, ["--tag", "v0.3.0"], /exactly match/],
    ["unsafe tag", {}, ["--tag", "v0.2.0;echo unsafe"], /exactly match/],
    ["numeric leading zero", { version: "0.2.0-01" }, ["--tag", "v0.2.0-01"], /exactly match/],
    ["build metadata npm cannot preserve", { version: "0.2.0+build.1" }, ["--tag", "v0.2.0+build.1"], /exactly match/],
    ["wrong package", { name: "another-package" }, ["--tag", "v0.2.0"], /public package/],
    ["private package", { private: true }, ["--tag", "v0.2.0"], /public package/],
    ["bad flag", {}, ["--tag", "v0.2.0", "--prerelease", "yes"], /boolean/],
    ["duplicate tag", {}, ["--tag", "v0.2.0", "--tag", "v0.2.0"], /duplicate/i],
  ]) {
    await t.test(name, (st) => {
      const result = run(fixture(st, manifest), ["plan", ...args]);
      if (typeof expected === "string") assert.equal(resultOf(result).distTag, expected);
      else {
        assert.equal(result.status, 1);
        assert.match(result.stderr, expected);
      }
    });
  }
});

function pack(root, extra = [], overrides = {}) {
  const path = join(root, "pack.json");
  writeFileSync(path, JSON.stringify([{
    name: "ocean-acoustics-expert", version: "0.2.0",
    files: [...NOTES, "package.json", ...extra].map((file) => ({ path: file })),
    integrity: "sha512-local-artifact",
    ...overrides,
  }]));
  return path;
}

test("package check requires all five new knowledge files and rejects private material", async (t) => {
  const root = fixture(t);
  assert.equal(resultOf(run(root, ["check-pack", pack(root)])).files, 6);
  for (const forbidden of [
    "knowledge/sources/book.PDF", "knowledge/.zotero-cache", ".npmrc", ".env.production",
    "config/credentials.json", "temp/notes.md", ".scratch/notes.md", ".git/config",
    "tools/matlab/oae_local_paths.m", "../escape", "C:\\secret.txt",
  ]) {
    await t.test(forbidden, (st) => {
      const dir = fixture(st);
      const result = run(dir, ["check-pack", pack(dir, [forbidden])]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /forbidden|unsafe/i);
    });
  }
  for (const overrides of [
    { version: "0.1.1" }, { name: "wrong-package" },
    { files: NOTES.slice(1).map((path) => ({ path })) },
  ]) {
    const result = run(root, ["check-pack", pack(root, [], overrides)]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /match|missing/i);
  }
});

function fakeNpm(root, replies) {
  const executable = join(root, "npm");
  writeFileSync(executable, `#!${process.execPath}\n` + [
    'const fs = require("node:fs");',
    'const args = process.argv.slice(2);',
    'fs.appendFileSync(process.env.FAKE_NPM_CALLS, JSON.stringify(args) + "\\n");',
    'const replies = JSON.parse(process.env.FAKE_NPM_REPLIES);',
    'const key = args.includes("dist-tags") ? "tags" : "version";',
    'const reply = replies[key];',
    'if (!reply) process.exit(99);',
    'if (reply.stderr) process.stderr.write(reply.stderr);',
    'process.stdout.write(JSON.stringify(reply.body));',
    'process.exit(reply.status ?? 0);',
  ].join("\n"));
  chmodSync(executable, 0o755);
  return {
    PATH: `${root}:${dirname(process.execPath)}`,
    FAKE_NPM_CALLS: join(root, "npm-calls.jsonl"),
    FAKE_NPM_REPLIES: JSON.stringify(replies),
  };
}

test("registry state distinguishes unpublished versions from immutable published artifacts", REGISTRY_FIXTURE, (t) => {
  const root = fixture(t);
  const env = fakeNpm(root, {
    version: { status: 1, body: { error: { code: "E404" } } },
    tags: { body: { latest: "0.1.1" } },
  });
  const result = resultOf(run(root, ["registry-state", "--tag", "v0.2.0"], env));
  assert.equal(result.published, false);
  assert.equal(result.publishTag, "latest");
  const calls = readFileSync(env.FAKE_NPM_CALLS, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(calls.length, 2);
  for (const args of calls) {
    assert.ok(args.includes("--registry=https://registry.npmjs.org"));
    assert.ok(args.includes("--fetch-retries=0"));
    assert.ok(args.includes("--fetch-timeout=15000"));
    assert.equal(args[0], "view");
  }
  const existing = fakeNpm(root, {
    version: { body: { version: "0.2.0", "dist.integrity": "sha512-local-artifact" } },
    tags: { body: { latest: "0.2.0" } },
  });
  const state = resultOf(run(root, ["registry-state", "--tag", "v0.2.0", "--pack-manifest", pack(root)], existing));
  assert.equal(state.published, true);
});

test("registry errors never masquerade as an unpublished version", REGISTRY_FIXTURE, async (t) => {
  for (const code of ["E401", "E500", "ETIMEDOUT"]) {
    await t.test(code, (st) => {
      const root = fixture(st);
      const env = fakeNpm(root, { version: { status: 1, body: { error: { code } } } });
      const result = run(root, ["registry-state", "--tag", "v0.2.0"], env);
      assert.equal(result.status, 1);
      assert.match(result.stderr, new RegExp(code));
    });
  }
  const root = fixture(t);
  const env = fakeNpm(root, { version: { status: 1, stderr: "unstructured E404", body: null } });
  assert.equal(run(root, ["registry-state", "--tag", "v0.2.0"], env).status, 1);
  const missingProcess = run(root, ["registry-state", "--tag", "v0.2.0"], { PATH: join(root, "no-programs") });
  assert.equal(missingProcess.status, 1);
  assert.match(missingProcess.stderr, /ENOENT/);
});

test("an unpublished backport preserves latest and cannot pass publication verification", REGISTRY_FIXTURE, (t) => {
  const root = fixture(t);
  const env = fakeNpm(root, {
    version: { status: 1, body: { error: { code: "E404" } } },
    tags: { body: { latest: "0.3.0" } },
  });
  const state = resultOf(run(root, ["registry-state", "--tag", "v0.2.0"], env));
  assert.equal(state.published, false);
  assert.equal(state.publishTag, "backport");
  const result = run(root, ["verify", "--tag", "v0.2.0"], env);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not published/);
});

test("an integrity-less pack manifest fails before registry access", (t) => {
  const root = fixture(t);
  const path = pack(root, [], { integrity: undefined });
  const result = run(root, ["registry-state", "--tag", "v0.2.0", "--pack-manifest", path], {
    PATH: join(root, "no-programs"),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /integrity/);
});

test("registry state refuses an existing version with different integrity or metadata", REGISTRY_FIXTURE, async (t) => {
  for (const body of [
    { version: "0.2.0", "dist.integrity": "sha512-different" },
    { version: "0.1.1", "dist.integrity": "sha512-local-artifact" },
    { version: "0.2.0" },
  ]) {
    const root = fixture(t);
    const env = fakeNpm(root, { version: { body }, tags: { body: { latest: "0.2.0" } } });
    const result = run(root, ["registry-state", "--tag", "v0.2.0", "--pack-manifest", pack(root)], env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /integrity|version/i);
  }
});

test("release reruns preserve newer dist-tags and verification refuses missing or older tags", REGISTRY_FIXTURE, async (t) => {
  for (const [version, flag, current, ok, publishTag] of [
    ["0.2.0", "false", "0.2.0", true, "latest"],
    ["0.2.0", "false", "0.3.0", true, "backport"],
    ["0.2.0", "false", "0.1.1", false, "latest"],
    ["0.2.0", "false", undefined, false, "latest"],
    ["0.3.0-beta.2", "false", "0.3.0-beta.10", true, "backport"],
    ["0.3.0-beta.10", "false", "0.3.0-beta.2", false, "next"],
    ["0.3.0-beta.1", "false", "0.3.0", true, "backport"],
  ]) {
    await t.test(`${version} at ${current}`, (st) => {
      const root = fixture(st, { version });
      const tag = version.includes("-") || flag === "true" ? "next" : "latest";
      const env = fakeNpm(root, {
        version: { body: { version, "dist.integrity": "sha512-local-artifact" } },
        tags: { body: current ? { [tag]: current } : {} },
      });
      const args = ["--tag", `v${version}`, "--prerelease", flag];
      assert.equal(resultOf(run(root, ["registry-state", ...args], env)).publishTag, publishTag);
      const result = run(root, ["verify", ...args], env);
      assert.equal(result.status, ok ? 0 : 1, result.stderr);
      if (ok) assert.equal(JSON.parse(result.stdout).verified, true);
      else assert.match(result.stderr, /dist-tag.*missing|dist-tag.*behind/i);
    });
  }
});
