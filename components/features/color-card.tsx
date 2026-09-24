"use client";

import { cn } from "@/lib/utils";

export interface ColorCardData {
  id: string;
  name: string;
  hex: string;
  family?: string;
}

export function ColorCard({
  color,
  selected,
  onClick,
}: {
  color: ColorCardData;
  selected?: boolean;
  onClick?: (color: ColorCardData) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(color)}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-2xl border border-border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected && "border-accent ring-2 ring-accent/40"
      )}
    >
      <span
        className="h-14 w-14 rounded-full border border-black/5 shadow-inner"
        style={{ backgroundColor: color.hex }}
      />
      <span className="text-xs font-medium">{color.name}</span>
    </button>
  );
}
