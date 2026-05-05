import { request } from "./client";

export type EventType = {
  code: string;
  name: string;
  scoring_strategy: string;
};

export function queryEventTypes() {
  return request<{ items: EventType[]; total: number }>("/event-types");
}

export function createEventType(body: { code: string; name: string; scoring_strategy: string }) {
  return request<{ ok: true; code: string }>("/event-types", { method: "POST", body: JSON.stringify(body) });
}

export function updateEventType(code: string, body: { name?: string; scoring_strategy?: string }) {
  return request<{ ok: true; code: string }>(`/event-types/${code}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteEventType(code: string) {
  return request<{ ok: true; deleted: string }>(`/event-types/${code}`, { method: "DELETE" });
}
