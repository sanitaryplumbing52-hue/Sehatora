import { useQuery } from "@tanstack/react-query";

import { searchApi } from "@/api/resources";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: () => searchApi.global(query),
    enabled: query.trim().length > 1,
  });
}
