"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Calendar, Award, Clock, Activity, Mic, Pause,
  ChevronDown, ChevronUp, FileText, Camera, Play, Mail, AlertCircle, Sparkles,
  BadgeCheck, XCircle
} from "lucide-react";

// Dynamically imported with ssr:false — cloudflare realtimekit is browser-only
const VideoRTCWidget = dynamic(
  () => import("@/components/video/VideoRTCWidget"),
  { ssr: false, loading: () => null }
);

interface QuestionAnswer {
  questionText: string;
  audioUrl: string | null;
  audioTranscript: string | null;
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
  const filled = (score / 30) * circ; // Score is out of 30 now
  const percentage = (score / 30) * 100;
  const color = percentage >= 75 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width="115" height="115" className="-rotate-90 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
        <circle cx="57.5" cy="57.5" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="57.5" cy="57.5" r={radius}
          stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.5, ease: "circOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.8, type: "spring" }} 
          className="text-3xl font-black block leading-none" 
          style={{ color }}
        >
          {score}
        </motion.span>
        <div className="text-[10px] text-zinc-600 font-bold tracking-tighter mt-1 uppercase">Points / 30</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", Icon: BadgeCheck, label: "Assessment Completed" },
    in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", Icon: Activity, label: "Still In Progress" },
    abandoned: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", Icon: XCircle, label: "Abandoned" },
  }[status] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", Icon: AlertCircle, label: status };
  const { Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold border ${config.bg} ${config.text} ${config.border} backdrop-blur-md`}>
      <Icon className="w-4 h-4" />{config.label}
    </span>
  );
}

function ResponseDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const responseId = params.responseId as string;

  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (interviewId && responseId) fetchResponseDetails();
    return () => {
      const el = audioRef.current;
      if (el) el.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, responseId]);

  const fetchResponseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interviews/${interviewId}/responses/${responseId}`);
      const data = await res.json();
      if (data.success) {
        setResponse({
          id: data.data.id,
          studentName: data.data.student?.name || data.data.studentName || "Candidate",
          studentEmail: data.data.student?.email || data.data.studentEmail || "N/A",
          score: data.data.score,
          evaluation: data.data.evaluation,
          status: data.data.status,
          startedAt: data.data.startedAt,
          completedAt: data.data.completedAt,
          timeTaken: data.data.timeTaken,
          questionAnswers: (data.data.answers || []).map((a: { questionText: string; audioUrl: string | null; audioTranscript: string | null; audioDuration: number | null; questionOrder: number; answeredAt: string }) => ({
            questionText: a.questionText,
            audioUrl: a.audioUrl,
            audioTranscript: a.audioTranscript,
            audioDuration: a.audioDuration,
            questionOrder: a.questionOrder,
            answeredAt: a.answeredAt,
          })),
        });
      } else toast.error("Failed to load response details");
    } catch { toast.error("Error loading response details"); }
    finally { setLoading(false); }
  };

  const playAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      return;
    }
    setPlayingAudio(audioUrl);
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {
        toast.error("Playback error");
        setPlayingAudio(null);
      });
      audioRef.current.onended = () => setPlayingAudio(null);
    }
  };

  const toggleTranscript = (index: number) => {
    setExpandedTranscripts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-[3px] border-indigo-500/10 border-t-indigo-500 animate-spin" />
            <div className="w-16 h-16 rounded-full border-[3px] border-transparent border-b-violet-500 animate-spin absolute inset-0 [animation-direction:reverse]" />
          </div>
          <p className="text-zinc-400 text-[14px] font-medium tracking-tight">Generating detailed report…</p>
        </motion.div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-foreground selection:bg-indigo-500/30">
      <audio ref={audioRef} hidden />
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/[0.03] blur-[140px] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/[0.02] blur-[120px] rounded-full translate-y-1/4 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      </div>

      <Toaster position="bottom-right" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10 lg:px-12">
        
        {/* Navigation */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] font-bold text-zinc-500 hover:text-white transition-all mb-10 group bg-white/[0.03] border border-white/[0.06] pr-4 pl-3 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </motion.button>

        {/* Profile Header */}
        <header className="mb-12">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <motion.div variants={fadeUp} className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[24px] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-20 h-20 rounded-[22px] bg-zinc-900 border border-white/10 flex items-center justify-center text-[32px] font-black text-white overflow-hidden">
                  <span className="relative z-10">{response.studentName?.[0]?.toUpperCase()}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-[32px] font-black text-white tracking-tight leading-none">{response.studentName}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2 text-[13px] text-zinc-400 font-medium">
                    <Mail className="w-4 h-4 text-indigo-400/70" /> {response.studentEmail}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span className="flex items-center gap-2 text-[13px] text-zinc-400 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-400/70" /> {new Date(response.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-4">
               <StatusBadge status={response.status} />
            </motion.div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Evaluation & Log */}
          <div className="lg:col-span-8 space-y-10">
            
            {response.status === "in_progress" && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <VideoRTCWidget responseId={responseId} mode="teacher" interviewId={interviewId} />
              </motion.section>
            )}

            {/* AI Report Card */}
            {response.evaluation && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-[28px] border border-white/[0.08] bg-[#080808]/80 backdrop-blur-xl overflow-hidden">
                  <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                         <Sparkles className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-[17px] font-black text-white uppercase tracking-wider">Expert Assessment</h2>
                    </div>
                  </div>
                  <div className="p-8 pb-10">
                    <div className="prose prose-invert prose-zinc max-w-none 
                      prose-h2:text-[18px] prose-h2:font-black prose-h2:text-white prose-h2:mt-6 prose-h2:mb-4
                      prose-p:text-[15px] prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-white prose-strong:font-bold
                      prose-li:text-zinc-400 prose-li:text-[15px]
                      prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    ">
                      <ReactMarkdown>{response.evaluation.replace("EVALUATION:", "")}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Response Timeline */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Mic className="w-5 h-5 text-emerald-400" />
                   </div>
                   <h2 className="text-[17px] font-black text-white uppercase tracking-wider">Interview Interaction</h2>
                </div>
                <div className="text-[11px] font-black text-zinc-500 bg-white/[0.03] border border-white/[0.08] px-4 py-1.5 rounded-full uppercase tracking-widest">
                  {response.questionAnswers.length} Exchanges
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-500/20 before:via-zinc-800 before:to-zinc-900">
                {response.questionAnswers
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((qa, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} 
                      whileInView={{ opacity: 1, x: 0 }} 
                      viewport={{ once: true }}
                      className="relative pl-12"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1.5 w-[40px] h-[40px] rounded-2xl bg-[#080808] border-4 border-[#020202] flex items-center justify-center z-10 shadow-lg shadow-black/50 overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                        <span className="relative text-[13px] font-black text-indigo-400">{qa.questionOrder}</span>
                      </div>

                      <div className="rounded-[24px] border border-white/[0.08] bg-[#080808]/40 backdrop-blur-md overflow-hidden group">
                        {/* Question Content */}
                        <div className="p-6 border-b border-white/[0.04] bg-white/[0.01]">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">System Inquiry</p>
                          <h3 className="text-[16px] text-zinc-200 font-semibold leading-relaxed">
                            {qa.questionText}
                          </h3>
                        </div>

                        {/* Answer Content */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Candidate Input</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-600 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.05]">
                              {new Date(qa.answeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {qa.audioUrl ? (
                            <div className="flex flex-col gap-4">
                              {/* Audio Player UX */}
                              <div className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05]">
                                <button
                                  onClick={() => playAudio(qa.audioUrl!)}
                                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                                    playingAudio === qa.audioUrl 
                                    ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-95" 
                                    : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {playingAudio === qa.audioUrl ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                </button>
                                <div className="flex-1">
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: playingAudio === qa.audioUrl ? "100%" : 0 }}
                                       transition={{ duration: qa.audioDuration || 5, ease: "linear" }}
                                       className="h-full bg-emerald-500"
                                     />
                                  </div>
                                  <div className="flex justify-between mt-2">
                                    <span className="text-[11px] font-bold text-zinc-600">Audio Recording</span>
                                    <span className="text-[11px] font-bold text-zinc-500">{qa.audioDuration ? `${qa.audioDuration}s` : "—"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Transcription Section */}
                              {qa.audioTranscript && (
                                <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-5">
                                  <button 
                                    onClick={() => toggleTranscript(i)}
                                    className="flex items-center justify-between w-full text-left group/btn"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-zinc-500 group-hover/btn:text-indigo-400 transition-colors" />
                                      <span className="text-[12px] font-bold text-zinc-400 group-hover/btn:text-white transition-colors">Technical Transcript</span>
                                    </div>
                                    {expandedTranscripts[i] ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                                  </button>
                                  <AnimatePresence>
                                    {expandedTranscripts[i] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pt-4 border-t border-white/[0.04] mt-4">
                                          <p className="text-[14px] leading-relaxed text-zinc-400 italic font-medium">
                                            &quot;{qa.audioTranscript}&quot;
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-8 bg-zinc-900/40 rounded-2xl border border-dashed border-white/[0.06] flex flex-col items-center justify-center gap-2">
                               <AlertCircle className="w-5 h-5 text-zinc-700" />
                               <span className="text-[12px] font-medium text-zinc-600">No response data captured</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </section>
          </div>

          {/* Sidebar Stats */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Visual Scoreboard */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[32px] p-[1px] bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent shadow-2xl shadow-black/50"
            >
              <div className="bg-[#080808] rounded-[31px] p-8">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Scorecard</h3>
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Award className="w-6 h-6 text-indigo-400" />
                   </div>
                </div>

                <div className="flex flex-col items-center py-4">
                  {response.score !== null ? (
                    <>
                      <ScoreRing score={response.score} />
                      <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Status</p>
                          <p className="text-[14px] font-black text-white uppercase tracking-tight">
                            {response.score >= 22 ? "Advanced" : response.score >= 15 ? "Competent" : "Developing"}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Rank</p>
                          <p className="text-[14px] font-black text-white tracking-tight">
                            {response.score >= 25 ? "Top 5%" : "Verified"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center opacity-40">
                       <Clock className="w-12 h-12 text-zinc-700 mb-4" />
                       <span className="text-[14px] font-bold text-zinc-600">Score Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Session Metadata */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[32px] border border-white/[0.08] bg-[#080808]/60 backdrop-blur-md p-8 pt-6"
            >
              <h3 className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Analytical Metadata</h3>
              <div className="space-y-6">
                {[
                  { icon: Calendar, label: "Interview Date", value: new Date(response.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) },
                  { icon: Clock, label: "Engagement Time", value: response.timeTaken ? `${Math.floor(response.timeTaken / 60)}m ${response.timeTaken % 60}s` : "Under 1m" },
                  { icon: Activity, label: "Session Integrity", value: response.status === "completed" ? "Verified" : "Incidental" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-colors group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20">
                      <item.icon className="w-5 h-5 text-zinc-500 transition-colors group-hover:text-indigo-400 font-bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                      <p className="text-[14px] font-bold text-white tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ResponseDetailPage() {
  return <ResponseDetailPageInner />;
}
