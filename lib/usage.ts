import { db } from "@/lib/db";
import { FREE_PLAN_MONTHLY_GENERATIONS } from "@/lib/constants";

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function checkAndReserveGeneration(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (subscription?.plan === "PRO" && subscription.status === "ACTIVE") {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  const periodKey = currentPeriodKey();
  const counter = await db.usageCounter.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    update: {},
    create: { userId, periodKey, generationsUsed: 0, generationsLimit: FREE_PLAN_MONTHLY_GENERATIONS },
  });

  if (counter.generationsUsed >= counter.generationsLimit) {
    return { allowed: false, remaining: 0, limit: counter.generationsLimit };
  }

  await db.usageCounter.update({
    where: { id: counter.id },
    data: { generationsUsed: { increment: 1 } },
  });

  return { allowed: true, remaining: counter.generationsLimit - counter.generationsUsed - 1, limit: counter.generationsLimit };
}
