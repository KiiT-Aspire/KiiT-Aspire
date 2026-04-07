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
  const filled = (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const textColor = score >= 75 ? "text-green-700" : score >= 50 ? "text-amber-700" : "text-red-700";
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width="115" height="115" className="-rotate-90">
        <circle cx="57.5" cy="57.5" r={radius} stroke="#f3f4f6" strokeWidth="10" fill="none" />
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
          className={`text-3xl font-black block leading-none ${textColor}`}
        >
          {score}
        </motion.span>
        <div className="text-[10px] text-gray-400 font-bold tracking-tighter mt-1 uppercase">Points / 100</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", Icon: BadgeCheck, label: "Assessment Completed" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", Icon: Activity, label: "Still In Progress" },
    abandoned: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", Icon: XCircle, label: "Abandoned" },
  }[status] || { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", Icon: AlertCircle, label: status };
  const { Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold border ${config.bg} ${config.text} ${config.border}`}>
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
          questionAnswers: (data.data.answers || []).map((a: any) => ({
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
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-[3px] border-green-200 border-t-green-600 animate-spin" />
          <p className="text-gray-500 text-[14px] font-medium tracking-tight">Generating detailed report…</p>
        </motion.div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="min-h-screen bg-[#f8faf8] text-gray-900 selection:bg-green-100">
      <audio ref={audioRef} hidden />
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-300/[0.08] blur-[140px] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-300/[0.06] blur-[120px] rounded-full translate-y-1/4 -translate-x-1/4" />
      </div>

      <Toaster position="bottom-right" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10 lg:px-12">
        
        {/* Navigation */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-green-700 transition-all mb-10 group bg-white border border-green-100 pr-4 pl-3 py-1.5 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Results
        </motion.button>

        {/* Profile Header */}
        <header className="mb-12">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <motion.div variants={fadeUp} className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[24px] blur-lg opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative w-20 h-20 rounded-[22px] bg-white border border-green-100 flex items-center justify-center text-[32px] font-black text-gray-900 overflow-hidden shadow-sm">
                  <span className="relative z-10">{response.studentName?.[0]?.toUpperCase()}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none">{response.studentName}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2 text-[13px] text-gray-500 font-bold">
                    <Mail className="w-4 h-4 text-green-500" /> {response.studentEmail}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-2 text-[13px] text-gray-500 font-bold">
                    <Calendar className="w-4 h-4 text-emerald-500" /> {new Date(response.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <VideoRTCWidget responseId={responseId} mode="teacher" />
              </motion.section>
            )}

            {/* AI Report Card */}
            {response.evaluation && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-[28px] border border-green-100 bg-white overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-green-50 flex items-center justify-between bg-green-50/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                         <Sparkles className="w-5 h-5 text-green-700" />
                      </div>
                      <h2 className="text-[17px] font-black text-gray-900 uppercase tracking-wider">Expert Assessment</h2>
                    </div>
                  </div>
                  <div className="p-8 pb-10">
                    <div className="prose prose-zinc max-w-none 
                      prose-h2:text-[18px] prose-h2:font-black prose-h2:text-gray-900 prose-h2:mt-6 prose-h2:mb-4
                      prose-p:text-[15px] prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-gray-900 prose-strong:font-bold
                      prose-li:text-gray-600 prose-li:text-[15px]
                      prose-code:text-green-700 prose-code:bg-green-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
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
                   <div className="p-2 rounded-lg bg-green-100">
                      <Mic className="w-5 h-5 text-green-700" />
                   </div>
                   <h2 className="text-[17px] font-black text-gray-900 uppercase tracking-wider">Interview Interaction</h2>
                </div>
                <div className="text-[11px] font-black text-gray-500 bg-white border border-green-100 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  {response.questionAnswers.length} Exchanges
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-green-200 before:via-gray-100 before:to-transparent">
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
                      <div className="absolute left-0 top-1.5 w-[40px] h-[40px] rounded-2xl bg-white border-4 border-[#f8faf8] flex items-center justify-center z-10 shadow-md overflow-hidden">
                        <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                        <span className="relative text-[13px] font-black text-green-700">{qa.questionOrder}</span>
                      </div>

                      <div className="rounded-[24px] border border-green-100 bg-white overflow-hidden group shadow-sm">
                        {/* Question Content */}
                        <div className="p-6 border-b border-green-50 bg-green-50/10">
                          <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-3">System Inquiry</p>
                          <h3 className="text-[16px] text-gray-900 font-bold leading-relaxed">
                            {qa.questionText}
                          </h3>
                        </div>

                        {/* Answer Content */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Input</span>
                            </div>
                            <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-bold">
                              {new Date(qa.answeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {qa.audioUrl ? (
                            <div className="flex flex-col gap-4">
                              {/* Audio Player UX */}
                              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <button
                                  onClick={() => playAudio(qa.audioUrl!)}
                                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                                    playingAudio === qa.audioUrl 
                                    ? "bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] scale-95" 
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-700 hover:shadow-sm"
                                  }`}
                                >
                                  {playingAudio === qa.audioUrl ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                </button>
                                <div className="flex-1">
                                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: playingAudio === qa.audioUrl ? "100%" : 0 }}
                                       transition={{ duration: qa.audioDuration || 5, ease: "linear" }}
                                       className="h-full bg-green-500"
                                     />
                                  </div>
                                  <div className="flex justify-between mt-2">
                                    <span className="text-[11px] font-bold text-gray-400">Audio Recording</span>
                                    <span className="text-[11px] font-bold text-gray-500">{qa.audioDuration ? `${qa.audioDuration}s` : "—"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Transcription Section */}
                              {qa.audioTranscript && (
                                <div className="bg-white rounded-2xl border border-green-100 p-5">
                                  <button 
                                    onClick={() => toggleTranscript(i)}
                                    className="flex items-center justify-between w-full text-left group/btn"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-gray-400 group-hover/btn:text-green-700 transition-colors" />
                                      <span className="text-[12px] font-black text-gray-500 group-hover/btn:text-gray-900 transition-colors">Technical Transcript</span>
                                    </div>
                                    {expandedTranscripts[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                  </button>
                                  <AnimatePresence>
                                    {expandedTranscripts[i] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pt-4 border-t border-gray-100 mt-4">
                                          <p className="text-[14px] leading-relaxed text-gray-600 italic font-medium">
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
                            <div className="py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
                               <AlertCircle className="w-5 h-5" />
                               <span className="text-[12px] font-bold">No response data captured</span>
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
              className="rounded-[32px] p-0.5 bg-gradient-to-br from-green-100 to-transparent shadow-lg"
            >
              <div className="bg-white rounded-[31px] p-8">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-widest">Scorecard</h3>
                   <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-700" />
                   </div>
                </div>

                <div className="flex flex-col items-center py-4">
                  {response.score !== null ? (
                    <>
                      <ScoreRing score={response.score} />
                      <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                          <p className="text-[14px] font-black text-gray-900 uppercase tracking-tight">
                            {response.score >= 75 ? "Advanced" : response.score >= 50 ? "Competent" : "Developing"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rank</p>
                          <p className="text-[14px] font-black text-gray-900 tracking-tight">
                            {response.score >= 85 ? "Top 5%" : "Verified"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center">
                       <Clock className="w-12 h-12 text-gray-200 mb-4" />
                       <span className="text-[14px] font-bold text-gray-400">Score Pending</span>
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
              className="rounded-[32px] border border-green-100 bg-white p-8 pt-6 shadow-sm"
            >
              <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Analytical Metadata</h3>
              <div className="space-y-6">
                {[
                  { icon: Calendar, label: "Interview Date", value: new Date(response.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) },
                  { icon: Clock, label: "Engagement Time", value: response.timeTaken ? `${Math.floor(response.timeTaken / 60)}m ${response.timeTaken % 60}s` : "Under 1m" },
                  { icon: Activity, label: "Session Integrity", value: response.status === "completed" ? "Verified" : "Incidental" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors group-hover:bg-green-100 group-hover:border-green-200">
                      <item.icon className="w-5 h-5 text-gray-400 transition-colors group-hover:text-green-700 font-bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                      <p className="text-[14px] font-bold text-gray-900 tracking-tight">{item.value}</p>
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
