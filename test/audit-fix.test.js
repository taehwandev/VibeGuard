import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import { isoWeekParts, nextReleaseVersion, parseDate } from "../scripts/release-version.js";

const CLI_PATH = new URL("../src/cli.js", import.meta.url);

test("audit detects and fixes a hard-coded JavaScript secret without exposing it in reports", () => {
  const root = makeTempProject();
  const secretValue = `sk-proj-${"a".repeat(24)}${"1".repeat(12)}`;
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
  const secretValue = `ghp_${"a".repeat(24)}${"1".repeat(12)}`;
  fs.writeFileSync(path.join(root, "settings.py"), `API_TOKEN = "${secretValue}"\n`, "utf8");

  const report = auditProject(root);
  applyFixes(root, report);

  const source = fs.readFileSync(path.join(root, "settings.py"), "utf8");
  assert.match(source, /^import os\nAPI_TOKEN = os\.getenv\("API_TOKEN", ""\)/);
  assert.equal(source.includes(secretValue), false);
});

test("audit blocks npm access tokens without exposing them", () => {
  const root = makeTempProject();
  const tokenValue = `npm_${"a".repeat(12)}${"B".repeat(12)}${"3".repeat(12)}`;
  fs.writeFileSync(path.join(root, "notes.md"), `temporary token: ${tokenValue}\n`, "utf8");

  const report = auditProject(root);
  assert.equal(report.summary.blocks, 1);
  assert.ok(report.findings.some((finding) => finding.message.includes("npm access token")));

  const serialized = JSON.stringify(sanitizeReport(report));
  assert.equal(serialized.includes(tokenValue), false);
});

