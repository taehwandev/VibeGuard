import path from "node:path";
import { writeTextFile } from "./fs-utils.js";

export const DEFAULT_UPDATE_MODE = "explicit";
export const DEFAULT_UPDATE_CHECK_INTERVAL_DAYS = 0;
export const UPDATE_STATE_FILE = path.join(".vibeguard", "update-state.json");

export function normalizeUpdateSettings(config = {}) {
  const raw = isPlainObject(config.update) ? config.update : {};
  const mode = raw.mode === "scheduled" ? "scheduled" : DEFAULT_UPDATE_MODE;
  const parsedInterval = Number(raw.checkIntervalDays);
  const checkIntervalDays = mode === "scheduled" && Number.isFinite(parsedInterval)
    ? Math.max(0, Math.floor(parsedInterval))
    : DEFAULT_UPDATE_CHECK_INTERVAL_DAYS;
  return {
    ...raw,
    mode,
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

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
