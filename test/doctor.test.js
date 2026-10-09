import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { installPaths, runInstaller, snapshot, TOOLBOXES, writeHome, writePackage } from "./helpers/install.js";
import { writeDirectory } from "./helpers/knowledge-base.js";

/** Config folders of Codex and OpenCode; writeHome adds Claude's. */
const HARNESS_CONFIGS = {
  ".codex/config.toml": 'model = "gpt-5"\n',
  ".config/opencode/opencode.json": "{}\n",
};

/** A chapter note that points at the fixture package's book PDF. */
const NOTE_WITH_PDF = { "chapters/ch01.md": "---\nsource_pdf: sources/book.pdf\n---\n# Chapter 1\n" };

/**
 * The agent file of each harness inside a fake home (default config folders).
 * @param {string} home
 */
function agentPaths(home) {
  return {
    claude: join(home, ".claude", "agents", "ocean-acoustics-expert.md"),
    codex: join(home, ".codex", "agents", "ocean-acoustics-expert.toml"),
    opencode: join(home, ".config", "opencode", "agents", "ocean-acoustics-expert.md"),
  };
}

/**
 * Install into Claude Code, Codex and OpenCode in a fake home with toolboxes.
 * @param {import("node:test").TestContext} t
 * @param {{mode?: "link"|"copy", files?: Record<string, string>, knowledge?: Record<string, string>}} [options]
 *   Extra home files, and knowledge-base files of the package.
 */
function installEverywhere(t, { mode = "link", files = {}, knowledge = NOTE_WITH_PDF } = {}) {
  const pkg = writePackage(t, { knowledge });
  const home = writeHome(t, { ...HARNESS_CONFIGS, ...TOOLBOXES, ...files });
  const result = runInstaller(pkg, home, ["install", "--mode", mode]);
  assert.equal(result.status, 0, result.stderr);
  const paths = installPaths(home);
  const agents = agentPaths(home);
  const router = join(paths.sharedSkill, "SKILL.md");
  return {
    pkg,
    home,
    paths,
    agents,
    /** Each file doctor inspects, with the label its messages start with. */
    files: {
      ...Object.fromEntries(Object.entries(agents).map(([harness, path]) => [harness, { path, label: `${harness} agent ${path}` }])),
      router: { path: router, label: `skill ocean-acoustics-router ${router}` },
    },
  };
}

/**
 * Run doctor, asserting that it left the home and the package exactly as they were.
 * @param {string} pkg
 * @param {string} home
 * @param {string[]} [args]
 */
function runDoctor(pkg, home, args = []) {
  const before = { home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) };
  const result = runInstaller(pkg, home, ["doctor", ...args]);
  const after = { home: snapshot(home, { mtimes: true }), pkg: snapshot(pkg, { mtimes: true }) };
  assert.deepEqual(after, before, "doctor changed files");
  return { ...result, stdoutLines: result.stdout.split("\n"), stderrLines: result.stderr.split("\n") };
}

test("doctor passes a healthy install in every harness", async (t) => {
  for (const mode of ["link", "copy"]) {
    await t.test(`${mode} mode`, (st) => {
      const { pkg, home, paths, agents } = installEverywhere(st, { mode });

      const result = runDoctor(pkg, home);

      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, "");
      const lines = result.stdoutLines;
      assert.match(lines[0], new RegExp(`ocean-acoustics-expert \\S+, installed in ${mode} mode for claude, codex, opencode`));
      assert.ok(lines.includes(`OK   local path map ${paths.pathMap}: every entry that is set exists`), result.stdout);
      assert.ok(lines.includes(`OK   symbolic links: all ${mode === "link" ? 3 : 1} resolve`), result.stdout);
      for (const [harness, path] of Object.entries(agents)) {
        assert.ok(lines.includes(`OK   ${harness} agent ${path}`), result.stdout);
      }
      assert.ok(lines.includes(`OK   skill ocean-acoustics-router ${join(paths.sharedSkill, "SKILL.md")}`), result.stdout);
      assert.ok(lines.includes("OK   book PDFs the notes point at: 1, all in the installed copy"), result.stdout);
      const duplicate = `OK   OpenCode sees skill ocean-acoustics-router 2 times, all one folder (${paths.claudeSkill}, ${paths.sharedSkill}); its duplicate-name warning is harmless`;
      assert.ok(lines.includes(duplicate), result.stdout);
      assert.equal(lines.at(-2), "doctor found no problems.");
    });
  }
});

