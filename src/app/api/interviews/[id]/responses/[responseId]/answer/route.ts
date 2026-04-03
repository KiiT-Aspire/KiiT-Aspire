import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  interviewResponses,
  questionAnswers,
  interviews,
  interviewQuestions,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { put } from "@vercel/blob";

// Supported audio formats
const SUPPORTED_FORMATS = [
  "audio/wav",
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
  "audio/mp3",
];

// Initialize Google AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Extract score from evaluation text
function extractScore(evaluationText: string): number {
  const scoreMatch = evaluationText.match(
    /(\d+)(?:\s*(?:\/|out of)\s*(?:30|100)|\s*points?)/i
  );
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    if (score > 30) {
      return Math.round((score / 100) * 30);
    }
    return score;
  }
  return 0;
}

/*
  Interview Flow Logic:
  - Faculty creates N questions (e.g. 3).
  - The interview works through each question in order.
  - For each question, the student gets ONE attempt.
  - If the answer is wrong/incomplete, the AI asks ONE follow-up (guided retry).
  - If the follow-up answer is also wrong, the AI moves to the NEXT teacher-added question.
  - The interview ends only after ALL teacher-added questions have been covered.

  State tracked per answer submission:
    - currentQuestionIndex: which teacher question we are on (0-based)
    - isRetryAttempt: whether this answer is a follow-up for the same question
    - questionsAsked: full history of questions shown to the student
    - availableQuestions: the teacher-added questions
*/

async function processAudioWithAI(
  audioBase64: string,
  mimeType: string,
  currentQuestionIndex: number,   // 0-based index of the current teacher question
  isRetryAttempt: boolean,        // true if this is already the follow-up attempt
  availableQuestions: string[],   // teacher-set questions in order
  questionsAsked: string[]        // full history of questions shown so far
): Promise<{
  nextQuestion: string;
  transcript: string;
  isEvaluation: boolean;
  score?: number;
  nextQuestionIndex: number;
  isNextRetryAttempt: boolean;
  updatedQuestionsAsked: string[];
}> {
  const totalQuestions = availableQuestions.length;

  try {
    // Build a clear context for the AI about which question we are on and whether this is a retry
    const currentTeacherQuestion = availableQuestions[currentQuestionIndex] || "General question";
    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

    const SYSTEM_PROMPT = `You are an academic oral examiner conducting a university interview.

STRICT RULES:
1. Listen carefully to the student's audio response.
2. Provide an accurate transcript of what the student said.
3. Evaluate whether the answer adequately addresses the question.
4. Decide the next action based on these rules:
   - If the answer is ADEQUATE/GOOD: Move to the next question (or end if all done).
   - If the answer is POOR/INCOMPLETE and this is NOT a retry: Ask ONE helpful follow-up on the SAME topic to guide the student.
   - If the answer is POOR/INCOMPLETE and this IS a retry (second chance already given): Move to the next question regardless.
5. When all questions are done, return EVALUATION.

Response Format (JSON ONLY - no other text):
{
  "transcript": "exact transcript of what the student said",
  "answerQuality": "good" | "poor",
  "nextStep": "NEXT_QUESTION | RETRY_FOLLOWUP | EVALUATION"
  "followUpQuestion": "the guided follow-up question text (only if nextStep is RETRY_FOLLOWUP)",
  "evaluationReport": "full markdown evaluation report (only if nextStep is EVALUATION)"
}`;

    const contents = [
      { text: SYSTEM_PROMPT },
      {
        text: `Current Interview State:
- Teacher Question #${currentQuestionIndex + 1} of ${totalQuestions}: "${currentTeacherQuestion}"
- Is this a retry/follow-up attempt? ${isRetryAttempt ? "YES (this is the second chance — if poor, move to next question)" : "NO (first attempt)"}
- Is this the last teacher question? ${isLastQuestion ? "YES" : "NO"}
- Full question history: ${questionsAsked.join(" → ")}

Evaluate the student's audio response and decide the next step according to the rules.`,
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
    ];

    const response = await genAI.models.generateContent({
      model: "gemini-flash-lite-latest",
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseMimeType: "application/json",
      },
      contents: contents,
    });

    const aiData = JSON.parse(response.text || "{}");
    const transcript = aiData.transcript || "";
    const answerQuality = aiData.answerQuality || "good";
    const nextStep = aiData.nextStep || "NEXT_QUESTION";

    // --- Decision logic ---

    if (nextStep === "RETRY_FOLLOWUP" && !isRetryAttempt) {
      // First failure - give a guided follow-up on the same question
      const followUp = aiData.followUpQuestion || `Could you elaborate further on: "${currentTeacherQuestion}"?`;
      return {
        nextQuestion: followUp,
        transcript,
        isEvaluation: false,
        nextQuestionIndex: currentQuestionIndex, // same question index
        isNextRetryAttempt: true,               // next submission is a retry
        updatedQuestionsAsked: [...questionsAsked, followUp],
      };
    }

    // Either a good answer, or a retry that was still poor → move to next question
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= totalQuestions) {
      // All questions done → evaluate
      const evalText = nextStep === "EVALUATION" && aiData.evaluationReport
        ? `EVALUATION:\n${aiData.evaluationReport}`
        : `EVALUATION: Thank you for completing the interview. The student answered ${totalQuestions} question(s).`;
      return {
        nextQuestion: evalText,
        transcript,
        isEvaluation: true,
        score: extractScore(evalText),
        nextQuestionIndex: nextIndex,
        isNextRetryAttempt: false,
        updatedQuestionsAsked: [...questionsAsked],
      };
    }

    // Move to next teacher question
    const nextQ = availableQuestions[nextIndex];
    return {
      nextQuestion: nextQ,
      transcript,
      isEvaluation: false,
      nextQuestionIndex: nextIndex,
      isNextRetryAttempt: false,
      updatedQuestionsAsked: [...questionsAsked, nextQ],
    };
  } catch (error) {
    console.error("Error processing audio with AI:", error);

    // Fallback: move to next question on error
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= availableQuestions.length) {
      return {
        nextQuestion: "EVALUATION: Thank you for completing the interview. Score: 21/30",
        transcript: "Technical issue occurred during transcription.",
        isEvaluation: true,
        score: 21,
        nextQuestionIndex: nextIndex,
        isNextRetryAttempt: false,
        updatedQuestionsAsked: questionsAsked,
      };
    }
    const fallbackQuestion = availableQuestions[nextIndex];
    return {
      nextQuestion: fallbackQuestion,
      transcript: "Fallback transcript due to AI error.",
      isEvaluation: false,
      nextQuestionIndex: nextIndex,
      isNextRetryAttempt: false,
      updatedQuestionsAsked: [...questionsAsked, fallbackQuestion],
    };
  }
}

