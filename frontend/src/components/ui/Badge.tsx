import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "default" | "primary" | "success" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-slate-100 text-ink dark:bg-slate-700 dark:text-slate-100",
  primary: "bg-primary-light text-primary dark:bg-primary/20 dark:text-blue-300",
  success: "bg-green-100 text-success dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-warning dark:bg-amber-900/40 dark:text-amber-300",
  danger: "bg-red-100 text-danger dark:bg-red-900/40 dark:text-red-300",
  muted: "bg-slate-50 text-muted dark:bg-slate-800 dark:text-slate-400",
};

export function Badge({
  tone = "default",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </span>
  );
}
