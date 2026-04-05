/** Display helper; DB trigger still assigns subscription_number on insert. */
export function previewOrderNumber(nextAutoIncrement: number, prefix = "SO"): string {
  const n = Math.max(1, Math.floor(nextAutoIncrement));
  return `${prefix}${String(n).padStart(3, "0")}`;
}
