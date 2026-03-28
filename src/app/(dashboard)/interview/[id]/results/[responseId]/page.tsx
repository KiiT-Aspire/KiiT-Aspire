"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Loader2, ArrowLeft, User, Calendar, Award, Clock,
  CheckCircle2, XCircle, AlertCircle, Mail, Volume2,
  MessageSquare, Sparkles, Play, Activity, Mic
} from "lucide-react";

interface QuestionAnswer {
  questionText: string;
  audioUrl: string | null;
  audioDuration: number | null;
  questionOrder: number;
  answeredAt: string;
}

interface ResponseDetails {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  evaluation: string | null;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  timeTaken: number | null;
  questionAnswers: QuestionAnswer[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="55" cy="55" r={radius}
          stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-3xl font-black" style={{ color }}>
          {score}
        </motion.span>
        <div className="text-[10px] text-zinc-600 font-medium">/ 100</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", Icon: CheckCircle2, label: "Completed" },
    in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", Icon: Activity, label: "In Progress" },
    abandoned: { bg: "bg-zinc-500/10", text: "text-zinc-500", border: "border-zinc-500/20", Icon: XCircle, label: "Abandoned" },
  }[status] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", Icon: AlertCircle, label: status };
  const { Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />{config.label}
    </span>
  );
}

export default function ResponseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const responseId = params.responseId as string;

  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (interviewId && responseId) fetchResponseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, responseId]);

  useEffect(() => {
    return () => { if (audioElement) { audioElement.pause(); audioElement.currentTime = 0; } };
  }, [audioElement]);

  const fetchResponseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interviews/${interviewId}/responses/${responseId}`);
      const data = await res.json();
      if (data.success) {
        setResponse({
          id: data.data.id,
          studentName: data.data.student?.name || "Unknown",
          studentEmail: data.data.student?.email || "N/A",
          score: data.data.score,
          evaluation: data.data.evaluation,
          status: data.data.status,
          startedAt: data.data.startedAt,
          completedAt: data.data.completedAt,
          timeTaken: data.data.timeTaken,
          questionAnswers: (data.data.answers || []).map((a: any) => ({
            questionText: a.questionText,
            audioUrl: a.audioUrl,
            audioDuration: a.audioDuration,
            questionOrder: a.questionOrder,
            answeredAt: a.answeredAt,
          })),
        });
      } else toast.error("Failed to load response details");
    } catch { toast.error("Error loading response details"); }
    finally { setLoading(false); }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const playAudio = (audioUrl: string) => {
    if (audioElement) { audioElement.pause(); audioElement.currentTime = 0; }
    if (playingAudio === audioUrl) { setPlayingAudio(null); setAudioElement(null); return; }
    setPlayingAudio(audioUrl);
    const audio = new Audio(audioUrl);
    setAudioElement(audio);
    audio.play().catch(() => { toast.error("Failed to play audio"); setPlayingAudio(null); setAudioElement(null); });
    audio.onended = () => { setPlayingAudio(null); setAudioElement(null); };
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-zinc-500 text-[14px]">Loading candidate report…</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!response) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-[18px] font-bold text-white mb-2">Response Not Found</h2>
          <p className="text-zinc-500 text-[13px] mb-6">This assessment record could not be located.</p>
          <button onClick={() => router.push(`/interview/${interviewId}/results`)} className="text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-foreground selection:bg-indigo-500/20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-600/[0.03] blur-[100px] rounded-full" />
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }, duration: 3000 }} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8 lg:px-10 lg:py-10">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push(`/interview/${interviewId}/results`)}
          className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 hover:text-white transition-colors mb-7 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Results
        </motion.button>

        {/* Candidate Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8 pb-8 border-b border-white/[0.06]"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-[20px] font-black text-indigo-400">
              {response.studentName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-white tracking-tight">{response.studentName}</h1>
              <p className="text-[13px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {response.studentEmail}
              </p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp}><StatusBadge status={response.status} /></motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Q&A Feed */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-1"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h2 className="text-[15px] font-bold text-white">Interaction Log</h2>
              </div>
              <span className="text-[11px] font-bold text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                {response.questionAnswers.length} questions
              </span>
            </motion.div>

            {response.questionAnswers.length === 0 ? (
              <div className="py-20 rounded-[16px] border border-dashed border-white/[0.06] text-center text-zinc-600 text-[13px]">
                No answers recorded for this session.
              </div>
            ) : (
              <div className="space-y-4">
                {response.questionAnswers
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((qa, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-[16px] border border-white/[0.07] bg-[#0a0a0a] overflow-hidden group"
                    >
                      {/* Question */}
                      <div className="px-5 py-4 border-b border-white/[0.05]">
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 mt-0.5">
                            {qa.questionOrder}
                          </span>
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Question</p>
                            <h3 className="text-[15px] text-white font-medium leading-relaxed">"{qa.questionText}"</h3>
                          </div>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Candidate Response</p>
                          <span className="ml-auto text-[11px] text-zinc-600 font-mono">
                            {new Date(qa.answeredAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {qa.audioUrl ? (
                          <div className="flex items-center gap-3 p-3.5 rounded-[12px] bg-white/[0.02] border border-white/[0.05]">
                            <button
                              onClick={() => playAudio(qa.audioUrl!)}
                              className={`flex items-center gap-2 h-9 px-4 rounded-[9px] text-[13px] font-semibold transition-all ${
                                playingAudio === qa.audioUrl
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25"
                              }`}
                            >
                              {playingAudio === qa.audioUrl
                                ? <><Volume2 className="w-3.5 h-3.5 animate-pulse" /> Playing</>
                                : <><Play className="w-3.5 h-3.5 fill-current" /> Play</>
                              }
                            </button>
                            {qa.audioDuration && (
                              <span className="text-[12px] text-zinc-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {qa.audioDuration}s
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-[12px] border border-dashed border-white/[0.05] text-center text-zinc-600 text-[12px]">
                            No audio recorded for this question
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Score Card */}
            {response.status === "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[18px] border border-white/[0.07] bg-[#0a0a0a] overflow-hidden"
              >
                <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-[13px] font-bold text-white">Final Score</h3>
                  </div>
                  <div className="flex justify-center mb-5">
                    {response.score !== null ? (
                      <ScoreRing score={response.score} />
                    ) : (
                      <div className="text-center py-4 text-zinc-600 text-[13px]">Score pending</div>
                    )}
                  </div>

                  {response.evaluation && (
                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                      <div className="flex items-center gap-1.5 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">AI Evaluation</p>
                      </div>
                      <p className="text-[13px] text-zinc-400 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                        {response.evaluation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Timestamps */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-[18px] border border-white/[0.07] bg-[#0a0a0a] p-6"
            >
              <h3 className="text-[13px] font-bold text-white mb-5">Session Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Calendar, label: "Started", value: new Date(response.startedAt).toLocaleString() },
                  ...(response.completedAt ? [{ icon: CheckCircle2, label: "Completed", value: new Date(response.completedAt).toLocaleString() }] : []),
                  { icon: Clock, label: "Duration", value: formatDuration(response.timeTaken) },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">{item.label}</p>
                        <p className="text-[13px] text-zinc-300 font-mono">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
