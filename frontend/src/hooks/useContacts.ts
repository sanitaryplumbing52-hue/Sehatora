import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { contactsApi, ListParams } from "@/api/resources";
import type { Contact } from "@/types";

export function useContacts(params?: ListParams) {
  return useQuery({ queryKey: ["contacts", params], queryFn: () => contactsApi.list(params) });
}

export function useContact(id?: string) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsApi.retrieve(id as string),
    enabled: Boolean(id),
  });
}

export function useContactTimeline(id?: string) {
  return useQuery({
    queryKey: ["contacts", id, "timeline"],
    queryFn: () => contactsApi.timeline(id as string),
    enabled: Boolean(id),
  });
}

export function useContactDeals(id?: string) {
  return useQuery({
    queryKey: ["contacts", id, "deals"],
    queryFn: () => contactsApi.deals(id as string),
    enabled: Boolean(id),
  });
}

export function useContactTasks(id?: string) {
  return useQuery({
    queryKey: ["contacts", id, "tasks"],
    queryFn: () => contactsApi.tasks(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Contact>) => contactsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created");
    },
    onError: () => toast.error("Could not create contact"),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Contact> }) => contactsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts", variables.id] });
      toast.success("Contact updated");
    },
    onError: () => toast.error("Could not update contact"),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: () => toast.error("Could not delete contact"),
  });
}