test("doctor fails when nothing is installed or the manifest is unreadable, and takes no arguments", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t);

  const missing = runDoctor(pkg, home);

  assert.equal(missing.status, 1);
  assert.ok(missing.stderrLines.includes("FAIL ocean-acoustics-expert is not installed; run install first"), missing.stderr);

  const paths = installPaths(home);
  assert.equal(runInstaller(pkg, home, ["install"]).status, 0);
  writeFileSync(paths.manifest, "{");

  const unreadable = runDoctor(pkg, home);

  assert.equal(unreadable.status, 1);
  assert.match(unreadable.stderr, /^FAIL cannot read the install manifest: /m);

  const usage = runDoctor(pkg, home, ["--fix"]);

  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /doctor takes no arguments/);
});

test("doctor warns about a toolbox that is not set but passes", (t) => {
  const pkg = writePackage(t);
  const home = writeHome(t, HARNESS_CONFIGS);
  assert.equal(runInstaller(pkg, home, ["install"]).status, 0);

  const result = runDoctor(pkg, home);

  assert.equal(result.status, 0, result.stderr);
  for (const name of ["at_2023", "at_2020"]) {
    const flag = `--${name.replace("_", "-")}`;
    assert.ok(result.stderrLines.includes(`WARN local path map: ${name} is not set on this machine; reinstall with ${flag} <dir>`), result.stderr);
  }
  assert.equal(result.stdoutLines.at(-2), "doctor found no problems; 2 warnings.");
});

test("doctor fails when a path-map entry no longer exists or the path map is unreadable", async (t) => {
  await t.test("a toolbox folder was moved", (st) => {
    const { pkg, home } = installEverywhere(st);
    const toolbox = join(home, "Tools", "AT", "at_2023");
    renameSync(toolbox, `${toolbox}-old`);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(
      result.stderrLines.includes(`FAIL local path map: at_2023 ${toolbox} does not exist; reinstall with --at-2023 <dir>`),
      result.stderr,
    );
    assert.doesNotMatch(result.stderr, /at_2020/);
    assert.equal(result.stdoutLines.at(-2), "doctor found 1 problem.");
  });

  await t.test("the path map was deleted", (st) => {
    const { pkg, home, paths } = installEverywhere(st);
    rmSync(paths.pathMap);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`^FAIL cannot read the local path map: ${paths.pathMap}: ENOENT`, "m"));
  });

  await t.test("the path map is not a mapping", (st) => {
    const { pkg, home, paths } = installEverywhere(st);
    writeFileSync(paths.pathMap, "- /somewhere\n");

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(result.stderrLines.includes(`FAIL local path map ${paths.pathMap} is not a mapping of names to paths`), result.stderr);
  });

  await t.test("an entry that is not a toolbox was emptied", (st) => {
    const { pkg, home, paths } = installEverywhere(st);
    const text = readFileSync(paths.pathMap, "utf8");
    writeFileSync(paths.pathMap, text.replace(/^knowledge_base: .*$/m, "knowledge_base:"));

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(result.stderrLines.includes("FAIL local path map: knowledge_base is not set"), result.stderr);
  });
});

