/** Base URL for storefront routes nested under the internal dashboard. */
export const INTERNAL_DASHBOARD_NAV_BASE = '/dashboard/internal' as const;

/**
 * Builds router `navigate` / `routerLink` command arrays for storefront flows.
 * When `navLinkBase` is set (e.g. `/dashboard/internal`), URLs stay under that prefix.
 */
export function ecommerceCommands(
  navLinkBase: string | undefined,
  ...segments: (string | number)[]
): (string | number)[] {
  if (navLinkBase) {
    return segments.length ? [navLinkBase, ...segments] : [navLinkBase];
  }
  if (segments.length === 0) return ['/home'];
  return [`/${String(segments[0])}`, ...segments.slice(1)];
}
