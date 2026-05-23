const TEMPLATE_MARKERS = new Set(["default", "defaults", "dist", "example", "sample", "schema", "template"]);

export const ENV_TEMPLATE_UNIGNORE_LINES = [
  "!.env.example",
  "!.env.sample",
  "!.env.template",
  "!.env.dist",
  "!.env.defaults",
  "!.env.schema",
  "!.env*.default",
  "!.env*.defaults",
  "!.env*.dist",
  "!.env*.example",
  "!.env*.sample",
  "!.env*.schema",
  "!.env*.template"
];

export function isEnvFileName(name) {
  return name === ".env" || name.startsWith(".env.");
}

export function isEnvTemplateFileName(name) {
  if (!isEnvFileName(name)) return false;
  return TEMPLATE_MARKERS.has(envNameSegments(name).at(-1));
}

export function isRuntimeEnvFileName(name) {
  return isEnvFileName(name) && !isEnvTemplateFileName(name);
}

export function shouldScanEnvFileName(name) {
  return !isEnvFileName(name) || isEnvTemplateFileName(name);
}

export function hasEnvTemplateFile(names) {
  return names.some(isEnvTemplateFileName);
}

export function normalizeEnvValue(raw) {
  let value = raw.trim();
  if (!value) return "";
  if (!value.startsWith("\"") && !value.startsWith("'")) {
    value = value.replace(/\s+#.*$/, "").trim();
  }
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === "\"" || quote === "'") && value.at(-1) === quote) return value.slice(1, -1);
  }
  return value;
}

function envNameSegments(name) {
  return name
    .replace(/^\.env\.?/, "")
    .split(/[._-]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
}
