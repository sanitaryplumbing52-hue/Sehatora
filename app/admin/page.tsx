import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AdminPanel } from "@/components/features/admin/admin-panel";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="container py-16">
      <h1 className="font-serif text-3xl font-semibold">Admin Panel</h1>
      <p className="mt-2 text-muted-foreground">Manage catalog, users, AI settings, content, and analytics.</p>
      <div className="mt-10">
        <AdminPanel />
      </div>
    </div>
  );
}