test("init creates project policy and config", () => {
  const root = makeTempProject();
  const applied = initProject(root);

  assert.ok(applied.includes("Created .vibeguard.json."));
  assert.ok(applied.includes("Created VIBEGUARD.md."));
  assert.ok(applied.includes("Created AGENTS.md VibeGuard instructions."));
  assert.ok(applied.includes("Installed pre-commit VibeGuard hook."));
  assert.ok(applied.includes("Installed pre-push VibeGuard hook."));
  assert.ok(fs.existsSync(path.join(root, ".vibeguard.json")));
  assert.ok(fs.existsSync(path.join(root, "VIBEGUARD.md")));
  assert.ok(fs.existsSync(path.join(root, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(root, ".git", "hooks", "pre-commit")));
  assert.ok(fs.existsSync(path.join(root, ".git", "hooks", "pre-push")));

  const policy = fs.readFileSync(path.join(root, "VIBEGUARD.md"), "utf8");
  assert.match(policy, /Environment-Specific Configuration Rule/);
  assert.match(policy, /web env\/deployment variables/);
  assert.match(policy, /Android `local\.properties` or Gradle/);
  assert.match(policy, /iOS `\.xcconfig`/);

  const agentInstructions = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agentInstructions, /<!-- vibeguard:start version=1 -->/);
  assert.match(agentInstructions, /Keep VibeGuard scoped to guardrails/);
  assert.match(agentInstructions, /Preserve existing repo-local instructions/);
  assert.match(agentInstructions, /stale VibeGuard guardrails/);
  assert.match(agentInstructions, /default refresh interval is 7 days/);
  assert.match(agentInstructions, /Before creating a commit, run `vibeguard audit \.`/);
  assert.match(agentInstructions, /Keep secrets server-side/);
  assert.match(agentInstructions, /If the user pastes a secret in chat/);
  assert.match(agentInstructions, /Prefer cost-aware architecture/);
  assert.match(agentInstructions, /commonize repeated API\/model\/provider calls/);
  assert.match(agentInstructions, /environment-specific URLs/);
  assert.match(
    agentInstructions,
    /npx --yes @taehwandev\/vibeguard@latest audit \./
  );

  const preCommit = fs.readFileSync(path.join(root, ".git", "hooks", "pre-commit"), "utf8");
  const prePush = fs.readFileSync(path.join(root, ".git", "hooks", "pre-push"), "utf8");
  assert.match(preCommit, /# vibeguard:start version=1/);
  assert.match(preCommit, /vibeguard audit \./);
  assert.doesNotMatch(preCommit, /npx --yes @taehwandev\/vibeguard@latest update \./);
  assert.doesNotMatch(preCommit, /--strict/);
  assert.match(prePush, /# vibeguard:start version=1/);
  assert.match(prePush, /vibeguard audit \. --strict/);
  assert.doesNotMatch(prePush, /npx --yes @taehwandev\/vibeguard@latest update \./);
  assert.equal((fs.statSync(path.join(root, ".git", "hooks", "pre-commit")).mode & 0o111) > 0, true);

  const config = JSON.parse(fs.readFileSync(path.join(root, ".vibeguard.json"), "utf8"));
  assert.equal(config.mode, "guided");
  assert.equal(config.display, "emoji");
  assert.equal(config.rulesPath, null);
  assert.equal(config.maxFileLines, 800);
  assert.equal(config.repository.visibility, "unknown");
  assert.equal(config.update.checkIntervalDays, 7);
  assert.ok(fs.existsSync(path.join(root, ".vibeguard", "update-state.json")));

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /^\.vibeguard\/$/m);
});

test("audit reads developer tuning from .vibeguard.json", () => {
  const root = makeTempProject();
  initProject(root);
  fs.writeFileSync(
    path.join(root, ".vibeguard.json"),
    `${JSON.stringify({ mode: "developer", display: "traffic-light", maxFileLines: 2 }, null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(path.join(root, "small.js"), ["one", "two", "three"].join("\n"), "utf8");

  const report = auditProject(root);
  assert.equal(report.mode, "developer");
  assert.equal(report.display, "traffic-light");
  assert.equal(report.findings.some((finding) => finding.file === "small.js" && finding.category === "structure"), true);
});

test("audit warns when VibeGuard update check state is stale", () => {
  const root = makeTempProject();
  initProject(root);
  fs.writeFileSync(
    path.join(root, ".vibeguard", "update-state.json"),
    `${JSON.stringify({ lastCheckedAt: "2000-01-01T00:00:00.000Z" }, null, 2)}\n`,
    "utf8"
  );

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.action === "update-vibeguard");
  assert.equal(finding?.severity, "warn");
  assert.match(finding.message, /7-day interval/);
  assert.equal(report.summary.blocks, 0);
});

test("audit treats missing VibeGuard update check state as informational", () => {
  const root = makeTempProject();
  initProject(root);
  fs.rmSync(path.join(root, ".vibeguard", "update-state.json"));

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.action === "update-vibeguard");
  assert.equal(finding?.severity, "info");
  assert.equal(report.summary.warnings, 0);
});

test("init preserves existing shell hooks while adding VibeGuard checks", () => {
  const root = makeTempProject();
  const hooksRoot = path.join(root, ".git", "hooks");
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(path.join(hooksRoot, "pre-commit"), "#!/bin/sh\necho existing hook\n", "utf8");

  const applied = initProject(root);
  assert.ok(applied.includes("Added VibeGuard check to existing pre-commit hook."));

  const preCommit = fs.readFileSync(path.join(hooksRoot, "pre-commit"), "utf8");
  assert.match(preCommit, /echo existing hook/);
  assert.match(preCommit, /# vibeguard:start version=1/);
});

test("init wraps existing non-shell hooks instead of overwriting them", () => {
  const root = makeTempProject();
  const hooksRoot = path.join(root, ".git", "hooks");
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(path.join(hooksRoot, "pre-push"), "#!/usr/bin/env node\nconsole.log('existing hook');\n", "utf8");

  const applied = initProject(root);
  assert.ok(applied.includes("Wrapped existing pre-push hook with VibeGuard check."));

  const prePush = fs.readFileSync(path.join(hooksRoot, "pre-push"), "utf8");
  const original = fs.readFileSync(path.join(hooksRoot, "pre-push.vibeguard-original"), "utf8");
  assert.match(prePush, /# vibeguard:start version=1/);
  assert.match(prePush, /vibeguard-original/);
  assert.match(original, /existing hook/);
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

test("env templates are shareable but still scanned for real secrets", () => {
  const root = makeRealGitProject();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name: "env-template-app" }, null, 2)}\n`, "utf8");
  runGit(root, ["remote", "add", "origin", "https://github.com/example/env-template-app.git"]);
  runGit(root, ["config", "vibeguard.repositoryVisibility", "public"]);
  fs.writeFileSync(path.join(root, ".env.sample"), "OPENAI_API_KEY=\nPUBLIC_BASE_URL=http://localhost:3000\n", "utf8");
  runGit(root, ["add", ".env.sample"]);

  const safeReport = auditProject(root);
  assert.equal(safeReport.summary.blocks, 0);
  assert.equal(safeReport.findings.some((finding) => finding.category === "repository" && finding.severity === "block"), false);

  const secretValue = `sk-proj-${"e".repeat(24)}${"5".repeat(12)}`;
  fs.writeFileSync(path.join(root, ".env.template"), `OPENAI_API_KEY=${secretValue}\n`, "utf8");

  const unsafeReport = auditProject(root);
  assert.equal(unsafeReport.findings.some((finding) => finding.message.includes("OpenAI API key")), true);
  assert.equal(unsafeReport.summary.blocks, 1);
  assert.equal(JSON.stringify(sanitizeReport(unsafeReport)).includes(secretValue), false);
});

test("runtime env files are protected while existing env templates prevent duplicate examples", () => {
  const publicRoot = makeRealGitProject();
  fs.writeFileSync(path.join(publicRoot, "package.json"), `${JSON.stringify({ name: "runtime-env-app" }, null, 2)}\n`, "utf8");
  runGit(publicRoot, ["remote", "add", "origin", "https://github.com/example/runtime-env-app.git"]);
  runGit(publicRoot, ["config", "vibeguard.repositoryVisibility", "public"]);
  fs.writeFileSync(path.join(publicRoot, ".env.dev"), "API_URL=http://localhost:3000\n", "utf8");
  runGit(publicRoot, ["add", ".env.dev"]);

  const publicReport = auditProject(publicRoot);
  assert.equal(publicReport.gates.repository.status, "block");
  assert.equal(publicReport.findings.some((finding) => finding.message.includes(".env.dev")), true);

  const templateRoot = makeTempProject();
  fs.writeFileSync(path.join(templateRoot, ".env.sample"), "SERVICE_TOKEN=\nPUBLIC_MODE=true\n", "utf8");

  const applied = applyFixes(templateRoot, auditProject(templateRoot));
  const gitignore = fs.readFileSync(path.join(templateRoot, ".gitignore"), "utf8");
  assert.ok(applied.includes("Updated .gitignore env protection rules."));
  assert.match(gitignore, /^!\.env\.sample$/m);
  assert.match(gitignore, /^!\.env\*\.template$/m);
  assert.equal(fs.existsSync(path.join(templateRoot, ".env.example")), false);
});

test("audit skips gitignored local files and generated output", () => {
  const root = makeRealGitProject();
  const secretValue = `sk-proj-${"f".repeat(24)}${"6".repeat(12)}`;
  fs.writeFileSync(path.join(root, ".gitignore"), ".env copy.*\n.vercel/\n", "utf8");
  fs.writeFileSync(path.join(root, ".env copy.local"), `OPENAI_API_KEY=${secretValue}\n`, "utf8");
  fs.mkdirSync(path.join(root, ".vercel", "output"), { recursive: true });
  fs.writeFileSync(path.join(root, ".vercel", "output", "bundle.js"), "export const generated = true;\n".repeat(1700), "utf8");

  const report = auditProject(root);
  assert.equal(report.summary.blocks, 0);
  assert.equal(report.findings.some((finding) => finding.file?.includes(".env copy")), false);
  assert.equal(report.findings.some((finding) => finding.file?.includes(".vercel")), false);
});

test("audit still scans tracked files that also match gitignore", () => {
  const root = makeRealGitProject();
  const secretValue = `sk-proj-${"g".repeat(24)}${"7".repeat(12)}`;
  fs.writeFileSync(path.join(root, ".gitignore"), ".env copy.*\n", "utf8");
  fs.writeFileSync(path.join(root, ".env copy.local"), `OPENAI_API_KEY=${secretValue}\n`, "utf8");
  runGit(root, ["add", "-f", ".env copy.local"]);

  const report = auditProject(root);
  assert.equal(report.summary.blocks, 1);
  assert.equal(report.findings.some((finding) => finding.file === ".env copy.local" && finding.severity === "block"), true);
  assert.equal(JSON.stringify(sanitizeReport(report)).includes(secretValue), false);
});

test("prompt includes actionable guardrails", () => {
  const root = makeTempProject();
  const report = auditProject(root);
  const prompt = buildAgentPrompt(report, "Add checkout");

  assert.match(prompt, /Add checkout/);
  assert.match(prompt, /If you find a secret value, do not print it/);
  assert.match(prompt, /Do not delete databases, run migrations, deploy to production/);
  assert.match(prompt, /do not claim verification that was not observed/);
  assert.match(prompt, /Prefer cost-aware architecture/);
  assert.match(prompt, /commonize repeated API\/model\/provider calls/);
  assert.match(prompt, /environment-specific URLs/);
  assert.match(prompt, /verify `git remote -v`, repository visibility, and changed files/);
  assert.match(prompt, /If the user pastes a secret in chat/);
});

test("audit avoids descriptive sensitive-name false positives", () => {
  const root = makeTempProject();
  initProject(root);
  fs.writeFileSync(
    path.join(root, "utils.js"),
    [
      'const tokenizer = "GPT-4 tokenizer for text processing";',
      'const apiKeyFormat = "API keys should start with sk-";',
      'const secretManagerPath = "/aws/secretsmanager/prod/database";',
      'const passwordPolicy = "Password must be at least 12 chars";',
      'const privateKeyDescription = "RSA keys in /etc/ssl";',
      'const retryToken = "exponential-backoff-retry-v2";'
    ].join("\n"),
    "utf8"
  );

  const report = auditProject(root);
  assert.equal(report.findings.some((finding) => finding.action === "secret-quarantine"), false);
  assert.equal(report.findings.some((finding) => finding.severity === "block"), false);
});

test("audit warns on generic high-entropy sensitive assignments without auto-quarantine", () => {
  const root = makeTempProject();
  initProject(root);
  const suspiciousValue = "A7f9K2mP8qR4sT6vW9xY1zB3cD5eF";
  fs.writeFileSync(path.join(root, "service.js"), `const serviceToken = "${suspiciousValue}";\n`, "utf8");

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.evidence === "serviceToken=<redacted>");
  assert.equal(report.summary.blocks, 0);
  assert.equal(finding?.severity, "warn");
  assert.equal(finding?.fixable, false);
  assert.equal(finding?.action, undefined);
  assert.equal(JSON.stringify(sanitizeReport(report)).includes(suspiciousValue), false);

  const defaultRun = runCli(["audit", root, "--json"]);
  assert.equal(defaultRun.status, 0);
  assert.match(defaultRun.stdout, /"status": "warn"/);

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.equal(strictRun.status, 1);
  assert.match(strictRun.stdout, /"status": "warn"/);
});

