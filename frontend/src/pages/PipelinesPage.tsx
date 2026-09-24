import { Workflow } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePipelines } from "@/hooks/useDeals";

export function PipelinesPage() {
  const { data: pipelines, isLoading } = usePipelines();

  return (
    <div>
      <PageHeader title="Pipelines" description="Every sales process your team runs, each with its own stages" />

      <div className="px-4 md:px-6 pb-10 space-y-4">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : !pipelines?.length ? (
          <EmptyState icon={Workflow} title="No pipelines yet" description="Pipelines are seeded on first setup — see the installation guide." />
        ) : (
          pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader>
                <CardTitle>
                  {pipeline.name} {pipeline.is_default && <Badge tone="primary" className="ml-2">Default</Badge>}
                </CardTitle>
                <span className="text-sm text-muted">
                  {pipeline.stages.reduce((sum, s) => sum + (s.deal_count ?? 0), 0)} deals &middot; {pipeline.total_value?.toLocaleString()} total
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto">
                  {pipeline.stages.map((stage) => (
                    <div key={stage.id} className="w-44 shrink-0 rounded-lg border border-border dark:border-border-dark p-3">
                      <p className="text-sm font-medium text-ink dark:text-slate-100">{stage.name}</p>
                      <p className="text-xs text-muted mt-1">{stage.deal_count ?? 0} deals</p>
                      <p className="text-xs text-muted">{(stage.stage_value ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-muted mt-1">{stage.probability}% probability</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
