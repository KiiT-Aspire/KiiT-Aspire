import { GoogleGenAI, Modality, TurnCoverage, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Initialize the Google GenAI client with your API key
    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });

    // Set expiration time to 30 minutes from now
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Create ephemeral token with configuration constraints
    const token = await client.authTokens.create({
      config: {
        uses: 1, // Default usage limit
        expireTime: expireTime,
        liveConnectConstraints: {
          model: "gemini-3.1-flash-live-preview",
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
            systemInstruction: `You are a helpful AI interviewer. Conduct professional interviews by asking relevant questions about the candidate's experience, skills, and qualifications. Be encouraging and provide constructive feedback.`,
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {
              languageCodes: ["en-IN"],
            },
            speechConfig: {
              languageCode: "en-IN",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Puck",
                },
              },
            },
            realtimeInputConfig: {
              turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
            },
            contextWindowCompression: {
              triggerTokens: "25600",
              slidingWindow: { targetTokens: "12800" },
            },
          },
        },
        httpOptions: {
          apiVersion: "v1alpha",
        },
      },
    });

    return NextResponse.json({
      success: true,
      token: token.name,
      expiresAt: expireTime,
    });
  } catch (error) {
    console.error("Error creating ephemeral token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ephemeral token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
