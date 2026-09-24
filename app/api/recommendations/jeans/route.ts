import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { recommendJeans } from "@/services/jeans-recommender";

export async function GET() {
  try {
    const user = await requireUser();
    const styleProfile = await db.styleProfile.findUnique({ where: { userId: user.id } });
    const recommendations = await recommendJeans({
      bodyShape: styleProfile?.bodyShape,
      undertone: styleProfile?.undertone,
    });
    return apiOk({ recommendations });
  } catch (err) {
    return apiError(err);
  }
}
