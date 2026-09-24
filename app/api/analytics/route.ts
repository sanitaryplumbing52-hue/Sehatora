import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";

const eventSchema = z.object({
  event: z.string().min(1).max(60),
  sessionId: z.string().max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ALLOWED_EVENTS = new Set([
  "photo_upload",
  "ai_generation_started",
  "outfit_viewed",
  "outfit_saved",
  "color_favorited",
  "try_on_completed",
  "shopping_click",
  "conversion",
  "subscription_started",
]);

/** Minimal, privacy-conscious event tracker (section 29) — no unnecessary PII collected. */
export async function POST(req: Request) {
  const limit = checkRateLimit(rateLimitKeyFromRequest(req, "analytics"), 60, 60_000);
  if (!limit.success) return NextResponse.json({ ok: false }, { status: 429 });

  try {
    const body = eventSchema.parse(await req.json());
    if (!ALLOWED_EVENTS.has(body.event)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const user = await getCurrentUser();
    await db.analyticsEvent.create({
      data: { userId: user?.id, sessionId: body.sessionId, event: body.event, metadata: body.metadata as object },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
