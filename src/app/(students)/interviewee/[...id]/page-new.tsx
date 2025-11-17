"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

const ReactMediaRecorder = dynamic(
  () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
  { ssr: false }
);

const IntervieweePage = () => {
  const params = useParams();
  const interviewId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [showNameForm, setShowNameForm] = useState(true);
  
  // Interview state
  const [responseId, setResponseId] = useState<string>("");
  const [interviewName, setInterviewName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  
  const recorderRef = useRef<any>({});
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start interview function
  const startInterview = useCallback(async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error("Please enter your name and email");
      return;
    }

    if (!interviewId) {
      toast.error("Invalid interview link");
      return;
    }

    try {
      const response = await fetch(`/api/interviews/${interviewId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setResponseId(result.data.responseId);
          setCurrentQuestion(result.data.firstQuestion);
          setInterviewName(result.data.interviewName || "Interview");
          setShowNameForm(false);
          setInterviewStarted(true);
          setQuestionCount(1);
          setQuestionsAsked([result.data.firstQuestion]);
          toast.success("Interview started!");
        } else {
          toast.error(result.message || "Failed to start interview");
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start interview");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Error starting interview. Please try again.");
    }
  }, [studentName, studentEmail, interviewId]);

  const sendAudioToAPI = useCallback(
    async (audioUrl: string, duration: number) => {
      if (!responseId || !interviewId) {
        toast.error("Interview session not found");
        return;
      }

      setIsProcessing(true);

      try {
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(",")[1];

            if (!base64Data) {
              toast.error("Failed to process audio");
              setIsProcessing(false);
              return;
            }

            const apiResponse = await fetch(
              `/api/interviews/${interviewId}/responses/${responseId}/answer`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audio: base64Data,
                  mimeType: audioBlob.type,
                  duration: duration,
                  questionText: currentQuestion,
                  questionCount: questionCount,
                  questionsAsked: questionsAsked,
                }),
              }
            );

            const result = await apiResponse.json();

            if (result.success) {
              if (result.data.interviewComplete) {
                setInterviewComplete(true);
                setEvaluation(result.data.evaluation || "");
                setScore(result.data.score || 0);
                toast.success("Interview completed!");
              } else if (result.data.nextQuestion) {
                setCurrentQuestion(result.data.nextQuestion);
                setQuestionCount((prev) => prev + 1);
                setQuestionsAsked((prev) => [...prev, result.data.nextQuestion]);
                toast.success("Answer recorded!");
              }
            } else {
              toast.error(result.message || "Failed to process answer");
            }
          } catch (error) {
            console.error("Error sending audio:", error);
            toast.error("Error processing your answer");
          } finally {
            setIsProcessing(false);
          }
        };

        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("Error reading audio:", error);
        toast.error("Error processing audio file");
        setIsProcessing(false);
      }
    },
    [responseId, interviewId, currentQuestion, questionCount, questionsAsked]
  );

  // Handle spacebar for recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !isSpacePressed &&
        interviewStarted &&
        !interviewComplete &&
        currentStatus === "idle"
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
        recorderRef.current?.startRecording?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(false);
        recorderRef.current?.stopRecording?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed, interviewStarted, interviewComplete, currentStatus]);

  // Track recording duration
  useEffect(() => {
    if (currentStatus === "recording") {
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [currentStatus]);

  // Show name/email form
  if (showNameForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Toaster position="top-right" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to the Interview</CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Please enter your details to begin
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={startInterview}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!studentName.trim() || !studentEmail.trim()}
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion screen
  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <Toaster position="top-right" />
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-green-600">
              Interview Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600 mb-2">{score}</p>
              <p className="text-gray-600">Your Score</p>
            </div>

            {evaluation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Evaluation</h3>
                <p className="text-gray-700">{evaluation}</p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Interview Summary</h3>
              <p className="text-gray-700">
                Questions Answered: <span className="font-medium">{questionCount}</span>
              </p>
            </div>

            <p className="text-center text-gray-600">
              Thank you for participating in this interview!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show interview screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{interviewName}</CardTitle>
            <p className="text-gray-600">Question {questionCount}</p>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <p className="text-lg font-medium text-gray-800">{currentQuestion}</p>
            </div>

            <ReactMediaRecorder
              audio
              onStop={(blobUrl: string, blob: Blob) => {
                console.log("Recording stopped:", { blobUrl, blob });
                setCurrentMediaUrl(blobUrl);
                
                const audio = new Audio(blobUrl);
                audio.onloadedmetadata = () => {
                  const duration = Math.floor(audio.duration);
                  setAudioDuration(duration);
                  sendAudioToAPI(blobUrl, duration);
                };
              }}
              render={({ status, startRecording, stopRecording }) => {
                recorderRef.current = { startRecording, stopRecording, status };
                setCurrentStatus(status);

                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Press and hold <kbd className="px-2 py-1 bg-gray-200 rounded">SPACE</kbd> to record your answer
                      </p>
                      
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                        status === "recording" 
                          ? "bg-red-500 animate-pulse" 
                          : isProcessing 
                          ? "bg-yellow-500" 
                          : "bg-gray-300"
                      }`}>
                        {status === "recording" && (
                          <span className="text-white font-semibold">{recordingDuration}s</span>
                        )}
                        {isProcessing && (
                          <span className="text-white text-sm">Processing...</span>
                        )}
                      </div>

                      <p className="text-lg font-medium">
                        {status === "recording" 
                          ? "Recording..." 
                          : isProcessing 
                          ? "Processing your answer..." 
                          : "Ready to record"}
                      </p>
                    </div>

                    {currentMediaUrl && (
                      <div className="mt-4">
                        <audio ref={audioRef} src={currentMediaUrl} controls className="w-full" />
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntervieweePage;
