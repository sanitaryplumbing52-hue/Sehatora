import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { chatMessageSchema } from "@/lib/validation";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { getAIProvider } from "@/ai";
import type { StyleProfileSnapshot } from "@/ai/types";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const limit = checkRateLimit(rateLimitKeyFromRequest(req, `chat:${user.id}`), 30, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Please slow down a little before sending more messages." }, { status: 429 });
    }

    const { message, conversation } = chatMessageSchema.parse(await req.json());

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
    const result = await provider.generateText({
      messages: [
        {
          role: "system",
          content:
            "You are STYLEAI's personal fashion assistant. Be concise, practical, and specific. Never comment on attractiveness or make sensitive personal-attribute judgments.",
        },
        ...(conversation ?? []).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      styleProfile: snapshot,
    });

    return apiOk({ reply: result.content });
  } catch (err) {
    return apiError(err);
  }
}
