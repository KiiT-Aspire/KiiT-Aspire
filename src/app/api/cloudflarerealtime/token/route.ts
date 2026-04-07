import { NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

/**
 * POST /api/cloudflarerealtime/token
 *
 * Body: { meetingId: string (our DB responseId), participantName: string }
 *
 * Flow:
 *  1. Look up whether a Cloudflare meeting already exists for this responseId.
 *     We store the mapping in Cloudflare meeting title = responseId so we can
 *     search for it by title.
 *  2. If not found → create a new Cloudflare meeting with title = responseId.
 *  3. Add a participant to the meeting → returns an auth token.
 *  4. Return { success: true, token, cfMeetingId }.
 */
export async function POST(req: Request) {
  try {
    const { meetingId: responseId, participantName } = await req.json();

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

    // ── Step 1: Find or create a Cloudflare meeting for this responseId ──────

    let cfMeetingId: string | null = null;

    // Search existing meetings by title (we use our responseId as the title)
    // IMPORTANT: Cloudflare API ignores ?title= and returns all meetings. We MUST 
    // fetch a larger limit (e.g. limit=100) and manually search for the exact match.
    const listRes = await fetch(
      `${CF_BASE}/accounts/${accountId}/realtime/kit/${appId}/meetings?limit=100`,
      { headers }
    );
    const listData = await listRes.json();

    if (listData.success && Array.isArray(listData.data) && listData.data.length > 0) {
      // FIX: The Cloudflare RealtimeKit API doesn't always filter exactly by `title` in the query string.
      // If we blindly take `listData.data[0].id`, all responses get dumped into whatever the very first 
      // meeting in the account is (the same shared meeting room). We MUST verify the exact title string.
      const exactMatch = listData.data.find((m: any) => m.title === responseId);
      if (exactMatch) {
        cfMeetingId = exactMatch.id;
      }
    }

    // ── Step 2: Create the meeting if it doesn't exist ────────────────────────

    if (!cfMeetingId) {
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
          customParticipantId: crypto.randomUUID()
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
