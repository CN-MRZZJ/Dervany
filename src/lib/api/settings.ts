import { request, BASE } from "./client";

export type SystemStatus = {
  ok: boolean;
  completed: boolean;
  checks: { key: string; label: string; ok: boolean; detail: string }[];
  summary: { event_count: number; athlete_count: number; department_count: number };
};

export function queryStatus() {
  return request<SystemStatus>("/status");
}

export function saveReportEnv(body: {
  date?: string;
  weather?: string;
  temperature_high?: string;
  temperature_low?: string;
  wind_direction?: string;
  wind_speed?: string;
  air_quality?: string;
}) {
  return request<{ ok: true }>("/settings/report-environment", { method: "POST", body: JSON.stringify(body) });
}

export function clearData(body: {
  tables: string[];
  confirm_text: string;
  confirm_code: string;
  acknowledged: boolean;
}) {
  return request<{ ok: true }>("/maintenance/clear-data", { method: "POST", body: JSON.stringify(body) });
}
