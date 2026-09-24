import { api } from "@/api/client";
import type {
  Activity,
  Company,
  Contact,
  DashboardSummary,
  Deal,
  Lead,
  Notification,
  Paginated,
  Pipeline,
  Task,
  Tag,
  User,
} from "@/types";

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

const list = <T>(url: string) => (params?: ListParams) => api.get<Paginated<T>>(url, { params }).then((r) => r.data);
const retrieve = <T>(url: string) => (id: string) => api.get<T>(`${url}${id}/`).then((r) => r.data);
const create = <T>(url: string) => (payload: Partial<T>) => api.post<T>(url, payload).then((r) => r.data);
const update = <T>(url: string) => (id: string, payload: Partial<T>) =>
  api.patch<T>(`${url}${id}/`, payload).then((r) => r.data);
const remove = (url: string) => (id: string) => api.delete(`${url}${id}/`);

export const contactsApi = {
  list: list<Contact>("/contacts/"),
  retrieve: retrieve<Contact>("/contacts/"),
  create: create<Contact>("/contacts/"),
  update: update<Contact>("/contacts/"),
  remove: remove("/contacts/"),
  timeline: (id: string) => api.get<Activity[]>(`/contacts/${id}/timeline/`).then((r) => r.data),
  deals: (id: string) => api.get<Deal[]>(`/contacts/${id}/deals/`).then((r) => r.data),
  tasks: (id: string) => api.get<Task[]>(`/contacts/${id}/tasks/`).then((r) => r.data),
};

export const companiesApi = {
  list: list<Company>("/companies/"),
  retrieve: retrieve<Company>("/companies/"),
  create: create<Company>("/companies/"),
  update: update<Company>("/companies/"),
  remove: remove("/companies/"),
  timeline: (id: string) => api.get<Activity[]>(`/companies/${id}/timeline/`).then((r) => r.data),
};

export const leadsApi = {
  list: list<Lead>("/leads/"),
  retrieve: retrieve<Lead>("/leads/"),
  create: create<Lead>("/leads/"),
  update: update<Lead>("/leads/"),
  remove: remove("/leads/"),
  convertToDeal: (id: string, payload: Record<string, unknown>) =>
    api.post<Deal>(`/leads/${id}/convert_to_deal/`, payload).then((r) => r.data),
  scoreEvent: (id: string, eventType: string) =>
    api.post<Lead>(`/leads/${id}/score-event/`, { event_type: eventType }).then((r) => r.data),
};

export const dealsApi = {
  list: list<Deal>("/deals/"),
  retrieve: retrieve<Deal>("/deals/"),
  create: create<Deal>("/deals/"),
  update: update<Deal>("/deals/"),
  remove: remove("/deals/"),
  kanban: (pipelineId?: string) =>
    api.get<{ pipeline: Pipeline; stages: (Pipeline["stages"][number] & { deals: Deal[]; total_value: number })[] }>(
      "/deals/kanban/",
      { params: pipelineId ? { pipeline: pipelineId } : undefined }
    ).then((r) => r.data),
  moveStage: (id: string, stageId: string, lostReason?: string) =>
    api.post<Deal>(`/deals/${id}/move-stage/`, { stage: stageId, lost_reason: lostReason }).then((r) => r.data),
  timeline: (id: string) => api.get<Activity[]>(`/deals/${id}/timeline/`).then((r) => r.data),
};

export const pipelinesApi = {
  list: () => api.get<Paginated<Pipeline>>("/deals/pipelines/", { params: { page_size: 100 } }).then((r) => r.data.results),
  create: create<Pipeline>("/deals/pipelines/"),
};

export const stagesApi = {
  create: create<Pipeline["stages"][number]>("/deals/stages/"),
  update: update<Pipeline["stages"][number]>("/deals/stages/"),
  remove: remove("/deals/stages/"),
};

export const tasksApi = {
  list: list<Task>("/tasks/"),
  retrieve: retrieve<Task>("/tasks/"),
  create: create<Task>("/tasks/"),
  update: update<Task>("/tasks/"),
  remove: remove("/tasks/"),
  kanban: (params?: ListParams) =>
    api.get<{ status: string; label: string; tasks: Task[] }[]>("/tasks/kanban/", { params }).then((r) => r.data),
  complete: (id: string) => api.post<Task>(`/tasks/${id}/complete/`).then((r) => r.data),
};

export const activitiesApi = {
  create: (payload: { entity_type: string; entity_id: string; activity_type: string; title: string; description?: string }) =>
    api.post<Activity>("/activities/", payload).then((r) => r.data),
};

export const notificationsApi = {
  list: () => api.get<Paginated<Notification>>("/notifications/", { params: { page_size: 20 } }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread_count/").then((r) => r.data.count),
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/mark_read/`).then((r) => r.data),
  markAllRead: () => api.post("/notifications/mark-all-read/"),
};

export const dashboardApi = {
  summary: (range: string, start?: string, end?: string) =>
    api
      .get<DashboardSummary>("/dashboard/summary/", { params: { range, start, end } })
      .then((r) => r.data),
};

export const tagsApi = {
  list: () => api.get<Paginated<Tag>>("/tags/", { params: { page_size: 100 } }).then((r) => r.data.results),
  create: create<Tag>("/tags/"),
};

export const usersApi = {
  list: () => api.get<Paginated<User>>("/auth/users/", { params: { page_size: 100 } }).then((r) => r.data.results),
  create: create<User>("/auth/users/"),
  update: update<User>("/auth/users/"),
};

export const searchApi = {
  global: (q: string) =>
    api
      .get<{ contacts: Contact[]; companies: Company[]; leads: Lead[]; deals: Deal[]; tasks: Task[] }>("/search/", {
        params: { q },
      })
      .then((r) => r.data),
};
