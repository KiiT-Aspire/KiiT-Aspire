"use client";

/**
 * VideoRTCWidget — WebSocket-based video proctoring component.
 *
 * Student mode: Captures camera frames → WS relay. Shows self-view overlay.
 *               Plays back teacher's private audio messages via AudioContext.
 *
 * TeacherMonitor (named export): Single-WS component for the results page.
 *               Renders a grid of ALL student feeds, click-to-select a student,
 *               push-to-talk sends private audio to selected student only.
 *               Teacher has mic access but NO camera.
 *
 * Loaded ONLY via `dynamic(() => import(...), { ssr: false })`.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_VIDEO_WS_URL || "ws://localhost:8080";

// Frame capture settings
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 240;
const FRAME_QUALITY = 0.4;
const FRAME_INTERVAL_MS = 333; // ~3 fps

// Audio settings
const AUDIO_TARGET_RATE = 8000;
const AUDIO_BUFFER_SIZE = 4096;

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoRTCWidgetProps {
  responseId: string;
  studentName?: string;
  mode: "student" | "teacher";
  interviewId?: string;
}

interface StudentFrame {
  name: string;
  dataUrl: string;
}

// ─── Audio Helpers ────────────────────────────────────────────────────────────

function encodeInt16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function decodeBase64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
  return float32;
}

function downsample(
  buffer: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.round(i * ratio)];
  }
  return result;
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
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);

  const playTeacherAudio = useCallback((base64: string) => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioContext({ sampleRate: AUDIO_TARGET_RATE });
    }
    const ctx = playbackCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const float32 = decodeBase64ToFloat32(base64);
    const buffer = ctx.createBuffer(1, float32.length, AUDIO_TARGET_RATE);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;
  }, []);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
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
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("[VideoWS] Camera access failed:", e);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = FRAME_WIDTH;
      canvas.height = FRAME_HEIGHT;

      function connectWs() {
        if (!mounted) return;
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

          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN || !video.videoWidth) return;
            ctx.drawImage(video, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
            const base64 = canvas
              .toDataURL("image/jpeg", FRAME_QUALITY)
              .split(",")[1];
            if (base64) ws.send(JSON.stringify({ type: "frame", data: base64 }));
          }, FRAME_INTERVAL_MS);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "teacher-audio" && msg.data) {
              playTeacherAudio(msg.data);
            }
          } catch {
            /* ignore */
          }
        };

        ws.onerror = (e) => console.error("[VideoWS] WS error:", e);
        ws.onclose = () => {
          console.log("[VideoWS] Student WS closed, reconnecting in 2s…");
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (mounted) setTimeout(connectWs, 2000);
        };
      }

      connectWs();
    };

    start();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (playbackCtxRef.current) playbackCtxRef.current.close();
    };
  }, [responseId, studentName, interviewId, playTeacherAudio]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
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

// ─── Teacher Monitor (single-WS, grid + push-to-talk) ────────────────────────

export function TeacherMonitor({
  interviewId,
}: {
  interviewId: string;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [students, setStudents] = useState<Map<string, StudentFrame>>(
    new Map()
  );
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // ── WS message handler ──────────────────────────────────────────────────
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "student-joined") {
        setStudents((prev) => {
          const next = new Map(prev);
          if (!next.has(msg.responseId))
            next.set(msg.responseId, { name: msg.studentName, dataUrl: "" });
          return next;
        });
      } else if (msg.type === "student-left") {
        setStudents((prev) => {
          const next = new Map(prev);
          next.delete(msg.responseId);
          return next;
        });
        setSelectedStudent((prev) =>
          prev === msg.responseId ? null : prev
        );
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
      /* ignore */
    }
  }, []);

  // ── Single WS connection with auto-reconnect ──────────────────────────
  useEffect(() => {
    let alive = true;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (!alive) return;
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", role: "teacher", interviewId }));
        console.log("[VideoWS] Teacher monitor connected");
      };
      ws.onmessage = handleMessage;
      ws.onerror = (e) => console.error("[VideoWS] WS error:", e);
      ws.onclose = () => {
        console.log("[VideoWS] WS closed, reconnecting in 2s…");
        if (alive) reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [interviewId, handleMessage]);

  // ── Push-to-talk: start ─────────────────────────────────────────────────
  const startTalking = useCallback(async () => {
    if (!selectedStudent || !wsRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      micStreamRef.current = stream;

      const audioCtx = new AudioContext();
      captureCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const processor = audioCtx.createScriptProcessor(
        AUDIO_BUFFER_SIZE,
        1,
        1
      );
      processorRef.current = processor;

      const nativeSampleRate = audioCtx.sampleRate;
      const targetId = selectedStudent;
      const ws = wsRef.current;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const downsampled = downsample(
          input,
          nativeSampleRate,
          AUDIO_TARGET_RATE
        );
        const int16 = new Int16Array(downsampled.length);
        for (let i = 0; i < downsampled.length; i++) {
          int16[i] = Math.max(
            -32768,
            Math.min(32767, Math.round(downsampled[i] * 32768))
          );
        }
        ws.send(
          JSON.stringify({
            type: "teacher-audio",
            targetResponseId: targetId,
            data: encodeInt16ToBase64(int16),
          })
        );
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsTalking(true);
    } catch (e) {
      console.error("[VideoWS] Mic access failed:", e);
    }
  }, [selectedStudent]);

  // ── Push-to-talk: stop ──────────────────────────────────────────────────
  const stopTalking = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close();
      captureCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsTalking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopTalking();
    };
  }, [stopTalking]);

  // ── Empty state ─────────────────────────────────────────────────────────
  if (students.size === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-5 text-zinc-600">
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
          Waiting for students to connect…
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const entries = Array.from(students.entries());

  return (
    <div>
      {/* Student grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {entries.map(([rid, info]) => (
          <div
            key={rid}
            onClick={() =>
              setSelectedStudent((prev) => (prev === rid ? null : rid))
            }
            className={`relative aspect-video rounded-xl overflow-hidden bg-[#050505] border-2 transition-all cursor-pointer shadow-lg ${
              selectedStudent === rid
                ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                : "border-white/[0.05] hover:border-white/10"
            }`}
          >
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
            {/* Name badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-[120px]">
                {info.name || "Candidate"}
              </span>
            </div>
            {selectedStudent === rid && (
              <div className="absolute bottom-2 right-2 bg-indigo-500/80 px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur">
                Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Push-to-talk bar */}
      {selectedStudent && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Speaking to:{" "}
            <span className="text-white font-semibold">
              {students.get(selectedStudent)?.name}
            </span>
          </div>

          <button
            onMouseDown={startTalking}
            onMouseUp={stopTalking}
            onMouseLeave={stopTalking}
            onTouchStart={startTalking}
            onTouchEnd={stopTalking}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold uppercase tracking-wider transition-all select-none ${
              isTalking
                ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105"
                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
              />
            </svg>
            {isTalking ? "Speaking…" : "Hold to Talk"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Root component (student mode entry point) ───────────────────────────────

export default function VideoRTCWidget(props: VideoRTCWidgetProps) {
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

  // Fallback for backwards compat — prefer <TeacherMonitor> directly
  return <TeacherMonitor interviewId={interviewId} />;
}
