const APPROVAL_RULE = "Obtain explicit user authority before deleting data, running migrations, deploying to production, increasing paid API/model usage, adding recurring infrastructure, or changing credentials. Before execution, state the exact target and action and check that existing approval covers them. Continue within that approval through scoped corrections and retries; a source revision change alone does not revoke approval. Ask when the target or action is unresolved, scope or material risk changes, or the user pauses, limits, or revokes authority. Never infer approval from silence or extend it to unrelated actions, a new version, destructive operations, or an unapproved tag overwrite.";
const LEGACY_RULE = "For every real external production deployment, and any deployment whose target\nis unknown, immediately before execution state the exact target and action and\nwait for fresh user confirmation. Never infer, reuse, or bypass approval from\nearlier wording such as \"deploy it\" or \"handle it yourself\".";
function refreshGeneratedApprovalPolicy(text) {
  const heading = "## Deployment Confirmation Rule\n\n";
  const start = text.indexOf(heading);
  if (start < 0) return text;
  const bodyStart = start + heading.length;
  const next = text.indexOf("\n## ", bodyStart);
  const end = next < 0 ? text.length : next;
  const body = text.slice(bodyStart, end);
  if (body.trim() !== LEGACY_RULE) return text;
  return text.slice(0, bodyStart) + APPROVAL_RULE + body.slice(body.trimEnd().length) + text.slice(end);
}

export const approvalPolicy = { rule: APPROVAL_RULE, refresh: refreshGeneratedApprovalPolicy };
