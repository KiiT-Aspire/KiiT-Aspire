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

        const totalInterviews = list.length;
        const totalResponses = list.reduce((acc, i) => acc + (Number(i.responseCount) || 0), 0);
        const activeInterviews = list.filter(i => i.isActive).length;

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
    "JavaScript":         "bg-amber-100 border-amber-200 text-amber-700",
    "Python":             "bg-green-100 border-green-200 text-green-700",
    "React":              "bg-cyan-100 border-cyan-200 text-cyan-700",
    "System Design":      "bg-violet-100 border-violet-200 text-violet-700",
    "Cloud Computing":    "bg-sky-100 border-sky-200 text-sky-700",
    "Software Engineering":"bg-indigo-100 border-indigo-200 text-indigo-700",
    "Data Science":       "bg-purple-100 border-purple-200 text-purple-700",
    "Frontend Development":"bg-pink-100 border-pink-200 text-pink-700",
    "default":            "bg-green-100 border-green-200 text-green-700",
  };
  const getColor = (s: string) => subjectColors[s] || subjectColors["default"];

  const statCards = [
    {
      label: "Total Interviews",
      icon: BarChart3,
      value: stats?.totalInterviews ?? 0,
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      valueColor: "text-gray-900",
    },
    {
      label: "Total Submissions",
      icon: Users,
      value: stats?.totalResponses ?? 0,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      valueColor: "text-gray-900",
    },
    {
      label: "Completed",
      icon: CheckCircle2,
      value: stats?.completedResponses ?? 0,
      bg: "bg-teal-50",
      border: "border-teal-200",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700",
      valueColor: "text-gray-900",
    },
    {
      label: "Avg Score",
      icon: Award,
      value: stats && stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}` : "—",
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      valueColor: "text-gray-900",
    },
    {
      label: "Completion Rate",
      icon: TrendingUp,
      value: stats ? `${stats.completionRate.toFixed(0)}%` : "—",
      bg: "bg-lime-50",
      border: "border-lime-200",
      iconBg: "bg-lime-100",
      iconColor: "text-lime-700",
      valueColor: "text-gray-900",
    },
    {
      label: "Active Interviews",
      icon: Activity,
      value: stats?.activeInterviews ?? 0,
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      valueColor: "text-gray-900",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf8] selection:bg-green-200">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-green-300/[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-emerald-300/[0.06] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-8 lg:px-10 lg:py-10 space-y-8">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-[11px] bg-green-100 border border-green-300 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-700" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Analytics</h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-gray-500 text-[14px] ml-12">
            Platform-wide performance overview for all interviews
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[110px] rounded-[16px] border border-green-200 bg-green-50/50 animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`rounded-[16px] border ${stat.border} ${stat.bg} p-5`}
                >
                  <div className={`w-9 h-9 rounded-[10px] ${stat.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className={`text-[26px] font-bold ${stat.valueColor} tracking-tight`}>{stat.value}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Per-Interview Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">By Interview</h2>
            <span className="text-[12px] text-gray-400 font-medium">{interviews.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-[14px] border border-green-200 bg-green-50/50 animate-pulse" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-[13px] rounded-[16px] border border-dashed border-green-200 bg-green-50/50 font-medium">
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
                  className="flex items-center gap-4 px-5 py-4 rounded-[14px] border border-green-200 bg-white hover:border-green-400 hover:shadow-sm hover:shadow-green-100 transition-all group"
                >
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${getColor(interview.subject)}`}>
                    {interview.subject}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{interview.name}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 text-[12px] text-gray-500 shrink-0 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {Number(interview.responseCount) || 0} submissions
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {Number(interview.questionCount) || 0} questions
                    </span>
                    <span className={`flex items-center gap-1 font-semibold ${interview.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {interview.isActive
                        ? <><CheckCircle2 className="w-3.5 h-3.5" />Active</>
                        : <><XCircle className="w-3.5 h-3.5" />Inactive</>
                      }
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
