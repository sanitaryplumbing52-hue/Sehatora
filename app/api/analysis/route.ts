import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { checkAndReserveGeneration } from "@/lib/usage";
import { createAnalysisJob, processAnalysisJob } from "@/lib/jobs/analysis-job";

const bodySchema = z.object({ photoId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { photoId } = bodySchema.parse(await req.json());

    const photo = await db.photo.findFirst({ where: { id: photoId, userId: user.id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const quota = await checkAndReserveGeneration(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "You've reached your monthly generation limit on the Free plan. Upgrade to Pro for more." },
        { status: 402 }
      );
    }

    const job = await createAnalysisJob(user.id, photoId);
    // Fire-and-forget in a persistent Node server; swap for a real queue
    // worker (BullMQ/Inngest/QStash) in a serverless deployment.
    void processAnalysisJob(job.id);

    return apiOk({ jobId: job.id, status: "QUEUED" });
  } catch (err) {
    return apiError(err);
  }
}
