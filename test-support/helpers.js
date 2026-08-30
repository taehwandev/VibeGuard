import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const CLI_PATH = new URL("../src/cli.js", import.meta.url);

export function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-test-"));
  fs.mkdirSync(path.join(root, ".git"));
  return root;
}

export function makeRealGitProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
  runGit(root, ["init", "-q"]);
  return root;
}

export function makeNamedRealGitProject(name) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
  const root = path.join(parent, name);
  fs.mkdirSync(root);
  runGit(root, ["init", "-q"]);
  return root;
}

export function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

export function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI_PATH.pathname, ...args], {
    encoding: "utf8",
    input: options.input
  });
}
