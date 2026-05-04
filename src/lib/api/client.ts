const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api/v1";

export type ApiError = { ok: false; error: string };

export async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T & { ok: true }> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers: Record<string, string> = {};
  if (init?.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  Object.assign(headers, init?.headers);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error as string;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchBlob(path: string): Promise<Blob> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.blob();
}

export { BASE };
