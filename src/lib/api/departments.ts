import { request } from "./client";

export type Department = {
  id: number;
  name: string;
  total_members: number;
};

export function queryDepartments(params: {
  keyword?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}) {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  if (params.sort_by) q.set("sort_by", params.sort_by);
  if (params.sort_dir) q.set("sort_dir", params.sort_dir);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  return request<{ items: Department[]; total: number; page: number; page_size: number }>(`/departments?${q.toString()}`);
}

export function addDepartment(body: { name: string; total_members?: number }) {
  return request<{ ok: true }>("/departments", { method: "POST", body: JSON.stringify(body) });
}

export function updateDepartment(id: number, body: { name?: string; total_members?: number }) {
  return request<{ ok: true }>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteDepartment(id: number) {
  return request<{ ok: true }>(`/departments/${id}`, { method: "DELETE" });
}

export function deleteDepartmentForm(body: { department_id: number }) {
  return request<{ ok: true }>("/departments/delete", { method: "POST", body: JSON.stringify(body) });
}