test("doctor fails when a symbolic link is gone, replaced or no longer resolves", async (t) => {
  await t.test("the shared router the Claude skill links to is gone", (st) => {
    const { pkg, home, paths } = installEverywhere(st);
    rmSync(paths.sharedSkill, { recursive: true });

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    const lines = result.stderrLines;
    assert.ok(
      lines.includes(`FAIL symbolic link ${paths.claudeSkill} -> ../../.agents/skills/ocean-acoustics-router does not resolve`),
      result.stderr,
    );
    assert.ok(lines.includes(`FAIL skill ocean-acoustics-router ${join(paths.sharedSkill, "SKILL.md")} is missing`), result.stderr);
  });

  await t.test("the authoring copy the installed copy links to was moved", (st) => {
    const { pkg, home, paths } = installEverywhere(st);
    renameSync(join(pkg, "knowledge"), join(pkg, "knowledge-moved"));

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    const lines = result.stderrLines;
    assert.ok(lines.includes(`FAIL symbolic link ${paths.knowledge} -> ${join(pkg, "knowledge")} does not resolve`), result.stderr);
    assert.ok(lines.includes(`FAIL local path map: knowledge_base ${paths.knowledge} does not exist`), result.stderr);
    assert.match(result.stderr, new RegExp(`^FAIL cannot read the installed copy ${paths.knowledge}: `, "m"));
  });

  await t.test("the Claude skill link was deleted", (st) => {
    const { pkg, home, paths } = installEverywhere(st, { mode: "copy" });
    rmSync(paths.claudeSkill);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(result.stderrLines.includes(`FAIL symbolic link ${paths.claudeSkill} is missing`), result.stderr);
  });

  await t.test("the Claude skill link was replaced by a folder holding an old router", (st) => {
    const { pkg, home, paths } = installEverywhere(st, { mode: "copy" });
    rmSync(paths.claudeSkill);
    mkdirSync(paths.claudeSkill);
    writeFileSync(join(paths.claudeSkill, "SKILL.md"), "---\nname: ocean-acoustics-router\ndescription: old\n---\nold router\n");

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    const target = "../../.agents/skills/ocean-acoustics-router";
    assert.ok(result.stderrLines.includes(`FAIL ${paths.claudeSkill} is no longer the symbolic link to ${target} that install made`), result.stderr);
  });
});

test("doctor fails when an installed agent or skill file is missing, unreadable or does not parse", async (t) => {
  // [case, file, content, problem]; file is a harness's agent or the shared router.
  const cases = [
    ["a Claude agent without frontmatter", "claude", "You are an expert.\n", "has no YAML frontmatter"],
    ["a Claude agent without a name", "claude", "---\ndescription: x\n---\nbody\n", "lacks name in its frontmatter"],
    [
      "an OpenCode agent with frontmatter outside the YAML doctor reads",
      "opencode",
      "---\ndescription: x\npermission: {edit: deny}\n---\nbody\n",
      "has frontmatter doctor cannot parse: line 2: flow mappings are not supported",
    ],
    ["a Codex agent that is not TOML", "codex", 'name = "ocean-acoustics-expert\n', "is TOML doctor cannot parse: line 1: unterminated string"],
    ["a Codex agent with a table", "codex", 'name = "x"\n[mcp_servers]\n', "is TOML doctor cannot parse: line 2: tables are not supported"],
    ["a Codex agent without instructions", "codex", 'name = "x"\ndescription = "y"\n', "lacks developer_instructions"],
    ["a shared router without frontmatter", "router", "# Ocean Acoustics Router\n", "has no YAML frontmatter"],
  ];
  for (const [name, file, content, problem] of cases) {
    await t.test(name, (st) => {
      const { pkg, home, files } = installEverywhere(st);
      writeFileSync(files[file].path, content);

      const result = runDoctor(pkg, home);

      assert.equal(result.status, 1);
      assert.ok(result.stderrLines.includes(`FAIL ${files[file].label}: ${problem}`), result.stderr);
    });
  }

  await t.test("a deleted Claude agent", (st) => {
    const { pkg, home, files } = installEverywhere(st);
    rmSync(files.claude.path);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(result.stderrLines.includes(`FAIL ${files.claude.label} is missing`), result.stderr);
  });

  await t.test("a folder where the Codex agent should be", (st) => {
    const { pkg, home, files } = installEverywhere(st);
    rmSync(files.codex.path);
    mkdirSync(files.codex.path);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`^FAIL ${files.codex.label} cannot be read: .*EISDIR`, "m"));
  });
});

