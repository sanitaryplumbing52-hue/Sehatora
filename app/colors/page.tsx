import type { Metadata } from "next";
import { ColorRecommendationsView } from "@/components/features/color-recommendations-view";

export const metadata: Metadata = {
  title: "Color Recommendations",
  description: "Discover the colors that suit you — best neutrals, accents, and shades to use carefully.",
};

export default function ColorsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Color Recommendations</h1>
        <p className="mt-3 text-muted-foreground">Tap a color to see outfit combinations built around it.</p>
      </div>
      <div className="mt-10">
        <ColorRecommendationsView />
      </div>
    </div>
  );
}
