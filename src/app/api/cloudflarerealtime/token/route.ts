import { NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

/**
 * POST /api/cloudflarerealtime/token
 *
 * Body: {
 *   meetingId: string (our DB responseId),
 *   participantName: string,
 *   role: "student" | "teacher"    ← NEW: prevents duplicate-meeting race
 * }
 *
 * RACE CONDITION FIX:
 * Previously both student and teacher called this API simultaneously, both saw
 * "no meeting exists", and both created separate Cloudflare meetings. The student
 * ended up in room A, teacher in room B — they could never see each other.
 *
 * Now:
 *  - role="student" → find existing meeting OR create a new one (only students create)
 *  - role="teacher" → find existing meeting ONLY. If not found, return MEETING_NOT_READY
 *    so the TeacherVideoTile can retry after a delay.
 */
export async function POST(req: Request) {
  try {
    const { meetingId: responseId, participantName, role } = await req.json();

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const appId = process.env.CLOUDFLARE_APP_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !appId || !apiToken) {
      return NextResponse.json({
        success: false,
        error: "MISSING_CREDENTIALS",
        message: "Cloudflare credentials not configured. Video feeds are disabled.",
      });
    }

    const headers = {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    };

    // ── Step 1: Search for existing meeting with this responseId as title ─────
    // Cloudflare's API ignores the ?title= query param and returns ALL meetings,
    // so we fetch up to 100 and filter in-memory.

    let cfMeetingId: string | null = null;

    const listRes = await fetch(
      `${CF_BASE}/accounts/${accountId}/realtime/kit/${appId}/meetings?limit=100`,
      { headers }
    );
    const listData = await listRes.json();

    if (listData.success && Array.isArray(listData.data)) {
      // Find ALL meetings with matching title (there may be duplicates from old bugs)
      const matches = listData.data.filter((m: any) => m.title === responseId);
      if (matches.length > 0) {
        // Use the OLDEST meeting — that's the one the student created first
        matches.sort((a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        cfMeetingId = matches[0].id;
        console.log(`[CF Token] Found existing meeting ${cfMeetingId} for ${responseId} (${matches.length} match(es))`);
      }
    }

    // ── Step 2: Create or bail depending on role ──────────────────────────────

    if (!cfMeetingId) {
      if (role === "teacher") {
        // Teacher must NOT create meetings — return "not ready" so tile retries
        console.log(`[CF Token] Teacher requested meeting for ${responseId} but student hasn't created it yet`);
        return NextResponse.json({
          success: false,
          error: "MEETING_NOT_READY",
          message: "Student hasn't started their camera yet. Retrying...",
        });
      }

      // Student (or legacy callers without role): create the meeting
      const createRes = await fetch(
        `${CF_BASE}/accounts/${accountId}/realtime/kit/${appId}/meetings`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ title: responseId }),
        }
      );
      const createData = await createRes.json();

      if (!createData.success) {
        console.error("[CF Token] Meeting creation failed:", createData);
        throw new Error(createData.error?.message || "Failed to create Cloudflare meeting");
      }

      cfMeetingId = createData.data.id;
      console.log(`[CF Token] Created new meeting ${cfMeetingId} for ${responseId}`);
    }

    // ── Step 3: Add participant to the meeting → get auth token ───────────────

    const participantRes = await fetch(
      `${CF_BASE}/accounts/${accountId}/realtime/kit/${appId}/meetings/${cfMeetingId}/participants`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: participantName || "Participant",
          presetName: "group_call_participant",
          customParticipantId: crypto.randomUUID(),
        }),
      }
    );
    const participantData = await participantRes.json();

    if (!participantData.success) {
      console.error("[CF Token] Participant creation failed:", participantData);
      throw new Error(participantData.error?.message || "Failed to add participant");
    }

    return NextResponse.json({
      success: true,
      token: participantData.data.token,
      cfMeetingId,
    });
  } catch (error) {
    console.error("[CF Token] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate video feed token" },
      { status: 500 }
    );
  }
}
