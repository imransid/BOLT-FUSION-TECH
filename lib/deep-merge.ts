/** Deep-merge plain objects; arrays and primitives from patch replace entirely. */
export function deepMerge(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (patch === null) return null;
  if (Array.isArray(patch)) return patch.slice();
  if (typeof patch !== "object") return patch;
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
      if (v === undefined) continue;
      result[k] = deepMerge(undefined, v);
    }
    return result;
  }
  const b = base as Record<string, unknown>;
  const p = patch as Record<string, unknown>;
  const result: Record<string, unknown> = { ...b };
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined) continue;
    result[k] = k in b ? deepMerge(b[k], v) : deepMerge(undefined, v);
  }
  return result;
}
