import { NextRequest, NextResponse } from "next/server";
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

// Interview questions for Computer Networks
const INTERVIEW_QUESTIONS = [
  "What is a stack's main rule?",
  "Which data structure uses FIFO?",
  "Time complexity of binary search?",
  "Name one sorting algorithm with O(n²) complexity.",
  "What does a hash table store data as?",
];

// System prompt for the AI interviewer
const SYSTEM_PROMPT = `You are an experienced technical interviewer conducting a Data Structures & Algorithms interview.

Available Questions:
${INTERVIEW_QUESTIONS.map((q, index) => `${index + 1}. ${q}`).join("\n")}

Interview Rules:
- Ask 3-6 questions total based on response quality
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
- Provide specific feedback and topic-wise performance summary

Goal: Efficiently assess candidate's DSA knowledge through adaptive questioning.`;

// Initialize Google AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function processAudioWithAI(
  audioBase64: string,
  mimeType: string,
  currentQuestionCount: number,
  currentQuestionsAsked: string[]
): Promise<{
  nextQuestion: string;
  isEvaluation: boolean;
  score?: number;
  questionCount: number;
  questionsAsked: string[];
}> {
  try {
    // Prepare the content for the AI model with enhanced context
    const contents = [
      { text: SYSTEM_PROMPT },
      {
        text: `Interview Context:
- Question ${currentQuestionCount} | Total asked: ${
          currentQuestionsAsked.length
        }
- Previous: "${
          currentQuestionsAsked[currentQuestionsAsked.length - 1] || "None"
        }"
- History: ${
          currentQuestionsAsked.length > 0
            ? currentQuestionsAsked.join(" | ")
            : "None"
        }

Based on the audio response, decide: next question or "EVALUATION:" if assessment complete.`,
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
    ];

    // Generate response using Gemini model
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        thinkingConfig: {
          thinkingBudget: 512,
        },
      },
      contents: contents,
    });

    const aiResponse =
      response.text || "Could you please elaborate on your previous answer?";

    // Check if this is an evaluation
    if (aiResponse.startsWith("EVALUATION:")) {
      return {
        nextQuestion: aiResponse,
        isEvaluation: true,
        score: extractScore(aiResponse),
        questionCount: currentQuestionCount,
        questionsAsked: currentQuestionsAsked,
      };
    } else {
      // This is a new question (could be follow-up on same topic or new topic)
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

    // Enhanced fallback behavior
    const questionLength = currentQuestionsAsked.length;

    // If we've asked enough questions, provide evaluation
    if (questionLength >= 5) {
      return {
        nextQuestion:
          "EVALUATION: Thank you for completing the interview. Due to a technical issue, we'll review your responses manually. Based on our interaction, you demonstrated engagement with the technical topics. Score: 21/30 - Please schedule a follow-up session for detailed assessment.",
        isEvaluation: true,
        score: 21,
        questionCount: currentQuestionCount,
        questionsAsked: currentQuestionsAsked,
      };
    } else {
      // Ask next fallback question from a different topic
      const usedQuestions = currentQuestionsAsked
        .map((q) =>
          INTERVIEW_QUESTIONS.findIndex((iq) => q.includes(iq.split(" ")[0]))
        )
        .filter((i) => i !== -1);

      const availableQuestions = INTERVIEW_QUESTIONS.filter(
        (_, index) => !usedQuestions.includes(index)
      );

      const fallbackQuestion =
        availableQuestions.length > 0
          ? availableQuestions[
              Math.floor(Math.random() * availableQuestions.length)
            ]
          : "Can you explain what you studied in this subject and how it relates to real-world applications?";

      const newQuestionCount = currentQuestionCount + 1;
      const newQuestionsAsked = [...currentQuestionsAsked, fallbackQuestion];

      return {
        nextQuestion: fallbackQuestion,
        isEvaluation: false,
        questionCount: newQuestionCount,
        questionsAsked: newQuestionsAsked,
      };
    }
  }
}

function extractScore(evaluationText: string): number {
  // Try to extract score from evaluation text - updated for score out of 30
  const scoreMatch = evaluationText.match(
    /(\d+)(?:\s*(?:\/|out of)\s*(?:30|100)|\s*points?)/i
  );

  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    // If score seems to be out of 100, convert to out of 30
    if (score > 30) {
      return Math.round((score / 100) * 30);
    }
    return score;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      audio,
      mimeType,
      duration,
      questionCount: clientQuestionCount,
      questionsAsked: clientQuestionsAsked,
    } = body;

    // Validate required fields
    if (!audio || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: audio and mimeType" },
        { status: 400 }
      );
    }

    // Use client-provided state or defaults
    const currentQuestionCount = clientQuestionCount || 1;
    const currentQuestionsAsked = clientQuestionsAsked || [
      INTERVIEW_QUESTIONS[0],
    ];

    // Validate audio format - accept multiple formats
    if (!SUPPORTED_FORMATS.includes(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported audio format. Supported formats: " +
            SUPPORTED_FORMATS.join(", "),
          supportedFormats: SUPPORTED_FORMATS,
        },
        { status: 400 }
      );
    }

    // Validate base64 data
    if (typeof audio !== "string") {
      return NextResponse.json(
        { error: "Audio data must be a base64 string" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer for validation
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audio, "base64");
    } catch (error) {
      console.error("Base64 conversion error:", error);
      return NextResponse.json(
        { error: "Invalid base64 audio data" },
        { status: 400 }
      );
    }

    // Log successful audio receipt
    console.log(`Audio received successfully:`, {
      mimeType,
      duration: duration || "unknown",
      size: audioBuffer.length,
      receivedAt: new Date().toISOString(),
      questionCount: currentQuestionCount,
    });

    // Process audio with AI to get the next interview question
    const aiResult = await processAudioWithAI(
      audio,
      mimeType,
      currentQuestionCount,
      currentQuestionsAsked
    );

    // Return success response with the next question or evaluation
    return NextResponse.json({
      success: true,
      message: aiResult.isEvaluation
        ? "Interview completed with evaluation"
        : "Audio processed successfully",
      nextQuestion: aiResult.nextQuestion,
      isEvaluation: aiResult.isEvaluation,
      score: aiResult.score,
      data: {
        mimeType,
        duration: duration || null,
        size: audioBuffer.length,
        processedAt: new Date().toISOString(),
        questionCount: aiResult.questionCount,
        questionsAsked: aiResult.questionsAsked,
        totalQuestions: "3+ adaptive",
      },
    });
  } catch (error) {
    console.error("Error processing audio upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET request to start/reset interview
export async function GET() {
  // Select a random question to start with
  const randomIndex = Math.floor(Math.random() * INTERVIEW_QUESTIONS.length);
  const firstQuestion = INTERVIEW_QUESTIONS[randomIndex];

  return NextResponse.json({
    success: true,
    message: "Interview session started",
    firstQuestion: firstQuestion,
    totalQuestions: "3+ (adaptive based on responses)",
    isFirstQuestion: true,
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to upload audio." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to upload audio." },
    { status: 405 }
  );
}
