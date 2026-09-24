import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { adminSettingSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.adminSetting.findMany({ orderBy: { key: "asc" } });
    return apiOk({ settings });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const { key, value } = adminSettingSchema.parse(await req.json());
    const setting = await db.adminSetting.upsert({
      where: { key },
      update: { value: value as object, updatedBy: admin.id },
      create: { key, value: value as object, updatedBy: admin.id },
    });
    await db.auditLog.create({ data: { actorId: admin.id, action: "setting.update", targetType: "AdminSetting", targetId: key } });
    return apiOk({ setting });
  } catch (err) {
    return apiError(err);
  }
}
