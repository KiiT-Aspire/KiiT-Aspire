import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviewResponses, questionAnswers, interviews } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/interviews/[id]/responses/[responseId] - Get Single Response Details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: interviewId, responseId } = await params;

    // Fetch response details
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

    // Fetch interview details
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1);

    // Fetch all answers for this response
    const answers = await db
      .select()
      .from(questionAnswers)
      .where(eq(questionAnswers.responseId, responseId))
      .orderBy(questionAnswers.questionOrder);

    // Calculate time taken
    let timeTaken = null;
    if (response.completedAt && response.startedAt) {
      const diff = response.completedAt.getTime() - response.startedAt.getTime();
      timeTaken = Math.floor(diff / 1000); // in seconds
    }

    return NextResponse.json({
      success: true,
      data: {
        // Response info
        id: response.id,
        interviewId: response.interviewId,
        status: response.status,
        score: response.score,
        evaluation: response.evaluation,
        
        // Student info
        student: {
          id: response.studentId,
          name: response.studentName,
          email: response.studentEmail,
        },
        
        // Interview info
        interview: interview ? {
          id: interview.id,
          name: interview.name,
          subject: interview.subject,
        } : null,
        
        // Timing
        startedAt: response.startedAt,
        completedAt: response.completedAt,
        timeTaken: timeTaken,
        
        // Questions and answers
        totalQuestions: answers.length,
        answers: answers.map(a => ({
          id: a.id,
          questionText: a.questionText,
          questionOrder: a.questionOrder,
          audioUrl: a.audioUrl,
          audioTranscript: a.audioTranscript,
          audioDuration: a.audioDuration,
          answeredAt: a.answeredAt,
        })),
      },
    });

  } catch (error) {
    console.error("Error fetching response details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
