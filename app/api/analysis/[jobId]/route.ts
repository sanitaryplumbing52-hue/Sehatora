import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const user = await requireUser();
    const job = await db.aIGeneration.findFirst({ where: { id: jobId, userId: user.id } });
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

    return apiOk({
      jobId: job.id,
      status: job.status,
      output: job.output,
      error: job.errorMessage,
    });
  } catch (err) {
    return apiError(err);
  }
}
