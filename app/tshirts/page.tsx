import type { Metadata } from "next";
import { TopStylistView } from "@/components/features/top-stylist-view";

export const metadata: Metadata = {
  title: "T-shirt Stylist",
  description: "Personalized t-shirt color, fit, and style recommendations with matching bottoms and footwear.",
};

export default function TshirtsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">T-shirt Stylist</h1>
        <p className="mt-3 text-muted-foreground">Recommended color, fit, and pairing for your t-shirts.</p>
      </div>
      <div className="mt-10">
        <TopStylistView categorySlug="t-shirt" title="T-shirt" />
      </div>
    </div>
  );
}
