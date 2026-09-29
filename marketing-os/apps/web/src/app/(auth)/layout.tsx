import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-base font-semibold tracking-tight text-ink">Marketing Intelligence OS</p>
        <p className="mt-1 text-xs text-ink-3">Real data. Real integrations. Real calculations.</p>
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">{children}</div>
    </div>
  );
}
