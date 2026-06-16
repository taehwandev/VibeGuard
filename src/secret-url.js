const DATABASE_URL_PROTOCOLS = new Set([
  "postgres:",
  "postgresql:",
  "mysql:",
  "mariadb:",
  "mongodb:",
  "mongodb+srv:",
  "redis:",
  "rediss:",
  "sqlserver:"
]);

const HTTP_URL_PROTOCOLS = new Set(["http:", "https:"]);
const URL_CANDIDATE_REGEX = /\b[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s"'`<>]+/g;

export function findCredentialUrlSecretMatches(content) {
  if (typeof content !== "string" || content.length === 0) return [];

  const matches = [];
  for (const match of content.matchAll(URL_CANDIDATE_REGEX)) {
    const value = match[0];
    const label = credentialUrlSecretLabel(value);
    if (!label) continue;
    matches.push({ index: match.index, value, label });
  }
  return matches;
}

export function containsCredentialUrlSecret(content) {
  return findCredentialUrlSecretMatches(content).length > 0;
}

export function redactCredentialUrlSecrets(content) {
  if (typeof content !== "string" || content.length === 0) return content;
  return content.replace(URL_CANDIDATE_REGEX, (value) => (credentialUrlSecretLabel(value) ? "<redacted>" : value));
}

function credentialUrlSecretLabel(value) {
  const parsed = parseUrl(value);
  if (!parsed || !hasUrlPassword(parsed)) return null;
  if (DATABASE_URL_PROTOCOLS.has(parsed.protocol)) return "database connection string";
  if (HTTP_URL_PROTOCOLS.has(parsed.protocol)) return "URL with embedded credentials";
  return null;
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hasUrlPassword(url) {
  return url.password !== "";
}