test("doctor fails when an agent file does not point at the installed copy", async (t) => {
  await t.test("the legacy Codex agent from /import", (st) => {
    const { pkg, home, paths, agents } = installEverywhere(st);
    const legacy = "/home/someone/.Codex/knowledge/ocean-acoustics/00-hub.md";
    writeFileSync(agents.codex, `name = "ocean-acoustics-expert"\ndescription = "old agent"\ndeveloper_instructions = """\n- \`${legacy}\`\n"""\n`);

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    const lines = result.stderrLines;
    assert.ok(lines.includes(`FAIL codex agent ${agents.codex}: does not name the installed hub ${join(paths.knowledge, "00-hub.md")}`), result.stderr);
    assert.ok(lines.includes(`FAIL codex agent ${agents.codex}: names paths outside the data folder ${paths.data}: ${legacy}`), result.stderr);
  });

  await t.test("a Claude agent rendered for another data folder", (st) => {
    const { pkg, home, paths, agents } = installEverywhere(st);
    const old = "/old/share/ocean-acoustics-expert";
    writeFileSync(agents.claude, readFileSync(agents.claude, "utf8").replaceAll(paths.data, old));

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    const lines = result.stderrLines;
    assert.ok(lines.includes(`FAIL claude agent ${agents.claude}: does not name the installed hub ${join(paths.knowledge, "00-hub.md")}`), result.stderr);
    assert.ok(
      lines.some((line) => line.startsWith(`FAIL claude agent ${agents.claude}: names paths outside the data folder ${paths.data}: ${old}/knowledge/00-hub.md, `)),
      result.stderr,
    );
  });

  await t.test("an OpenCode agent that may not read the installed copy", (st) => {
    const { pkg, home, paths, agents } = installEverywhere(st);
    const allowData = `    ${JSON.stringify(`${paths.data}/**`)}: allow\n`;
    const text = readFileSync(agents.opencode, "utf8");
    assert.ok(text.includes(allowData));
    writeFileSync(agents.opencode, text.replace(allowData, ""));

    const result = runDoctor(pkg, home);

    assert.equal(result.status, 1);
    assert.ok(
      result.stderrLines.includes(
        `FAIL opencode agent ${agents.opencode}: permission.external_directory does not allow ${paths.data}/**, so every read of the installed copy asks first`,
      ),
      result.stderr,
    );
  });
});

test("doctor lists the book PDFs the notes point at that are missing from the installed copy", (t) => {
  const knowledge = {
    "01-source-book.md": "Read `{{knowledge_base}}/sources/lost.pdf`, pp. 3-5.\n",
    "chapters/ch01.md": "---\nsource_pdf: sources/book.pdf\n---\n# Chapter 1\n\nSee `sources/lost.pdf` and `sources/gone.pdf`.\n",
  };
  const { pkg, home, paths } = installEverywhere(t, { mode: "copy", knowledge });
  rmSync(join(paths.knowledge, "sources", "book.pdf"));

  const result = runDoctor(pkg, home);

  assert.equal(result.status, 1);
  const missing = result.stderrLines.filter((line) => line.startsWith("FAIL book PDF"));
  assert.deepEqual(missing, [
    "FAIL book PDF sources/book.pdf is missing from the installed copy; notes pointing at it: chapters/ch01.md:2",
    "FAIL book PDF sources/gone.pdf is missing from the installed copy; notes pointing at it: chapters/ch01.md:6",
    "FAIL book PDF sources/lost.pdf is missing from the installed copy; notes pointing at it: 01-source-book.md:1, chapters/ch01.md:6",
  ]);
  assert.equal(result.stdoutLines.at(-2), "doctor found 3 problems.");
});

test("doctor fails when OpenCode sees the router in a folder install did not write", (t) => {
  const stale = join(".config", "opencode", "skills", "ocean-acoustics-router");
  const oldRouter = "---\nname: 'ocean-acoustics-router'\ndescription: old copy\n---\nold router\n";
  const { pkg, home, paths } = installEverywhere(t, {
    files: {
      [join(stale, "SKILL.md")]: oldRouter,
      // OpenCode does not search hidden folders in its config folder.
      ".config/opencode/skills/.archive/ocean-acoustics-router/SKILL.md": oldRouter,
    },
  });

  const result = runDoctor(pkg, home);

  assert.equal(result.status, 1);
  const where = [paths.claudeSkill, paths.sharedSkill, join(home, stale)].join(", ");
  assert.ok(
    result.stderrLines.includes(
      `FAIL OpenCode sees skill ocean-acoustics-router in 2 different folders (${where}) and loads only one of them, in no fixed order; remove the ones install did not write`,
    ),
    result.stderr,
  );
});

test("doctor reads Codex agents whose template holds quotes, backslashes, control characters, URLs and tags", async (t) => {
  // The renderer writes a literal string unless the text holds ''', ends with ' or has control characters.
  const bodies = {
    "a basic string with quotes and backslashes": "Read `{{knowledge_base}}/00-hub.md`.\nUse $\\alpha$ and \\\\server\\share.\n\"\"\"Quoted\"\"\"\tand '''tabbed'''.\n",
    "a basic string with control characters": "Read `{{knowledge_base}}/00-hub.md`.\nIt's '''odd''' and \\n is not a newline.\r\nCarriage return and \u0001 control.\nEnds with a quote'",
    "a literal string": "Read `{{knowledge_base}}/00-hub.md`.\nC:\\temp\\new keeps its backslashes, and \"\"\" stays.\n",
    "a literal string with a URL and an HTML tag, which are not paths":
      "Read `{{knowledge_base}}/00-hub.md`; see https://oalib-acoustics.org/models/ and <b>bold</b>.\n",
  };
  for (const [name, body] of Object.entries(bodies)) {
    await t.test(name, (st) => {
      const pkg = writePackage(st);
      writeFileSync(
        join(pkg, "agent", "ocean-acoustics-expert.md"),
        `---\nname: ocean-acoustics-expert\ndescription: "Answers \\"quoted\\" questions about C:\\\\temp"\n---\n\n${body}`,
      );
      const home = writeDirectory(st, { ".codex/config.toml": "" });
      assert.equal(runInstaller(pkg, home, ["install"]).status, 0);

      const result = runDoctor(pkg, home);

      assert.equal(result.status, 0, result.stderr);
      assert.ok(result.stdoutLines.includes(`OK   codex agent ${agentPaths(home).codex}`), result.stdout);
    });
  }
});

test("doctor reports a folder it may not read and still runs the other checks", { skip: process.getuid?.() === 0 ? "root reads every folder" : false }, (t) => {
  const { pkg, home, files } = installEverywhere(t);
  const agents = join(home, ".codex", "agents");
  chmodSync(agents, 0o000);
  let result;
  try {
    result = runInstaller(pkg, home, ["doctor"]);
  } finally {
    chmodSync(agents, 0o755);
  }

  assert.equal(result.status, 1);
  assert.match(result.stderr, new RegExp(`^FAIL agents: could not finish: EACCES: permission denied, stat '${files.codex.path}'$`, "m"));
  assert.match(result.stdout, /^OK   book PDFs the notes point at: 1, all in the installed copy$/m);
});
