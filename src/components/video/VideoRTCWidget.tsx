"use client";

/**
 * VideoRTCWidget — Cloudflare RealtimeKit video component.
 *
 * Loaded ONLY via `dynamic(() => import(...), { ssr: false })`.
 * Never import directly in a server or App Router page.
 */

import { useEffect, useRef } from "react";
import {
  useRealtimeKitClient,
  useRealtimeKitSelector,
  RealtimeKitProvider,
} from "@cloudflare/realtimekit-react";
import type RTKClient from "@cloudflare/realtimekit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoRTCWidgetProps {
  responseId: string;
  studentName?: string;
  /** "student" = show local camera feed only, "teacher" = show remote feed */
  mode: "student" | "teacher";
}

// ─── Local video feed (student sees only their own camera) ────────────────────

function LocalVideoFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrack = useRealtimeKitSelector(
    (m: RTKClient) => m.self?.videoTrack as MediaStreamTrack | undefined
  );
  const videoEnabled = useRealtimeKitSelector(
    (m: RTKClient) => m.self?.videoEnabled as boolean | undefined
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoTrack && videoEnabled) {
      el.srcObject = new MediaStream([videoTrack]);
    } else {
      el.srcObject = null;
    }
  }, [videoTrack, videoEnabled]);

  return (
    <div className="fixed top-24 right-6 w-[200px] aspect-video bg-black rounded-[12px] overflow-hidden border-2 border-green-500/30 shadow-[0_0_20px_rgba(22,163,74,0.15)] z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-[6px] backdrop-blur font-mono text-[10px] uppercase font-bold text-white tracking-widest border border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Live
      </div>
    </div>
  );
}

// ─── Single remote participant video (for teacher view) ──────────────────────

function RemoteVideoTile({ participantId }: { participantId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoTrack = useRealtimeKitSelector((m: RTKClient) => {
    const p = m.participants?.joined?.toArray?.()?.find(
      (x: { id: string }) => x.id === participantId
    );
    return (p as { videoTrack?: MediaStreamTrack } | undefined)?.videoTrack;
  });

  const videoEnabled = useRealtimeKitSelector((m: RTKClient) => {
    const p = m.participants?.joined?.toArray?.()?.find(
      (x: { id: string }) => x.id === participantId
    );
    return (p as { videoEnabled?: boolean } | undefined)?.videoEnabled ?? false;
  });

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoTrack && videoEnabled) {
      el.srcObject = new MediaStream([videoTrack]);
    } else {
      el.srcObject = null;
    }
  }, [videoTrack, videoEnabled]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}

// ─── Teacher view — shows all remote participant feeds ───────────────────────

function TeacherView() {
  const participantIds = useRealtimeKitSelector((m: RTKClient) =>
    m.participants?.joined?.toArray?.()?.map((p: { id: string }) => p.id) ?? []
  );

  if (participantIds.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-[#080808] text-zinc-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-zinc-500">
            Waiting for student to connect camera…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {participantIds.map((id: string) => (
        <RemoteVideoTile key={id} participantId={id} />
      ))}
    </>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────

export default function VideoRTCWidget(props: VideoRTCWidgetProps) {
  const [meeting, initMeeting] = useRealtimeKitClient();

  // 1. Fetch token → init client → join room
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/cloudflarerealtime/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId: props.responseId,
            participantName:
              props.studentName ??
              (props.mode === "teacher" ? "Proctor" : "Student"),
          }),
        });
        const data = await res.json();

        if (!data.success || !data.token || !mounted) {
          if (!data.success)
            console.warn("[VideoRTC] Token error:", data.message ?? data.error);
          return;
        }

        const m = await initMeeting({ authToken: data.token });
        if (!m || !mounted) return;

        // Join the room (initMeeting only initialises the client)
        await m.join();
        console.log("[VideoRTC] Room joined, mode:", props.mode);
      } catch (e) {
        console.error("[VideoRTC] init error:", e);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.responseId]);

  // 2. Enable local camera once joined (student only)
  useEffect(() => {
    if (props.mode !== "student" || !meeting) return;

    const self = meeting.self;
    if (!self) return;

    const enableCam = () => {
      self.enableVideo().catch((e: unknown) =>
        console.error("[VideoRTC] enableVideo:", e)
      );
    };

    if (self.roomState === "joined") {
      enableCam();
    }

    // Also handle late / re-joins
    self.on("roomJoined", enableCam);
    return () => {
      self.removeListener("roomJoined", enableCam);
    };
  }, [meeting, props.mode]);

  return (
    <RealtimeKitProvider value={meeting}>
      {props.mode === "student" ? (
        <LocalVideoFeed />
      ) : (
        <TeacherView />
      )}
    </RealtimeKitProvider>
  );
}
