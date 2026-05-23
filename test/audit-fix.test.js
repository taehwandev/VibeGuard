import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditProject, sanitizeReport } from "../src/audit.js";
import { applyFixes } from "../src/fix.js";
import { formatAuditReport } from "../src/format.js";
import { initProject } from "../src/init.js";
import { buildAgentPrompt } from "../src/prompt.js";
import { loadRuleLibrary } from "../src/rules.js";

test("audit detects and fixes a hard-coded JavaScript secret without exposing it in reports", () => {
  const root = makeTempProject();
  const secretValue = ["realistic", "private", "value", "123456789012"].join("_");
  fs.writeFileSync(path.join(root, "app.js"), `const openaiApiKey = "${secretValue}";\n`, "utf8");

  const report = auditProject(root);
  assert.equal(report.summary.blocks, 1);
  assert.ok(report.summary.fixable >= 1);

  const serialized = JSON.stringify(sanitizeReport(report));
  assert.equal(serialized.includes(secretValue), false);

  const applied = applyFixes(root, report);
  assert.ok(applied.some((line) => line.includes("Moved 1 secret value")));

  const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.equal(source.includes(secretValue), false);
  assert.match(source, /process\.env\.OPENAI_API_KEY \|\| ""/);

  const envLocal = fs.readFileSync(path.join(root, ".env.vibeguard.local"), "utf8");
  assert.ok(envLocal.includes(secretValue));

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^!\.env\.example$/m);

  const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(example, /^OPENAI_API_KEY=$/m);
});

test("fix adds os import and environment reads for Python assignments", () => {
  const root = makeTempProject();
  const secretValue = ["python", "private", "token", "123456789012"].join("_");
  fs.writeFileSync(path.join(root, "settings.py"), `API_TOKEN = "${secretValue}"\n`, "utf8");

  const report = auditProject(root);
  applyFixes(root, report);

  const source = fs.readFileSync(path.join(root, "settings.py"), "utf8");
  assert.match(source, /^import os\nAPI_TOKEN = os\.getenv\("API_TOKEN", ""\)/);
  assert.equal(source.includes(secretValue), false);
});

test("init creates project policy and config", () => {
  const root = makeTempProject();
  const applied = initProject(root, { rulesPath: "~/Documents/KeyFlowVault/agent" });

  assert.ok(applied.includes("Created .vibeguard.json."));
  assert.ok(applied.includes("Created VIBEGUARD.md."));
  assert.ok(applied.includes("Created AGENTS.md Vibe-Guard instructions."));
  assert.ok(fs.existsSync(path.join(root, ".vibeguard.json")));
  assert.ok(fs.existsSync(path.join(root, "VIBEGUARD.md")));
  assert.ok(fs.existsSync(path.join(root, "AGENTS.md")));

  const agentInstructions = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agentInstructions, /<!-- vibe-guard:start version=1 -->/);
  assert.match(
    agentInstructions,
    /npm --no-update-notifier exec --yes --package github:taehwandev\/VibeGuard -- vibe-guard audit \./
  );
});

test("fix creates env example names from existing local env files", () => {
  const root = makeTempProject();
  const secretValue = ["env", "private", "value", "123456789012"].join("_");
  fs.writeFileSync(path.join(root, ".env"), `SERVICE_TOKEN=${secretValue}\nPUBLIC_MODE=true\n`, "utf8");

  const report = auditProject(root);
  applyFixes(root, report);

  const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(example, /^SERVICE_TOKEN=$/m);
  assert.match(example, /^PUBLIC_MODE=$/m);
  assert.equal(example.includes(secretValue), false);
});

test("prompt includes actionable guardrails", () => {
  const root = makeTempProject();
  const report = auditProject(root);
  const prompt = buildAgentPrompt(report, "Add checkout");

  assert.match(prompt, /Add checkout/);
  assert.match(prompt, /If you find a secret value, do not print it/);
  assert.match(prompt, /Do not delete databases, run migrations, deploy to production/);
});

test("audit report and prompt support Korean localization", () => {
  const root = makeTempProject();
  initProject(root);
  const report = auditProject(root, { language: "ko" });

  assert.equal(report.language, "ko");
  assert.equal(report.gates.security.label, "보안");

  const formatted = formatAuditReport(report, { language: "ko" });
  assert.match(formatted, /전체 상태/);
  assert.match(formatted, /발견사항: 없음/);

  const prompt = buildAgentPrompt(report, "로그인 추가", { language: "ko" });
  assert.match(prompt, /사용자 요청/);
  assert.match(prompt, /비밀값을 발견하면 값을 출력하지 마세요/);
});

test("rule library loads core safety and engineering cards when available", () => {
  const root = makeTempProject();
  const rulesRoot = path.join(root, "rules");
  const commonRoot = path.join(rulesRoot, "common");
  fs.mkdirSync(commonRoot, { recursive: true });

  for (const relative of [
    "AGENTS.md",
    "index.md",
    "common/agent-operating-skill.md",
    "common/llm-coding-discipline.md",
    "common/code-conventions.md",
    "common/verification-policy.md",
    "common/secure-development-baseline.md",
    "common/security-privacy-review.md",
    "common/agent-editing-safety.md",
    "common/generated-files-policy.md",
    "common/api-contract-compatibility.md",
    "common/refactoring.md",
    "common/server-side-caching.md"
  ]) {
    const filePath = path.join(rulesRoot, relative);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `# ${relative}\n\nReusable rule card.\n`, "utf8");
  }

  const library = loadRuleLibrary(root, rulesRoot);
  const loaded = library.documents.map((doc) => doc.relative);

  assert.deepEqual(loaded, [
    "AGENTS.md",
    "index.md",
    "common/agent-operating-skill.md",
    "common/llm-coding-discipline.md",
    "common/code-conventions.md",
    "common/verification-policy.md",
    "common/secure-development-baseline.md",
    "common/security-privacy-review.md",
    "common/agent-editing-safety.md",
    "common/generated-files-policy.md",
    "common/api-contract-compatibility.md",
    "common/refactoring.md",
    "common/server-side-caching.md"
  ]);
});

test("init updates only the managed Vibe-Guard agent instruction block", () => {
  const root = makeTempProject();
  fs.writeFileSync(
    path.join(root, "AGENTS.md"),
    [
      "# Local Instructions",
      "",
      "Keep this project-specific note.",
      "",
      "<!-- vibe-guard:start version=0 -->",
      "old instructions",
      "<!-- vibe-guard:end -->",
      "",
      "Keep this footer."
    ].join("\n"),
    "utf8"
  );

  const applied = initProject(root);
  assert.ok(applied.includes("Updated AGENTS.md Vibe-Guard instructions."));

  const agentInstructions = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agentInstructions, /Keep this project-specific note\./);
  assert.match(agentInstructions, /Keep this footer\./);
  assert.match(agentInstructions, /<!-- vibe-guard:start version=1 -->/);
  assert.doesNotMatch(agentInstructions, /old instructions/);
});

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-guard-test-"));
  fs.mkdirSync(path.join(root, ".git"));
  return root;
}
