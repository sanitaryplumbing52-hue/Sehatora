import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Fashion Guide",
  description: "Practical styling guidance — color theory, fit, and dressing for every occasion.",
};

const GUIDES = [
  {
    title: "Understanding Your Undertone",
    href: "/colors",
    excerpt: "Warm, cool, or neutral — your undertone is the foundation of every color recommendation.",
  },
  {
    title: "Choosing the Right Jeans Fit",
    href: "/jeans",
    excerpt: "Slim, straight, relaxed, tapered, or regular — matched to your body shape.",
  },
  {
    title: "Dressing for a Business Meeting",
    href: "/outfits",
    excerpt: "Shirts, trousers, and footwear that read as put-together without trying too hard.",
  },
  {
    title: "Building a Capsule Wardrobe",
    href: "/look-builder",
    excerpt: "Fewer, better pieces that combine into more outfits than you'd expect.",
  },
];

export default function FashionGuidePage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Fashion Guide</h1>
        <p className="mt-3 text-muted-foreground">Practical, no-nonsense styling guidance.</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link key={g.title} href={g.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{g.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{g.excerpt}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
