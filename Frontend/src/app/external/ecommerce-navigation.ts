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
