import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviewResponses, questionAnswers } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// GET /api/interviews/[id]/responses - Get All Responses for Interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const status = searchParams.get("status"); // 'completed', 'in_progress', 'abandoned'

    // Build where conditions
    const whereConditions = status
      ? and(
          eq(interviewResponses.interviewId, interviewId),
          eq(interviewResponses.status, status)
        )
      : eq(interviewResponses.interviewId, interviewId);

    // Build base query
    const responses = await db
      .select({
        id: interviewResponses.id,
        interviewId: interviewResponses.interviewId,
        studentId: interviewResponses.studentId,
        studentName: interviewResponses.studentName,
        studentEmail: interviewResponses.studentEmail,
        startedAt: interviewResponses.startedAt,
        completedAt: interviewResponses.completedAt,
        score: interviewResponses.score,
        status: interviewResponses.status,
        answerCount: sql<number>`count(${questionAnswers.id})`,
      })
      .from(interviewResponses)
      .leftJoin(questionAnswers, eq(interviewResponses.id, questionAnswers.responseId))
      .where(whereConditions)
      .groupBy(
        interviewResponses.id,
        interviewResponses.interviewId,
        interviewResponses.studentId,
        interviewResponses.studentName,
        interviewResponses.studentEmail,
        interviewResponses.startedAt,
        interviewResponses.completedAt,
        interviewResponses.score,
        interviewResponses.status
      )
      .orderBy(desc(interviewResponses.startedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewResponses)
      .where(eq(interviewResponses.interviewId, interviewId));

    // Calculate statistics
    const stats = await db
      .select({
        totalResponses: sql<number>`count(*)`,
        completedCount: sql<number>`count(*) filter (where ${interviewResponses.status} = 'completed')`,
        inProgressCount: sql<number>`count(*) filter (where ${interviewResponses.status} = 'in_progress')`,
        abandonedCount: sql<number>`count(*) filter (where ${interviewResponses.status} = 'abandoned')`,
        averageScore: sql<number>`avg(${interviewResponses.score}) filter (where ${interviewResponses.score} is not null)`,
      })
      .from(interviewResponses)
      .where(eq(interviewResponses.interviewId, interviewId));

    return NextResponse.json({
      success: true,
      data: responses,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
      statistics: stats[0] || {
        totalResponses: 0,
        completedCount: 0,
        inProgressCount: 0,
        abandonedCount: 0,
        averageScore: 0,
      },
    });

  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
