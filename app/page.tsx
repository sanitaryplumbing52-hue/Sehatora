import Link from "next/link";
import { ArrowRight, Palette, Shirt, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { icon: Sparkles, title: "Upload your photo", desc: "A clear full-body photo — JPG, PNG, WebP, or your mobile camera." },
  { icon: Wand2, title: "AI builds your style profile", desc: "Body proportions, color palette, and fit guidance, generated for you." },
  { icon: Shirt, title: "See yourself styled", desc: "Virtual try-on, curated outfits, and color-matched combinations." },
];

const FEATURES = [
  { icon: Palette, title: "Color Recommendation Engine", desc: "Colors that suit you, neutrals, accents, and shades to use carefully.", href: "/colors" },
  { icon: Shirt, title: "AI Outfit Generator", desc: "Complete looks for any occasion, weather, and style — instantly.", href: "/outfits" },
  { icon: Wand2, title: "Virtual Try-On", desc: "Preview tops, bottoms, footwear, and accessories on your own photo.", href: "/look-builder" },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-editorial-gradient">
        <div className="container flex flex-col items-center gap-8 py-24 text-center md:py-32">
          <Badge variant="outline" className="animate-fade-up bg-background/70">
            AI Personal Stylist & Virtual Try-On
          </Badge>
          <h1 className="max-w-3xl animate-fade-up font-serif text-4xl font-semibold leading-tight md:text-6xl">
            Discover What Looks Best on You.
          </h1>
          <p className="max-w-xl animate-fade-up text-balance text-lg text-muted-foreground">
            Upload your photo and let AI create personalized outfits, colors, and styling
            recommendations made for you.
          </p>
          <div className="flex animate-fade-up flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/try">
                Try My Style <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/outfits">Explore Styles</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold">How it works</h2>
          <p className="mt-3 text-muted-foreground">From a single photo to a complete, personalized style profile.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                  <step.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-serif text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold">Everything you need to dress with confidence</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-24 text-center">
        <h2 className="font-serif text-3xl font-semibold md:text-4xl">Ready to find your best style?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          It takes less than a minute to upload your photo and get your first personalized recommendations.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/try">
            Try My Style <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
