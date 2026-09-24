import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { processTryOnJob } from "@/lib/jobs/tryon-job";

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const user = await requireUser();
    const session = await db.tryOnSession.findFirst({ where: { id: sessionId, userId: user.id } });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    return apiOk({
      sessionId: session.id,
      status: session.status,
      resultImageUrl: session.resultImageUrl,
      error: session.errorMessage,
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const user = await requireUser();
    const session = await db.tryOnSession.findFirst({ where: { id: sessionId, userId: user.id } });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    await db.tryOnSession.update({ where: { id: session.id }, data: { status: "QUEUED", errorMessage: null } });
    void processTryOnJob(session.id);

    return apiOk({ sessionId: session.id, status: "QUEUED" });
  } catch (err) {
    return apiError(err);
  }
}
