import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getStorageProvider, buildPhotoKey } from "@/lib/storage";
import { validateImageFile, assessImageQuality } from "@/lib/pipeline/steps";
import { PipelineError } from "@/lib/pipeline/types";
import { apiError, apiOk } from "@/lib/api-response";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const limit = checkRateLimit(rateLimitKeyFromRequest(req, `upload:${user.id}`), 20, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
    }

    const form = await req.formData();
    const file = form.get("photo");
    const consent = form.get("consent");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose a photo to upload." }, { status: 400 });
    }
    if (consent !== "true") {
      return NextResponse.json({ error: "Please confirm consent before we can process your photo." }, { status: 400 });
    }

    validateImageFile({ type: file.type, size: file.size });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { width, height } = await assessImageQuality(buffer);

    const storage = getStorageProvider();
    const key = buildPhotoKey(user.id, file.name);
    await storage.putObject(key, buffer, file.type);
    const url = await storage.getSignedReadUrl(key, 3600);

    const photo = await db.photo.create({
      data: {
        userId: user.id,
        storageKey: key,
        url,
        width,
        height,
        status: "VALIDATED",
        consentGiven: true,
      },
    });

    return apiOk({ photoId: photo.id, url });
  } catch (err) {
    if (err instanceof PipelineError) {
      return NextResponse.json({ error: err.userMessage }, { status: 422 });
    }
    return apiError(err);
  }
}
