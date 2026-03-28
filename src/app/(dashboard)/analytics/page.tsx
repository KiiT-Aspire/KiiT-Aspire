"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, Award, CheckCircle2,
  Clock, Activity, XCircle
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

interface OverviewStats {
  totalInterviews: number;
  totalResponses: number;
  completedResponses: number;
  averageScore: number;
  completionRate: number;
  activeInterviews: number;
}

interface InterviewStat {
  id: string;
  name: string;
  subject: string;
  responseCount: number;
  questionCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [interviews, setInterviews] = useState<InterviewStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/interviews");
      const data = await res.json();
      if (data.success) {
        const list: InterviewStat[] = data.data;
        setInterviews(list);

        // Compute aggregate stats
        const totalInterviews = list.length;
        const totalResponses = list.reduce((acc, i) => acc + (Number(i.responseCount) || 0), 0);
        const activeInterviews = list.filter(i => i.isActive).length;

        // Fetch responses stats for each interview in parallel
        const statResults = await Promise.allSettled(
          list.map(async (interview) => {
            const r = await fetch(`/api/interviews/${interview.id}/responses?limit=1`);
            const d = await r.json();
            return d.statistics;
          })
        );

        let completedTotal = 0;
        let scoreSum = 0;
        let scorCount = 0;

        statResults.forEach(r => {
          if (r.status === "fulfilled" && r.value) {
            completedTotal += Number(r.value.completedCount) || 0;
            if (r.value.averageScore) {
              scoreSum += parseFloat(r.value.averageScore);
              scorCount++;
            }
          }
        });

        setStats({
          totalInterviews,
          totalResponses,
          completedResponses: completedTotal,
          averageScore: scorCount > 0 ? scoreSum / scorCount : 0,
          completionRate: totalResponses > 0 ? (completedTotal / totalResponses) * 100 : 0,
          activeInterviews,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const subjectColors: Record<string, string> = {
    "JavaScript": "from-yellow-600/15 to-amber-600/15 border-yellow-500/15 text-yellow-400",
    "Python": "from-green-600/15 to-emerald-600/15 border-green-500/15 text-green-400",
    "React": "from-cyan-600/15 to-blue-600/15 border-cyan-500/15 text-cyan-400",
    "System Design": "from-violet-600/15 to-purple-600/15 border-violet-500/15 text-violet-400",
    "default": "from-indigo-600/15 to-violet-600/15 border-indigo-500/15 text-indigo-400",
  };
  const getColor = (s: string) => subjectColors[s] || subjectColors["default"];

  return (
    <div className="min-h-screen bg-[#020202] selection:bg-indigo-500/20">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-600/[0.03] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8 lg:px-10 lg:py-10 space-y-8">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-white">Analytics</h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-zinc-500 text-[14px] ml-12">
            Platform-wide performance overview
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[110px] rounded-[16px] border border-white/[0.05] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Total Interviews", value: stats.totalInterviews, icon: BarChart3, color: "from-indigo-600/15 to-violet-600/15", border: "border-indigo-500/15", iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400" },
              { label: "Total Submissions", value: stats.totalResponses, icon: Users, color: "from-blue-600/15 to-cyan-600/15", border: "border-blue-500/15", iconBg: "bg-blue-500/15", iconColor: "text-blue-400" },
              { label: "Completed", value: stats.completedResponses, icon: CheckCircle2, color: "from-emerald-600/15 to-teal-600/15", border: "border-emerald-500/15", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
              { label: "Avg Score", value: stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}` : "—", icon: Award, color: "from-amber-600/15 to-orange-600/15", border: "border-amber-500/15", iconBg: "bg-amber-500/15", iconColor: "text-amber-400" },
              { label: "Completion Rate", value: `${stats.completionRate.toFixed(0)}%`, icon: TrendingUp, color: "from-cyan-600/15 to-sky-600/15", border: "border-cyan-500/15", iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400" },
              { label: "Active Evaluations", value: stats.activeInterviews, icon: Activity, color: "from-violet-600/15 to-pink-600/15", border: "border-violet-500/15", iconBg: "bg-violet-500/15", iconColor: "text-violet-400" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={fadeUp} className={`rounded-[16px] border ${stat.border} bg-gradient-to-br ${stat.color} p-5`}>
                  <div className={`w-9 h-9 rounded-[10px] ${stat.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-[26px] font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Per-Interview Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-white">By Evaluation</h2>
            <span className="text-[12px] text-zinc-600">{interviews.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-[14px] border border-white/[0.05] bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-[13px] rounded-[16px] border border-dashed border-white/[0.05]">
              Create interviews to see analytics here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {interviews.map((interview, i) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                  className="flex items-center gap-4 px-5 py-4 rounded-[14px] border border-white/[0.06] bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors group"
                >
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border bg-gradient-to-br shrink-0 ${getColor(interview.subject)}`}>
                    {interview.subject}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate">{interview.name}</p>
                  </div>
                  <div className="flex items-center gap-6 text-[12px] text-zinc-500 shrink-0">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{Number(interview.responseCount) || 0} submissions</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{Number(interview.questionCount) || 0} questions</span>
                    <span className={`flex items-center gap-1 font-semibold ${interview.isActive ? "text-emerald-400" : "text-zinc-600"}`}>
                      {interview.isActive ? <><CheckCircle2 className="w-3.5 h-3.5" />Active</> : <><XCircle className="w-3.5 h-3.5" />Inactive</>}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
