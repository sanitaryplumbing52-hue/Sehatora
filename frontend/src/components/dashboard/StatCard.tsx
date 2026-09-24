import clsx from "clsx";

import type { IconType } from "@/types/icon";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: IconType;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    primary: "bg-primary-light text-primary dark:bg-primary/20 dark:text-blue-300",
    success: "bg-green-100 text-success dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-amber-100 text-warning dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-red-100 text-danger dark:bg-red-900/30 dark:text-red-300",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-surface-dark-card dark:border-border-dark p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink dark:text-slate-100">{value}</p>
        </div>
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", toneClasses)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
