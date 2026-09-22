// Audit safety must not depend on how recently guardrails were refreshed.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { auditProject } from "../src/audit.js";
import { initProject } from "../src/init.js";
import { projects } from "./project-fixtures.js";
import { runCli } from "./cli-runner.js";

for (const state of [null, "invalid JSON", JSON.stringify({lastCheckedAt: "2000-01-01T00:00:00.000Z"})]) {
  test(`scheduled age alone never requests an update: ${state}`, () => {
    const root = projects.temp();
    initProject(root);
    const configPath = path.join(root, ".vibeguard.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.update = { mode: "scheduled", checkIntervalDays: 7 };
    fs.writeFileSync(configPath, JSON.stringify(config));
    const statePath = path.join(root, ".vibeguard", "update-state.json");
    if (state === null) fs.rmSync(statePath);
    else fs.writeFileSync(statePath, state);
    const before = fs.readFileSync(configPath, "utf8");

    const report = auditProject(root);
    assert.equal(report.findings.some(item => item.action === "update-vibeguard"), false);
    const strictRun = runCli(["audit", root, "--json", "--strict"]);
    assert.equal(strictRun.status, 0, strictRun.stderr || strictRun.stdout);
    assert.equal(JSON.parse(strictRun.stdout).findings.some(item => item.action === "update-vibeguard"), false);
    assert.equal(fs.readFileSync(configPath, "utf8"), before);
    assert.equal(fs.existsSync(statePath), state !== null);
    if (state !== null) assert.equal(fs.readFileSync(statePath, "utf8"), state);
  });
}

test("a real warning still fails a strict audit", () => {
  // Removing age-based notices must preserve actual safety enforcement.
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

test("default explicit mode ignores missing or stale update state", () => {
  const root = projects.temp();
  initProject(root);
  fs.rmSync(path.join(root, ".vibeguard", "update-state.json"));

  assert.equal(
    auditProject(root).findings.some((item) => item.action === "update-vibeguard"),
    false
  );
  fs.mkdirSync(path.join(root, ".vibeguard"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".vibeguard", "update-state.json"),
    `${JSON.stringify({ lastCheckedAt: "2000-01-01T00:00:00.000Z" }, null, 2)}\n`,
    "utf8"
  );
  assert.equal(
    auditProject(root).findings.some((item) => item.action === "update-vibeguard"),
    false
  );
});

test("legacy interval-only config migrates to explicit mode", () => {
  const root = projects.temp();
  initProject(root);
  const configPath = path.join(root, ".vibeguard.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.update = { checkIntervalDays: 7 };
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  initProject(root);

  const migrated = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.deepEqual(migrated.update, { checkIntervalDays: 0, mode: "explicit" });
  assert.equal(
    auditProject(root).findings.some((item) => item.action === "update-vibeguard"),
    false
  );
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
