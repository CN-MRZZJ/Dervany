import { request } from "./client";

export type EventInfo = {
  id: number;
  name: string;
  category: string;
  gender: string;
  group: string;
  event_type: string;
  scoring_strategy: string;
  is_individual: number;
};

export function queryEvents() {
  return request<{ items: EventInfo[]; total: number }>("/events");
}

// --- progress ---

export type SessionProgress = {
  id: number;
  name: string;
  category: string;
  category_text: string;
  event_type: string;
  gender: string;
  gender_text: string;
  group: string;
  group_text: string;
  scoring_strategy: string;
  is_individual: number;
  checkin_done: number;
  competition_done: number;
  record_done: number;
  publish_done: number;
  updated_at: string;
};

export function queryEventProgress() {
  return request<{ items: SessionProgress[]; total: number }>("/events/progress");
}

export function updateProgressForm(body: {
  event_id: number;
  checkin_done?: boolean;
  competition_done?: boolean;
  record_done?: boolean;
  publish_done?: boolean;
}) {
  return request<{ ok: true }>("/events/progress/update", { method: "POST", body: JSON.stringify(body) });
}

export function updateProgress(eventId: number, body: {
  checkin_done?: boolean;
  competition_done?: boolean;
  record_done?: boolean;
  publish_done?: boolean;
}) {
  return request<{ ok: true }>(`/events/${eventId}/progress`, { method: "PUT", body: JSON.stringify(body) });
}
