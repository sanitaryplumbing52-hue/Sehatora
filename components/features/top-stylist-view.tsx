"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopCategorySlug, TopRecommendation } from "@/services/top-recommender";

interface ClothingItemView {
  id: string;
  name: string;
  imageUrl: string | null;
  color: { name: string; hex: string } | null;
  brand: { name: string } | null;
}

export function TopStylistView({ categorySlug, title }: { categorySlug: TopCategorySlug; title: string }) {
  const [recommendation, setRecommendation] = useState<TopRecommendation | null>(null);
  const [items, setItems] = useState<ClothingItemView[]>([]);

  useEffect(() => {
    fetch(`/api/recommendations/tops/${categorySlug}`)
      .then((r) => r.json())
      .then((json) => {
        setRecommendation(json.recommendation);
        setItems(json.items ?? []);
      });
  }, [categorySlug]);

  if (!recommendation) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>Your {title} Guidance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm">
            <Row label="Recommended color" value={recommendation.recommendedColor} />
            <Row label="Recommended fit" value={recommendation.recommendedFit} />
            <Row label="Recommended style" value={recommendation.recommendedStyle} />
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Matching bottom" value={recommendation.matchingBottom} />
            <Row label="Matching footwear" value={recommendation.matchingFootwear} />
            <Row label="Matching accessory" value={recommendation.matchingAccessory} />
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div>
          <h2 className="mb-4 font-serif text-xl font-semibold">Catalog picks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id}>
                <div className="relative aspect-square overflow-hidden rounded-t-xl bg-secondary">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview</div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {item.brand?.name}
                    {item.color && <Badge variant="outline">{item.color.name}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
