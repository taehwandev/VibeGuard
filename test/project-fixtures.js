// Building the throwaway projects the suites audit.
//
// One exported owner, because a file of loose helpers is what the structure
// review refuses: `projects` is the contract, and the ways of making a project
// are its members rather than five separate top-level names.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const projects = {
  /** A bare directory with a `.git` folder: enough for path-based auditing. */
  temp() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-test-"));
    fs.mkdirSync(path.join(root, ".git"));
    return root;
  },

  /** A real repository, for anything that reads git state. */
  realGit() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
    this.git(root, ["init", "-q"]);
    return root;
  },

  /** A real repository whose directory name matters to the assertion. */
  namedRealGit(name) {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
    const root = path.join(parent, name);
    fs.mkdirSync(root);
    this.git(root, ["init", "-q"]);
    return root;
  },

  /** Run git in a fixture and fail the test on a non-zero exit. */
  git(cwd, args) {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout.trim();
  }
};
