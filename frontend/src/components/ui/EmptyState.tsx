import type { ReactNode } from "react";

import type { IconType } from "@/types/icon";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light dark:bg-primary/20">
        <Icon size={22} className="text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-ink dark:text-slate-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
