// Setup and configuration: what `init` writes, what it preserves, and how
// `.vibeguard.json` tuning and paid-dependency acknowledgements are read.
// Split out of audit-fix.test.js, which had grown past the review-pressure
// line while holding several unrelated concerns.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { auditProject } from "../src/audit.js";
import { initProject } from "../src/init.js";
import { projects } from "./project-fixtures.js";
import { runCli } from "./cli-runner.js";

test("init creates project policy and config", () => {
  const root = projects.temp();
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
  assert.doesNotMatch(policy, /Environment-Specific Configuration Rule/);
  assert.doesNotMatch(policy, /environment-specific web URLs/);

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
  assert.doesNotMatch(agentInstructions, /environment-specific URLs/);
  assert.match(
    agentInstructions,
    /npx --yes @taehwandev\/vibeguard@latest audit \./
  );

  const preCommit = fs.readFileSync(path.join(root, ".git", "hooks", "pre-commit"), "utf8");
  const prePush = fs.readFileSync(path.join(root, ".git", "hooks", "pre-push"), "utf8");
  assert.match(preCommit, /# vibeguard:managed-hook:start name=vibeguard-preflight version=2 hook=pre-commit/);
  assert.match(preCommit, /Managed by VibeGuard \(@taehwandev\/vibeguard\)/);
  assert.match(preCommit, /vibeguard audit \./);
  assert.doesNotMatch(preCommit, /npx --yes @taehwandev\/vibeguard@latest update \./);
  assert.doesNotMatch(preCommit, /--strict/);
  assert.match(prePush, /# vibeguard:managed-hook:start name=vibeguard-preflight version=2 hook=pre-push/);
  assert.match(prePush, /vibeguard audit \. --strict/);
  assert.doesNotMatch(prePush, /npx --yes @taehwandev\/vibeguard@latest update \./);
  assert.equal((fs.statSync(path.join(root, ".git", "hooks", "pre-commit")).mode & 0o111) > 0, true);

  const config = JSON.parse(fs.readFileSync(path.join(root, ".vibeguard.json"), "utf8"));
  assert.equal(config.mode, "guided");
  assert.equal(config.display, "emoji");
  assert.equal(config.rulesPath, null);
  assert.equal(Object.hasOwn(config, "maxFileLines"), false);
  assert.equal(config.repository.visibility, "unknown");
  assert.deepEqual(config.cost.acknowledgedPaidDependencies, []);
  assert.equal(config.update.checkIntervalDays, 7);
  assert.ok(fs.existsSync(path.join(root, ".vibeguard", "update-state.json")));

  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /^\.vibeguard\/$/m);
});

test("audit reads developer tuning from .vibeguard.json", () => {
  const root = projects.temp();
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
  assert.equal(report.findings.some((finding) => finding.file === "small.js" && finding.category === "structure"), false);
});

test("init preserves reviewed paid dependencies while adding cost defaults", () => {
  const root = projects.temp();
  fs.writeFileSync(
    path.join(root, ".vibeguard.json"),
    `${JSON.stringify({
      mode: "developer",
      cost: {
        acknowledgedPaidDependencies: ["firebase"],
        reviewOwner: "maintainer"
      }
    }, null, 2)}\n`,
    "utf8"
  );

  initProject(root);

  const config = JSON.parse(fs.readFileSync(path.join(root, ".vibeguard.json"), "utf8"));
  assert.deepEqual(config.cost.acknowledgedPaidDependencies, ["firebase"]);
  assert.equal(config.cost.reviewOwner, "maintainer");
  assert.equal(config.update.checkIntervalDays, 7);
});

test("audit ignores retired maxFileLines setting", () => {
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(path.join(root, ".vibeguard.json"), `${JSON.stringify({ maxFileLines: 2 }, null, 2)}\n`, "utf8");

  const longContent = ["one", "two", "three"].join("\n");
  fs.writeFileSync(path.join(root, "large.js"), longContent, "utf8");

  const report = auditProject(root);
  assert.equal(report.findings.some((finding) => finding.file === "large.js" && finding.category === "structure"), false);
});

test("audit acknowledges only exact reviewed paid dependency names", () => {
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({
      dependencies: {
        "@aws-sdk/client-s3": "1.0.0",
        firebase: "1.0.0",
        "firebase-admin": "1.0.0"
      }
    }, null, 2)}\n`,
    "utf8"
  );
  const configPath = path.join(root, ".vibeguard.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.cost.acknowledgedPaidDependencies = [" @AWS-SDK/client-s3 ", "firebase", null, ""];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const report = auditProject(root);
  const acknowledged = report.findings.find(
    (finding) => finding.category === "cost" && finding.severity === "info"
  );
  const warning = report.findings.find(
    (finding) => finding.category === "cost" && finding.severity === "warn"
  );

  assert.equal(report.gates.cost.status, "warn");
  assert.match(acknowledged?.message ?? "", /@aws-sdk\/client-s3, firebase/i);
  assert.match(warning?.message ?? "", /firebase-admin/);
  assert.doesNotMatch(warning?.message ?? "", /@aws-sdk\/client-s3/);
  assert.doesNotMatch(warning?.message ?? "", /(?:^|, )firebase(?:,|$)/);

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.equal(strictRun.status, 1, strictRun.stderr || strictRun.stdout);
});

test("audit accepts object acknowledgements and never blocks on paid dependencies", () => {
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({ dependencies: { firebase: "1.0.0", resend: "1.0.0" } }, null, 2)}\n`,
    "utf8"
  );
  const configPath = path.join(root, ".vibeguard.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.cost.acknowledgedPaidDependencies = [
    { name: " Firebase ", reason: "Spark free tier, under the daily read quota", reviewedAt: "2026-07-19" },
    "resend"
  ];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const report = auditProject(root);
  const withoutReason = report.findings.find((finding) => finding.file === ".vibeguard.json" && finding.category === "cost");

  assert.equal(report.gates.cost.status, "pass");
  assert.equal(report.summary.blocks, 0);
  assert.match(withoutReason?.message ?? "", /resend/);
  assert.doesNotMatch(withoutReason?.message ?? "", /firebase/i);
  assert.equal(withoutReason?.severity, "info");
});

