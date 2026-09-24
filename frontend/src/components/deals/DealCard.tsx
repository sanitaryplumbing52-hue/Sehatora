import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Calendar, User } from "lucide-react";

import type { Deal } from "@/types";

export function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, data: { deal } });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-card p-3 shadow-card space-y-2 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="text-sm font-medium text-ink dark:text-slate-100 line-clamp-2">{deal.name}</p>
      {deal.company_name && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Building2 size={12} /> {deal.company_name}
        </p>
      )}
      <p className="text-sm font-semibold text-primary">
        {deal.currency} {Number(deal.amount).toLocaleString()}
      </p>
      <div className="flex items-center justify-between text-xs text-muted pt-1">
        <span className="flex items-center gap-1">
          <User size={12} /> {deal.owner_name?.split(" ")[0] || "Unassigned"}
        </span>
        {deal.expected_close_date && (
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {new Date(deal.expected_close_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      {deal.next_task && <p className="text-[11px] text-muted border-t border-border dark:border-border-dark pt-1.5">Next: {deal.next_task.name}</p>}
    </div>
  );
}
