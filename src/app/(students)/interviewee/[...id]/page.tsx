"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  Clock, Mic, MicOff, CheckCircle2, AlertCircle, Play,
  Loader2, Sparkles, AudioWaveform, ChevronRight, User,
  Mail, Shield, BookOpen, Zap, Radio
} from "lucide-react";

const ReactMediaRecorder = dynamic(
  () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
  { ssr: false }
);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70" cy="70" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-4xl font-black"
          style={{ color }}
        >
          {score}
        </motion.div>
        <div className="text-[11px] text-zinc-500 font-medium">/ 100</div>
      </div>
    </div>
  );
}

export default function IntervieweePage() {
  const params = useParams();
  const interviewId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [showNameForm, setShowNameForm] = useState(false);
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);

  const [interviewDetails, setInterviewDetails] = useState<{
    name: string;
    subject: string;
    questionCount: number;
    timeLimit: number;
  } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [responseId, setResponseId] = useState<string>("");
  const [interviewName, setInterviewName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [isStarting, setIsStarting] = useState(false);

  const recorderRef = useRef<any>({});
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          } else toast.error("Interview not found");
        } else toast.error("Interview not found or inactive");
      } catch {
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
        await fetch(`/api/interviews/${interviewId}/responses/${responseId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: 0, evaluation: "Interview ended due to timeout." }),
        });
      }
    } catch {}
  }, [interviewId, responseId, interviewComplete]);

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
    return () => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); };
  }, [interviewStarted, interviewComplete, timeRemaining, endInterviewDueToTimeout]);

  const startInterview = useCallback(async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    if (!interviewId) return;
    setIsStarting(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: studentName.trim(), studentEmail: studentEmail.trim() }),
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
          if (interviewDetails?.timeLimit) setTimeRemaining(interviewDetails.timeLimit * 60);
        } else toast.error(result.message || "Failed to start");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start interview");
      }
    } catch {
      toast.error("Error starting interview. Please try again.");
    } finally {
      setIsStarting(false);
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
                  duration,
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
                } catch {}
                toast.success("Interview completed!");
              } else if (result.data.nextQuestion) {
                setCurrentQuestion(result.data.nextQuestion);
                setQuestionCount((prev) => prev + 1);
                setQuestionsAsked((prev) => [...prev, result.data.nextQuestion]);
              }
            } else toast.error(result.message || "Failed to process answer");
          } catch {
            toast.error("Error processing your answer");
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch {
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
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [isSpacePressed, interviewStarted, interviewComplete, currentStatus]);

  useEffect(() => {
    if (currentStatus === "recording") {
      durationIntervalRef.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      setRecordingDuration(0);
    }
    return () => { if (durationIntervalRef.current) clearInterval(durationIntervalRef.current); };
  }, [currentStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeRemaining !== null && timeRemaining < 120;

  // ─── LOADING STATE ───────────────────────────────────────────────────────────
  if (isLoadingInterview) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
          />
          <p className="text-zinc-400 text-[14px] font-medium">Initializing interview environment…</p>
        </div>
      </div>
    );
  }

  // ─── NOT FOUND STATE ─────────────────────────────────────────────────────────
  if (!interviewDetails) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center px-4">
        <Toaster position="top-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-[20px] font-bold text-white mb-2">Session Not Found</h2>
          <p className="text-zinc-500 text-[14px] leading-relaxed">
            This interview session could not be found or has expired. Please verify your link and try again.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── REGISTRATION FORM ───────────────────────────────────────────────────────
  if (showNameForm) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/[0.07] blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/[0.05] blur-[100px] rounded-full" />
        </div>
        {/* Grid */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <Toaster position="top-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } }} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <AudioWaveform className="w-5 h-5 text-white" />
            </div>
            <span className="text-[18px] font-bold text-white">Echo<span className="text-indigo-400">Grade</span></span>
          </motion.div>

          {/* Card */}
          <motion.div variants={fadeUp} className="rounded-[24px] border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  {interviewDetails.subject}
                </span>
              </div>
              <h1 className="text-[22px] font-bold text-white tracking-tight mb-1">{interviewDetails.name}</h1>
              <div className="flex items-center gap-4 text-[13px] text-zinc-500">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{interviewDetails.timeLimit} min</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{interviewDetails.questionCount} questions</span>
              </div>
            </div>

            {/* Guidelines */}
            <div className="px-8 py-5 border-b border-white/[0.06]">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Session Guidelines</p>
              <div className="space-y-2.5">
                {[
                  { icon: Mic, text: "Hold Spacebar to record your verbal answer" },
                  { icon: Zap, text: "AI will ask follow-up questions based on your answers" },
                  { icon: Shield, text: "Don't refresh — your progress won't be saved" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-[6px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-3 h-3 text-indigo-400" />
                    </div>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startInterview()}
                  className="bg-black/60 border-white/[0.08] focus-visible:ring-1 focus-visible:ring-indigo-500/50 h-11 rounded-[10px] text-[14px] text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startInterview()}
                  className="bg-black/60 border-white/[0.08] focus-visible:ring-1 focus-visible:ring-indigo-500/50 h-11 rounded-[10px] text-[14px] text-white placeholder:text-zinc-600"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={startInterview}
                disabled={!studentName.trim() || !studentEmail.trim() || isStarting}
                className="w-full h-12 mt-2 rounded-[12px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(99,102,241,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isStarting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Starting interview…</>
                ) : (
                  <>Begin Interview <ChevronRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── COMPLETION STATE ────────────────────────────────────────────────────────
  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/[0.05] blur-[120px] rounded-full" />
        </div>
        <Toaster position="top-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } }} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 w-full max-w-lg text-center"
        >
          {/* Success icon */}
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />
              <div className="relative w-20 h-20 rounded-[20px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[2.5rem] font-bold text-white tracking-tight mb-2">
            Evaluation Complete
          </motion.h1>
          <motion.p variants={fadeUp} className="text-zinc-500 text-[15px] mb-10">
            Your responses have been securely recorded and analyzed.
          </motion.p>

          {/* Score */}
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <ScoreRing score={score} />
          </motion.div>

          {/* Evaluation */}
          {evaluation && (
            <motion.div
              variants={fadeUp}
              className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-6 text-left mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-[13px] font-bold text-indigo-400 uppercase tracking-wider">AI Evaluation</h3>
              </div>
              <p className="text-zinc-300 text-[14px] leading-relaxed whitespace-pre-wrap">{evaluation}</p>
            </motion.div>
          )}

          <motion.p variants={fadeUp} className="text-zinc-600 text-[13px]">
            You may safely close this window. Results have been sent to the hiring team.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ─── ACTIVE INTERVIEW ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020202] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-600/[0.05] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-violet-600/[0.04] blur-[100px] rounded-full" />
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <Toaster position="top-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" } }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-[60px] px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <AudioWaveform className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white leading-tight">{interviewName}</p>
              <p className="text-[11px] text-zinc-500">{studentName}</p>
            </div>
          </div>

          {/* Timer */}
          <motion.div
            animate={isTimeCritical ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-[10px] font-mono text-[15px] font-bold border transition-all ${
              isTimeCritical
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-white/[0.03] text-indigo-300 border-white/[0.07]"
            }`}
          >
            <Clock className="w-4 h-4" />
            {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
          </motion.div>

          {/* Progress */}
          <div className="flex items-center gap-2 text-[13px] text-zinc-500">
            <span className="text-white font-semibold">{questionCount}</span>
            <span>/</span>
            <span>{interviewDetails?.questionCount}</span>
            <span className="ml-1 text-zinc-600">questions</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.03]">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${(questionCount / (interviewDetails?.questionCount || 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.header>

      {/* Main Interview Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="h-full rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent" />

              <div className="mb-5">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                  Question {questionCount} of {interviewDetails?.questionCount}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="text-[1.5rem] sm:text-[2rem] font-bold text-white leading-tight tracking-tight"
                >
                  "{currentQuestion}"
                </motion.h2>
              </AnimatePresence>

              <p className="mt-6 text-zinc-600 text-[13px]">
                Record your verbal answer using the microphone panel →
              </p>
            </div>
          </motion.div>

          {/* Recording Console */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="h-full rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col items-center justify-center">
              <ReactMediaRecorder
                audio
                onStop={(blobUrl) => {
                  const audio = new Audio(blobUrl);
                  audio.onloadedmetadata = () => setRecordedAudioDuration(Math.floor(audio.duration));
                }}
                render={({ status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl }) => {
                  recorderRef.current = { startRecording, stopRecording, status, clearBlobUrl };
                  setCurrentStatus(status);

                  const handleSubmitAnswer = async () => {
                    if (!mediaBlobUrl) return toast.error("No audio recorded");
                    await sendAudioToAPI(mediaBlobUrl, recordedAudioDuration);
                    if (clearBlobUrl) clearBlobUrl();
                    setRecordedAudioDuration(0);
                  };

                  return (
                    <div className="w-full flex flex-col items-center gap-6">
                      {/* Mic visualizer */}
                      <div className="relative">
                        {status === "recording" && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping scale-150" />
                            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping scale-125" style={{ animationDelay: "0.3s" }} />
                          </>
                        )}
                        <motion.div
                          animate={status === "recording" ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                            status === "recording"
                              ? "bg-red-500/15 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                              : "bg-white/[0.03] border-white/[0.08]"
                          }`}
                        >
                          {status === "recording" ? (
                            <>
                              <Radio className="w-8 h-8 text-red-400" />
                              <span className="text-red-400 font-mono text-[12px] font-bold mt-1">{recordingDuration}s</span>
                            </>
                          ) : isProcessing ? (
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                          ) : (
                            <MicOff className="w-8 h-8 text-zinc-500" />
                          )}
                        </motion.div>
                      </div>

                      {/* Status text */}
                      <div className="text-center">
                        <p className="text-[15px] font-semibold text-white mb-1">
                          {status === "recording" ? "Recording…" : isProcessing ? "Analyzing…" : "Ready to record"}
                        </p>
                        {!mediaBlobUrl && !isProcessing && (
                          <p className="text-[12px] text-zinc-600">
                            Hold <kbd className="px-1.5 py-0.5 bg-white/[0.05] border border-white/10 rounded-[4px] font-mono text-zinc-400 text-[11px]">Space</kbd> to record
                          </p>
                        )}
                      </div>

                      {/* Record button */}
                      {!mediaBlobUrl && (
                        <div className="flex gap-3 w-full">
                          <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={isProcessing}
                            className={`flex-1 h-12 rounded-[12px] font-semibold text-[13px] flex items-center justify-center gap-2 transition-all border ${
                              status === "recording"
                                ? "bg-red-500/15 border-red-500/30 text-red-400"
                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15"
                            } disabled:opacity-40`}
                          >
                            {status === "recording" ? <><Radio className="w-4 h-4" /> Release to stop</> : <><Mic className="w-4 h-4" /> Hold to record</>}
                          </button>
                        </div>
                      )}

                      {/* Audio review */}
                      {mediaBlobUrl && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full space-y-3"
                        >
                          <div className="flex items-center justify-between text-[12px] text-zinc-500 px-1">
                            <span>Recording ready</span>
                            <span className="font-mono">{recordedAudioDuration}s</span>
                          </div>
                          <audio src={mediaBlobUrl} controls className="w-full h-9 rounded-[8px] opacity-80" />
                          <div className="flex gap-2">
                            <button
                              disabled={isProcessing}
                              onClick={() => { if (clearBlobUrl) clearBlobUrl(); setRecordedAudioDuration(0); }}
                              className="flex-1 h-10 rounded-[10px] border border-white/[0.08] bg-white/[0.02] text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
                            >
                              Discard
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              disabled={isProcessing}
                              onClick={handleSubmitAnswer}
                              className="flex-1 h-10 rounded-[10px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit <ChevronRight className="w-4 h-4" /></>}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
