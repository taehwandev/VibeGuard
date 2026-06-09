import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initProject } from "../src/init.js";

const CLI_PATH = new URL("../src/cli.js", import.meta.url);

test("hook run writes compact changed-only status for agent hooks", () => {
  const root = makeRealGitProject();
  initProject(root);
  fs.writeFileSync(path.join(root, "large.js"), "console.log('old');\n".repeat(900), "utf8");
  commitAll(root);

  fs.writeFileSync(path.join(root, "small.js"), "console.log('changed');\n", "utf8");

  const run = runCli(["hook", "run", root, "--event", "post-edit", "--json"]);
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const status = JSON.parse(run.stdout);
  assert.equal(status.kind, "vibeguard-hook-status");
  assert.equal(status.event, "post-edit");
  assert.equal(status.signal, "green");
  assert.equal(status.scan.mode, "changed");
  assert.equal(status.scan.scannedFiles, 1);
  assert.equal(status.summary.warnings, 0);

  const statusFile = JSON.parse(fs.readFileSync(path.join(root, ".vibeguard", "status.json"), "utf8"));
  assert.equal(statusFile.line, status.line);

  const cached = runCli(["hook", "status", root]);
  assert.equal(cached.status, 0);
  assert.match(cached.stdout, /^VibeGuard hook: green /);
});

test("hook run blocks changed secrets without exposing values", () => {
  const root = makeRealGitProject();
  initProject(root);
  commitAll(root);

  const secretValue = `sk-proj-${"h".repeat(24)}${"8".repeat(12)}`;
  fs.writeFileSync(path.join(root, "app.js"), `const apiToken = "${secretValue}";\n`, "utf8");

  const run = runCli(["hook", "run", root, "--event", "post-edit", "--json"]);
  assert.equal(run.status, 2);
  assert.equal(run.stdout.includes(secretValue), false);

  const status = JSON.parse(run.stdout);
  assert.equal(status.signal, "red");
  assert.equal(status.summary.blocks, 1);
  assert.equal(status.findings[0].file, "app.js");

  const statusFile = fs.readFileSync(path.join(root, ".vibeguard", "status.json"), "utf8");
  assert.equal(statusFile.includes(secretValue), false);
  assert.match(statusFile, /API_TOKEN/);
});

function makeRealGitProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
  runGit(root, ["init", "-q"]);
  return root;
}

function commitAll(root) {
  runGit(root, ["config", "user.email", "vibeguard@example.test"]);
  runGit(root, ["config", "user.name", "VibeGuard Test"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-q", "-m", "test snapshot"]);
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function runCli(args) {
  return spawnSync(process.execPath, [CLI_PATH.pathname, ...args], {
    encoding: "utf8"
  });
}
