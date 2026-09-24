import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { stylePreferenceSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const [styleProfile, stylePreference] = await Promise.all([
      db.styleProfile.findUnique({ where: { userId: user.id } }),
      db.stylePreference.findUnique({ where: { userId: user.id } }),
    ]);
    return apiOk({ styleProfile, stylePreference });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = req.headers.get("content-type")?.includes("application/json") ? await req.json() : {};

    if (body.styleProfile) {
      const allowed = [
        "bodyShape",
        "undertone",
        "skinTone",
        "hairColor",
        "beardPresence",
      ] as const;
      const data: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in body.styleProfile) data[key] = body.styleProfile[key];
      }
      await db.styleProfile.update({ where: { userId: user.id }, data });
    }

    if (body.stylePreference) {
      const preference = stylePreferenceSchema.partial().parse(body.stylePreference);
      await db.stylePreference.upsert({
        where: { userId: user.id },
        update: preference,
        create: {
          userId: user.id,
          fashionProfiles: preference.fashionProfiles ?? [],
          favoriteOccasions: preference.favoriteOccasions ?? [],
          preferredBrands: preference.preferredBrands ?? [],
          avoidColors: preference.avoidColors ?? [],
          budgetMax: preference.budgetMax,
          notes: preference.notes,
        },
      });
    }

    const [styleProfile, stylePreference] = await Promise.all([
      db.styleProfile.findUnique({ where: { userId: user.id } }),
      db.stylePreference.findUnique({ where: { userId: user.id } }),
    ]);

    return apiOk({ styleProfile, stylePreference });
  } catch (err) {
    return apiError(err);
  }
}
