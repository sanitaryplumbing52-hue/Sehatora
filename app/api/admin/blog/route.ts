import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { slugify } from "@/lib/utils";

const blogSchema = z.object({
  title: z.string().min(1).max(160),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return apiOk({ posts });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = blogSchema.parse(await req.json());
    const post = await db.blogPost.create({
      data: {
        ...data,
        slug: slugify(data.title),
        authorId: admin.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });
    return apiOk({ post }, 201);
  } catch (err) {
    return apiError(err);
  }
}
