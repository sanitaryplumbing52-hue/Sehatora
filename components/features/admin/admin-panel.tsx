"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "./users-tab";
import { ClothingTab } from "./clothing-tab";
import { ColorsTab } from "./colors-tab";
import { OutfitsTab } from "./outfits-tab";
import { StyleRulesTab } from "./style-rules-tab";
import { SettingsTab } from "./settings-tab";
import { ProductsTab } from "./products-tab";
import { BlogTab } from "./blog-tab";
import { AnalyticsTab } from "./analytics-tab";

const TABS = [
  { value: "analytics", label: "Analytics", component: AnalyticsTab },
  { value: "users", label: "Users", component: UsersTab },
  { value: "clothing", label: "Clothing", component: ClothingTab },
  { value: "colors", label: "Colors", component: ColorsTab },
  { value: "outfits", label: "Outfits", component: OutfitsTab },
  { value: "rules", label: "Style Rules", component: StyleRulesTab },
  { value: "settings", label: "AI Settings", component: SettingsTab },
  { value: "products", label: "Products", component: ProductsTab },
  { value: "blog", label: "Blog", component: BlogTab },
];

export function AdminPanel() {
  return (
    <Tabs defaultValue="analytics">
      <TabsList className="flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <tab.component />
        </TabsContent>
      ))}
    </Tabs>
  );
}
