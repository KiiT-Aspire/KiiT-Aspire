"use client";

/**
 * TeacherVideoTile — renders a student's camera feed in an isolated <iframe>.
 *
 * ROOT CAUSE OF MULTI-STUDENT BUG:
 * RTKClient.init() is a module-level singleton. Calling it N times in the same
 * browser tab returns the same underlying instance, so all tiles end up sharing
 * one WebRTC connection and showing the same room's video.
 *
 * FIX: load each tile in a separate <iframe>. Iframes have their own JavaScript
 * execution context, meaning each one gets its own private RTKClient singleton
 * that is completely independent from every other iframe on the page.
 *
 * The iframe loads /monitor-frame/[responseId] which renders VideoRTCWidget
 * in teacher (view-only) mode for that specific student's room.
 *
 * Must be loaded with `dynamic(() => import(...), { ssr: false })`.
 */

export interface TeacherVideoTileProps {
  responseId: string;
  studentName?: string;
}

export default function TeacherVideoTile({ responseId }: TeacherVideoTileProps) {
  return (
    <iframe
      src={`/monitor-frame/${responseId}`}
      className="w-full h-full border-none block"
      allow="autoplay"
      title={`Student monitor — ${responseId}`}
    />
  );
}
