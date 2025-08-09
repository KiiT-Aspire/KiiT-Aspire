import { NextRequest, NextResponse } from "next/server";

// Supported audio formats
const SUPPORTED_FORMATS = [
  "audio/wav",
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio, mimeType, duration } = body;

    // Validate required fields
    if (!audio || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: audio and mimeType" },
        { status: 400 }
      );
    }

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

    // Log successful audio receipt (without saving)
    console.log(`Audio received successfully:`, {
      mimeType,
      duration: duration || "unknown",
      size: audioBuffer.length,
      receivedAt: new Date().toISOString(),
    });

    // Process audio here (e.g., send to speech recognition service, etc.)
    // For now, we'll just acknowledge receipt

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Audio received and processed successfully",
      data: {
        mimeType,
        duration: duration || null,
        size: audioBuffer.length,
        processedAt: new Date().toISOString(),
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

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to upload audio." },
    { status: 405 }
  );
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