test("audit blocks database connection strings without exposing values", () => {
  const root = makeTempProject();
  const databaseUrl = ["postgres://admin", "generated-password-123@prod.db.company.com/main"].join(":");
  fs.writeFileSync(path.join(root, "config.yaml"), `database:\n  url: "${databaseUrl}"\n`, "utf8");

  const report = auditProject(root);
  assert.equal(report.findings.some((finding) => finding.message.includes("database connection string")), true);
  assert.equal(JSON.stringify(sanitizeReport(report)).includes("generated-password-123"), false);
});

test("audit ignores at signs in public http url paths and queries", () => {
  const root = makeTempProject();
  const googleFontUrl = ["https://fonts.googleapis.com/css2?family=Inter", "wght@900&text=KEYLOW"].join(":");
  const emailSearchUrl = "https://example.com/search?q=user@example.com";
  const scopedPackageUrl = "https://example.com/path/@scope/package";
  fs.writeFileSync(
    path.join(root, "route.tsx"),
    [
      `const fontUrl = "${googleFontUrl}";`,
      `const emailSearchUrl = "${emailSearchUrl}";`,
      `const scopedPackageUrl = "${scopedPackageUrl}";`
    ].join("\n"),
    "utf8"
  );

  const report = auditProject(root);
  const blockingSecurityFindings = report.findings.filter(
    (finding) => finding.category === "security" && finding.severity === "block"
  );
  assert.equal(blockingSecurityFindings.length, 0);
});

