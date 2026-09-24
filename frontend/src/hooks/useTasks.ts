import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { ListParams, tasksApi } from "@/api/resources";
import type { Task } from "@/types";

export function useTasks(params?: ListParams) {
  return useQuery({ queryKey: ["tasks", params], queryFn: () => tasksApi.list(params) });
}

export function useTasksKanban(params?: ListParams) {
  return useQuery({ queryKey: ["tasks", "kanban", params], queryFn: () => tasksApi.kanban(params) });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Task>) => tasksApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: () => toast.error("Could not create task"),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) => tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: () => toast.error("Could not update task"),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task completed");
    },
    onError: () => toast.error("Could not complete task"),
  });
}
