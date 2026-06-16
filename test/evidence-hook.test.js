import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const CLI_PATH = new URL("../src/cli.js", import.meta.url);

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
  assert.match(result.command, /command -v vibeguard/);
  assert.match(result.command, /\bvibeguard evidence claude-hook/);
  assert.match(result.command, /npx --yes @taehwandev\/vibeguard@latest evidence claude-hook/);
  const shellCheck = spawnSync("bash", ["-n"], { input: result.command, encoding: "utf8" });
  assert.equal(shellCheck.status, 0, shellCheck.stderr);

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

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vibeguard-test-"));
  fs.mkdirSync(path.join(root, ".git"));
  return root;
}

function runCli(args) {
  return spawnSync(process.execPath, [CLI_PATH.pathname, ...args], {
    encoding: "utf8"
  });
}

function countClaudeEvidenceHooks(settings) {
  return Object.values(settings.hooks)
    .flat()
    .flatMap((group) => group.hooks)
    .filter((hook) => /(?:\bvibeguard|@taehwandev\/vibeguard@latest)\s+evidence\s+claude-hook\b/.test(hook.command)).length;
}