test("audit blocks credential-bearing database and http urls", () => {
  const root = makeTempProject();
  const databaseUrls = [
    ["postgres://user", "generated-password-123@example.com:5432/db"].join(":"),
    ["mysql://user", "generated-password-123@example.com/db"].join(":"),
    ["mongodb+srv://user", "generated-password-123@example.com/db"].join(":")
  ];
  const privateHttpUrl = ["https://user", "generated-password-123@example.com/private"].join(":");
  fs.writeFileSync(path.join(root, "links.txt"), [...databaseUrls, privateHttpUrl].join("\n"), "utf8");

  const report = auditProject(root);
  const blockingSecurityFindings = report.findings.filter(
    (finding) => finding.category === "security" && finding.severity === "block"
  );
  assert.equal(blockingSecurityFindings.length, 4);
  assert.equal(blockingSecurityFindings.filter((finding) => finding.message.includes("database connection string")).length, 3);
  assert.equal(blockingSecurityFindings.some((finding) => finding.message.includes("URL with embedded credentials")), true);
  assert.equal(JSON.stringify(sanitizeReport(report)).includes("generated-password-123"), false);
});

test("audit blocks sensitive git changes when repository visibility is public or unknown", () => {
  const root = makeRealGitProject();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name: "customer-app" }, null, 2)}\n`, "utf8");
  runGit(root, ["remote", "add", "origin", "https://github.com/example/customer-app.git"]);
  runGit(root, ["config", "vibeguard.repositoryVisibility", "public"]);
  fs.writeFileSync(path.join(root, "prod-service-account.json"), "{}\n", "utf8");
  runGit(root, ["add", "prod-service-account.json"]);

  const report = auditProject(root);
  assert.equal(report.gates.repository.status, "block");
  assert.equal(report.findings.some((finding) => finding.category === "repository" && finding.severity === "block"), true);
  assert.equal(JSON.stringify(sanitizeReport(report)).includes("https://github.com"), false);
});

test("audit warns rather than blocks sensitive git changes in confirmed private repositories", () => {
  const root = makeRealGitProject();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name: "customer-app" }, null, 2)}\n`, "utf8");
  runGit(root, ["remote", "add", "origin", "git@github.com:example/customer-app.git"]);
  runGit(root, ["config", "vibeguard.repositoryVisibility", "private"]);
  fs.writeFileSync(path.join(root, "prod-service-account.json"), "{}\n", "utf8");
  runGit(root, ["add", "prod-service-account.json"]);

  const report = auditProject(root);
  assert.equal(report.gates.repository.status, "warn");
  assert.equal(report.summary.blocks, 0);
  assert.equal(report.findings.some((finding) => finding.category === "repository" && finding.severity === "warn"), true);
});

