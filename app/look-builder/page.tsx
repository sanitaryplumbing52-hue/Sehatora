import type { Metadata } from "next";
import { LookBuilderView } from "@/components/features/look-builder-view";

export const metadata: Metadata = {
  title: "Complete Look Builder",
  description: "Build your complete look — top, bottom, shoes, watch, and accessories — with a live virtual try-on preview.",
};

export default function LookBuilderPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Complete Look Builder</h1>
        <p className="mt-3 text-muted-foreground">
          Mix and match every piece of your outfit and preview it on your own photo.
        </p>
      </div>
      <div className="mt-10">
        <LookBuilderView />
      </div>
    </div>
  );
}
