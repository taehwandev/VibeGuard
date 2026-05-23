import os from "node:os";

export function sanitizePathForDisplay(filePath) {
  const home = os.homedir();
  if (filePath?.startsWith(home)) return `~${filePath.slice(home.length)}`;
  return filePath;
}

export function relativePath(filePath) {
  return filePath || ".";
}

