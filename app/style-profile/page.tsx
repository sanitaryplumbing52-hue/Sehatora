import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildFitGuidance, buildProportionSummary } from "@/services/body-profile";
import { StylePreferenceForm } from "@/components/features/style-preference-form";

export const metadata: Metadata = { title: "My Style Profile" };

export default async function StyleProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/style-profile");

  const [styleProfile, stylePreference] = await Promise.all([
    db.styleProfile.findUnique({ where: { userId: user.id } }),
    db.stylePreference.findUnique({ where: { userId: user.id } }),
  ]);

  if (!styleProfile) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">No style profile yet</h1>
        <p className="max-w-md text-muted-foreground">Upload a photo to generate your personal style profile.</p>
        <Button asChild>
          <Link href="/try">Find My Best Style</Link>
        </Button>
      </div>
    );
  }

  const proportions = buildProportionSummary({
    shoulderRatio: styleProfile.shoulderRatio,
    torsoRatio: styleProfile.torsoRatio,
    legRatio: styleProfile.legRatio,
  });

  return (
    <div className="container max-w-4xl py-16">
      <h1 className="font-serif text-3xl font-semibold">My Style Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Generated from your photo. You can manually correct or customize any of this below.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Body Profile</CardTitle>
            <CardDescription>Proportions and fit guidance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Body shape</span>
              <span className="font-medium">{styleProfile.bodyShape}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {proportions.map((p) => (
                <Badge key={p} variant="outline">
                  {p}
                </Badge>
              ))}
            </div>
            <p className="pt-2 text-sm text-muted-foreground">{buildFitGuidance(styleProfile.bodyShape)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Profile</CardTitle>
            <CardDescription>Undertone and dominant palette.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Undertone</span>
              <Badge variant="secondary">{styleProfile.undertone}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Skin tone</span>
              <span className="font-medium">{styleProfile.skinTone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hair color</span>
              <span className="font-medium">{styleProfile.hairColor}</span>
            </div>
            <div className="flex gap-2 pt-2">
              {styleProfile.dominantColors.map((hex) => (
                <span key={hex} className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href="/colors">See full color recommendations →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Fashion Profile</CardTitle>
            <CardDescription>Tell us how you like to dress — this tunes every recommendation.</CardDescription>
          </CardHeader>
          <CardContent>
            <StylePreferenceForm initial={stylePreference} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/outfits">Generate Outfits</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/look-builder">Open Look Builder</Link>
        </Button>
      </div>
    </div>
  );
}
