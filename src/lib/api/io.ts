import { request, fetchBlob, BASE } from "./client";

// --- notices ---

export function previewPersonalPdf(eventId: number, templateName: string) {
  return `${BASE}/notices/personal-result.pdf?event_id=${eventId}&template_name=${templateName}`;
}

export function previewTeamPdf(eventId: number, templateName: string) {
  return `${BASE}/notices/team-result.pdf?event_id=${eventId}&template_name=${templateName}`;
}

export function exportPersonalXlsx(eventId: number, templateName: string) {
  return `${BASE}/notices/personal-result.xlsx?event_id=${eventId}&template_name=${templateName}`;
}

export function exportTeamXlsx(eventId: number, templateName: string) {
  return `${BASE}/notices/team-result.xlsx?event_id=${eventId}&template_name=${templateName}`;
}

// --- imports ---

export function importAthletesCsv(athleteType: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ ok: true }>(`/imports/athletes/${athleteType}`, {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function importEventsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ ok: true }>("/imports/events", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function importRegistrationsCsv(targetCategory: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ ok: true }>(`/imports/registrations/${targetCategory}`, {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function setupMeetDate(meetDate: string) {
  return request<{ ok: true }>("/imports/setup", {
    method: "POST",
    body: JSON.stringify({ meet_date: meetDate }),
  });
}

export function downloadRegistrationTemplate(category: string) {
  return `${BASE}/imports/registrations/template?category=${category}`;
}

export function downloadImportTemplate(name: string) {
  return `${BASE}/imports/templates/${name}`;
}

// --- attempt notices ---

export function previewPersonalAttemptPdf(eventId: number, templateName: string, attemptNumber: number) {
  return `${BASE}/notices/personal-attempt.pdf?event_id=${eventId}&template_name=${templateName}&attempt_number=${attemptNumber}`;
}

export function previewTeamAttemptPdf(eventId: number, templateName: string, attemptNumber: number) {
  return `${BASE}/notices/team-attempt.pdf?event_id=${eventId}&template_name=${templateName}&attempt_number=${attemptNumber}`;
}

export function exportPersonalAttemptXlsx(eventId: number, templateName: string, attemptNumber: number) {
  return `${BASE}/notices/personal-attempt.xlsx?event_id=${eventId}&template_name=${templateName}&attempt_number=${attemptNumber}`;
}

export function exportTeamAttemptXlsx(eventId: number, templateName: string, attemptNumber: number) {
  return `${BASE}/notices/team-attempt.xlsx?event_id=${eventId}&template_name=${templateName}&attempt_number=${attemptNumber}`;
}

// --- exports ---

export function exportViewCsv(view: string, params?: Record<string, string>) {
  const q = new URLSearchParams(params);
  return `${BASE}/exports/${view}?${q.toString()}`;
}

