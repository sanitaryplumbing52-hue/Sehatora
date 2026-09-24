import type { Metadata } from "next";
import { LookBuilderView } from "@/components/features/look-builder-view";

export const metadata: Metadata = {
  title: "Virtual Try-On",
  description: "See yourself in tops, bottoms, footwear, and accessories with AI-powered virtual try-on.",
};

export default function VirtualTryOnPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Virtual Try-On</h1>
        <p className="mt-3 text-muted-foreground">
          Select items below and generate a realistic preview of you wearing the outfit.
        </p>
      </div>
      <div className="mt-10">
        <LookBuilderView />
      </div>
    </div>
  );
}
