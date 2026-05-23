import path from "node:path";
import { readJsonIfExists, writeTextFile } from "./fs-utils.js";
import { t } from "./i18n.js";

export const DEFAULT_UPDATE_CHECK_INTERVAL_DAYS = 7;
export const UPDATE_STATE_FILE = path.join(".vibeguard", "update-state.json");

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeUpdateSettings(config = {}) {
  const raw = isPlainObject(config.update) ? config.update : {};
  const parsedInterval = Number(raw.checkIntervalDays);
  const checkIntervalDays = Number.isFinite(parsedInterval) ? Math.max(0, Math.floor(parsedInterval)) : DEFAULT_UPDATE_CHECK_INTERVAL_DAYS;
  return {
    ...raw,
    checkIntervalDays
  };
}

export function withDefaultUpdateSettings(config = {}) {
  return {
    ...config,
    update: normalizeUpdateSettings(config)
  };
}

export function recordUpdateCheck(projectRoot, now = new Date()) {
  const statePath = path.join(projectRoot, UPDATE_STATE_FILE);
  writeTextFile(
    statePath,
    `${JSON.stringify(
      {
        lastCheckedAt: now.toISOString()
      },
      null,
      2
    )}\n`
  );
}

export function updateCheckStatus(projectRoot, config = {}, now = new Date()) {
  const settings = normalizeUpdateSettings(config);
  if (settings.checkIntervalDays <= 0) {
    return {
      due: false,
      disabled: true,
      checkIntervalDays: settings.checkIntervalDays,
      ageDays: null
    };
  }

  const state = readUpdateState(projectRoot);
  const checkedAt = typeof state.lastCheckedAt === "string" ? Date.parse(state.lastCheckedAt) : NaN;
  if (!Number.isFinite(checkedAt)) {
    return {
      due: true,
      disabled: false,
      reason: "missing-state",
      checkIntervalDays: settings.checkIntervalDays,
      ageDays: "unknown"
    };
  }

  const ageMs = Math.max(0, now.getTime() - checkedAt);
  const ageDays = Math.floor(ageMs / DAY_MS);
  return {
    due: ageMs >= settings.checkIntervalDays * DAY_MS,
    disabled: false,
    reason: "stale-state",
    checkIntervalDays: settings.checkIntervalDays,
    ageDays
  };
}

export function staleUpdateFinding(projectRoot, config = {}, options = {}) {
  if (!options.hasConfig) return null;

  const status = updateCheckStatus(projectRoot, config, options.now ?? new Date());
  if (!status.due) return null;

  return {
    severity: status.reason === "missing-state" ? "info" : "warn",
    category: "environment",
    action: "update-vibeguard",
    message: t(options.language, "finding.staleUpdate.message", {
      intervalDays: status.checkIntervalDays,
      ageDays: status.ageDays
    }),
    recommendation: t(options.language, "finding.staleUpdate.recommendation")
  };
}

function readUpdateState(projectRoot) {
  try {
    return readJsonIfExists(path.join(projectRoot, UPDATE_STATE_FILE)) ?? {};
  } catch {
    return {};
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
