import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { adminClothingItemSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    const data = adminClothingItemSchema.partial().parse(await req.json());
    const item = await db.clothingItem.update({ where: { id }, data });
    await db.auditLog.create({
      data: { actorId: admin.id, action: "clothing_item.update", targetType: "ClothingItem", targetId: item.id },
    });
    return apiOk({ item });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    await db.clothingItem.update({ where: { id }, data: { isActive: false } });
    await db.auditLog.create({
      data: { actorId: admin.id, action: "clothing_item.deactivate", targetType: "ClothingItem", targetId: id },
    });
    return apiOk({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
