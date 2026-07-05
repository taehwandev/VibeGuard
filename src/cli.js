#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { auditProject, sanitizeReport } from "./audit.js";
import {
  evidenceFromClaudeHook,
  formatEvidenceReport,
  installClaudeEvidenceHook,
  loadEvidenceEvents,
  recordEvidenceEvent,
  summarizeEvidence
} from "./evidence.js";
import { applyFixes } from "./fix.js";
import { formatAppliedFixes, formatAuditReport } from "./format.js";
import { expandHome, pathExists } from "./fs-utils.js";
import { buildHookErrorStatus, formatHookStatusLine, loadHookStatus, runHookStatus, writeHookStatus } from "./hook-status.js";
import { cliHelp, resolveLanguage } from "./i18n.js";
import { initProject } from "./init.js";
import { buildAgentPrompt } from "./prompt.js";

main();

function main() {
  try {
    const rawArgs = process.argv.slice(2);
    const parsed = parseArgs(rawArgs);
    const language = resolveLanguage(parsed.flags.lang);
    const packageInfo = readPackageInfo();

    if (parsed.flags.version || parsed.command === "version") {
      if (parsed.flags.json) {
        process.stdout.write(`${JSON.stringify(packageInfo, null, 2)}\n`);
      } else {
        process.stdout.write(`${packageInfo.version}\n`);
      }
      return;
    }

    if (rawArgs.length === 0 || parsed.command === "--help" || parsed.command === "-h" || parsed.flags.help) {
      process.stdout.write(cliHelp(language));
      return;
    }

    if (!parsed.command) {
      process.stdout.write(cliHelp(language));
      return;
    }

    if (parsed.command === "init" || parsed.command === "setup" || parsed.command === "update") {
      const projectRoot = resolveProjectPath(parsed.positionals[0] ?? ".");
      const applied = initProject(projectRoot, { rulesPath: parsed.flags.rules });
      process.stdout.write(formatAppliedFixes(applied, { language }));
      return;
    }

    if (parsed.command === "audit") {
      const projectRoot = resolveProjectPath(parsed.positionals[0] ?? ".");
      const auditOptions = {
        rulesPath: parsed.flags.rules,
        language,
        changedOnly: parsed.flags.changedOnly
      };
      const report = auditProject(projectRoot, auditOptions);

      if (parsed.flags.fix) {
        const applied = applyFixes(projectRoot, report);
        const nextReport = auditProject(projectRoot, auditOptions);
        if (parsed.flags.json) {
          process.stdout.write(`${JSON.stringify({ applied, report: sanitizeReport(nextReport) }, null, 2)}\n`);
        } else {
          process.stdout.write(formatAppliedFixes(applied, { language }));
          process.stdout.write("\n");
          process.stdout.write(formatAuditReport(nextReport, { language }));
        }
        process.exitCode = auditExitCode(nextReport, parsed.flags);
        return;
      }

      if (parsed.flags.json) {
        process.stdout.write(`${JSON.stringify(sanitizeReport(report), null, 2)}\n`);
      } else {
        process.stdout.write(formatAuditReport(report, { language }));
      }
      process.exitCode = auditExitCode(report, parsed.flags);
      return;
    }

    if (parsed.command === "prompt") {
      const projectRoot = resolveProjectPath(firstProjectArg(parsed.positionals) ?? ".");
      const request = parsed.flags.request ?? requestFromPositionals(parsed.positionals, projectRoot);
      const report = auditProject(projectRoot, { rulesPath: parsed.flags.rules, language });
      process.stdout.write(buildAgentPrompt(report, request, { language }));
      return;
    }

    if (parsed.command === "hook") {
      const hookArgs = parseHookArgs(parsed.positionals);
      const projectRoot = resolveProjectPath(hookArgs.project);

      if (hookArgs.action === "status") {
        const status = loadHookStatus(projectRoot);
        if (!status) throw new Error("No VibeGuard hook status found. Run `vibeguard hook run .` first.");
        if (parsed.flags.json) process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
        else process.stdout.write(`${formatHookStatusLine(status)}\n`);
        process.exitCode = status.exitCode ?? 1;
        return;
      }

      if (hookArgs.action !== "run") {
        throw new Error(`Unknown hook command: ${hookArgs.action}`);
      }

      const changedOnly = parsed.flags.full ? false : true;
      let status;
      try {
        status = runHookStatus(projectRoot, {
          changedOnly,
          event: parsed.flags.event,
          language,
          rulesPath: parsed.flags.rules,
          strict: parsed.flags.strict
        });
      } catch (error) {
        status = buildHookErrorStatus(error, { changedOnly, event: parsed.flags.event });
        writeHookStatus(projectRoot, status);
      }

      if (parsed.flags.json) process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
      else if (!parsed.flags.quiet) process.stdout.write(`${formatHookStatusLine(status)}\n`);
      process.exitCode = status.exitCode;
      return;
    }

    if (parsed.command === "evidence") {
      if (parsed.positionals[0] === "install-claude-hook") {
        const projectRoot = resolveProjectPath(parsed.positionals[1] ?? ".");
        const result = installClaudeEvidenceHook(projectRoot);
        if (parsed.flags.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        else process.stdout.write(formatAppliedFixes(result.applied, { language }));
        return;
      }

      if (parsed.positionals[0] === "claude-hook") {
        const projectRoot = resolveProjectPath(parsed.positionals[1] ?? process.cwd());
        const input = fs.readFileSync(0, "utf8");
        const event = recordEvidenceEvent(projectRoot, evidenceFromClaudeHook(input));
        if (parsed.flags.json) process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
        return;
      }

      const projectRoot = resolveProjectPath(parsed.positionals[0] ?? ".");
      const summary = summarizeEvidence(loadEvidenceEvents(projectRoot));
      if (parsed.flags.json) process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      else process.stdout.write(formatEvidenceReport(summary));
      return;
    }

    throw new Error(`Unknown command: ${parsed.command}`);
  } catch (error) {
    process.stderr.write(`vibeguard: ${error.message}\n`);
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  const parsed = {
    command: null,
    flags: {},
    positionals: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.flags.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      parsed.flags.version = true;
      continue;
    }
    if (arg === "--fix") {
      parsed.flags.fix = true;
      continue;
    }
    if (arg === "--json") {
      parsed.flags.json = true;
      continue;
    }
    if (arg === "--quiet") {
      parsed.flags.quiet = true;
      continue;
    }
    if (arg === "--strict") {
      parsed.flags.strict = true;
      continue;
    }
    if (arg === "--full") {
      parsed.flags.full = true;
      continue;
    }
    if (arg === "--changed-only") {
      parsed.flags.changedOnly = true;
      continue;
    }
    if (arg === "--lang") {
      parsed.flags.lang = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--rules") {
      parsed.flags.rules = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--request") {
      parsed.flags.request = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--event") {
      parsed.flags.event = args[index + 1];
      index += 1;
      continue;
    }
    if (!parsed.command) parsed.command = arg;
    else parsed.positionals.push(arg);
  }

  return parsed;
}

function auditExitCode(report, flags = {}) {
  if (report.summary.blocks > 0) return 2;
  if (flags.strict && report.summary.warnings > 0) return 1;
  return 0;
}

function resolveProjectPath(input) {
  const resolved = path.resolve(expandHome(input));
  if (!pathExists(resolved)) {
    throw new Error(`Project path does not exist: ${resolved}`);
  }
  return resolved;
}

function firstProjectArg(positionals) {
  if (positionals.length === 0) return null;
  const candidate = path.resolve(expandHome(positionals[0]));
  return pathExists(candidate) ? positionals[0] : null;
}

function parseHookArgs(positionals) {
  const actions = new Set(["run", "status"]);
  if (actions.has(positionals[0])) {
    return {
      action: positionals[0],
      project: positionals[1] ?? "."
    };
  }

  return {
    action: "run",
    project: positionals[0] ?? "."
  };
}

function requestFromPositionals(positionals, projectRoot) {
  if (positionals.length === 0) return "";
  const candidate = path.resolve(expandHome(positionals[0]));
  if (candidate === projectRoot) return positionals.slice(1).join(" ");
  return positionals.join(" ");
}

function readPackageInfo() {
  const packagePath = new URL("../package.json", import.meta.url);
  const raw = fs.readFileSync(packagePath, "utf8");
  const pkg = JSON.parse(raw);
  return {
    name: pkg.name ?? "@taehwandev/vibeguard",
    version: pkg.version ?? "0.0.0"
  };
}
