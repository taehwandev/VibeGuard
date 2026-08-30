// The update-check reminder and what a strict audit does with it.
// Split out of audit-fix.test.js for the same reason.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { auditProject } from "../src/audit.js";
import { initProject } from "../src/init.js";
import { projects } from "./project-fixtures.js";
import { runCli } from "./cli-runner.js";

test("a stale update check is reported without failing a strict audit", () => {
  // VibeGuard installs `audit . --strict` into pre-push itself, and strict
  // fails on any warning. Grading this reminder as one blocked every push in a
  // repository whose guardrails had aged past the interval -- for a reason
  // unrelated to what was being pushed, with bypassing the hook as the way out.
  const root = projects.temp();
  initProject(root);
  fs.writeFileSync(
    path.join(root, ".vibeguard", "update-state.json"),
    `${JSON.stringify({ lastCheckedAt: "2000-01-01T00:00:00.000Z" }, null, 2)}\n`,
    "utf8"
  );

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.action === "update-vibeguard");
  assert.equal(finding?.severity, "info");
  assert.match(finding.message, /7-day interval/);
  assert.equal(report.summary.warnings, 0);
  assert.equal(report.summary.blocks, 0);

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.equal(strictRun.status, 0, strictRun.stderr || strictRun.stdout);
});

test("a real warning still fails a strict audit", () => {
  // The reminder stopped blocking; the safety gates must not have followed it.
  const root = projects.temp();
  initProject(root);
  // Assembled rather than written out: a literal of this shape in a committed
  // file is itself a finding, and VibeGuard audits its own repository.
  const fixtureKey = ["sk", "live", "0".repeat(20)].join("-");
  fs.writeFileSync(path.join(root, ".env"), `API_KEY=${fixtureKey}\n`, "utf8");
  fs.writeFileSync(path.join(root, ".gitignore"), "node_modules\n", "utf8");

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.notEqual(strictRun.status, 0, "a secret in a tracked .env must stop a strict audit");
});

test("audit treats missing VibeGuard update check state as informational", () => {
  const root = projects.temp();
  initProject(root);
  fs.rmSync(path.join(root, ".vibeguard", "update-state.json"));

  const report = auditProject(root);
  const finding = report.findings.find((item) => item.action === "update-vibeguard");
  assert.equal(finding?.severity, "info");
  assert.equal(report.summary.warnings, 0);
});

test("audit exits non-zero for blocked reports and strict warnings", () => {
  const blockedRoot = projects.temp();
  const secretValue = `sk-proj-${"b".repeat(24)}${"2".repeat(12)}`;
  fs.writeFileSync(path.join(blockedRoot, "app.js"), `const apiToken = "${secretValue}";\n`, "utf8");

  const blocked = runCli(["audit", blockedRoot, "--json"]);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /"status": "block"/);

  const warningRoot = projects.temp();
  const defaultWarning = runCli(["audit", warningRoot, "--json"]);
  assert.equal(defaultWarning.status, 0);

  const strictWarning = runCli(["audit", warningRoot, "--json", "--strict"]);
  assert.equal(strictWarning.status, 1);
  assert.match(strictWarning.stdout, /"status": "warn"/);
});
