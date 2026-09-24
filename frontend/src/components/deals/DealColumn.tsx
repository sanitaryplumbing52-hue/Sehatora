import { useDroppable } from "@dnd-kit/core";

import { DealCard } from "@/components/deals/DealCard";
import type { Deal } from "@/types";

export function DealColumn({
  id,
  name,
  totalValue,
  currency,
  deals,
  isWon,
  isLost,
}: {
  id: string;
  name: string;
  totalValue: number;
  currency: string;
  deals: Deal[];
  isWon?: boolean;
  isLost?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-50 dark:bg-surface-dark border border-border dark:border-border-dark">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border dark:border-border-dark">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isWon ? "bg-success" : isLost ? "bg-danger" : "bg-primary"}`}
          />
          <span className="text-sm font-semibold text-ink dark:text-slate-100">{name}</span>
          <span className="text-xs text-muted">({deals.length})</span>
        </div>
      </div>
      <p className="px-3 pt-2 text-xs font-medium text-muted">
        {currency} {totalValue.toLocaleString()}
      </p>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-3 min-h-[120px] transition-colors ${
          isOver ? "bg-primary-light/40 dark:bg-primary/10" : ""
        }`}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}
