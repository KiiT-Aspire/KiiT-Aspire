import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviewResponses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/interviews/[id]/responses/[responseId]/abandon
 *
 * Called via navigator.sendBeacon() when the student closes/navigates away from
 * the interview tab without formally completing. Sets status to "abandoned" so the
 * live monitor stops showing the student's card.
 *
 * Uses sendBeacon-compatible content-type (application/json blob).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: interviewId, responseId } = await params;

    // Only mark as abandoned if currently in_progress (don't overwrite completed)
    const [updated] = await db
      .update(interviewResponses)
      .set({
        status: "abandoned",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(interviewResponses.id, responseId),
          eq(interviewResponses.interviewId, interviewId),
          eq(interviewResponses.status, "in_progress")
        )
      )
      .returning({ id: interviewResponses.id, status: interviewResponses.status });

    return NextResponse.json({
      success: true,
      data: updated ?? null,
    });
  } catch (error) {
    console.error("[abandon] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
