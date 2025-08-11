"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const ReactMediaRecorder = dynamic(
  () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
  {
    ssr: false,
  }
);

const Interviewee = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [, setTotalQuestions] = useState<string>("3+ adaptive");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const recorderRef = useRef<{
    startRecording?: () => void;
    stopRecording?: () => void;
    clearBlobUrl?: () => void;
    status?: string;
  }>({});
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start interview function
  const startInterview = useCallback(async () => {
    try {
      const response = await fetch("/api/audio-upload", {
        method: "GET",
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentQuestion(result.firstQuestion);
        setTotalQuestions(result.totalQuestions || "3+ adaptive");
        setInterviewStarted(true);
        setQuestionCount(1);
        setInterviewComplete(false);
        setEvaluation("");
        setScore(0);
        setQuestionsAsked([result.firstQuestion]);
        console.log("Interview started:", result);
      } else {
        console.error("Failed to start interview");
        alert("Failed to start interview. Please try again.");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Error starting interview. Please try again.");
    }
  }, []);

  const sendAudioToAPI = useCallback(
    async (audioUrl: string, duration: number) => {
      setIsProcessing(true);

      try {
        console.log("Fetching audio from URL:", audioUrl);

        // Fetch the blob from the URL
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();

        console.log("Audio blob:", {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: duration,
        });

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;

            if (!base64Audio) {
              console.error("Failed to read audio file");
              return;
            }

            // Remove the data URL prefix to get pure base64
            const base64Data = base64Audio.split(",")[1];

            if (!base64Data) {
              console.error("Failed to extract base64 data");
              return;
            }

            console.log("Base64 data length:", base64Data.length);

            const payload = {
              audio: base64Data,
              mimeType: audioBlob.type,
              duration: duration,
              questionCount: questionCount,
              questionsAsked: questionsAsked,
            };

            console.log("Sending payload:", {
              audioLength: payload.audio.length,
              mimeType: payload.mimeType,
              duration: payload.duration,
            });

            const apiResponse = await fetch("/api/audio-upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (apiResponse.ok) {
              const result = await apiResponse.json();
              console.log("Audio processed successfully:", result);

              // Update the question with AI response
              if (result.nextQuestion) {
                if (result.isEvaluation) {
                  setEvaluation(result.nextQuestion);
                  setScore(result.score || 0);
                  setInterviewComplete(true);
                } else {
                  setCurrentQuestion(result.nextQuestion);
                  setQuestionCount(
                    result.data?.questionCount || questionCount + 1
                  );
                  setQuestionsAsked(
                    result.data?.questionsAsked || [
                      ...questionsAsked,
                      result.nextQuestion,
                    ]
                  );
                }
              }

              // Clear the current recording after successful submission
              if (recorderRef.current.clearBlobUrl) {
                recorderRef.current.clearBlobUrl();
              }
            } else {
              const errorText = await apiResponse.text();
              console.error("Failed to process audio:", errorText);
              alert("Failed to send audio. Check console for details.");
            }
          } catch (error) {
            console.error("Error in reader.onloadend:", error);
            alert("Error processing audio file.");
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          console.error("FileReader error");
          setIsProcessing(false);
          alert("Error reading audio file.");
        };

        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("Error sending audio:", error);
        setIsProcessing(false);
        alert("Error sending audio. Check console for details.");
      }
    },
    [questionCount, questionsAsked]
  );

  // Handle spacebar recording (only during interview)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !isSpacePressed &&
        interviewStarted &&
        !interviewComplete &&
        (currentStatus === "idle" || currentStatus === "stopped")
      ) {
        event.preventDefault();
        setIsSpacePressed(true);
        if (recorderRef.current.clearBlobUrl)
          recorderRef.current.clearBlobUrl();
        if (recorderRef.current.startRecording)
          recorderRef.current.startRecording();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isSpacePressed) {
        event.preventDefault();
        setIsSpacePressed(false);
        if (recorderRef.current.stopRecording)
          recorderRef.current.stopRecording();
      }
    };

    if (interviewStarted && !interviewComplete) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed, currentStatus, interviewStarted, interviewComplete]);

  // Handle duration timer based on recording status (start timer only when actually recording)
  useEffect(() => {
    if (currentStatus === "recording") {
      // Reset duration and start timer only when recording actually starts
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop duration timer when recording stops
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [currentStatus]);

  // Handle audio metadata loading when media URL changes
  useEffect(() => {
    if (currentMediaUrl && audioRef.current) {
      // Reset duration
      setAudioDuration(0);

      // Force load metadata
      audioRef.current.load();

      // Try multiple times to get duration
      const tryGetDuration = (attempts = 0) => {
        if (attempts > 10) return; // Give up after 10 attempts

        setTimeout(() => {
          if (
            audioRef.current &&
            audioRef.current.duration &&
            !isNaN(audioRef.current.duration)
          ) {
            setAudioDuration(audioRef.current.duration);
          } else {
            tryGetDuration(attempts + 1);
          }
        }, 50 * (attempts + 1)); // Increasing delay
      };

      tryGetDuration();
    }
  }, [currentMediaUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle audio metadata loading to get duration
  const handleAudioMetadataLoaded = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "idle":
        return "Hold SPACEBAR to record";
      case "acquiring_media":
        return "Getting microphone access...";
      case "recording":
        return "Recording...";
      case "stopped":
        return "Recording stopped";
      case "permission_denied":
        return "Microphone permission denied";
      default:
        return "Ready";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Interview Platform</h1>

      {!interviewStarted ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to the Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left ">
              <p className="text-lg mb-4 px-2">
                You are about to start an AI-powered interview
              </p>
              <div className="text-left px-4">
                <p className="text-sm text-gray-600 mb-2">
                  • The AI will ask you <strong>3+ questions</strong> adaptively
                  based on your responses
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • Questions are selected randomly from different topics
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • If you give incomplete answers, AI will ask follow-up
                  questions
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  • If you can&apos;t answer a question, just say so and AI will
                  switch topics
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  • After thorough assessment, you&apos;ll receive a score and
                  detailed feedback
                </p>
              </div>
              <Button onClick={startInterview} className="px-8 py-3 text-lg">
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Interview Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interview Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Question {questionCount} (Adaptive Interview)
                </span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    interviewComplete
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {interviewComplete ? "Complete" : "In Progress"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((questionCount / 6) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progress based on your responses (minimum 3 questions)
              </p>
            </CardContent>
          </Card>

          {/* Current Question */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-lg font-medium text-blue-900">
                  {currentQuestion || "Loading question..."}
                </p>
              </div>
              {!interviewComplete && (
                <p className="text-sm text-gray-600 mt-3">
                  💡 Take your time to think, then hold SPACEBAR to record your
                  answer.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ReactMediaRecorder
        audio={true}
        video={false}
        askPermissionOnMount={true}
        blobPropertyBag={{
          type: "audio/wav",
        }}
        mediaRecorderOptions={{
          audioBitsPerSecond: 128000,
        }}
        render={({
          status,
          startRecording,
          stopRecording,
          mediaBlobUrl,
          clearBlobUrl,
        }) => {
          // Update recorder ref and status when render prop values change
          recorderRef.current = {
            startRecording,
            stopRecording,
            clearBlobUrl,
            status,
          };

          // Update current status to trigger effects
          if (currentStatus !== status) {
            setCurrentStatus(status);
          }

          // Update media URL when it changes
          if (currentMediaUrl !== mediaBlobUrl) {
            setCurrentMediaUrl(mediaBlobUrl || "");
          }

          const handleSendAudio = async () => {
            if (!mediaBlobUrl) {
              console.error("No audio URL available");
              alert("No audio recording available to send.");
              return;
            }

            await sendAudioToAPI(mediaBlobUrl, recordingDuration);
          };

          const handleClearRecording = () => {
            if (clearBlobUrl) clearBlobUrl();
            setRecordingDuration(0);
          };

          return (
            <>
              {interviewStarted && !interviewComplete && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Record Your Answer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="mb-4">
                        <div
                          className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${
                            status === "recording"
                              ? "border-red-500 bg-red-50 animate-pulse"
                              : "border-gray-300 bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-16 h-16 rounded-full ${
                              status === "recording"
                                ? "bg-red-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-lg font-semibold">
                          {getStatusMessage(status)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration: {formatTime(recordingDuration)}
                        </p>
                      </div>

                      {isProcessing && (
                        <p className="text-blue-600">
                          Processing your answer...
                        </p>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      <p>• Hold SPACEBAR to start recording your answer</p>
                      <p>• Release SPACEBAR to stop recording</p>
                      <p>• Click Submit Answer to get the next question</p>
                    </div>

                    {mediaBlobUrl && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">
                          Your Recording:
                        </h3>
                        {audioDuration > 0 && (
                          <p className="text-sm text-gray-600 mb-2">
                            Duration: {formatTime(Math.floor(audioDuration))}
                          </p>
                        )}
                        <audio
                          ref={audioRef}
                          controls
                          preload="metadata"
                          className="w-full mb-4"
                          onLoadedMetadata={handleAudioMetadataLoaded}
                          onCanPlay={() => {
                            if (
                              audioRef.current &&
                              audioRef.current.duration &&
                              !isNaN(audioRef.current.duration)
                            ) {
                              setAudioDuration(audioRef.current.duration);
                            }
                          }}
                          onLoadedData={() => {
                            if (
                              audioRef.current &&
                              audioRef.current.duration &&
                              !isNaN(audioRef.current.duration)
                            ) {
                              setAudioDuration(audioRef.current.duration);
                            }
                          }}
                        >
                          <source src={mediaBlobUrl} type="audio/webm" />
                          <source src={mediaBlobUrl} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>

                        <div className="text-center space-x-4">
                          <Button
                            onClick={handleSendAudio}
                            disabled={isProcessing || !mediaBlobUrl}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? "Processing..." : "Submit Answer"}
                          </Button>

                          <Button
                            onClick={handleClearRecording}
                            disabled={isProcessing}
                            variant="outline"
                            className="px-6 py-2"
                          >
                            Record Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {interviewComplete && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Interview Complete!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-green-500 bg-green-50">
                          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-2xl">✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          Your Score
                        </h3>
                        <div className="text-6xl font-bold text-blue-600 mb-2">
                          {score}
                        </div>
                        <div className="text-lg text-gray-600">out of 30</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                score >= 24
                                  ? "bg-green-500"
                                  : score >= 18
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${(score / 30) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Text */}
                      {evaluation && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800">
                            Detailed Feedback
                          </h3>
                          <div className="text-sm text-gray-700 whitespace-pre-line">
                            {evaluation.replace("EVALUATION:", "").trim()}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-green-800">
                          Thank you for completing the interview!
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          Your responses have been evaluated and scored above.
                        </p>
                        <Button
                          onClick={startInterview}
                          variant="outline"
                          className="mt-4"
                        >
                          Take Interview Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default Interviewee;
