import type { Metadata } from "next";
import { OutfitGeneratorView } from "@/components/features/outfit-generator-view";

export const metadata: Metadata = {
  title: "AI Outfit Generator",
  description: "Generate complete outfit combinations for any occasion, weather, and style.",
};

export default function OutfitsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">AI Outfit Generator</h1>
        <p className="mt-3 text-muted-foreground">
          Choose an occasion, weather, and style — we&apos;ll generate complete outfit combinations for you.
        </p>
      </div>
      <div className="mt-10">
        <OutfitGeneratorView />
      </div>
    </div>
  );
}
