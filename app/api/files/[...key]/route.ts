import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getLocalStorageProvider, verifyLocalToken } from "@/lib/storage";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Serves locally-stored photos (DEMO MODE / no S3 configured) behind a
 * signed, time-limited token AND an ownership check — mirroring what an S3
 * pre-signed URL + bucket policy enforces in production. Never lists or
 * serves a file without both a valid token and a matching Photo record
 * owned by the requesting user (section 14, PHOTO PRIVACY).
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await params;
  const key = decodeURIComponent(keyParts.join("/"));
  const token = new URL(req.url).searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Missing access token." }, { status: 401 });

  const { key: signedKey, valid } = verifyLocalToken(token);
  if (!valid || signedKey !== key) {
    return NextResponse.json({ error: "This link has expired." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const photo = await db.photo.findFirst({ where: { storageKey: key } });
  if (photo && photo.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You don't have access to this file." }, { status: 403 });
  }

  try {
    const provider = getLocalStorageProvider();
    const buffer = await provider.readObject(key);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
