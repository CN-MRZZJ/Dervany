import { request } from "./client";

export type RulesConfig = {
  group_options: {
    athlete: { value: string; label: string }[];
    event: { value: string; label: string }[];
    fallback_label: string;
    team_event_default: string;
  };
  attempt_policy: string;
  event_scoring_strategy: Record<string, string>;
  point_rule: {
    individual: Record<string, number>;
    team: Record<string, number>;
  };
};

export function queryRules() {
  return request<{ config: RulesConfig }>("/rules");
}

export function saveRules(config: RulesConfig) {
  return request<{ ok: true }>("/rules", { method: "PUT", body: JSON.stringify({ config }) });
}
