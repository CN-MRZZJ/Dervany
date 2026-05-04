import { request } from "./client";

export type Athlete = {
  athlete_no: string;
  name: string;
  athlete_type: string;
  gender: string;
  age_group: string;
  department_name: string;
  athlete_ref_id: number;
  registered_events: string;
  registration_count: number;
};

export function queryAthletes(params: {
  athlete_type?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  if (params.athlete_type) q.set("athlete_type", params.athlete_type);
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  return request<{ items: Athlete[]; total: number; page: number; page_size: number }>(`/athletes?${q.toString()}`);
}

export function addAthlete(body: {
  athlete_type: string;
  athlete_no: string;
  name: string;
  gender: string;
  department_name: string;
  age_group?: string;
}) {
  return request<{ ok: true }>("/athletes", { method: "POST", body: JSON.stringify(body) });
}

export function deleteAthleteForm(body: { athlete_type: string; athlete_no: string }) {
  return request<{ ok: true }>("/athletes/delete", { method: "POST", body: JSON.stringify(body) });
}

export function deleteAthlete(athleteType: string, athleteNo: string) {
  return request<{ ok: true }>(`/athletes/${athleteType}/${athleteNo}`, { method: "DELETE" });
}

// --- registrations ---

export function queryRegisteredEvents(athleteType: string, athleteNo: string) {
  return request<{ items: { id: number; name: string; label: string; gender: string; age_group: string }[]; total: number }>(
    `/athletes/registered-events?athlete_type=${athleteType}&athlete_no=${athleteNo}`
  );
}

export function addRegistrationForm(body: { athlete_type: string; athlete_no: string; event_id: number }) {
  return request<{ ok: true }>("/athletes/registrations/add", { method: "POST", body: JSON.stringify(body) });
}

export function removeRegistrationForm(body: { athlete_type: string; athlete_no: string; event_id: number }) {
  return request<{ ok: true }>("/athletes/registrations/remove", { method: "POST", body: JSON.stringify(body) });
}

export function queryRegistrations(athleteType: string, athleteNo: string) {
  return request<{ items: { id: number; name: string; label: string; gender: string; age_group: string }[]; total: number }>(
    `/athletes/${athleteType}/${athleteNo}/registrations`
  );
}

export function addRegistration(athleteType: string, athleteNo: string, eventId: number) {
  return request<{ ok: true }>(
    `/athletes/${athleteType}/${athleteNo}/registrations/${eventId}`,
    { method: "POST" }
  );
}

export function deleteRegistration(athleteType: string, athleteNo: string, eventId: number) {
  return request<{ ok: true }>(
    `/athletes/${athleteType}/${athleteNo}/registrations/${eventId}`,
    { method: "DELETE" }
  );
}
