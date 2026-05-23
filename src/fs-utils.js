import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function expandHome(input) {
  if (!input) return input;
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

export function pathExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function readTextIfExists(filePath) {
  if (!pathExists(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

export function readJsonIfExists(filePath) {
  if (!pathExists(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeTextFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function appendUniqueLines(filePath, lines) {
  const existing = readTextIfExists(filePath);
  const existingLines = new Set(existing.split(/\r?\n/).map((line) => line.trim()));
  const missing = lines.filter((line) => !existingLines.has(line.trim()));
  if (missing.length === 0) return false;

  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  const suffix = missing.join("\n") + "\n";
  writeTextFile(filePath, existing + prefix + suffix);
  return true;
}

export function listFiles(root, options = {}) {
  const ignoreDirs = options.ignoreDirs ?? new Set();
  const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
  const files = [];

  function visit(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(fullPath);
      if (stat.size <= maxFileBytes) files.push(fullPath);
    }
  }

  visit(root);
  return files;
}

export function relativePath(root, filePath) {
  return path.relative(root, filePath) || ".";
}

export function lineNumberAt(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

export function hasBinaryByte(buffer) {
  const length = Math.min(buffer.length, 4096);
  for (let i = 0; i < length; i += 1) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

export function isProbablyTextFile(filePath) {
  const textExtensions = new Set([
    ".cjs",
    ".css",
    ".env",
    ".html",
    ".java",
    ".js",
    ".json",
    ".jsx",
    ".kt",
    ".md",
    ".mjs",
    ".php",
    ".properties",
    ".py",
    ".rb",
    ".rs",
    ".sh",
    ".swift",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".xml",
    ".yaml",
    ".yml"
  ]);

  if (textExtensions.has(path.extname(filePath))) return true;
  const basename = path.basename(filePath);
  if (basename === ".gitignore" || basename.startsWith(".env")) return true;

  try {
    const buffer = fs.readFileSync(filePath);
    return !hasBinaryByte(buffer);
  } catch {
    return false;
  }
}

