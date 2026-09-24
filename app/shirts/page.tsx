import type { Metadata } from "next";
import { TopStylistView } from "@/components/features/top-stylist-view";

export const metadata: Metadata = {
  title: "Shirt Stylist",
  description: "Personalized shirt color, fit, and style recommendations with matching bottoms and footwear.",
};

export default function ShirtsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Shirt Stylist</h1>
        <p className="mt-3 text-muted-foreground">Recommended color, fit, and pairing for your shirts.</p>
      </div>
      <div className="mt-10">
        <TopStylistView categorySlug="shirt" title="Shirt" />
      </div>
    </div>
  );
}
