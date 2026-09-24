import { PageHeader } from "@/components/PageHeader";
import { Timeline } from "@/components/Timeline";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActivityFeed } from "@/hooks/useActivities";

export function ActivitiesPage() {
  const { data, isLoading } = useActivityFeed({ page_size: 50 });

  return (
    <div>
      <PageHeader title="Activities" description="Every touchpoint across contacts, companies, leads and deals" />
      <div className="px-4 md:px-6 pb-10">
        <Card>
          <CardContent>{isLoading ? <Skeleton className="h-64" /> : <Timeline activities={data?.results} />}</CardContent>
        </Card>
      </div>
    </div>
  );
}
