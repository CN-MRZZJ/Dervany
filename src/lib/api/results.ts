import { request } from "./client";

export type ResultRecord = {
  id: number;
  event_name: string;
  category: string;
  scoring_strategy: string;
  group: string;
  result_type: string;
  athlete_type: string;
  target_name: string;
  department_name: string;
  rank: number;
  points: number;
  performance: string;
  entered_by: string;
  created_at: string;
};

export function queryResults(params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  department_name?: string;
  gender?: string;
  group?: string;
  category?: string;
  scoring_strategy?: string;
  sort_by?: string;
  sort_dir?: string;
}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  return request<{ items: ResultRecord[]; total: number }>(`/results?${q.toString()}`);
}

export function submitResult(body: {
  event_id: number;
  athlete_id?: number;
  athlete_no?: string;
  athlete_type?: string;
  entered_by?: string;
  performance?: string;
  rank?: number;
  team_id?: number;
}) {
  return request<{ ok: true }>("/results", { method: "POST", body: JSON.stringify(body) });
}

// --- attempts ---

export type AttemptRecord = {
  id: number;
  attempt_number: number;
  rank: number;
  performance: string;
  is_void: number;
  created_at: string;
};

export function queryAttempts(params: {
  event_id: number;
  athlete_type?: string;
  athlete_ref_id?: number;
  team_id?: number;
}) {
  const q = new URLSearchParams();
  q.set("event_id", String(params.event_id));
  if (params.athlete_type) q.set("athlete_type", params.athlete_type);
  if (params.athlete_ref_id) q.set("athlete_ref_id", String(params.athlete_ref_id));
  if (params.team_id) q.set("team_id", String(params.team_id));
  return request<{ items: AttemptRecord[]; total: number }>(`/attempts?${q.toString()}`);
}

export function voidAttempt(attemptId: number, isVoid: boolean) {
  return request<{ ok: true; attempt_id: number; is_void: boolean }>(
    `/attempts/${attemptId}/void`,
    { method: "PUT", body: JSON.stringify({ is_void: isVoid }) }
  );
}
