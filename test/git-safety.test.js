import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditProject } from "../src/audit.js";

const CLI_PATH = new URL("../src/cli.js", import.meta.url);

test("audit keeps unconfigured Bitbucket visibility advisory-only for strict hooks", () => {
  const root = makeRealGitProject();
  writePackage(root, "customer-app");
  fs.writeFileSync(path.join(root, ".gitignore"), ".env\n.env.*\n!.env.example\n", "utf8");
  runGit(root, ["remote", "add", "origin", "git@bitbucket.org:team/customer-app.git"]);
  fs.writeFileSync(path.join(root, "firebase.json"), "{}\n", "utf8");
  runGit(root, ["add", "firebase.json"]);

  const strictRun = runCli(["audit", root, "--json", "--strict"]);
  assert.equal(strictRun.status, 0, strictRun.stderr || strictRun.stdout);

  const report = JSON.parse(strictRun.stdout);
  const finding = report.findings.find((item) => item.message.includes("firebase.json"));
  assert.equal(report.summary.status, "pass");
  assert.equal(report.git.remoteHost, "bitbucket.org");
  assert.equal(report.git.visibility, "unknown");
  assert.equal(report.git.visibilitySource, "unknown");
  assert.equal(finding?.severity, "info");
});

test("audit resolves repository visibility from generic env and GitLab CI metadata", () => {
  const envRoot = makeRealGitProject();
  writePackage(envRoot, "customer-app");
  fs.writeFileSync(path.join(envRoot, ".vibeguard.json"), `${JSON.stringify({ repository: { visibility: "unknown" } }, null, 2)}\n`);
  runGit(envRoot, ["remote", "add", "origin", "git@bitbucket.org:team/customer-app.git"]);
  fs.writeFileSync(path.join(envRoot, "prod-service-account.json"), "{}\n", "utf8");
  runGit(envRoot, ["add", "prod-service-account.json"]);

  const envReport = auditProject(envRoot, { env: { VIBEGUARD_REPOSITORY_VISIBILITY: "private" } });
  assert.equal(envReport.git.visibility, "private");
  assert.equal(envReport.git.visibilitySource, "env");
  assert.equal(envReport.gates.repository.status, "warn");

  const gitlabRoot = makeRealGitProject();
  writePackage(gitlabRoot, "customer-app");
  runGit(gitlabRoot, ["remote", "add", "origin", "https://gitlab.com/team/mobile/customer-app.git"]);
  fs.writeFileSync(path.join(gitlabRoot, "prod-service-account.json"), "{}\n", "utf8");
  runGit(gitlabRoot, ["add", "prod-service-account.json"]);

  const gitlabReport = auditProject(gitlabRoot, {
    env: {
      CI_PROJECT_VISIBILITY: "private",
      CI_SERVER_HOST: "gitlab.com",
      CI_PROJECT_PATH: "team/mobile/customer-app"
    }
  });
  assert.equal(gitlabReport.git.remote, "team/mobile/customer-app");
  assert.equal(gitlabReport.git.visibility, "private");
  assert.equal(gitlabReport.git.visibilitySource, "gitlab-ci");
  assert.equal(gitlabReport.gates.repository.status, "warn");
});

function makeRealGitProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-git-test-"));
  runGit(root, ["init", "-q"]);
  return root;
}

function writePackage(root, name) {
  fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ name }, null, 2)}\n`, "utf8");
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
