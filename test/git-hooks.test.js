import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { initProject } from "../src/init.js";
import { projects } from "./project-fixtures.js";

test("pre-push skips only delete-only audits and preserves stdin", () => {
  const root = projects.realGit();
  const hooksRoot = path.join(root, ".git", "hooks");
  const fakeBin = path.join(root, "fake-bin");
  const auditMarker = path.join(root, "audit-called");
  const forwarded = path.join(root, "forwarded-updates");
  fs.mkdirSync(fakeBin);
  fs.mkdirSync(hooksRoot, { recursive: true });
  fs.writeFileSync(
    path.join(hooksRoot, "pre-push"),
    "#!/bin/sh\ncat > \"$VIBEGUARD_TEST_FORWARDED\"\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(fakeBin, "vibeguard"),
    "#!/bin/sh\nprintf 'called\\n' >> \"$VIBEGUARD_TEST_AUDIT_MARKER\"\n",
    "utf8"
  );
  fs.chmodSync(path.join(fakeBin, "vibeguard"), 0o755);
  initProject(root);

  const hook = path.join(hooksRoot, "pre-push");
  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
    VIBEGUARD_TEST_AUDIT_MARKER: auditMarker,
    VIBEGUARD_TEST_FORWARDED: forwarded
  };
  const oldSha = "a".repeat(40);
  const zeroSha = "0".repeat(40);
  const deletion = `refs/heads/topic ${zeroSha} refs/heads/topic ${oldSha}\n`;

  const deleted = spawnSync(hook, ["origin", "unused"], {
    cwd: root,
    env,
    input: deletion,
    encoding: "utf8"
  });

  assert.equal(deleted.status, 0, deleted.stderr);
  assert.match(deleted.stderr, /delete-only push; content audit skipped/);
  assert.equal(fs.existsSync(auditMarker), false);
  assert.equal(fs.readFileSync(forwarded, "utf8"), deletion);

  const update = `refs/heads/topic ${"b".repeat(40)} refs/heads/topic ${oldSha}\n`;
  const mixed = spawnSync(hook, ["origin", "unused"], {
    cwd: root,
    env,
    input: deletion + update,
    encoding: "utf8"
  });

  assert.equal(mixed.status, 0, mixed.stderr);
  assert.match(mixed.stderr, /running pre-push safety audit/);
  assert.equal(fs.readFileSync(auditMarker, "utf8"), "called\n");
  assert.equal(fs.readFileSync(forwarded, "utf8"), deletion + update);
});
