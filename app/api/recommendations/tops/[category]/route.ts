import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { recommendTop, listItemsForCategory, type TopCategorySlug } from "@/services/top-recommender";

const VALID: TopCategorySlug[] = ["t-shirt", "shirt", "polo", "overshirt", "jacket", "blazer"];

export async function GET(_req: Request, { params }: { params: Promise<{ category: string }> }) {
  try {
    const { category: categoryParam } = await params;
    if (!VALID.includes(categoryParam as TopCategorySlug)) {
      return NextResponse.json({ error: "Unknown category." }, { status: 404 });
    }
    const category = categoryParam as TopCategorySlug;
    const user = await requireUser();
    const styleProfile = await db.styleProfile.findUnique({ where: { userId: user.id } });

    const [recommendation, items] = await Promise.all([
      recommendTop(category, { bodyShape: styleProfile?.bodyShape, undertone: styleProfile?.undertone }),
      listItemsForCategory(category),
    ]);

    return apiOk({ recommendation, items });
  } catch (err) {
    return apiError(err);
  }
}
