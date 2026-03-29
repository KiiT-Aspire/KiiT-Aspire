"use client";

/**
 * VideoRTCWidget — WebSocket-based video proctoring component.
 *
 * Student mode: Captures camera frames and sends them to the WS relay server.
 *               Shows a small self-view overlay (top-right).
 *
 * Teacher mode: Receives student frames from the WS relay server.
 *               Renders them as a grid of <img> tiles.
 *
 * Loaded ONLY via `dynamic(() => import(...), { ssr: false })`.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_VIDEO_WS_URL || "ws://localhost:8080";

// Frame capture settings (low quality is fine for proctoring)
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 240;
const FRAME_QUALITY = 0.4; // JPEG quality 0–1
const FRAME_INTERVAL_MS = 333; // ~3 fps

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoRTCWidgetProps {
  responseId: string;
  studentName?: string;
  /** "student" = capture & show self-view, "teacher" = show remote feeds */
  mode: "student" | "teacher";
  /** interviewId used as the WS room key (teacher mode) */
  interviewId?: string;
}

// ─── Student Mode ─────────────────────────────────────────────────────────────

function StudentView({
  responseId,
  studentName,
  interviewId,
}: {
  responseId: string;
  studentName: string;
  interviewId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      // 1. Get camera (video only — mic is handled by ReactMediaRecorder)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("[VideoWS] Camera access failed:", e);
        return;
      }

      // 2. Connect to WS relay server
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "join",
              role: "student",
              interviewId,
              responseId,
              studentName,
            })
          );
          console.log("[VideoWS] Student connected to relay");

          // 3. Start sending frames
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = FRAME_WIDTH;
          canvas.height = FRAME_HEIGHT;

          intervalRef.current = setInterval(() => {
            if (
              ws.readyState !== WebSocket.OPEN ||
              !video.videoWidth
            )
              return;
            ctx.drawImage(video, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const dataUrl = canvas.toDataURL("image/jpeg", FRAME_QUALITY);
            // Strip the data:image/jpeg;base64, prefix
            const base64 = dataUrl.split(",")[1];
            if (base64) {
              ws.send(JSON.stringify({ type: "frame", data: base64 }));
            }
          }, FRAME_INTERVAL_MS);
        };

        ws.onerror = (e) => console.error("[VideoWS] WS error:", e);
        ws.onclose = () => console.log("[VideoWS] WS closed");
      } catch (e) {
        console.error("[VideoWS] WS connection failed:", e);
      }
    };

    start();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [responseId, studentName, interviewId]);

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Self-view overlay */}
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
    </>
  );
}

// ─── Teacher Mode ─────────────────────────────────────────────────────────────

interface StudentFrame {
  name: string;
  dataUrl: string; // full data URL for <img>
}

function TeacherView({ interviewId }: { interviewId: string }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [students, setStudents] = useState<Map<string, StudentFrame>>(
    new Map()
  );

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "student-joined") {
        setStudents((prev) => {
          const next = new Map(prev);
          if (!next.has(msg.responseId)) {
            next.set(msg.responseId, { name: msg.studentName, dataUrl: "" });
          }
          return next;
        });
      } else if (msg.type === "student-left") {
        setStudents((prev) => {
          const next = new Map(prev);
          next.delete(msg.responseId);
          return next;
        });
      } else if (msg.type === "frame") {
        setStudents((prev) => {
          const next = new Map(prev);
          const existing = next.get(msg.responseId);
          next.set(msg.responseId, {
            name: existing?.name || "Student",
            dataUrl: `data:image/jpeg;base64,${msg.data}`,
          });
          return next;
        });
      }
    } catch {
      // Ignore malformed messages
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          role: "teacher",
          interviewId,
        })
      );
      console.log("[VideoWS] Teacher connected to relay");
    };

    ws.onmessage = handleMessage;
    ws.onerror = (e) => console.error("[VideoWS] WS error:", e);
    ws.onclose = () => console.log("[VideoWS] WS closed");

    return () => {
      ws.close();
    };
  }, [interviewId, handleMessage]);

  if (students.size === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-[#080808] text-zinc-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-6 h-6"
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
      {Array.from(students.entries()).map(([rid, info]) => (
        <div key={rid} className="relative w-full h-full">
          {info.dataUrl ? (
            <img
              src={info.dataUrl}
              alt={info.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <p className="text-zinc-500 text-xs">Connecting…</p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────

export default function VideoRTCWidget(props: VideoRTCWidgetProps) {
  // Derive interviewId: teacher passes it directly, student extracts from responseId context
  const interviewId = props.interviewId || props.responseId;

  if (props.mode === "student") {
    return (
      <StudentView
        responseId={props.responseId}
        studentName={props.studentName || "Student"}
        interviewId={interviewId}
      />
    );
  }

  return <TeacherView interviewId={interviewId} />;
}
