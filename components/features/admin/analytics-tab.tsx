"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Analytics {
  userCount: number;
  photoUploads: number;
  generations: number;
  tryOns: number;
  savedOutfits: number;
  proSubscribers: number;
  topEvents: Array<{ event: string; count: number }>;
}

const METRICS: Array<{ key: keyof Analytics; label: string }> = [
  { key: "userCount", label: "Users" },
  { key: "photoUploads", label: "Photo Uploads" },
  { key: "generations", label: "AI Generations" },
  { key: "tryOns", label: "Virtual Try-Ons" },
  { key: "savedOutfits", label: "Saved Outfits" },
  { key: "proSubscribers", label: "Pro Subscribers" },
];

export function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map((m) => (
          <Card key={m.key}>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-semibold">{data[m.key] as number}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.topEvents.length === 0 && <p className="text-sm text-muted-foreground">No events tracked yet.</p>}
          {data.topEvents.map((e) => (
            <div key={e.event} className="flex justify-between border-b border-border pb-2 text-sm last:border-0">
              <span>{e.event}</span>
              <span className="font-medium">{e.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
