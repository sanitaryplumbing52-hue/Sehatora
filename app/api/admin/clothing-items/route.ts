import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { adminClothingItemSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const items = await db.clothingItem.findMany({
      include: { category: true, brand: true, color: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return apiOk({ items });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const data = adminClothingItemSchema.parse(await req.json());
    const item = await db.clothingItem.create({ data });
    await db.auditLog.create({
      data: { actorId: admin.id, action: "clothing_item.create", targetType: "ClothingItem", targetId: item.id },
    });
    return apiOk({ item }, 201);
  } catch (err) {
    return apiError(err);
  }
}
