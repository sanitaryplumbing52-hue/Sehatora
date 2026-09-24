"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OutfitRow {
  id: string;
  name: string;
  occasion: string | null;
  source: string;
  items: Array<{ slot: string; clothingItem: { name: string; color: { name: string } | null } }>;
}

export function OutfitsTab() {
  const [outfits, setOutfits] = useState<OutfitRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/outfits")
      .then((r) => r.json())
      .then((json) => setOutfits(json.outfits ?? []));
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {outfits.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {o.name}
              <Badge variant="outline">{o.source}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {o.items.map((i) => (
              <p key={i.slot}>
                {i.slot}: {i.clothingItem.color ? `${i.clothingItem.color.name} ` : ""}
                {i.clothingItem.name}
              </p>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
