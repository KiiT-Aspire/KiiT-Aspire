"use client";

/**
 * TeacherVideoTile — Fully self-contained per-student camera feed.
 *
 * KEY INSIGHT (race condition fix):
 * RTK fires `participantJoined` for already-in-room peers during the `join()` call.
 * If we attach listeners AFTER `join()` returns, those events are already gone and
 * `participants.joined.toArray()` may still be empty at that moment because the SDK
 * populates it asynchronously. We therefore:
 *  1. Attach ALL listeners before calling `join()`.
 *  2. After `join()`, snapshot current state (catches any that already were there).
 *  3. Poll `snap()` at 500 ms / 1.5 s / 3 s as a safety net for async population.
 *
 * We do NOT use useRealtimeKitSelector / RealtimeKitProvider — those have a
 * "missed initial events" problem when the client is created outside the hook lifecycle.
 *
 * Must be loaded with `dynamic(() => import(...), { ssr: false })`.
 */

import { useEffect, useRef, useState } from "react";
import RTKClient from "@cloudflare/realtimekit";
import type { RTKParticipant } from "@cloudflare/realtimekit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherVideoTileProps {
  responseId: string;
  studentName?: string;
}

// ─── Single participant video tile ────────────────────────────────────────────

function ParticipantVideoTile({
  participant,
}: {
  participant: RTKParticipant;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Seed with current track — may already be non-null if the student was
  // already publishing when we joined.
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | undefined>(
    participant.videoTrack ?? undefined
  );

  useEffect(() => {
    // Also re-read on mount in case the track was set between the render that
    // created this component and this effect running.
    setVideoTrack(participant.videoTrack ?? undefined);

    const onVideoUpdate = ({
      videoTrack: track,
    }: {
      videoEnabled: boolean;
      videoTrack: MediaStreamTrack;
    }) => {
      setVideoTrack(track ?? undefined);
    };

    participant.on("videoUpdate", onVideoUpdate);
    return () => {
      participant.removeListener("videoUpdate", onVideoUpdate);
    };
  }, [participant]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoTrack) {
      el.srcObject = new MediaStream([videoTrack]);
    } else {
      el.srcObject = null;
    }
  }, [videoTrack]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}

// ─── Root component ──────────────────────────────────────────────────────────

export default function TeacherVideoTile({
  responseId,
  studentName,
}: TeacherVideoTileProps) {
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RTKParticipant[]>([]);
  const clientRef = useRef<RTKClient | null>(null);

  useEffect(() => {
    let mounted = true;
    const retryTimers: ReturnType<typeof setTimeout>[] = [];

    (async () => {
      try {
        // ── 1. Fetch room token ───────────────────────────────────────────────
        const res = await fetch("/api/cloudflarerealtime/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId: responseId,
            participantName: `Proctor-${studentName ?? responseId.slice(0, 6)}`,
          }),
        });
        const data = await res.json();

        if (!mounted) return;

        if (!data.success || !data.token) {
          setError(
            data.error === "MISSING_CREDENTIALS"
              ? "Video disabled — set Cloudflare env vars"
              : (data.message ?? data.error ?? "Token fetch failed")
          );
          setConnecting(false);
          return;
        }

        // ── 2. Create isolated RTK client ────────────────────────────────────
        const rtkClient = await RTKClient.init({
          authToken: data.token,
          defaults: { video: false, audio: false },
        });

        if (!mounted) {
          rtkClient.leave().catch(() => {});
          return;
        }

        clientRef.current = rtkClient;

        // ── 3. Attach listeners BEFORE join() ────────────────────────────────
        // This is the critical fix: RTK fires `participantJoined` for peers
        // already in the room during the join() handshake. If we wait until
        // after join() to add listeners, we miss those events.
        const joinedMap = rtkClient.participants.joined;

        const snap = (): RTKParticipant[] =>
          (joinedMap.toArray() as RTKParticipant[]) ?? [];

        const refresh = () => {
          if (mounted) setParticipants(snap());
        };

        joinedMap.on("participantJoined", refresh);
        joinedMap.on("participantLeft", refresh);
        joinedMap.on("participantsUpdate", refresh);

        // ── 4. Join the room ──────────────────────────────────────────────────
        await rtkClient.join();

        if (!mounted) {
          rtkClient.leave().catch(() => {});
          return;
        }

        // ── 5. Read current participants immediately after join ───────────────
        setParticipants(snap());
        setConnecting(false);

        // ── 6. Retry snapshots — safety net for async participant population ──
        // Some SDKs populate participants.joined asynchronously even after the
        // join() Promise resolves. We retry a few times to catch them without
        // relying solely on events.
        [500, 1500, 3000, 5000].forEach((ms) => {
          const t = setTimeout(() => {
            if (mounted) {
              const current = snap();
              if (current.length > 0) {
                setParticipants(current);
              }
            }
          }, ms);
          retryTimers.push(t);
        });
      } catch (e) {
        console.error("[TeacherVideoTile] error for room", responseId, e);
        if (mounted) {
          setError("Connection error");
          setConnecting(false);
        }
      }
    })();

    return () => {
      mounted = false;
      retryTimers.forEach(clearTimeout);
      const c = clientRef.current;
      if (c) {
        try {
          const joinedMap = c.participants.joined;
          joinedMap.removeAllListeners?.();
        } catch {}
        c.leave().catch(() => {});
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (connecting) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-green-300/70 border-t-green-600 animate-spin" />
        <p className="text-[10px] text-gray-400 font-medium">Connecting…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-3 text-center">
        <svg
          className="w-4 h-4 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-[10px] text-red-400 font-medium leading-tight">
          {error}
        </p>
      </div>
    );
  }

  // ── No participants yet ────────────────────────────────────────────────────
  if (participants.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
        <svg
          className="w-5 h-5 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          />
        </svg>
        <p className="text-[10px] font-medium text-gray-400">Waiting for camera…</p>
      </div>
    );
  }

  // ── Video tiles ────────────────────────────────────────────────────────────
  return (
    <>
      {participants.map((p) => (
        <ParticipantVideoTile key={p.id} participant={p} />
      ))}
    </>
  );
}
