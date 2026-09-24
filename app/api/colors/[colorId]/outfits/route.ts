import { NextResponse } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { buildOutfitsForColor } from "@/services/color-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ colorId: string }> }) {
  try {
    const { colorId } = await params;
    const outfits = await buildOutfitsForColor(colorId);
    if (!outfits.length) return NextResponse.json({ outfits: [] });
    return apiOk({ outfits });
  } catch (err) {
    return apiError(err);
  }
}
