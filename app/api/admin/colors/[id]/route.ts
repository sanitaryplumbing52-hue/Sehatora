import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { adminColorSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const data = adminColorSchema.partial().parse(await req.json());
    const color = await db.color.update({ where: { id }, data });
    return apiOk({ color });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await db.color.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
