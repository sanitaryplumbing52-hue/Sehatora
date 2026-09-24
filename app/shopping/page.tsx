import type { Metadata } from "next";
import { ShoppingView } from "@/components/features/shopping-view";

export const metadata: Metadata = {
  title: "Shopping",
  description: "Shop outfit recommendations by budget, brand, and color.",
};

export default function ShoppingPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold">Shopping</h1>
        <p className="mt-3 text-muted-foreground">Filter by budget and shop pieces that match your recommendations.</p>
      </div>
      <div className="mt-10">
        <ShoppingView />
      </div>
    </div>
  );
}
