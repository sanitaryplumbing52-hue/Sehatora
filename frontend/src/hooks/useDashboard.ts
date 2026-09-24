import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/api/resources";

export function useDashboardSummary(range: string, start?: string, end?: string) {
  return useQuery({
    queryKey: ["dashboard-summary", range, start, end],
    queryFn: () => dashboardApi.summary(range, start, end),
  });
}