test("audit never blocks on an unacknowledged paid dependency", () => {
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({ dependencies: { stripe: "1.0.0" } }, null, 2)}\n`,
    "utf8"
  );

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.category === "cost");

  assert.equal(finding?.severity, "warn");
  assert.equal(report.summary.blocks, 0);
  assert.equal(runCli(["audit", root, "--json"]).status, 0);
});

test("audit keeps the Cost gate passing when every paid dependency is acknowledged", () => {
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify({ dependencies: { firebase: "1.0.0", resend: "1.0.0" } }, null, 2)}\n`,
    "utf8"
  );
  const configPath = path.join(root, ".vibeguard.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.cost.acknowledgedPaidDependencies = ["firebase", "resend"];
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  const report = auditProject(root);
  assert.equal(report.gates.cost.status, "pass");
  assert.match(report.gates.cost.message, /acknowledged/i);
  assert.equal(
    report.findings.some((finding) => finding.category === "cost" && finding.severity === "warn"),
    false
  );

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.equal(strictRun.status, 0, strictRun.stderr || strictRun.stdout);
});

test("init preserves existing shell hooks while adding VibeGuard checks", () => {
  const root = projects.temp();
  const hooksRoot = path.join(root, ".git", "hooks");
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(path.join(hooksRoot, "pre-commit"), "#!/bin/sh\nset -e\necho existing hook\n", "utf8");

  const applied = initProject(root);
  assert.ok(applied.includes("Added VibeGuard check to existing pre-commit hook."));

  const preCommit = fs.readFileSync(path.join(hooksRoot, "pre-commit"), "utf8");
  assert.match(preCommit, /^#!\/bin\/sh\n/);
  assert.match(preCommit, /echo existing hook/);
  assert.match(preCommit, /# vibeguard:managed-hook:start name=vibeguard-preflight version=2 hook=pre-commit/);
  assert.ok(preCommit.indexOf("vibeguard:managed-hook:start") < preCommit.indexOf("set -e"));
});

test("init wraps existing non-shell hooks instead of overwriting them", () => {
  const root = projects.temp();
  const hooksRoot = path.join(root, ".git", "hooks");
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(path.join(hooksRoot, "pre-push"), "#!/usr/bin/env node\nconsole.log('existing hook');\n", "utf8");

  const applied = initProject(root);
  assert.ok(applied.includes("Wrapped existing pre-push hook with VibeGuard check."));

  const prePush = fs.readFileSync(path.join(hooksRoot, "pre-push"), "utf8");
  const original = fs.readFileSync(path.join(hooksRoot, "pre-push.vibeguard-original"), "utf8");
  assert.match(prePush, /# vibeguard:managed-hook:start name=vibeguard-preflight version=2 hook=pre-push/);
  assert.match(prePush, /vibeguard-original/);
  assert.match(original, /existing hook/);
});

test("init migrates legacy VibeGuard hook markers while preserving existing shell hook body", () => {
  const root = projects.temp();
  const hooksRoot = path.join(root, ".git", "hooks");
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(
    path.join(hooksRoot, "pre-commit"),
    [
      "#!/bin/sh",
      "",
      "echo before",
      "",
      "# vibeguard:start version=1",
      "echo old VibeGuard hook",
      "# vibeguard:end",
      "",
      "echo after"
    ].join("\n"),
    "utf8"
  );

  const applied = initProject(root);
  assert.ok(applied.includes("Updated pre-commit VibeGuard hook."));

  const preCommit = fs.readFileSync(path.join(hooksRoot, "pre-commit"), "utf8");
  assert.doesNotMatch(preCommit, /echo old VibeGuard hook/);
  assert.doesNotMatch(preCommit, /# vibeguard:start version=1/);
  assert.match(preCommit, /# vibeguard:managed-hook:start name=vibeguard-preflight version=2 hook=pre-commit/);
  assert.match(preCommit, /echo before/);
  assert.match(preCommit, /echo after/);
  assert.ok(preCommit.indexOf("vibeguard:managed-hook:start") < preCommit.indexOf("echo before"));
  assert.ok(preCommit.indexOf("echo before") < preCommit.indexOf("echo after"));
});

test("init updates only the managed VibeGuard agent instruction block", () => {
  const root = projects.temp();
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
  assert.match(agentInstructions, /every real external production deployment, and any deployment whose target is unknown/);
  assert.match(agentInstructions, /immediately before execution state the exact target and action and wait for fresh user confirmation/);
  assert.match(agentInstructions, /Never infer, reuse, or bypass approval from earlier wording such as "deploy it" or "handle it yourself"/);
});
