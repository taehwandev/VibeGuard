import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { approvalPolicy } from "../src/approval-policy.js";
import { initProject } from "../src/init.js";
import { t } from "../src/i18n.js";
import { projects } from "./project-fixtures.js";

const legacy = [
  "For every real external production deployment, and any deployment whose target",
  "is unknown, immediately before execution state the exact target and action and",
  "wait for fresh user confirmation. Never infer, reuse, or bypass approval from",
  'earlier wording such as "deploy it" or "handle it yourself".'
].join("\n");
const heading = "## Deployment Confirmation Rule\n\n";

test("generated approval migration preserves surrounding policy and is idempotent", () => {
  const before = "# Team policy\n\nKeep team constraints.\n\n";
  const after = "\n\n## Team operations\n\nRetain deployment windows.\n";
  const actual = approvalPolicy.refresh(before + heading + legacy + after);
  assert.equal(actual, before + heading + approvalPolicy.rule + after);
  assert.equal(approvalPolicy.refresh(actual), actual);
  assert.equal(approvalPolicy.refresh(heading + legacy), heading + approvalPolicy.rule);
});

test("custom approval sections and legacy quotations are unchanged", () => {
  for (const policy of [
    heading + legacy + "\n\nRequire the release manager.\n",
    heading + legacy.replace("fresh user confirmation", "release manager confirmation"),
    "## Historical example\n\n" + legacy,
    "# Custom policy\n"
  ]) assert.equal(approvalPolicy.refresh(policy), policy);
});

test("init migrates old generated policy once without overwriting local rules", () => {
  const root = projects.temp();
  const file = path.join(root, "VIBEGUARD.md");
  const before = "# Local policy\n\n";
  const after = "\n\n## Local rules\n\nKeep this.\n";
  fs.writeFileSync(file, before + heading + legacy + after);
  assert.ok(initProject(root).includes("Updated generated VIBEGUARD.md approval policy."));
  const expected = before + heading + approvalPolicy.rule + after;
  assert.equal(fs.readFileSync(file, "utf8"), expected);
  assert.ok(!initProject(root).includes("Updated generated VIBEGUARD.md approval policy."));
  assert.equal(fs.readFileSync(file, "utf8"), expected);
});

test("init preserves customized deployment policy bytes", () => {
  const root = projects.temp();
  const file = path.join(root, "VIBEGUARD.md");
  const custom = heading + legacy + "\n\nAdditional signoff is required.\n";
  fs.writeFileSync(file, custom);
  initProject(root);
  assert.equal(fs.readFileSync(file, "utf8"), custom);
});

test("generated policies and English prompt share authority boundaries", () => {
  const root = projects.temp();
  initProject(root);
  const policy = fs.readFileSync(path.join(root, "VIBEGUARD.md"), "utf8");
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.ok(policy.includes(approvalPolicy.rule));
  assert.ok(agents.includes("6. " + approvalPolicy.rule));
  assert.equal(t("en", "prompt.rule4"), approvalPolicy.rule);
  for (const term of ["existing approval", "source revision", "material risk", "revokes", "silence", "new version", "tag overwrite"]) {
    assert.ok(approvalPolicy.rule.includes(term), term);
  }
  assert.doesNotMatch(policy + agents, /Never infer, reuse, or bypass approval/);
  assert.match(agents, /successful workflow-hook audit/);
  assert.match(agents, /exact input bytes, rules, and audit mode/);
  assert.match(agents, /non-strict evidence for a strict requirement/);
});

test("Korean prompt preserves approval and continuation boundaries", () => {
  const korean = t("ko", "prompt.rule4");
  for (const term of ["기존 승인", "수정과 재시도", "리비전", "위험", "철회", "침묵", "새 버전", "태그 덮어쓰기"]) {
    assert.ok(korean.includes(term), term);
  }
});
