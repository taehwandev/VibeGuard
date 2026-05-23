#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

export function isoWeekParts(inputDate = new Date()) {
  const date = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);

  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);

  return {
    year: isoYear,
    yy: String(isoYear).slice(-2),
    week: String(isoWeek).padStart(2, "0")
  };
}

export function nextReleaseVersion(options = {}) {
  const parts = isoWeekParts(options.date ?? new Date());
  const prefix = `${parts.yy}.${parts.week}`;
  const releaseNumbers = (options.tags ?? [])
    .map((tag) => tag.match(new RegExp(`^v?${escapeRegex(prefix)}\\.(\\d+)$`))?.[1])
    .filter(Boolean)
    .map((value) => Number.parseInt(value, 10))
    .filter(Number.isSafeInteger);

  const nextRelease = releaseNumbers.length === 0 ? 0 : Math.max(...releaseNumbers) + 1;
  return `${prefix}.${nextRelease}`;
}

export function parseDate(value) {
  if (!value) return new Date();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD.`);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const date = parseDate(args.date);
  const version = nextReleaseVersion({ date, tags: readTags(cwd) });

  if (args.write) writePackageVersion(cwd, version);
  process.stdout.write(`${version}\n`);
}

function parseArgs(args) {
  const parsed = { date: null, write: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--date") {
      parsed.date = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--write") {
      parsed.write = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function readTags(cwd) {
  try {
    return execFileSync("git", ["tag", "--list", "v[0-9][0-9].[0-9][0-9].*"], {
      cwd,
      encoding: "utf8"
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writePackageVersion(cwd, version) {
  const packagePath = path.join(cwd, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (process.argv[1] === __filename) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`release-version: ${error.message}\n`);
    process.exitCode = 1;
  }
}
