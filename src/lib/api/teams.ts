import { request } from "./client";

export type Team = {
  id: number;
  team_name: string;
  department_name: string;
  event_name: string;
  event_id: number;
  gender: string;
  age_group: string;
  member_count: number;
  members_summary: string;
};

export function queryTeams(params: { keyword?: string; department_name?: string; event_id?: number }) {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.department_name) q.set("department_name", params.department_name);
  if (params.event_id) q.set("event_id", String(params.event_id));
  return request<{ items: Team[]; total: number }>(`/teams?${q.toString()}`);
}

export function addTeam(body: { department_name: string; event_id: number; team_name: string }) {
  return request<{ ok: true }>("/teams", { method: "POST", body: JSON.stringify(body) });
}

export function batchAddTeams(body: { event_id: number; department_names: string[] }) {
  return request<{ ok: true }>("/teams/batch-add", { method: "POST", body: JSON.stringify(body) });
}

export function deleteTeamForm(body: { team_id: number }) {
  return request<{ ok: true }>("/teams/delete", { method: "POST", body: JSON.stringify(body) });
}

export function deleteTeam(teamId: number) {
  return request<{ ok: true }>(`/teams/${teamId}`, { method: "DELETE" });
}

// --- members ---

export function queryTeamMembers(teamId: number) {
  return request<{ items: { athlete_type: string; athlete_no: string; name: string }[]; total: number }>(
    `/teams/members?team_id=${teamId}`
  );
}

export function addTeamMemberForm(body: { team_id: number; athlete_type: string; athlete_no: string }) {
  return request<{ ok: true }>("/teams/members/add", { method: "POST", body: JSON.stringify(body) });
}

export function removeTeamMemberForm(body: { team_id: number; athlete_type: string; athlete_no: string }) {
  return request<{ ok: true }>("/teams/members/remove", { method: "POST", body: JSON.stringify(body) });
}

export function addTeamMember(teamId: number, athleteType: string, athleteNo: string) {
  return request<{ ok: true }>(`/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ athlete_type: athleteType, athlete_no: athleteNo }),
  });
}

export function deleteTeamMember(teamId: number, athleteType: string, athleteNo: string) {
  return request<{ ok: true }>(`/teams/${teamId}/members`, {
    method: "DELETE",
    body: JSON.stringify({ athlete_type: athleteType, athlete_no: athleteNo }),
  });
}
