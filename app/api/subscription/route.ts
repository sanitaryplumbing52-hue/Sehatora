import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const subscription = await db.subscription.findUnique({ where: { userId: user.id } });
    return apiOk({ subscription });
  } catch (err) {
    return apiError(err);
  }
}

const upgradeSchema = z.object({ plan: z.enum(["FREE", "PRO"]) });

/**
 * Plan-change endpoint. In production this only flips local state after a
 * Stripe webhook (`checkout.session.completed` / `customer.subscription.*`)
 * confirms payment — wire that webhook handler at
 * app/api/webhooks/stripe/route.ts and call this same upsert from there.
 * Left as a direct toggle here so PRO features are reachable in DEMO MODE
 * without a payment processor configured.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { plan } = upgradeSchema.parse(await req.json());

    const subscription = await db.subscription.upsert({
      where: { userId: user.id },
      update: { plan, status: "ACTIVE" },
      create: { userId: user.id, plan, status: "ACTIVE" },
    });

    return apiOk({ subscription });
  } catch (err) {
    return apiError(err);
  }
}
