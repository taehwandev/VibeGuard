import path from "node:path";

export const SCAN_IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vibeguard",
  ".venv",
  "build",
  "coverage",
  "DerivedData",
  "dist",
  "node_modules",
  "Pods",
  "target",
  "venv",
  "__pycache__"
]);

const SOURCE_CODE_EXTENSIONS = new Set([
  ".astro",
  ".bash",
  ".c",
  ".cc",
  ".cjs",
  ".clj",
  ".cljs",
  ".cpp",
  ".cs",
  ".css",
  ".dart",
  ".erl",
  ".ex",
  ".exs",
  ".fs",
  ".fsx",
  ".go",
  ".h",
  ".hpp",
  ".html",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".lua",
  ".m",
  ".mjs",
  ".mm",
  ".php",
  ".pl",
  ".py",
  ".r",
  ".rb",
  ".rs",
  ".scala",
  ".sh",
  ".svelte",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
  ".zsh"
]);

export function isSourceCodeFile(filePath) {
  return SOURCE_CODE_EXTENSIONS.has(path.extname(filePath));
}
