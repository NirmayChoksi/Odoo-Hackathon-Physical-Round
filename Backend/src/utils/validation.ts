export function num(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export function str(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v).trim();
}

export function bool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return undefined;
}

export function email(v: any): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return undefined;
  return s;
}

export function date(v: any): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split("T")[0];
}
