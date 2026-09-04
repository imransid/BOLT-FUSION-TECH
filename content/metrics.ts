import { metricSchema, parseContent, type Metric } from "./schema";
import { z } from "zod";

/**
 * COPY.md §3 "Metric band". Every row carries its status verbatim from the
 * approved table. Nothing here is rounded, reformatted, or added.
 */
export const metrics: Metric[] = parseContent(
  z.array(metricSchema),
  [
    {
      id: "search-response",
      value: "<100ms",
      label: "Search response, 80% of traffic",
      status: "shipped",
      source: "Restaurant discovery platform",
      href: "/work/restaurant-search",
    },
    {
      id: "cost-per-query",
      value: "~$0.001",
      label: "Average cost per AI query",
      status: "shipped",
      source: "Restaurant discovery platform",
      href: "/work/restaurant-search",
    },
    {
      id: "haiku-routing",
      value: "~90%",
      label: "Of AI calls routed to Haiku, not a frontier model",
      status: "shipped",
      source: "Restaurant discovery platform",
      href: "/work/restaurant-search",
    },
    {
      id: "first-reply",
      value: "<60s",
      label: "First reply to every inbound lead",
      status: "target",
      source: "WarmChats",
      href: "/work/warmchats",
    },
  ],
  "metrics.ts",
);
