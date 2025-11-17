import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviewResponses, questionAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/interviews/[id]/responses/[responseId]/complete - Complete Interview
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: interviewId, responseId } = await params;
    const body = await request.json();
    const { score, evaluation } = body;

    // Verify response exists
    const [response] = await db
      .select()
      .from(interviewResponses)
      .where(eq(interviewResponses.id, responseId))
      .limit(1);

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    if (response.interviewId !== interviewId) {
      return NextResponse.json(
        { error: "Response does not belong to this interview" },
        { status: 400 }
      );
    }

    // Get all answers for this response
    const answers = await db
      .select()
      .from(questionAnswers)
      .where(eq(questionAnswers.responseId, responseId))
      .orderBy(questionAnswers.questionOrder);

    // Update response with completion data
    const [updatedResponse] = await db
      .update(interviewResponses)
      .set({
        status: "completed",
        completedAt: new Date(),
        score: score,
        evaluation: evaluation,
      })
      .where(eq(interviewResponses.id, responseId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Interview completed successfully",
      data: {
        responseId: updatedResponse.id,
        score: updatedResponse.score,
        evaluation: updatedResponse.evaluation,
        completedAt: updatedResponse.completedAt,
        totalQuestions: answers.length,
        detailedResults: {
          startedAt: updatedResponse.startedAt,
          completedAt: updatedResponse.completedAt,
          answers: answers.map(a => ({
            question: a.questionText,
            order: a.questionOrder,
            answeredAt: a.answeredAt,
            duration: a.audioDuration,
          })),
        },
      },
    });

  } catch (error) {
    console.error("Error completing interview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
