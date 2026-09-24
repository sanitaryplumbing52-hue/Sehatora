import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { leadsApi, ListParams } from "@/api/resources";
import type { Lead } from "@/types";

export function useLeads(params?: ListParams) {
  return useQuery({ queryKey: ["leads", params], queryFn: () => leadsApi.list(params) });
}

export function useLead(id?: string) {
  return useQuery({ queryKey: ["leads", id], queryFn: () => leadsApi.retrieve(id as string), enabled: Boolean(id) });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Lead>) => leadsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created");
    },
    onError: () => toast.error("Could not create lead"),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Lead> }) => leadsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated");
    },
    onError: () => toast.error("Could not update lead"),
  });
}

export function useConvertLeadToDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: Record<string, unknown> }) =>
      leadsApi.convertToDeal(id, payload ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Lead converted to deal");
    },
    onError: () => toast.error("Could not convert lead"),
  });
}
