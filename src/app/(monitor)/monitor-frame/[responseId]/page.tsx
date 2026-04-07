"use client";

/**
 * MonitorFramePage — loaded inside an <iframe> on the faculty results page.
 *
 * Because each iframe has its own JavaScript execution context, the RTKClient
 * singleton inside this page is completely independent from every other iframe.
 * This is the ONLY reliable way to display multiple simultaneous video feeds
 * from different Cloudflare RealtimeKit rooms in the same browser tab.
 *
 * This page renders VideoRTCWidget in teacher (view-only) mode so it:
 *   - Joins the student's room using the tab's own private RTK singleton
 *   - Never publishes camera or mic (teacher is view-only here)
 *   - Fills 100vw × 100vh so the parent <iframe> shows a seamless video tile
 */

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const VideoRTCWidget = dynamic(
  () => import("@/components/video/VideoRTCWidget"),
  { ssr: false, loading: () => null }
);

export default function MonitorFramePage() {
  const { responseId } = useParams() as { responseId: string };

  if (!responseId) return null;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#111",
      }}
    >
      <VideoRTCWidget responseId={responseId} mode="teacher" />
    </div>
  );
}
