import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviews, interviewQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/interviews/[id] - Get Single Interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch interview
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

    // Fetch questions
    const questions = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.interviewId, id))
      .orderBy(interviewQuestions.order);

    return NextResponse.json({
      success: true,
      data: {
        ...interview,
        questions,
      },
    });

  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview" },
      { status: 500 }
    );
  }
}

// PUT /api/interviews/[id] - Update Interview
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subject, questions, isActive, timeLimit } = body;

    // Check if interview exists
    const [existingInterview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id))
      .limit(1);

    if (!existingInterview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Update interview basic info
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (timeLimit !== undefined) updateData.timeLimit = parseInt(timeLimit.toString());

    const [updatedInterview] = await db
      .update(interviews)
      .set(updateData)
      .where(eq(interviews.id, id))
      .returning();

    // Update questions if provided
    let updatedQuestions = [];
    if (questions && Array.isArray(questions)) {
      // Delete existing questions
      await db
        .delete(interviewQuestions)
        .where(eq(interviewQuestions.interviewId, id));

      // Insert new questions
      const questionValues = questions.map((q: { text: string; subject: string }, index: number) => ({
        interviewId: id,
        text: q.text,
        subject: q.subject || subject || existingInterview.subject,
        order: index + 1,
      }));

      updatedQuestions = await db
        .insert(interviewQuestions)
        .values(questionValues)
        .returning();
    } else {
      // If questions not provided, fetch existing ones
      updatedQuestions = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.interviewId, id))
        .orderBy(interviewQuestions.order);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedInterview,
        questions: updatedQuestions,
      },
    });

  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews/[id] - Delete Interview
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if interview exists
    const [existingInterview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id))
      .limit(1);

    if (!existingInterview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Delete interview (cascade will delete questions and responses)
    await db
      .delete(interviews)
      .where(eq(interviews.id, id));

    return NextResponse.json({
      success: true,
      message: "Interview deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting interview:", error);
    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 }
    );
  }
}
