"use client";

import * as React from "react";
import { queryRules } from "@/lib/api";

export function useGroupLabels() {
  const [map, setMap] = React.useState<Record<string, string>>({});
  const [athleteOptions, setAthleteOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [eventOptions, setEventOptions] = React.useState<{ value: string; label: string }[]>([]);

  React.useEffect(() => {
    queryRules().then((d) => {
      const m: Record<string, string> = {};
      d.config.group_options.athlete.forEach((g) => { m[g.value] = g.label; });
      d.config.group_options.event.forEach((g) => { if (!m[g.value]) m[g.value] = g.label; });
      setMap(m);
      setAthleteOptions(d.config.group_options.athlete);
      setEventOptions(d.config.group_options.event);
    }).catch(() => {});
  }, []);

  const label = React.useCallback((v: string) => map[v] || v, [map]);

  return { label, athleteOptions, eventOptions };
}
