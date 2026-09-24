"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OutfitCard } from "@/components/features/outfit-card";
import { useToast } from "@/hooks/use-toast";
import { OCCASIONS, STYLE_TAGS, WEATHER_OPTIONS } from "@/lib/constants";
import type { OutfitSuggestion } from "@/ai/types";

export function OutfitGeneratorView() {
  const { toast } = useToast();
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [weather, setWeather] = useState<string>(WEATHER_OPTIONS[1]);
  const [style, setStyle] = useState<string>(STYLE_TAGS[2]);
  const [loading, setLoading] = useState(false);
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, weather, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutfits(data.outfits);
    } catch (err) {
      toast({ title: "Couldn't generate outfits", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
        <div>
          <Label className="mb-2 block">Occasion</Label>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCCASIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Weather</Label>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEATHER_OPTIONS.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLE_TAGS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="sm:col-span-3" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Generate Outfits
        </Button>
      </div>

      {outfits.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.name} outfit={outfit} />
          ))}
        </div>
      )}
    </div>
  );
}
