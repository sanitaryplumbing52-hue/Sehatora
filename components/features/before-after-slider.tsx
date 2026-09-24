"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Current Look",
  afterLabel = "AI Recommended Look",
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [percent, setPercent] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-border", className)}
      onPointerDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Image src={afterSrc} alt={afterLabel} fill unoptimized className="object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        {containerWidth > 0 && (
          <div className="relative h-full" style={{ width: containerWidth }}>
            <Image src={beforeSrc} alt={beforeLabel} fill unoptimized className="object-cover" />
          </div>
        )}
      </div>

      <div className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 flex-col items-center bg-white" style={{ left: `${percent}%` }}>
        <div className="mt-auto mb-auto flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
          <div className="h-4 w-4 rounded-full bg-accent" />
        </div>
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{beforeLabel}</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{afterLabel}</span>

      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => setPercent(Number(e.target.value))}
        className="absolute inset-x-0 bottom-3 z-20 mx-auto w-3/4 opacity-0"
        aria-label="Compare before and after"
      />
    </div>
  );
}
