"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ColorCard, type ColorCardData } from "@/components/features/color-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ColorSet {
  best: ColorCardData[];
  neutrals: ColorCardData[];
  accents: ColorCardData[];
  careful: ColorCardData[];
  undertone: string | null;
}

interface ColorOutfit {
  name: string;
  items: Array<{ slot: string; label: string; colorName?: string }>;
}

const SECTIONS: Array<{ key: keyof Omit<ColorSet, "undertone">; title: string }> = [
  { key: "best", title: "Colors That Suit You" },
  { key: "neutrals", title: "Best Neutral Colors" },
  { key: "accents", title: "Best Accent Colors" },
  { key: "careful", title: "Colors To Use Carefully" },
];

export function ColorRecommendationsView() {
  const [data, setData] = useState<ColorSet | null>(null);
  const [selected, setSelected] = useState<ColorCardData | null>(null);
  const [outfits, setOutfits] = useState<ColorOutfit[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  useEffect(() => {
    fetch("/api/colors")
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function onSelectColor(color: ColorCardData) {
    setSelected(color);
    setLoadingOutfits(true);
    const res = await fetch(`/api/colors/${color.id}/outfits`);
    const json = await res.json();
    setOutfits(json.outfits ?? []);
    setLoadingOutfits(false);
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <h2 className="font-serif text-xl font-semibold">{section.title}</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {data[section.key].map((color) => (
              <ColorCard key={color.id} color={color} selected={selected?.id === color.id} onClick={onSelectColor} />
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Outfits built around {selected.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOutfits ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : outfits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No catalog items in this color yet — check back soon.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {outfits.map((o) => (
                  <div key={o.name} className="rounded-xl border border-border p-4">
                    <p className="font-medium">{o.name}</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {o.items.map((item) => (
                        <li key={item.slot}>
                          {item.slot}: {item.colorName ? `${item.colorName} ` : ""}
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
