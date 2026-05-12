import { request } from "./client";

export function advanceRound(
  eventId: number,
  roundId: number,
  body: {
    strategy?: string;
    lanes_per_heat?: number;
    algorithm?: string;
    params?: Record<string, unknown>;
  }
) {
  return request<{
    ok: true;
    round_id: number;
    round_name: string;
    qualified: number;
  }>(
    `/events/${eventId}/rounds/${roundId}/advance`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function listAdvancementStrategies() {
  return request<{ strategies: string[] }>(
    "/events/advancement-strategies"
  );
}
