"use client";

/**
 * AudioBridgeWidget — invisible component that lets the teacher speak to one
 * specific student's room at a time.
 *
 * Video for each student is displayed in isolated iframes (TeacherVideoTile).
 * This component handles the audio side in the main window using the main
 * window's RTK singleton. Since only ONE student is talked to at a time,
 * the singleton is fine — it just needs to publish the teacher's mic to that
 * one room.
 *
 * Usage: render with `key={talkingTo}` so it fully remounts and re-joins the
 * correct room whenever the teacher switches students.
 *
 * Must be loaded with `dynamic(() => import(...), { ssr: false })`.
 */

import { useEffect, useRef } from "react";
import { useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import type RTKClient from "@cloudflare/realtimekit";

export interface AudioBridgeWidgetProps {
  responseId: string;
  participantName?: string;
}

export default function AudioBridgeWidget({
  responseId,
  participantName,
}: AudioBridgeWidgetProps) {
  const [, initMeeting] = useRealtimeKitClient({ resetOnLeave: true });
  const meetingRef = useRef<RTKClient | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Fetch room token
        const res = await fetch("/api/cloudflarerealtime/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId: responseId,
            participantName: participantName ?? `Proctor-Audio`,
          }),
        });
        const data = await res.json();
        if (!data.success || !data.token || !mounted) return;

        // Join using the main window's RTK singleton
        const m = await initMeeting({
          authToken: data.token,
          defaults: { video: false, audio: true },
        });
        if (!m || !mounted) {
          m?.leave().catch(() => {});
          return;
        }

        await m.join();
        if (!mounted) {
          m.leave().catch(() => {});
          return;
        }

        meetingRef.current = m;

        // Enable microphone so the student can hear the teacher
        const enableMic = () => {
          m.self?.enableAudio().catch((e: unknown) =>
            console.error("[AudioBridge] enableAudio:", e)
          );
        };

        if (m.self?.roomState === "joined") {
          enableMic();
        } else {
          m.self?.on("roomJoined", enableMic);
        }
      } catch (e) {
        console.error("[AudioBridge] connection error:", e);
      }
    })();

    return () => {
      mounted = false;
      // Leave the room so the singleton is free to join a different room next time
      if (meetingRef.current) {
        meetingRef.current.leave().catch(() => {});
        meetingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseId]);

  // Intentionally renders nothing — audio only
  return null;
}
