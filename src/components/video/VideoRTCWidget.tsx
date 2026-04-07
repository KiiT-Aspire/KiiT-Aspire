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
  /** Teacher only — when true, enables mic to talk to this student */
  isTalking?: boolean;
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

  // NOTE: We intentionally do NOT check `videoEnabled` here.
  // Students call enableVideo() slightly after join(), so there is a brief
  // window where videoEnabled=false but videoTrack already exists. Checking
  // videoEnabled causes srcObject=null → video never recovers until re-render.
  const videoTrack = useRealtimeKitSelector((m: RTKClient) => {
    const p = m.participants?.joined?.toArray?.()?.find(
      (x: { id: string }) => x.id === participantId
    );
    return (p as { videoTrack?: MediaStreamTrack } | undefined)?.videoTrack;
  });

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

// ─── Remote audio feed (student hears faculty when they speak) ───────────────

function RemoteAudioFeed() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const remoteAudioTrack = useRealtimeKitSelector((m: RTKClient) => {
    const participants = m.participants?.joined?.toArray?.() ?? [];
    for (const p of participants) {
      const track = (p as { audioTrack?: MediaStreamTrack }).audioTrack;
      const enabled = (p as { audioEnabled?: boolean }).audioEnabled;
      if (track && enabled) return track;
    }
    return undefined;
  });

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (remoteAudioTrack) {
      el.srcObject = new MediaStream([remoteAudioTrack]);
    } else {
      el.srcObject = null;
    }
  }, [remoteAudioTrack]);

  return <audio ref={audioRef} autoPlay />;
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
            role: props.mode === "student" ? "student" : "teacher",
          }),
        });
        const data = await res.json();

        if (!data.success || !data.token || !mounted) {
          if (!data.success)
            console.warn("[VideoRTC] Token error:", data.message ?? data.error);
          return;
        }

        const m = await initMeeting({
          authToken: data.token,
          defaults: {
            video: props.mode === "student",
            audio: false,
          },
        });
        if (!m || !mounted) return;

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

  // 2. Ensure local camera stays enabled for student after join
  useEffect(() => {
    if (props.mode !== "student" || !meeting) return;

    const self = meeting.self;
    if (!self) return;

    const enableCam = () => {
      if (!self.videoEnabled) {
        self.enableVideo().catch((e: unknown) =>
          console.error("[VideoRTC] enableVideo:", e)
        );
      }
    };

    // Attempt immediately if already joined
    if (self.roomState === "joined") {
      enableCam();
    }

    // Handle the join event (fires when room state transitions to "joined")
    self.on("roomJoined", enableCam);

    // Fallback: retry after 1s to handle timing gaps where roomState hasn't
    // updated to "joined" yet when this effect ran (e.g. between join() call
    // resolving and roomJoined event firing).
    const retryTimer = setTimeout(enableCam, 1000);

    return () => {
      self.removeListener("roomJoined", enableCam);
      clearTimeout(retryTimer);
    };
  }, [meeting, props.mode]);

  // 3. Toggle teacher mic based on isTalking prop
  useEffect(() => {
    if (props.mode !== "teacher" || !meeting) return;

    const self = meeting.self;
    if (!self || self.roomState !== "joined") return;

    if (props.isTalking) {
      self.enableAudio().catch((e: unknown) =>
        console.error("[VideoRTC] enableAudio:", e)
      );
    } else {
      self.disableAudio().catch((e: unknown) =>
        console.error("[VideoRTC] disableAudio:", e)
      );
    }
  }, [meeting, props.mode, props.isTalking]);

  return (
    <RealtimeKitProvider value={meeting}>
      {props.mode === "student" ? (
        <>
          <LocalVideoFeed />
          <RemoteAudioFeed />
        </>
      ) : (
        <TeacherView />
      )}
    </RealtimeKitProvider>
  );
}
