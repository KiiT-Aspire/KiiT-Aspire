import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { interviewResponses, questionAnswers, interviews, interviewQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

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
  apiKey: process.env.GEMINI_API_KEY,
});

// Extract score from evaluation text
function extractScore(evaluationText: string): number {
  const scoreMatch = evaluationText.match(/(\d+)(?:\s*(?:\/|out of)\s*(?:30|100)|\s*points?)/i);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    if (score > 30) {
      return Math.round((score / 100) * 30);
    }
    return score;
  }
  return 0;
}

// Process audio with AI
async function processAudioWithAI(
  audioBase64: string,
  mimeType: string,
  currentQuestionCount: number,
  currentQuestionsAsked: string[],
  availableQuestions: string[]
): Promise<{
  nextQuestion: string;
  isEvaluation: boolean;
  score?: number;
  questionCount: number;
  questionsAsked: string[];
}> {
  try {
    const SYSTEM_PROMPT = `You are an experienced technical interviewer conducting an adaptive interview.

Available Questions:
${availableQuestions.map((q, index) => `${index + 1}. ${q}`).join("\n")}

Interview Rules:
- Ask 2-4 questions total based on response quality
- If answer is WRONG/INCOMPLETE: Ask ONE follow-up on same topic, then move on
- If answer is GOOD: Move to next topic
- If candidate can't answer: Switch to different topic immediately
- Stop when you have sufficient assessment (minimum 3 questions)

Response Format:
- Return ONLY the next question text
- When complete, return "EVALUATION:" followed by detailed feedback

Evaluation:
- Score out of 30 points
- Consider technical accuracy, depth, and communication
- Provide specific feedback and topic-wise performance summary`;

    const contents = [
      { text: SYSTEM_PROMPT },
      {
        text: `Interview Context:
- Question ${currentQuestionCount} | Total asked: ${currentQuestionsAsked.length}
- Previous: "${currentQuestionsAsked[currentQuestionsAsked.length - 1] || "None"}"
- History: ${currentQuestionsAsked.length > 0 ? currentQuestionsAsked.join(" | ") : "None"}

Based on the audio response, decide: next question or "EVALUATION:" if assessment complete.`,
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
    ];

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        thinkingConfig: {
          thinkingBudget: 512,
        },
      },
      contents: contents,
    });

    const aiResponse = response.text || "Could you please elaborate on your previous answer?";

    if (aiResponse.startsWith("EVALUATION:")) {
      return {
        nextQuestion: aiResponse,
        isEvaluation: true,
        score: extractScore(aiResponse),
        questionCount: currentQuestionCount,
        questionsAsked: currentQuestionsAsked,
      };
    } else {
      const newQuestionCount = currentQuestionCount + 1;
      const newQuestionsAsked = [...currentQuestionsAsked, aiResponse];
      return {
        nextQuestion: aiResponse,
        isEvaluation: false,
        questionCount: newQuestionCount,
        questionsAsked: newQuestionsAsked,
      };
    }
  } catch (error) {
    console.error("Error processing audio with AI:", error);
    
    if (currentQuestionsAsked.length >= 5) {
      return {
        nextQuestion: "EVALUATION: Thank you for completing the interview. Score: 21/30",
        isEvaluation: true,
        score: 21,
        questionCount: currentQuestionCount,
        questionsAsked: currentQuestionsAsked,
      };
    } else {
      const fallbackQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)] || "Can you explain your experience with this subject?";
      return {
        nextQuestion: fallbackQuestion,
        isEvaluation: false,
        questionCount: currentQuestionCount + 1,
        questionsAsked: [...currentQuestionsAsked, fallbackQuestion],
      };
    }
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
    const { audio, mimeType, duration, questionText, questionCount, questionsAsked } = body;

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
        { error: "Unsupported audio format", supportedFormats: SUPPORTED_FORMATS },
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
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    if (response.interviewId !== interviewId) {
      return NextResponse.json({ error: "Response does not belong to this interview" }, { status: 400 });
    }

    if (response.status !== "in_progress") {
      return NextResponse.json({ error: "Interview is not in progress" }, { status: 400 });
    }

    // Get available questions for this interview
    const questions = await db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.interviewId, interviewId));

    const availableQuestions = questions.map(q => q.text);

    // Store this answer in the database
    const currentQuestionOrder = questionCount || 1;
    await db.insert(questionAnswers).values({
      responseId: responseId,
      questionText: questionText || questionsAsked?.[questionsAsked.length - 1] || "Question",
      audioDuration: duration || null,
      questionOrder: currentQuestionOrder,
      // audioUrl and audioTranscript can be added later if you implement storage
    });

    // Process audio with AI
    const currentQuestionCount = questionCount || 1;
    const currentQuestionsAsked = questionsAsked || [];

    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audio, "base64");
    } catch (error) {
      return NextResponse.json({ error: "Invalid base64 audio data" }, { status: 400 });
    }

    const aiResult = await processAudioWithAI(
      audio,
      mimeType,
      currentQuestionCount,
      currentQuestionsAsked,
      availableQuestions
    );

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
          questionCount: aiResult.questionCount,
          questionsAsked: aiResult.questionsAsked,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Answer processed successfully",
      data: {
        interviewComplete: false,
        nextQuestion: aiResult.nextQuestion,
        questionCount: aiResult.questionCount,
        questionsAsked: aiResult.questionsAsked,
        mimeType,
        duration: duration || null,
        size: audioBuffer.length,
        processedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
