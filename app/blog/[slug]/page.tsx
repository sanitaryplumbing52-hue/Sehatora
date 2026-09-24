import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") return {};

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: "article",
    },
    alternates: { canonical: absoluteUrl(`/blog/${post.slug}`) },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <article className="container max-w-2xl py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            datePublished: post.publishedAt,
            description: post.excerpt,
          }),
        }}
      />
      <h1 className="font-serif text-3xl font-semibold">{post.title}</h1>
      {post.publishedAt && (
        <p className="mt-2 text-sm text-muted-foreground">{new Date(post.publishedAt).toLocaleDateString()}</p>
      )}
      <div className="mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed text-foreground">{post.content}</div>
    </article>
  );
}
