/**
 * Full-page navigation. Used after sign-in / sign-out / org switches so every cache
 * (React Query, router cache, server-rendered data) starts fresh with the new session.
 */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}
