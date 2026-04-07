"use client";

/**
 * TeacherVideoTile — Fully self-contained per-student camera feed.
 *
 * ARCHITECTURE:
 * Each tile creates its own isolated RTKClient (NOT the shared singleton from
 * useRealtimeKitClient). This ensures each tile connects to a different Cloudflare
 * meeting room — one per student responseId.
 *
 * RACE CONDITION FIX:
 * The token API now distinguishes role="student" vs role="teacher".
 * Only students create meetings; teachers only join existing ones.
 * If the student hasn't created their meeting yet, the API returns
 * MEETING_NOT_READY and this tile retries with exponential backoff.
 *
 * PARTICIPANT EVENTS:
 * Listeners are attached BEFORE join() so we catch participantJoined events
 * that fire during the handshake for already-present peers.
 *
 * Must be loaded with `dynamic(() => import(...), { ssr: false })`.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import RTKClient from "@cloudflare/realtimekit";
import type { RTKParticipant } from "@cloudflare/realtimekit";

export interface TeacherVideoTileProps {
  responseId: string;
  studentName?: string;
  isTalking?: boolean;
}

// ─── Single participant video tile ────────────────────────────────────────────

function ParticipantVideoTile({
  participant,
}: {
  participant: RTKParticipant;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | undefined>(
    participant.videoTrack ?? undefined
  );

  useEffect(() => {
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
  isTalking,
}: TeacherVideoTileProps) {
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RTKParticipant[]>([]);
  const clientRef = useRef<RTKClient | null>(null);
  const mountedRef = useRef(true);

  // Fetch token with retry for MEETING_NOT_READY
  const fetchToken = useCallback(async (attempt: number): Promise<{ token: string } | null> => {
    const MAX_ATTEMPTS = 8;
    const res = await fetch("/api/cloudflarerealtime/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingId: responseId,
        participantName: `Proctor-${studentName ?? responseId.slice(0, 6)}`,
        role: "teacher",
      }),
    });
    const data = await res.json();

    if (!mountedRef.current) return null;

    if (data.success && data.token) {
      return { token: data.token };
    }

    if (data.error === "MISSING_CREDENTIALS") {
      setError("Video disabled — set Cloudflare env vars");
      setConnecting(false);
      return null;
    }

    if (data.error === "MEETING_NOT_READY" && attempt < MAX_ATTEMPTS) {
      // Student hasn't created their meeting yet — wait and retry
      const delay = Math.min(2000 * Math.pow(1.5, attempt), 10000);
      console.log(`[TeacherVideoTile] Meeting not ready for ${responseId}, retry #${attempt + 1} in ${delay}ms`);
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, delay);
        // If unmounted during wait, resolve immediately
        const check = setInterval(() => {
          if (!mountedRef.current) { clearInterval(check); clearTimeout(t); resolve(); }
        }, 200);
        setTimeout(() => clearInterval(check), delay + 100);
      });
      if (!mountedRef.current) return null;
      return fetchToken(attempt + 1);
    }

    setError(data.message ?? data.error ?? "Token fetch failed");
    setConnecting(false);
    return null;
  }, [responseId, studentName]);

  useEffect(() => {
    mountedRef.current = true;
    const retryTimers: ReturnType<typeof setTimeout>[] = [];

    (async () => {
      try {
        // ── 1. Fetch room token (with retry) ──────────────────────────────────
        const tokenData = await fetchToken(0);
        if (!tokenData || !mountedRef.current) return;

        // ── 2. Create isolated RTK client ─────────────────────────────────────
        const rtkClient = await RTKClient.init({
          authToken: tokenData.token,
          defaults: { video: false, audio: false },
        });

        if (!mountedRef.current) {
          rtkClient.leave().catch(() => {});
          return;
        }

        clientRef.current = rtkClient;

        // ── 3. Attach listeners BEFORE join() ─────────────────────────────────
        const joinedMap = rtkClient.participants.joined;

        const snap = (): RTKParticipant[] =>
          (joinedMap.toArray() as RTKParticipant[]) ?? [];

        const refresh = () => {
          if (mountedRef.current) setParticipants(snap());
        };

        joinedMap.on("participantJoined", refresh);
        joinedMap.on("participantLeft", refresh);
        joinedMap.on("participantsUpdate", refresh);

        // ── 4. Join the room ──────────────────────────────────────────────────
        await rtkClient.join();

        if (!mountedRef.current) {
          rtkClient.leave().catch(() => {});
          return;
        }

        // ── 5. Read current participants immediately after join ────────────────
        setParticipants(snap());
        setConnecting(false);

        // ── 6. Safety-net snapshots ───────────────────────────────────────────
        [500, 1500, 3000, 5000].forEach((ms) => {
          const t = setTimeout(() => {
            if (mountedRef.current) {
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
        if (mountedRef.current) {
          setError("Connection error");
          setConnecting(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
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

  // ── Handle teacher mic (isTalking) ──────────────────────────────────────────
  useEffect(() => {
    if (!clientRef.current) return;
    const self = clientRef.current.self;
    if (!self || self.roomState !== "joined") return;

    if (isTalking) {
      self.enableAudio().catch((e: unknown) =>
        console.error("[TeacherVideoTile] enableAudio:", e)
      );
    } else {
      self.disableAudio().catch((e: unknown) =>
        console.error("[TeacherVideoTile] disableAudio:", e)
      );
    }
  }, [isTalking, connecting]);

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
