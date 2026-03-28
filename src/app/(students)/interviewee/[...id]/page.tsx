"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { Clock, Mic, MicOff, CheckCircle2, AlertCircle, Play, Square, Loader2, Sparkles } from "lucide-react";

// For hydration issues with media recorder
const ReactMediaRecorder = dynamic(
  () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
  { ssr: false }
);

export default function IntervieweePage() {
  const params = useParams();
  const interviewId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [showNameForm, setShowNameForm] = useState(false);
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);
  
  const [interviewDetails, setInterviewDetails] = useState<{
    name: string;
    subject: string;
    questionCount: number;
    timeLimit: number; // in minutes
  } | null>(null);
  
  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Interview state
  const [responseId, setResponseId] = useState<string>("");
  const [interviewName, setInterviewName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recorderRef = useRef<any>({});
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      if (!interviewId) {
        toast.error("Invalid interview link");
        setIsLoadingInterview(false);
        return;
      }

      try {
        const response = await fetch(`/api/interviews/${interviewId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setInterviewDetails({
              name: result.data.name,
              subject: result.data.subject,
              questionCount: result.data.questions?.length || 0,
              timeLimit: result.data.timeLimit || 30,
            });
            setInterviewName(result.data.name);
            setShowNameForm(true);
          } else {
            toast.error("Interview not found");
          }
        } else {
          toast.error("Interview not found or inactive");
        }
      } catch (error) {
        toast.error("Failed to load interview details");
      } finally {
        setIsLoadingInterview(false);
      }
    };

    fetchInterviewDetails();
  }, [interviewId]);

  const endInterviewDueToTimeout = useCallback(async () => {
    if (interviewComplete) return;
    toast.error("Time is up! Submitting your interview...");
    setInterviewComplete(true);
    
    try {
      if (responseId) {
        await fetch(
          `/api/interviews/${interviewId}/responses/${responseId}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: 0, evaluation: "Interview ended due to timeout." }),
          }
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, [interviewId, responseId, interviewComplete]);

  // Master Timer Effect
  useEffect(() => {
    if (interviewStarted && !interviewComplete && timeRemaining !== null && timeRemaining > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev <= 1) {
            clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
            endInterviewDueToTimeout();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [interviewStarted, interviewComplete, timeRemaining, endInterviewDueToTimeout]);

  const startInterview = useCallback(async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    if (!interviewId) return;

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
          
          if (interviewDetails?.timeLimit) {
             setTimeRemaining(interviewDetails.timeLimit * 60);
          }
          
          toast.success("Interview started!");
        } else {
          toast.error(result.message || "Failed to start interview");
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start interview");
      }
    } catch (error) {
      toast.error("Error starting interview. Please try again.");
    }
  }, [studentName, studentEmail, interviewId, interviewDetails]);

  const sendAudioToAPI = useCallback(
    async (audioUrl: string, duration: number) => {
      if (!responseId || !interviewId) return;

      setIsProcessing(true);
      try {
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const base64Data = base64Audio.split(",")[1];
            if (!base64Data) throw new Error("Audio empty");

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
                  questionCount,
                  questionsAsked,
                }),
              }
            );

            const result = await apiResponse.json();
            if (result.success) {
              if (result.data.interviewComplete) {
                setInterviewComplete(true);
                setEvaluation(result.data.evaluation || "");
                setScore(result.data.score || 0);
                
                try {
                  await fetch(`/api/interviews/${interviewId}/responses/${responseId}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ score: result.data.score || 0, evaluation: result.data.evaluation || "" }),
                  });
                } catch (e) {}
                toast.success("Interview completed!");
              } else if (result.data.nextQuestion) {
                setCurrentQuestion(result.data.nextQuestion);
                setQuestionCount((prev) => prev + 1);
                setQuestionsAsked((prev) => [...prev, result.data.nextQuestion]);
              } else {
                toast.error("Unexpected response from server");
              }
            } else {
              toast.error(result.message || "Failed to process answer");
            }
          } catch (error) {
            toast.error("Error processing your answer");
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        toast.error("Error processing audio file");
        setIsProcessing(false);
      }
    },
    [responseId, interviewId, currentQuestion, questionCount, questionsAsked]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed && interviewStarted && !interviewComplete && currentStatus === "idle") {
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

  useEffect(() => {
    if (currentStatus === "recording") {
      durationIntervalRef.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      setRecordingDuration(0);
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [currentStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoadingInterview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
         <p className="text-lg font-medium animate-pulse">Initializing Platform Environment...</p>
      </div>
    );
  }

  if (!interviewDetails) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 pointer-events-none">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-500">Invalid Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-400">
            This interview session could not be found or has expired. Please verify your magic link.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showNameForm) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              {interviewDetails.name}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-indigo-300 border-indigo-500/30 bg-indigo-500/10">
                {interviewDetails.subject}
              </Badge>
              <Badge variant="outline" className="text-cyan-300 border-cyan-500/30 bg-cyan-500/10">
                <Clock className="w-3 h-3 mr-1" />
                {interviewDetails.timeLimit} Minutes
              </Badge>
            </div>
            <CardDescription className="text-slate-400">
              Please identify yourself to begin the adaptive evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-indigo-500/20 text-slate-300">
              <h4 className="font-semibold text-indigo-400 mb-2 text-sm uppercase tracking-wider">Session Guidelines</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> Wait for questions to resolve.</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> Hold <kbd className="mx-1 px-1.5 py-0.5 bg-slate-700 rounded text-xs">Spacebar</kbd> to record.</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> Don&apos;t reload the page.</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Legal Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">University / Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <Button
              onClick={startInterview}
              className="w-full h-12 text-md font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/20"
              disabled={!studentName.trim() || !studentEmail.trim()}
            >
              Enter Sandbox Environment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
        <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 text-slate-100 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
          <CardHeader className="text-center pt-8">
             <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-slate-100">
              Evaluation Complete
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your responses have been securely recorded and processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Final Telemetry Score</p>
              <div className="flex items-baseline justify-center font-mono">
                <span className="text-6xl font-black text-emerald-400">{score}</span>
                <span className="text-xl text-slate-600 ml-2">/ 100</span>
              </div>
            </div>

            {evaluation && (
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-indigo-500/20">
                <h3 className="font-semibold text-indigo-400 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Synthesis
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{evaluation}</p>
              </div>
            )}
            
            <p className="text-center text-slate-500 text-sm">You may now close this window safely.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTimeCritical = timeRemaining !== null && timeRemaining < 120; // less than 2 minutes

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      {/* Header bar */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-500/20 flex items-center justify-center rounded-xl border border-indigo-500/30">
            <Play className="text-indigo-400 w-5 h-5 ml-1" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{interviewName}</h2>
            <p className="text-xs text-slate-400">Candidate: {studentName}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl font-mono text-xl border ${isTimeCritical ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-slate-950 text-indigo-300 border-indigo-500/20'}`}>
           <Clock className="w-5 h-5" />
           {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6 flex-1">
        
        {/* Main Teleprompter */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col">
           <Card className="flex-1 border-slate-800 bg-slate-900 flex flex-col overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
             <CardContent className="flex-1 flex flex-col justify-center p-8 sm:p-12 text-center relative z-10">
                <span className="text-sm font-bold tracking-widest text-indigo-500 mb-6 uppercase block">
                  Prompt {questionCount} of {interviewDetails?.questionCount}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-100 leading-tight">
                  &quot;{currentQuestion}&quot;
                </h3>
             </CardContent>
           </Card>
        </div>

        {/* Recording Console */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col">
          <Card className="flex-1 border-slate-800 bg-slate-900 flex flex-col justify-center items-center p-6 overflow-hidden">
            <ReactMediaRecorder
              audio
              onStop={(blobUrl, blob) => {
                setCurrentMediaUrl(blobUrl);
                const audio = new Audio(blobUrl);
                audio.onloadedmetadata = () => {
                  setRecordedAudioDuration(Math.floor(audio.duration));
                  setAudioDuration(audio.duration);
                };
              }}
              render={({ status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl }) => {
                recorderRef.current = { startRecording, stopRecording, status, clearBlobUrl };
                setCurrentStatus(status);

                const handleSubmitAnswer = async () => {
                  if (!mediaBlobUrl) return toast.error("No audio found");
                  await sendAudioToAPI(mediaBlobUrl, recordedAudioDuration);
                  if (clearBlobUrl) clearBlobUrl();
                  setCurrentMediaUrl("");
                  setRecordedAudioDuration(0);
                };

                return (
                  <div className="w-full flex flex-col items-center">
                    
                    {/* Visualizer Circle */}
                    <div className={`relative w-40 h-40 mb-8 flex items-center justify-center rounded-full transition-all duration-300 ${status === "recording" ? "bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.4)]" : "bg-slate-800 border-4 border-slate-700 hover:border-slate-600"}`}>
                       {status === "recording" ? (
                         <>
                           <Mic className="w-12 h-12 text-red-500 animate-pulse" />
                           <div className="absolute bottom-4 left-0 w-full text-center">
                              <span className="text-red-400 font-mono font-bold">{recordingDuration}s</span>
                           </div>
                         </>
                       ) : (
                         <MicOff className="w-12 h-12 text-slate-500" />
                       )}
                    </div>
                    
                    <h4 className="text-xl font-medium text-slate-200 mb-2">
                       {status === "recording" ? "Recording Input..." : isProcessing ? "Uplinking Data..." : "Awaiting Input"}
                    </h4>
                    
                    <p className="text-sm text-slate-400 text-center mb-8 max-w-[250px]">
                      Hold <kbd className="px-2 py-1 bg-slate-800 rounded mx-1 text-slate-300 border border-slate-700">Spacebar</kbd> to record your answer verbally.
                    </p>

                    {mediaBlobUrl && (
                      <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm text-slate-400">
                           <span>Audio Capture</span>
                           <span className="font-mono">{recordedAudioDuration}s</span>
                        </div>
                        <audio src={mediaBlobUrl} controls className="w-full h-10 invert grayscale" />
                        <div className="flex gap-2 w-full mt-2">
                          <Button disabled={isProcessing} onClick={() => { if(clearBlobUrl) clearBlobUrl(); setCurrentMediaUrl(""); }} variant="outline" className="flex-1 bg-slate-900 border-slate-700 hover:text-red-400 h-12 text-sm">
                            Discard
                          </Button>
                          <Button disabled={isProcessing} onClick={handleSubmitAnswer} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-12 text-sm font-semibold">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </Card>
        </div>

      </div>
    </div>
  );
}
