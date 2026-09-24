import type { Metadata } from "next";
import { JeansStylistView } from "@/components/features/jeans-stylist-view";

export const metadata: Metadata = {
  title: "Jeans Stylist",
  description: "Get personalized jeans shade and fit recommendations with virtual try-on previews.",
};

export default function JeansPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Jeans Stylist</h1>
        <p className="mt-3 text-muted-foreground">
          Light blue, medium blue, dark blue, black, grey, or off-white — matched to your color profile and body
          shape, in the fit that works for you.
        </p>
      </div>
      <div className="mt-10">
        <JeansStylistView />
      </div>
    </div>
  );
}
