import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { outfitGenerateSchema } from "@/lib/validation";
import { getAIProvider } from "@/ai";
import type { StyleProfileSnapshot } from "@/ai/types";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const params = outfitGenerateSchema.parse(await req.json());

    const [styleProfile, stylePreference] = await Promise.all([
      db.styleProfile.findUnique({ where: { userId: user.id } }),
      db.stylePreference.findUnique({ where: { userId: user.id } }),
    ]);

    const snapshot: StyleProfileSnapshot = {
      bodyShape: styleProfile?.bodyShape,
      undertone: styleProfile?.undertone,
      skinTone: styleProfile?.skinTone,
      dominantColors: styleProfile?.dominantColors ?? [],
      fashionProfiles: stylePreference?.fashionProfiles ?? [],
      preferredBrands: stylePreference?.preferredBrands ?? [],
      budgetMax: stylePreference?.budgetMax,
    };

    const provider = getAIProvider();
    const result = await provider.recommendStyle({
      styleProfile: snapshot,
      occasion: params.occasion,
      weather: params.weather,
      style: params.style,
      colorFocus: params.colorFocus,
      count: 3,
    });

    await db.recommendation.create({
      data: { userId: user.id, type: "OUTFIT", payload: { params, outfits: result.outfits } as object },
    });

    return apiOk(result);
  } catch (err) {
    return apiError(err);
  }
}