test("audit warns when git remote name is suspiciously similar but not exact", () => {
  const root = makeRealGitProject();
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name: "client-admin" }, null, 2)}\n`, "utf8");
  runGit(root, ["remote", "add", "origin", "https://github.com/example/client-admin-prod.git"]);
  runGit(root, ["config", "vibeguard.repositoryVisibility", "private"]);
  fs.writeFileSync(path.join(root, "index.js"), "console.log('ok');\n", "utf8");
  runGit(root, ["add", "index.js"]);

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.message.includes("remote name"));
  assert.equal(finding?.severity, "warn");
  assert.match(finding.message, /client-admin/);
  assert.match(finding.message, /client-admin-prod/);
});

test("audit exits non-zero for blocked reports and strict warnings", () => {
  const blockedRoot = makeTempProject();
  const secretValue = `sk-proj-${"b".repeat(24)}${"2".repeat(12)}`;
  fs.writeFileSync(path.join(blockedRoot, "app.js"), `const apiToken = "${secretValue}";\n`, "utf8");

  const blocked = runCli(["audit", blockedRoot, "--json"]);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /"status": "block"/);

  const warningRoot = makeTempProject();
  const defaultWarning = runCli(["audit", warningRoot, "--json"]);
  assert.equal(defaultWarning.status, 0);

  const strictWarning = runCli(["audit", warningRoot, "--json", "--strict"]);
  assert.equal(strictWarning.status, 1);
  assert.match(strictWarning.stdout, /"status": "warn"/);
});

test("evidence records Claude hook command execution without leaking secrets", () => {
  const root = makeTempProject();
  const secretValue = `sk-proj-${"c".repeat(24)}${"3".repeat(12)}`;
  const npmTokenValue = `npm_${"d".repeat(12)}${"E".repeat(12)}${"4".repeat(12)}`;
  const hookInput = {
    cwd: root,
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: {
      command: `npm test && echo ${secretValue} && echo ${npmTokenValue}`
    },
    tool_use_id: "toolu_test",
    duration_ms: 42
  };

  const recorded = runCli(["evidence", "claude-hook", root, "--json"], {
    input: JSON.stringify(hookInput)
  });
  assert.equal(recorded.status, 0);
  assert.equal(recorded.stdout.includes(secretValue), false);
  assert.equal(recorded.stdout.includes(npmTokenValue), false);
  assert.match(recorded.stdout, /"agent": "claude-code"/);

  const evidenceFile = fs.readFileSync(path.join(root, ".vibeguard", "session", "events.jsonl"), "utf8");
  assert.equal(evidenceFile.includes(secretValue), false);
  assert.equal(evidenceFile.includes(npmTokenValue), false);
  assert.match(evidenceFile, /<redacted>/);

  const summary = runCli(["evidence", root, "--json"]);
  assert.equal(summary.status, 0);
  const parsed = JSON.parse(summary.stdout);
  assert.equal(parsed.commandCount, 1);
  assert.equal(parsed.checks.test.observed, true);
});

test("evidence redacts credential urls without redacting public at-sign urls", () => {
  const root = makeTempProject();
  const publicUrl = ["https://fonts.googleapis.com/css2?family=Inter", "wght@900&text=KEYLOW"].join(":");
  const privateUrl = ["https://user", "generated-password-123@example.com/private"].join(":");
  const hookInput = {
    cwd: root,
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: {
      command: `curl "${publicUrl}" && curl "${privateUrl}"`
    },
    tool_use_id: "toolu_test",
    duration_ms: 42
  };

  const recorded = runCli(["evidence", "claude-hook", root, "--json"], {
    input: JSON.stringify(hookInput)
  });
  assert.equal(recorded.status, 0);
  assert.equal(recorded.stdout.includes(publicUrl), true);
  assert.equal(recorded.stdout.includes("generated-password-123"), false);

  const evidenceFile = fs.readFileSync(path.join(root, ".vibeguard", "session", "events.jsonl"), "utf8");
  assert.equal(evidenceFile.includes(publicUrl), true);
  assert.equal(evidenceFile.includes("generated-password-123"), false);
});

test("evidence records Claude hook failures and extracts exit code", () => {
  const root = makeTempProject();
  const hookInput = {
    cwd: root,
    hook_event_name: "PostToolUseFailure",
    tool_name: "Bash",
    tool_input: {
      command: "npm test"
    },
    error: "Command exited with non-zero status code 1"
  };

  const recorded = runCli(["evidence", "claude-hook", root, "--json"], {
    input: JSON.stringify(hookInput)
  });
  assert.equal(recorded.status, 0);

  const parsed = JSON.parse(recorded.stdout);
  assert.equal(parsed.status, "failure");
  assert.equal(parsed.exitCode, 1);
});

test("evidence installs Claude Code local hook idempotently", () => {
  const root = makeTempProject();
  const settingsPath = path.join(root, ".claude", "settings.local.json");
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(
    settingsPath,
    `${JSON.stringify(
      {
        permissions: {
          allow: ["Bash(npm test)"]
        },
        hooks: {
          PostToolUse: [
            {
              matcher: "Edit|Write",
              hooks: [{ type: "command", command: "npm test" }]
            }
          ]
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const installed = runCli(["evidence", "install-claude-hook", root, "--json"]);
  assert.equal(installed.status, 0);
  const result = JSON.parse(installed.stdout);
  assert.deepEqual(result.events, ["PostToolUse", "PostToolUseFailure"]);
  assert.match(result.command, /npx --yes @taehwandev\/vibeguard@latest evidence claude-hook/);

  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  assert.deepEqual(settings.permissions.allow, ["Bash(npm test)"]);
  assert.equal(settings.hooks.PostToolUse.some((group) => group.matcher === "Edit|Write"), true);
  assert.equal(countClaudeEvidenceHooks(settings), 2);

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /^\.claude\/settings\.local\.json$/m);
  assert.match(gitignore, /^\.vibeguard\/session\/$/m);

  const reinstalled = runCli(["evidence", "install-claude-hook", root, "--json"]);
  assert.equal(reinstalled.status, 0);
  const settingsAfterSecondRun = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  assert.equal(countClaudeEvidenceHooks(settingsAfterSecondRun), 2);
});

test("audit report and prompt support Korean localization", () => {
  const root = makeTempProject();
  initProject(root);
  const report = auditProject(root, { language: "ko" });

  assert.equal(report.language, "ko");
  assert.equal(report.gates.security.label, "보안");

  const formatted = formatAuditReport(report, { language: "ko" });
  assert.match(formatted, /전체 상태/);
  assert.match(formatted, /✅ 진행 가능/);
  assert.doesNotMatch(formatted, /🟢/);
  assert.match(formatted, /발견사항: 없음/);

  const prompt = buildAgentPrompt(report, "로그인 추가", { language: "ko" });
  assert.match(prompt, /사용자 요청/);
  assert.match(prompt, /✅ 진행 가능/);
  assert.doesNotMatch(prompt, /🟢/);
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

test("init updates only the managed VibeGuard agent instruction block", () => {
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
  assert.ok(applied.includes("Updated AGENTS.md VibeGuard instructions."));

  const agentInstructions = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agentInstructions, /Keep this project-specific note\./);
  assert.match(agentInstructions, /Keep this footer\./);
  assert.match(agentInstructions, /<!-- vibeguard:start version=1 -->/);
  assert.doesNotMatch(agentInstructions, /old instructions/);
});

test("release version uses ISO week and weekly release count", () => {
  assert.deepEqual(isoWeekParts(parseDate("2026-05-23")), {
    year: 2026,
    yy: "26",
    week: "21"
  });
  assert.equal(nextReleaseVersion({ date: parseDate("2026-05-23"), tags: [] }), "26.21.0");
  assert.equal(
    nextReleaseVersion({ date: parseDate("2026-05-23"), tags: ["v26.20.3", "v26.21.0", "v26.21.1"] }),
    "26.21.2"
  );
  assert.equal(nextReleaseVersion({ date: parseDate("2026-05-25"), tags: [] }), "26.22.0");
});

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-test-"));
  fs.mkdirSync(path.join(root, ".git"));
  return root;
}

function makeRealGitProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
  runGit(root, ["init", "-q"]);
  return root;
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI_PATH.pathname, ...args], {
    encoding: "utf8",
    input: options.input
  });
}

function countClaudeEvidenceHooks(settings) {
  return Object.values(settings.hooks)
    .flat()
    .flatMap((group) => group.hooks)
    .filter((hook) => /(?:\bvibeguard|@taehwandev\/vibeguard@latest)\s+evidence\s+claude-hook\b/.test(hook.command)).length;
}
