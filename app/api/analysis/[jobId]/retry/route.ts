import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { processAnalysisJob } from "@/lib/jobs/analysis-job";

export async function POST(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const user = await requireUser();
    const job = await db.aIGeneration.findFirst({ where: { id: jobId, userId: user.id } });
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

    await db.aIGeneration.update({ where: { id: job.id }, data: { status: "QUEUED", errorMessage: null } });
    void processAnalysisJob(job.id);

    return apiOk({ jobId: job.id, status: "QUEUED" });
  } catch (err) {
    return apiError(err);
  }
}
