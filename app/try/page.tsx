import type { Metadata } from "next";
import { TryFlow } from "@/components/features/try-flow";

export const metadata: Metadata = {
  title: "Find My Best Style",
  description: "Upload a full-body photo and let STYLEAI build your personal style profile.",
};

export default function TryPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <h1 className="font-serif text-3xl font-semibold">Find My Best Style</h1>
        <p className="mt-3 text-muted-foreground">
          Upload a clear, full-body photo. Our AI will analyze your proportions, colors, and current
          outfit to build a personalized style profile — privately and securely.
        </p>
      </div>
      <TryFlow />
    </div>
  );
}
