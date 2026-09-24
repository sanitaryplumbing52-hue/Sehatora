import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const data = updateSchema.parse(await req.json());
    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    return apiOk({ post });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await db.blogPost.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
