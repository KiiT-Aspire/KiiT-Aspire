"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, ArrowLeft, User, Calendar, Award, Clock,
  CheckCircle2, XCircle, AlertCircle, Download, Eye,
  TrendingUp, BarChart3, Users, Activity, ChevronLeft,
  ChevronRight, AudioWaveform, Filter, Trash2, Mic, MicOff
} from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

interface VideoRTCWidgetProps {
  responseId: string;
  studentName?: string;
  mode: "student" | "teacher";
  isTalking?: boolean;
}

const VideoRTCWidget = dynamic(
  () => import("@/components/video/VideoRTCWidget") as Promise<{ default: ComponentType<VideoRTCWidgetProps> }>,
  { ssr: false, loading: () => null }
);

interface ResponseData {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  timeTaken: number | null;
}

interface Statistics {
  totalResponses: number;
  completedCount: number;
  inProgressCount: number;
  abandonedCount: number;
  averageScore: number | null;
  completionRate: number;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };



export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [interviewName, setInterviewName] = useState<string>("");
  const [interviewSubject, setInterviewSubject] = useState<string>("");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [talkingTo, setTalkingTo] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    setIsMounted(true);
    if (interviewId) { fetchInterview(); fetchResponses(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, statusFilter, currentPage]);

  const fetchInterview = async () => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`);
      const data = await res.json();
      if (data.success) {
        setInterviewName(data.data.name);
        setInterviewSubject(data.data.subject);
      }
    } catch {}
  };

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const qp = new URLSearchParams({ page: currentPage.toString(), limit: limit.toString() });
      if (statusFilter !== "all") qp.append("status", statusFilter);
      const res = await fetch(`/api/interviews/${interviewId}/responses?${qp}`);
      const data = await res.json();
      if (data.success) {
        setResponses(data.data.map((r: any) => ({
          id: r.id,
          studentName: r.studentName,
          studentEmail: r.studentEmail,
          score: r.score,
          status: r.status,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          timeTaken: r.completedAt && r.startedAt
            ? Math.floor((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
            : null,
        })));
        setStatistics({
          totalResponses: data.statistics?.totalResponses || 0,
          completedCount: data.statistics?.completedCount || 0,
          inProgressCount: data.statistics?.inProgressCount || 0,
          abandonedCount: data.statistics?.abandonedCount || 0,
          averageScore: data.statistics?.averageScore ? parseFloat(data.statistics.averageScore) : 0,
          completionRate: data.statistics?.totalResponses
            ? (data.statistics.completedCount / data.statistics.totalResponses) * 100 : 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch { toast.error("Error loading results"); }
    finally { setLoading(false); }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const exportCSV = () => {
    if (!responses.length) { toast.error("No data to export"); return; }
    const rows = [
      ["Name", "Email", "Score", "Status", "Started", "Completed", "Duration (s)"].join(","),
      ...responses.map(r => [r.studentName, r.studentEmail, r.score ?? "", r.status, new Date(r.startedAt).toLocaleString(), r.completedAt ? new Date(r.completedAt).toLocaleString() : "", r.timeTaken ?? ""].join(","))
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `echograde-${interviewId}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const deleteInterview = async () => {
    if (!confirm("Are you sure you want to delete this interview and all its results? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Interview deleted successfully");
        router.push("/interview");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete interview");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    }
  };

  const sorted = [...responses].sort((a, b) => {
    if (sortBy === "score") return (b.score ?? 0) - (a.score ?? 0);
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] text-gray-900 selection:bg-green-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-200/[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-200/[0.05] blur-[100px] rounded-full" />
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: "#fff", color: "#374151", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px" }, duration: 3000 }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 lg:px-10 lg:py-10 space-y-8">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.button
            variants={fadeUp}
            onClick={() => router.push("/interview")}
            className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-green-700 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Evaluations
          </motion.button>

          <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(22,163,74,0.3)]">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Results</h1>
              </div>
              <p className="text-gray-500 text-[14px]">{interviewName || "Loading…"} {interviewSubject && `· ${interviewSubject}`}</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={deleteInterview}
                className="flex items-center gap-2 h-10 px-4 rounded-[11px] border border-red-100 bg-red-50 text-[13px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-100 transition-all"
                title="Delete Interview"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportCSV}
                className="flex items-center gap-2 h-10 px-5 rounded-[11px] border border-green-100 bg-white text-[13px] font-semibold text-gray-600 hover:text-green-700 hover:bg-green-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        {statistics && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Attempts", value: statistics.totalResponses, icon: Users, color: "from-green-50 to-emerald-50", border: "border-green-100", iconBg: "bg-green-100", iconColor: "text-green-700" },
              { label: "Avg Score", value: (statistics.averageScore && !isNaN(statistics.averageScore) && statistics.averageScore > 0) ? `${statistics.averageScore.toFixed(1)}` : "—", icon: Award, color: "from-emerald-50 to-teal-50", border: "border-emerald-100", iconBg: "bg-emerald-100", iconColor: "text-emerald-700" },
              { label: "Completion Rate", value: `${statistics.completionRate.toFixed(0)}%`, icon: TrendingUp, color: "from-lime-50 to-green-50", border: "border-lime-100", iconBg: "bg-lime-100", iconColor: "text-lime-700" },
              { label: "Completed", value: statistics.completedCount, icon: CheckCircle2, color: "from-green-50 to-teal-50", border: "border-green-100", iconBg: "bg-green-100", iconColor: "text-green-700" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={fadeUp} className={`rounded-[16px] border ${stat.border} bg-gradient-to-br ${stat.color} p-5`}>
                  <div className={`w-9 h-9 rounded-[10px] ${stat.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-[24px] font-bold text-gray-900 tracking-tight">{stat.value}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Live Video Feeds Area */}
        {isMounted && sorted.filter(r => r.status === "in_progress").length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_12px_rgba(239,68,68,0.3)]" />
                <h2 className="text-[14px] font-bold text-gray-900 tracking-widest uppercase flex items-center gap-2">Live Monitor <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{sorted.filter(r => r.status === "in_progress").length} Active</span></h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sorted.filter(r => r.status === "in_progress").map(r => (
                <div key={r.id} className="relative aspect-video rounded-xl overflow-hidden bg-white border border-green-200 hover:border-green-400 transition-colors shadow-sm">
                  <VideoRTCWidget responseId={r.id} studentName={r.studentName} mode="teacher" isTalking={talkingTo === r.id} />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded backdrop-blur z-10 border border-white/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-[120px]">{r.studentName || "Candidate"}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTalkingTo(prev => prev === r.id ? null : r.id); }}
                    className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      talkingTo === r.id
                        ? "bg-green-600 text-white shadow-[0_0_14px_rgba(22,163,74,0.4)] animate-pulse"
                        : "bg-black/40 text-white hover:bg-black/60 backdrop-blur border border-white/20"
                    }`}
                    title={talkingTo === r.id ? `Speaking to ${r.studentName}` : `Talk to ${r.studentName}`}
                  >
                    {talkingTo === r.id ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        >
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-9 bg-white border-green-100 text-[13px] text-gray-700 rounded-[10px] focus:ring-green-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-green-100 text-gray-700 rounded-[12px]">
                <SelectItem value="all" className="text-[13px] focus:bg-green-50 focus:text-green-700">All Status</SelectItem>
                <SelectItem value="completed" className="text-[13px] focus:bg-green-50 focus:text-green-700">Completed</SelectItem>
                <SelectItem value="in_progress" className="text-[13px] focus:bg-green-50 focus:text-green-700">In Progress</SelectItem>
                <SelectItem value="abandoned" className="text-[13px] focus:bg-green-50 focus:text-green-700">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-9 bg-white border-green-100 text-[13px] text-gray-700 rounded-[10px] focus:ring-green-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-green-100 text-gray-700 rounded-[12px]">
                <SelectItem value="date" className="text-[13px] focus:bg-green-50 focus:text-green-700">Newest First</SelectItem>
                <SelectItem value="score" className="text-[13px] focus:bg-green-50 focus:text-green-700">Highest Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 rounded-full border-2 border-green-200 border-t-green-600 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] border border-dashed border-green-200 bg-white py-32 flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1">No candidates yet</h3>
            <p className="text-gray-500 text-[13px] font-medium">Share your interview link to start receiving submissions.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[20px] border border-green-100 bg-white overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_120px_130px_120px_100px_80px] gap-4 px-5 py-3.5 border-b border-green-50 bg-green-50/30">
              {["Candidate", "Email", "Score", "Status", "Date", "Duration", ""].map((h, i) => (
                <div key={i} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {/* Table rows */}
            <div className="divide-y divide-green-50">
              <AnimatePresence>
                {sorted.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => router.push(`/interview/${interviewId}/results/${r.id}`)}
                    className="grid grid-cols-[1fr_1fr_120px_130px_120px_100px_80px] gap-4 px-5 py-4 hover:bg-green-50/50 cursor-pointer transition-colors group items-center"
                  >
                    {/* Candidate */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0 text-[12px] font-bold text-green-700">
                        {r.studentName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-900 truncate">{r.studentName || "—"}</span>
                    </div>

                    {/* Email */}
                    <div className="text-[13px] text-gray-500 truncate font-medium">{r.studentEmail || "—"}</div>

                    {/* Score */}
                    <div><ScoreBar score={r.score} /></div>

                    {/* Status */}
                    <div><StatusBadge status={r.status} /></div>

                    {/* Date */}
                    <div className="text-[12px] text-gray-500 font-semibold font-mono">
                      {new Date(r.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <br />
                      <span className="text-[10px] font-medium text-gray-400">
                        {new Date(r.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="text-[12px] text-gray-500 font-mono font-semibold">{formatDuration(r.timeTaken)}</div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <span className="flex items-center gap-1 text-[12px] font-bold text-gray-400 group-hover:text-green-700 group-hover:bg-green-100 px-2.5 py-1.5 rounded-[8px] transition-all">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-green-50 bg-green-50/10">
                <span className="text-[12px] text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-[8px] border border-green-100 bg-white flex items-center justify-center text-gray-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-30 transition-all font-bold shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-[8px] border border-green-100 bg-white flex items-center justify-center text-gray-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-30 transition-all font-bold shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle2, label: "Completed" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Activity, label: "In Progress" },
    abandoned: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: XCircle, label: "Abandoned" },
  }[status] || { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", icon: AlertCircle, label: status };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 font-mono text-[13px] font-bold">—</span>;
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 75 ? "text-green-700" : score >= 50 ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`font-mono font-bold text-[13px] w-8 text-right ${textColor}`}>{score}</span>
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

