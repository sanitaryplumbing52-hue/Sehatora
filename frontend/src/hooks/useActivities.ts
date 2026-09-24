import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { Activity, Paginated } from "@/types";

export function useActivityFeed(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ["activity-feed", params],
    queryFn: () => api.get<Paginated<Activity>>("/activities/", { params }).then((r) => r.data),
  });
}
