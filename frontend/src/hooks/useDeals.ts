import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { dealsApi, pipelinesApi } from "@/api/resources";
import type { Deal } from "@/types";

export function usePipelines() {
  return useQuery({ queryKey: ["pipelines"], queryFn: pipelinesApi.list });
}

export function useDealsKanban(pipelineId?: string) {
  return useQuery({
    queryKey: ["deals", "kanban", pipelineId],
    queryFn: () => dealsApi.kanban(pipelineId),
  });
}

export function useDeal(id?: string) {
  return useQuery({ queryKey: ["deals", id], queryFn: () => dealsApi.retrieve(id as string), enabled: Boolean(id) });
}

export function useDealTimeline(id?: string) {
  return useQuery({
    queryKey: ["deals", id, "timeline"],
    queryFn: () => dealsApi.timeline(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Deal>) => dealsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created");
    },
    onError: () => toast.error("Could not create deal"),
  });
}

export function useMoveDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId, lostReason }: { id: string; stageId: string; lostReason?: string }) =>
      dealsApi.moveStage(id, stageId, lostReason),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["deals", "kanban"] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: () => toast.error("Could not move deal"),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Deal> }) => dealsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal updated");
    },
    onError: () => toast.error("Could not update deal"),
  });
}
