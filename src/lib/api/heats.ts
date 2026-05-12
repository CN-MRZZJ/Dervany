import { request } from "./client";

export type HeatEntry = {
  id: number;
  heat_id: number;
  athlete_type: string;
  athlete_ref_id: number;
  athlete_name: string;
  athlete_no: string;
  department_name: string;
  group: string;
  lane: number | null;
  team_id: number | null;
};

export type HeatInfo = {
  id: number;
  round_id: number;
  heat_number: number;
  heat_name: string;
  entries: HeatEntry[];
};

export type RoundHeats = {
  id: number;
  event_id: number;
  round_number: number;
  round_name: string;
  advancement_rule: string | null;
  created_at: string;
  heats: HeatInfo[];
};

export type HeatsData = {
  event_id: number;
  rounds: RoundHeats[];
};

export type UnassignedAthlete = {
  athlete_id: number;
  athlete_name: string;
  athlete_no: string;
  athlete_type: string;
  department_name: string;
  group: string;
};

export function configHeatRounds(eventId: number, body: { heat_rounds: number }) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats/config`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export function generateHeats(
  eventId: number,
  body: {
    lanes_per_heat?: number;
    algorithm?: string;
    params?: Record<string, unknown>;
  }
) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function queryHeats(eventId: number) {
  return request<{ ok: true; data: HeatsData }>(`/events/${eventId}/heats`);
}

export function clearHeats(eventId: number) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats`,
    { method: "DELETE" }
  );
}

export function queryUnassignedParticipants(eventId: number) {
  return request<{ items: UnassignedAthlete[]; total: number }>(
    `/events/${eventId}/unassigned-participants`
  );
}

export function addHeatEntry(
  eventId: number,
  heatId: number,
  body: { athlete_id: number; athlete_type: string; lane?: number | null }
) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats/${heatId}/entries`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function removeHeatEntry(eventId: number, heatId: number, entryId: number) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats/${heatId}/entries/${entryId}`,
    { method: "DELETE" }
  );
}

export function updateHeatEntry(
  eventId: number,
  heatId: number,
  entryId: number,
  body: { heat_id?: number; lane?: number | null }
) {
  return request<{ ok: true }>(
    `/events/${eventId}/heats/${heatId}/entries/${entryId}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export function listAlgorithms() {
  return request<{ algorithms: string[] }>("/events/heats/algorithms");
}