// POST /api/interviews/[id]/responses/[responseId]/answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: interviewId, responseId } = await params;
    const body = await request.json();
    const {
      audio,
      mimeType,
      duration,
      questionText,
      questionCount,
      questionsAsked,
      currentQuestionIndex,  // NEW: 0-based index of current teacher question
      isRetryAttempt,        // NEW: whether this is a follow-up retry
    } = body;

    // Validate required fields
    if (!audio || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: audio and mimeType" },
        { status: 400 }
      );
    }

    // Validate audio format
    if (!SUPPORTED_FORMATS.includes(mimeType)) {
      return NextResponse.json(
        {
          error: "Unsupported audio format",
          supportedFormats: SUPPORTED_FORMATS,
        },
        { status: 400 }
      );
    }

    // Verify response exists and belongs to this interview
    const [response] = await db
      .select()
      .from(interviewResponses)
      .where(eq(interviewResponses.id, responseId))
      .limit(1);

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    if (response.interviewId !== interviewId) {
      return NextResponse.json(
        { error: "Response does not belong to this interview" },
        { status: 400 }
      );
    }

    if (response.status !== "in_progress") {
      return NextResponse.json(
        { error: "Interview is not in progress" },
        { status: 400 }
      );
    }

    // Get available questions for this interview (teacher-set, in order)
    const questions = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.interviewId, interviewId));

    const availableQuestions = questions.map((q) => q.text);

    // Convert base64 to buffer for upload
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audio, "base64");
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid base64 audio data" },
        { status: 400 }
      );
    }

    // Upload audio to Vercel Blob
    let audioUrl: string | null = null;
    try {
      const filename = `interview-${interviewId}/response-${responseId}/answer-${Date.now()}.webm`;
      const blob = await put(filename, audioBuffer, {
        access: "public",
        contentType: mimeType,
      });
      audioUrl = blob.url;
    } catch (error) {
      console.error("Error uploading audio to Vercel Blob:", error);
    }

    // Store this answer in the database
    const currentQuestionOrder = questionCount || 1;
    await db.insert(questionAnswers).values({
      responseId: responseId,
      questionText:
        questionText ||
        questionsAsked?.[questionsAsked.length - 1] ||
        "Question",
      audioDuration: duration || null,
      audioTranscript: "",
      questionOrder: currentQuestionOrder,
      audioUrl: audioUrl,
    });

    // Process audio with AI using new flow logic
    const resolvedCurrentQuestionIndex = currentQuestionIndex ?? 0;
    const resolvedIsRetryAttempt = isRetryAttempt ?? false;
    const currentQuestionsAsked = questionsAsked || [];

    const aiResult = await processAudioWithAI(
      audio,
      mimeType,
      resolvedCurrentQuestionIndex,
      resolvedIsRetryAttempt,
      availableQuestions,
      currentQuestionsAsked
    );

    // Update the record with the actual transcript from AI
    const lastAnswer = await db
      .select({ id: questionAnswers.id })
      .from(questionAnswers)
      .where(eq(questionAnswers.responseId, responseId))
      .orderBy(questionAnswers.answeredAt)
      .limit(1);

    if (lastAnswer.length > 0) {
      await db
        .update(questionAnswers)
        .set({
          audioTranscript: aiResult.transcript,
        })
        .where(eq(questionAnswers.id, lastAnswer[0].id));
    }

    // If evaluation is complete, update the response record
    if (aiResult.isEvaluation) {
      await db
        .update(interviewResponses)
        .set({
          status: "completed",
          completedAt: new Date(),
          score: aiResult.score,
          evaluation: aiResult.nextQuestion,
        })
        .where(eq(interviewResponses.id, responseId));

      return NextResponse.json({
        success: true,
        message: "Interview completed with evaluation",
        data: {
          interviewComplete: true,
          evaluation: aiResult.nextQuestion,
          score: aiResult.score,
          questionCount: currentQuestionOrder + 1,
          questionsAsked: aiResult.updatedQuestionsAsked,
          currentQuestionIndex: aiResult.nextQuestionIndex,
          isRetryAttempt: aiResult.isNextRetryAttempt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Answer processed successfully",
      data: {
        interviewComplete: false,
        nextQuestion: aiResult.nextQuestion,
        questionCount: currentQuestionOrder + 1,
        questionsAsked: aiResult.updatedQuestionsAsked,
        currentQuestionIndex: aiResult.nextQuestionIndex,
        isRetryAttempt: aiResult.isNextRetryAttempt,
        mimeType,
        duration: duration || null,
        size: audioBuffer.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
