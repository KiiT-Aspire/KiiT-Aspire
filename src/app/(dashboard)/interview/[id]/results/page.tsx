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
  ChevronRight, AudioWaveform, Filter
} from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle2, label: "Completed" },
    in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", icon: Activity, label: "In Progress" },
    abandoned: { bg: "bg-zinc-500/10", text: "text-zinc-500", border: "border-zinc-500/20", icon: XCircle, label: "Abandoned" },
  }[status] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", icon: AlertCircle, label: status };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-zinc-600 font-mono text-[13px]">—</span>;
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`font-mono font-bold text-[13px] w-8 text-right ${textColor}`}>{score}</span>
      <div className="w-20 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
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
  const limit = 20;

  useEffect(() => {
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

  const sorted = [...responses].sort((a, b) => {
    if (sortBy === "score") return (b.score ?? 0) - (a.score ?? 0);
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });

  return (
    <div className="min-h-screen bg-[#020202] text-foreground selection:bg-indigo-500/20">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/[0.03] blur-[100px] rounded-full" />
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }, duration: 3000 }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 lg:px-10 lg:py-10 space-y-8">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.button
            variants={fadeUp}
            onClick={() => router.push("/interview")}
            className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 hover:text-white transition-colors mb-5 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Evaluations
          </motion.button>

          <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-[26px] font-bold tracking-tight text-white">Results</h1>
              </div>
              <p className="text-zinc-500 text-[14px]">{interviewName || "Loading…"} {interviewSubject && `· ${interviewSubject}`}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCSV}
              className="flex items-center gap-2 h-10 px-5 rounded-[11px] border border-white/[0.08] bg-white/[0.03] text-[13px] font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        {statistics && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Attempts", value: statistics.totalResponses, icon: Users, color: "from-indigo-600/15 to-violet-600/15", border: "border-indigo-500/15", iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400" },
              { label: "Avg Score", value: (statistics.averageScore && !isNaN(statistics.averageScore) && statistics.averageScore > 0) ? `${statistics.averageScore.toFixed(1)}` : "—", icon: Award, color: "from-emerald-600/15 to-teal-600/15", border: "border-emerald-500/15", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
              { label: "Completion Rate", value: `${statistics.completionRate.toFixed(0)}%`, icon: TrendingUp, color: "from-cyan-600/15 to-blue-600/15", border: "border-cyan-500/15", iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400" },
              { label: "Completed", value: statistics.completedCount, icon: CheckCircle2, color: "from-violet-600/15 to-pink-600/15", border: "border-violet-500/15", iconBg: "bg-violet-500/15", iconColor: "text-violet-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={fadeUp} className={`rounded-[16px] border ${stat.border} bg-gradient-to-br ${stat.color} p-5`}>
                  <div className={`w-9 h-9 rounded-[10px] ${stat.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-[24px] font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        >
          <div className="flex items-center gap-2 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36 h-9 bg-black/60 border-white/[0.08] text-[13px] text-zinc-300 rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/[0.08] text-white rounded-[12px]">
                <SelectItem value="all" className="text-[13px] focus:bg-indigo-500/10">All Status</SelectItem>
                <SelectItem value="completed" className="text-[13px] focus:bg-indigo-500/10">Completed</SelectItem>
                <SelectItem value="in_progress" className="text-[13px] focus:bg-indigo-500/10">In Progress</SelectItem>
                <SelectItem value="abandoned" className="text-[13px] focus:bg-indigo-500/10">Abandoned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-9 bg-black/60 border-white/[0.08] text-[13px] text-zinc-300 rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/[0.08] text-white rounded-[12px]">
                <SelectItem value="date" className="text-[13px] focus:bg-indigo-500/10">Newest First</SelectItem>
                <SelectItem value="score" className="text-[13px] focus:bg-indigo-500/10">Highest Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] border border-dashed border-white/[0.06] bg-white/[0.01] py-32 flex flex-col items-center justify-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-zinc-600" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-1">No candidates yet</h3>
            <p className="text-zinc-600 text-[13px]">Share your interview link to start receiving submissions.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[20px] border border-white/[0.07] bg-[#0a0a0a] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_120px_130px_120px_100px_80px] gap-4 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              {["Candidate", "Email", "Score", "Status", "Date", "Duration", ""].map((h, i) => (
                <div key={i} className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {/* Table rows */}
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {sorted.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => router.push(`/interview/${interviewId}/results/${r.id}`)}
                    className="grid grid-cols-[1fr_1fr_120px_130px_120px_100px_80px] gap-4 px-5 py-4 hover:bg-white/[0.03] cursor-pointer transition-colors group items-center"
                  >
                    {/* Candidate */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 text-[12px] font-bold text-indigo-400">
                        {r.studentName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-[13px] font-semibold text-white truncate">{r.studentName || "—"}</span>
                    </div>

                    {/* Email */}
                    <div className="text-[13px] text-zinc-500 truncate">{r.studentEmail || "—"}</div>

                    {/* Score */}
                    <div><ScoreBar score={r.score} /></div>

                    {/* Status */}
                    <div><StatusBadge status={r.status} /></div>

                    {/* Date */}
                    <div className="text-[12px] text-zinc-500 font-mono">
                      {new Date(r.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <br />
                      {new Date(r.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    {/* Duration */}
                    <div className="text-[12px] text-zinc-500 font-mono">{formatDuration(r.timeTaken)}</div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <span className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-[8px] transition-all">
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
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06] bg-white/[0.01]">
                <span className="text-[12px] text-zinc-600">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-[8px] border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-[8px] border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-all"
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
