"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Share2, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BeforeAfterSlider } from "@/components/features/before-after-slider";
import { StyleScoreCard } from "@/components/features/style-score-card";
import { useToast } from "@/hooks/use-toast";
import { computeStyleMatch } from "@/services/style-score";
import { ACCESSORY_CATEGORY_SLUGS } from "@/lib/constants";
import type { Undertone } from "@/ai/types";

interface CatalogItem {
  id: string;
  name: string;
  imageUrl: string | null;
  category: { slug: string; group: "TOP" | "BOTTOM" | "FOOTWEAR" | "ACCESSORY"; name: string };
  color: { name: string; hex: string } | null;
}

interface PhotoRecord {
  id: string;
  url: string;
}

type SlotKey = "TOP" | "BOTTOM" | "FOOTWEAR" | "WATCH" | "ACCESSORY";

const ROWS: Array<{ key: SlotKey; label: string }> = [
  { key: "TOP", label: "Top" },
  { key: "BOTTOM", label: "Bottom" },
  { key: "FOOTWEAR", label: "Shoes" },
  { key: "WATCH", label: "Watch" },
  { key: "ACCESSORY", label: "Accessories" },
];

export function LookBuilderView() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selection, setSelection] = useState<Record<SlotKey, string | undefined>>({
    TOP: undefined,
    BOTTOM: undefined,
    FOOTWEAR: undefined,
    WATCH: undefined,
    ACCESSORY: undefined,
  });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<{ bodyShape?: string; undertone?: Undertone } | null>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((json) => setPhotos(json.photos ?? []));
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((json) => setItems(json.items ?? []));
    fetch("/api/style-profile")
      .then((r) => r.json())
      .then((json) => setProfile(json.styleProfile));
  }, []);

  const activePhoto = photos[0];

  const itemsByRow = useMemo(() => {
    const groups: Record<SlotKey, CatalogItem[]> = { TOP: [], BOTTOM: [], FOOTWEAR: [], WATCH: [], ACCESSORY: [] };
    for (const item of items) {
      if (item.category.group === "TOP") groups.TOP.push(item);
      else if (item.category.group === "BOTTOM") groups.BOTTOM.push(item);
      else if (item.category.group === "FOOTWEAR") groups.FOOTWEAR.push(item);
      else if (item.category.slug === "watch") groups.WATCH.push(item);
      else if (ACCESSORY_CATEGORY_SLUGS.includes(item.category.slug)) groups.ACCESSORY.push(item);
    }
    return groups;
  }, [items]);

  const selectedItems = useMemo(
    () =>
      ROWS.map((row) => ({ row, item: items.find((i) => i.id === selection[row.key]) })).filter((r) => r.item),
    [items, selection]
  );

  async function generatePreview() {
    if (!activePhoto) {
      toast({ title: "Upload a photo first", description: "Go to Find My Best Style to upload a photo." });
      return;
    }
    const payloadItems = selectedItems.map(({ row, item }) => ({
      slot: row.key === "WATCH" ? "ACCESSORY" : row.key,
      clothingItemId: item!.id,
    }));
    if (payloadItems.length === 0) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: activePhoto.id, items: payloadItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const poll = setInterval(async () => {
        const s = await fetch(`/api/try-on/${data.sessionId}`).then((r) => r.json());
        if (s.status === "COMPLETED") {
          clearInterval(poll);
          setResultUrl(s.resultImageUrl);
          setGenerating(false);
        }
        if (s.status === "FAILED") {
          clearInterval(poll);
          setGenerating(false);
          toast({ title: "Couldn't generate preview", description: s.error, variant: "destructive" });
        }
      }, 1000);
    } catch (err) {
      setGenerating(false);
      toast({ title: "Couldn't generate preview", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  }

  async function saveLook() {
    if (selectedItems.length === 0) return;
    try {
      const res = await fetch("/api/outfits/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Custom Look",
          items: selectedItems.map(({ row, item }) => ({ slot: row.key === "WATCH" ? "ACCESSORY" : row.key, label: item!.name })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Look saved to your dashboard" });
    } catch (err) {
      toast({ title: "Couldn't save look", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  }

  function shareLook() {
    if (navigator.share) navigator.share({ title: "My STYLEAI Look", url: window.location.href }).catch(() => {});
    else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied" });
    }
  }

  const styleMatch = computeStyleMatch({
    profile: { bodyShape: profile?.bodyShape, undertone: profile?.undertone },
    outfitColorNames: selectedItems.map(({ item }) => item?.color?.name).filter((v): v is string => Boolean(v)),
  });

  if (!activePhoto) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-4 pt-8">
          <p className="text-muted-foreground">Upload a photo to start building your look.</p>
          <Button asChild>
            <Link href="/try">Find My Best Style</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        {resultUrl || activePhoto ? (
          <BeforeAfterSlider beforeSrc={activePhoto.url} afterSrc={resultUrl ?? activePhoto.url} />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={generatePreview} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Preview"}
          </Button>
          <Button variant="outline" onClick={() => setSelection({ TOP: undefined, BOTTOM: undefined, FOOTWEAR: undefined, WATCH: undefined, ACCESSORY: undefined })}>
            <RefreshCw className="h-4 w-4" /> Try Another
          </Button>
          <Button variant="outline" onClick={saveLook}>
            <Heart className="h-4 w-4" /> Save Look
          </Button>
          <Button variant="ghost" onClick={shareLook}>
            <Share2 className="h-4 w-4" /> Share Look
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/outfits">Create Similar Look</Link>
          </Button>
        </div>

        {selectedItems.length > 0 && <StyleScoreCard breakdown={styleMatch} />}
      </div>

      <div className="space-y-6">
        {ROWS.map((row) => (
          <div key={row.key}>
            <Label className="mb-2 block">{row.label}</Label>
            <Select value={selection[row.key] ?? ""} onValueChange={(v) => setSelection((s) => ({ ...s, [row.key]: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose ${row.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {itemsByRow[row.key].map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.color ? `${item.color.name} ` : ""}
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
