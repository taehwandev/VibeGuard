#!/usr/bin/env node

import path from "node:path";
import { auditProject, sanitizeReport } from "./audit.js";
import { applyFixes } from "./fix.js";
import { formatAppliedFixes, formatAuditReport } from "./format.js";
import { expandHome, pathExists } from "./fs-utils.js";
import { cliHelp, resolveLanguage } from "./i18n.js";
import { initProject } from "./init.js";
import { buildAgentPrompt } from "./prompt.js";

main();

function main() {
  try {
    const rawArgs = process.argv.slice(2);
    const parsed = parseArgs(rawArgs);
    const language = resolveLanguage(parsed.flags.lang);

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
      const report = auditProject(projectRoot, { rulesPath: parsed.flags.rules, language });

      if (parsed.flags.fix) {
        const applied = applyFixes(projectRoot, report);
        const nextReport = auditProject(projectRoot, { rulesPath: parsed.flags.rules, language });
        if (parsed.flags.json) {
          process.stdout.write(`${JSON.stringify({ applied, report: sanitizeReport(nextReport) }, null, 2)}\n`);
        } else {
          process.stdout.write(formatAppliedFixes(applied, { language }));
          process.stdout.write("\n");
          process.stdout.write(formatAuditReport(nextReport, { language }));
        }
        return;
      }

      if (parsed.flags.json) {
        process.stdout.write(`${JSON.stringify(sanitizeReport(report), null, 2)}\n`);
      } else {
        process.stdout.write(formatAuditReport(report, { language }));
      }
      return;
    }

    if (parsed.command === "prompt") {
      const projectRoot = resolveProjectPath(firstProjectArg(parsed.positionals) ?? ".");
      const request = parsed.flags.request ?? requestFromPositionals(parsed.positionals, projectRoot);
      const report = auditProject(projectRoot, { rulesPath: parsed.flags.rules, language });
      process.stdout.write(buildAgentPrompt(report, request, { language }));
      return;
    }

    throw new Error(`Unknown command: ${parsed.command}`);
  } catch (error) {
    process.stderr.write(`vibe-guard: ${error.message}\n`);
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
    if (arg === "--fix") {
      parsed.flags.fix = true;
      continue;
    }
    if (arg === "--json") {
      parsed.flags.json = true;
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
    if (!parsed.command) parsed.command = arg;
    else parsed.positionals.push(arg);
  }

  return parsed;
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

function requestFromPositionals(positionals, projectRoot) {
  if (positionals.length === 0) return "";
  const candidate = path.resolve(expandHome(positionals[0]));
  if (candidate === projectRoot) return positionals.slice(1).join(" ");
  return positionals.join(" ");
}
