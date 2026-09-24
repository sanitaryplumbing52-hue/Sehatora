import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { companiesApi, ListParams } from "@/api/resources";
import type { Company } from "@/types";

export function useCompanies(params?: ListParams) {
  return useQuery({ queryKey: ["companies", params], queryFn: () => companiesApi.list(params) });
}

export function useCompany(id?: string) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companiesApi.retrieve(id as string),
    enabled: Boolean(id),
  });
}

export function useCompanyTimeline(id?: string) {
  return useQuery({
    queryKey: ["companies", id, "timeline"],
    queryFn: () => companiesApi.timeline(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Company>) => companiesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created");
    },
    onError: () => toast.error("Could not create company"),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Company> }) => companiesApi.update(id, payload),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["companies", variables.id] });
      toast.success("Company updated");
    },
    onError: () => toast.error("Could not update company"),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: () => toast.error("Could not delete company"),
  });
}
