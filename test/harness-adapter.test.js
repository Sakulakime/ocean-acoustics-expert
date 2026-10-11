import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import {
  agentPath,
  inspectMarkdownAgent,
  planAgentFile,
  planLegacyCleanup,
  planSkillLinks,
  renderMarkdownAgent,
} from "../src/harness-adapter.js";

describe("harness-adapter utilities", () => {
  describe("renderMarkdownAgent", () => {
    it("renders a basic Markdown agent with frontmatter", () => {
      const template = {
        name: "test-agent",
        description: "A test agent",
        body: "# Instructions\n\nDo something useful.",
      };
      const variables = {};
      const frontmatter = { model: "inherit", color: "blue" };

      const result = renderMarkdownAgent(template, variables, frontmatter);

      assert.match(result, /^---\n/);
      assert.match(result, /name: test-agent/);
      assert.match(result, /description: "A test agent"/);
      assert.match(result, /model: inherit/);
      assert.match(result, /color: blue/);
      assert.match(result, /---\n\n# Instructions/);
    });

    it("substitutes template variables in the body", () => {
      const template = {
        name: "test-agent",
        description: "Test",
        body: "Knowledge at {{knowledge_base}}",
      };
      const variables = { knowledge_base: "/path/to/kb" };

      const result = renderMarkdownAgent(template, variables);

      assert.match(result, /Knowledge at \/path\/to\/kb/);
    });
  });

  describe("planSkillLinks", () => {
    it("creates link units for each skill", () => {
      const skills = [
        { name: "skill-a", path: "/shared/skills/skill-a" },
        { name: "skill-b", path: "/shared/skills/skill-b" },
      ];
      const targetDir = "/home/user/.harness/skills";

      const units = planSkillLinks(skills, targetDir);

      assert.equal(units.length, 2);
      assert.equal(units[0].kind, "link");
      assert.equal(units[0].path, "/home/user/.harness/skills/skill-a");
      // Relative path calculation: from /home/user/.harness/skills/skill-a to /shared/skills/skill-a
      assert.equal(units[0].target, "../../../../shared/skills/skill-a");
      assert.equal(units[1].path, "/home/user/.harness/skills/skill-b");
    });
  });

  describe("planAgentFile", () => {
    it("creates a file unit with the given path and content", () => {
      const path = "/home/user/.harness/agents/test.md";
      const content = "---\nname: test\n---\nInstructions";

      const unit = planAgentFile(path, content);

      assert.equal(unit.kind, "file");
      assert.equal(unit.path, path);
      assert.equal(unit.content, content);
    });
  });

  describe("planLegacyCleanup", () => {
    it("creates absent units for legacy paths", () => {
      const relativePaths = ["old/path1", "old/path2"];
      const configDir = "/home/user/.harness";

      const units = planLegacyCleanup(relativePaths, configDir);

      assert.equal(units.length, 2);
      assert.equal(units[0].kind, "absent");
      assert.equal(units[0].path, "/home/user/.harness/old/path1");
      assert.equal(units[1].path, "/home/user/.harness/old/path2");
    });
  });

  describe("inspectMarkdownAgent", () => {
    it("parses valid frontmatter and body", () => {
      const text = `---
name: test-agent
description: "A test agent"
model: inherit
---

# Instructions

Do something.`;

      const inspection = inspectMarkdownAgent(text, ["name", "description"]);

      assert.equal(inspection.instructions, "\n# Instructions\n\nDo something.");
      assert.equal(inspection.problems.length, 0);
      assert.equal(inspection.frontmatter.name, "test-agent");
      assert.equal(inspection.frontmatter.description, "A test agent");
    });

    it("reports missing required fields", () => {
      const text = `---
description: "A test agent"
---

Body`;

      const inspection = inspectMarkdownAgent(text, ["name", "description"]);

      assert.equal(inspection.problems.length, 1);
      assert.match(inspection.problems[0], /lacks name in its frontmatter/);
    });

    it("handles missing frontmatter", () => {
      const text = "No frontmatter here";

      const inspection = inspectMarkdownAgent(text, ["name"]);

      assert.equal(inspection.instructions, null);
      assert.equal(inspection.problems.length, 1);
      assert.match(inspection.problems[0], /no YAML frontmatter/);
    });

    it("handles invalid YAML in frontmatter", () => {
      const text = `---
name: test
bad: |
  indented
not properly indented
---

Body`;

      const inspection = inspectMarkdownAgent(text, ["name"]);

      assert.ok(inspection.problems.length > 0);
      assert.match(inspection.problems[0], /cannot parse/);
      assert.equal(inspection.instructions, "\nBody");
    });
  });

  describe("agentPath", () => {
    it("constructs agent path with correct extension", () => {
      const configDir = "/home/user/.harness";
      const agentName = "test-agent";

      const mdPath = agentPath(configDir, agentName, ".md");
      const tomlPath = agentPath(configDir, agentName, ".toml");

      assert.equal(mdPath, "/home/user/.harness/agents/test-agent.md");
      assert.equal(tomlPath, "/home/user/.harness/agents/test-agent.toml");
    });
  });
});
