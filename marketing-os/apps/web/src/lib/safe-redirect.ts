/** Only allows same-site relative paths (prevents open redirects via ?next=). */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\') || /[\r\n]/.test(next)) return fallback;
  return next;
}
