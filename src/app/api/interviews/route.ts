import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviews, interviewQuestions, interviewResponses } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// POST /api/interviews - Create Interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, questions, createdBy, timeLimit } = body;

    console.log("Received interview creation request:", { name, subject, createdBy, questionsCount: questions?.length, timeLimit });

    // Validate required fields
    if (!name || !subject || !questions || !createdBy) {
      console.error("Validation failed - missing fields:", { name: !!name, subject: !!subject, questions: !!questions, createdBy: !!createdBy });
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required fields: name, subject, questions, createdBy",
          message: "Please fill all required fields"
        },
        { status: 400 }
      );
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Validation failed - invalid questions array");
      return NextResponse.json(
        { 
          success: false,
          error: "Questions must be a non-empty array",
          message: "Please add at least one question"
        },
        { status: 400 }
      );
    }

    console.log("Creating interview in database...");

    // Create interview
    const [newInterview] = await db
      .insert(interviews)
      .values({
        name,
        subject,
        createdBy,
        timeLimit: timeLimit ? parseInt(timeLimit.toString()) : 30, // Default to 30 mins
        isActive: true,
      })
      .returning();

    console.log("Interview created:", newInterview.id);

    // Create interview questions
    const questionValues = questions.map((q: { text: string; subject: string }, index: number) => ({
      interviewId: newInterview.id,
      text: q.text,
      subject: q.subject || subject,
      order: index + 1,
    }));

    const createdQuestions = await db
      .insert(interviewQuestions)
      .values(questionValues)
      .returning();

    console.log("Questions created:", createdQuestions.length);

    // Return interview with questions
    return NextResponse.json({
      success: true,
      data: {
        ...newInterview,
        questions: createdQuestions,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create interview",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET /api/interviews - List All Interviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get("createdBy");

    // Build query with filters
    let query = db
      .select({
        id: interviews.id,
        name: interviews.name,
        subject: interviews.subject,
        timeLimit: interviews.timeLimit,
        isActive: interviews.isActive,
        createdBy: interviews.createdBy,
        createdAt: interviews.createdAt,
        updatedAt: interviews.updatedAt,
        questionCount: sql<number>`count(distinct ${interviewQuestions.id})`,
        responseCount: sql<number>`count(distinct ${interviewResponses.id})`,
      })
      .from(interviews)
      .leftJoin(interviewQuestions, eq(interviews.id, interviewQuestions.interviewId))
      .leftJoin(interviewResponses, eq(interviews.id, interviewResponses.interviewId))
      .groupBy(
        interviews.id,
        interviews.name,
        interviews.subject,
        interviews.timeLimit,
        interviews.isActive,
        interviews.createdBy,
        interviews.createdAt,
        interviews.updatedAt
      )
      .orderBy(desc(interviews.createdAt));

    // Apply filter if createdBy is provided
    if (createdBy) {
      query = query.where(eq(interviews.createdBy, createdBy)) as typeof query;
    }

    const result = await query;

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
