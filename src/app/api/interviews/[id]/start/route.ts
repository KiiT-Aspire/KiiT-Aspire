import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviews, interviewQuestions, interviewResponses } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/interviews/[id]/start - Start Interview Session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { studentId, studentName, studentEmail } = body;

    // Validate that interview exists and is active
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id))
      .limit(1);

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (!interview.isActive) {
      return NextResponse.json(
        { error: "This interview is not currently active" },
        { status: 403 }
      );
    }

    // Fetch questions for this interview
    const questions = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.interviewId, id))
      .orderBy(interviewQuestions.order);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "This interview has no questions" },
        { status: 400 }
      );
    }

    // Create new interview response
    const [newResponse] = await db
      .insert(interviewResponses)
      .values({
        interviewId: id,
        studentId: studentId || null,
        studentName: studentName || null,
        studentEmail: studentEmail || null,
        status: "in_progress",
      })
      .returning();

    // Get first question (randomly or first in order)
    const firstQuestion = questions[Math.floor(Math.random() * questions.length)];

    return NextResponse.json({
      success: true,
      data: {
        responseId: newResponse.id,
        interviewDetails: {
          id: interview.id,
          name: interview.name,
          subject: interview.subject,
        },
        firstQuestion: firstQuestion.text,
        totalQuestions: "3+ adaptive",
        questionsAvailable: questions.length,
      },
    });

  } catch (error) {
    console.error("Error starting interview:", error);
    return NextResponse.json(
      { error: "Failed to start interview" },
      { status: 500 }
    );
  }
}
