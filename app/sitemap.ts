import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "/",
  "/try",
  "/outfits",
  "/colors",
  "/jeans",
  "/shirts",
  "/tshirts",
  "/look-builder",
  "/virtual-try-on",
  "/shopping",
  "/chat",
  "/fashion-guide",
  "/blog",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.7,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
