"use client";

import dynamic from "next/dynamic";

const SceneBackground = dynamic(
  () => import("./scene-background").then((m) => m.default),
  { ssr: false }
);

export default function LandingScene() {
  return <SceneBackground />;
}
