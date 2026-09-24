"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JeansRecommendation {
  shade: string;
  fit: string;
  reason: string;
  clothingItemId?: string;
  imageUrl?: string | null;
}

export function JeansStylistView() {
  const [data, setData] = useState<JeansRecommendation[] | null>(null);

  useEffect(() => {
    fetch("/api/recommendations/jeans")
      .then((r) => r.json())
      .then((json) => setData(json.recommendations));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl font-semibold">Your Recommended Jeans</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((rec) => (
          <Card key={rec.shade}>
            <div className="relative aspect-square overflow-hidden rounded-t-xl bg-secondary">
              {rec.imageUrl ? (
                <Image src={rec.imageUrl} alt={rec.shade} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview</div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {rec.shade} Jeans
                <Badge variant="accent">{rec.fit}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rec.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
