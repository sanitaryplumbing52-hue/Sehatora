import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { getColorRecommendations } from "@/services/color-engine";

export async function GET() {
  try {
    const user = await requireUser();
    const styleProfile = await db.styleProfile.findUnique({ where: { userId: user.id } });
    const recommendations = await getColorRecommendations(styleProfile?.undertone);
    return apiOk({ ...recommendations, undertone: styleProfile?.undertone ?? null });
  } catch (err) {
    return apiError(err);
  }
}
