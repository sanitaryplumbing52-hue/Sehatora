import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Welcome to STYLEAI" };

export default function OnboardingPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="max-w-lg text-center">
        <CardContent className="space-y-6 pt-10">
          <Sparkles className="mx-auto h-8 w-8 text-accent" />
          <h1 className="font-serif text-2xl font-semibold">Welcome to STYLEAI</h1>
          <p className="text-muted-foreground">
            Upload a full-body photo to unlock your personal style profile, color recommendations, and
            AI-generated outfits.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/try">Find My Best Style</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Skip for now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
