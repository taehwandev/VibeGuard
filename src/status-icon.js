export const STATUS_ICON = Object.freeze({
  pass: "✅",
  warn: "⚠️",
  block: "🛑",
  info: "ℹ️"
});

export function statusIcon(status) {
  return STATUS_ICON[status] ?? STATUS_ICON.info;
}
