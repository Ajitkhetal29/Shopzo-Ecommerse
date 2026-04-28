/**
 * Must match `basePath` / `assetPrefix` in `next.config.ts`.
 * String paths to `public/` files are not auto-prefixed for `next/image` `src`.
 */
export const APP_BASE_PATH = "/admin" as const;

export function publicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalized}`;
}
