import { parseContent, serviceSchema, type Service } from "./schema";
import { z } from "zod";

/** COPY.md §6 "Engagement models". No price column in v1, per COPY.md. */
export const services: Service[] = parseContent(
  z.array(serviceSchema),
  [
    { id: "mvp-build", name: "MVP build", shape: "Scope, architecture, shippable v1", timeline: "8–16 weeks" },
    { id: "embedded-team", name: "Embedded team", shape: "Roadmap delivery with your PMs", timeline: "Ongoing" },
    { id: "stabilise-scale", name: "Stabilise and scale", shape: "Performance, reliability, maintainability", timeline: "As needed" },
  ],
  "services.ts",
);
