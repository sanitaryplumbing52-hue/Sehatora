import { Rocket } from "lucide-react";
import { useLocation } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NAV_ITEMS } from "@/utils/nav";

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) => n.path === pathname);

  return (
    <div>
      <PageHeader title={item?.label ?? "Coming soon"} description="Part of the Sehatora CRM roadmap" />
      <EmptyState
        icon={item?.icon ?? Rocket}
        title={`${item?.label ?? "This module"} ships in Phase 2`}
        description="Phase 1 shipped the core CRM: contacts, companies, leads, deals, pipelines, tasks, activities and the dashboard. This module is designed into the architecture (data model, sidebar, API namespace) and is next on the roadmap -- see docs/ROADMAP.md."
      />
    </div>
  );
}
