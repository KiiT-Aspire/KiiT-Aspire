import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { subject, count = 5 } = await request.json();

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const prompt = `Generate ${count} technical interview questions for the subject: "${subject}". 
    Return ONLY a JSON array of objects with the following structure:
    [
      { "id": "q1", "text": "Question text here", "subject": "${subject}" }
    ]
    Make sure each id is unique (e.g. q1, q2). Do not include any other text or markdown block wrappers. Respond straight with the valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
      contents: prompt,
    });

    const textResponse = response.text || "[]";
    // Usually gemini can still wrap things in ```json ... ``` so we parse carefully
    let cleanedJson = textResponse.trim();
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const questions = JSON.parse(cleanedJson.trim());

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Error generating AI questions:", error);
    return NextResponse.json({ error: "Failed to generate questions", details: (error as Error).message }, { status: 500 });
  }
}
