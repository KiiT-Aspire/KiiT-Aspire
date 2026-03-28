"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, BookOpen, Link2, BarChart3, Loader2, Clock,
  Sparkles, CheckCircle2, Trash2, MoreHorizontal,
  FolderDot, AudioWaveform, Zap, Users, TrendingUp,
  ChevronRight, Copy, Eye, ArrowUpRight
} from "lucide-react";

interface Question {
  id?: string;
  text: string;
  subject: string;
}

interface Interview {
  id: string;
  name: string;
  subject: string;
  timeLimit: number;
  questions: Question[];
  questionCount?: number;
  candidatesCount?: number;
  createdAt: string;
  isActive?: boolean;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
  "Software Engineering": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "Cloud Computing": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  "Data Science": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "System Design": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "Frontend Development": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

export default function InterviewPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const [currentInterview, setCurrentInterview] = useState<Partial<Interview>>({
    name: "",
    subject: "",
    timeLimit: 30,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<{ text: string }>({ text: "" });

  const subjects = [
    "Software Engineering",
    "Cloud Computing",
    "Data Science",
    "System Design",
    "Frontend Development",
  ];

  useEffect(() => {
    const initializePage = async () => {
      try {
        const mockUserId = "mock-teacher-id";
        setUserId(mockUserId);
        await fetchInterviews(mockUserId);
      } catch (error) {
        console.error("Failed to initialize:", error);
        setLoading(false);
      }
    };
    initializePage();
  }, [router]);

  const fetchInterviews = async (createdBy?: string) => {
    try {
      setLoading(true);
      const url = createdBy ? `/api/interviews?createdBy=${createdBy}` : "/api/interviews";
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setInterviews(
          data.data.map((interview: any) => ({
            id: interview.id,
            name: interview.name,
            subject: interview.subject,
            timeLimit: interview.timeLimit || 30,
            questions: interview.questions || [],
            questionCount: interview.questionCount || interview.questions?.length || 0,
            candidatesCount: interview.responseCount || 0,
            createdAt: new Date(interview.createdAt).toLocaleDateString(),
            isActive: interview.isActive,
          }))
        );
      } else {
        toast.error("Failed to load interviews");
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (currentQuestion.text.trim() && currentInterview.subject) {
      const newQuestion: Question = {
        id: `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: currentQuestion.text,
        subject: currentInterview.subject,
      };
      setCurrentInterview((prev) => ({
        ...prev,
        questions: [...(prev.questions || []), newQuestion],
      }));
      setCurrentQuestion({ text: "" });
    }
  };

  const removeQuestion = (questionId: string | undefined) => {
    if (!questionId) return;
    setCurrentInterview((prev) => ({
      ...prev,
      questions: prev.questions?.filter((q) => q.id !== questionId) || [],
    }));
  };

  const generateAIQuestions = async () => {
    if (!currentInterview.subject) {
      toast.error("Please select a subject first");
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch("/api/interviews/ai-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: currentInterview.subject, count: 5 }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("5 questions generated!");
        const newQuestions = data.data.map((q: any) => ({
          ...q,
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));
        setCurrentInterview((prev) => ({
          ...prev,
          questions: [...(prev.questions || []), ...newQuestions],
        }));
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setAiLoading(false);
    }
  };

  const saveInterview = async () => {
    if (!currentInterview.name || !currentInterview.subject || !currentInterview.questions?.length || !userId) {
      toast.error("Complete all fields and add at least one question.");
      return;
    }
    try {
      const payload = {
        name: currentInterview.name,
        subject: currentInterview.subject,
        timeLimit: currentInterview.timeLimit,
        createdBy: userId,
        questions: currentInterview.questions.map((q) => ({ text: q.text, subject: q.subject })),
      };
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Interview created!");
        setCurrentInterview({ name: "", subject: "", timeLimit: 30, questions: [] });
        setIsCreateDialogOpen(false);
        fetchInterviews(userId);
      } else {
        toast.error(data.message || "Failed to create");
      }
    } catch (error) {
      toast.error("Error creating interview");
    }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm("Delete this interview? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Deleted successfully");
        setIsViewDialogOpen(false);
        fetchInterviews(userId);
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const copyInterviewLink = async (interviewId: string) => {
    const link = `${window.location.origin}/interviewee/${interviewId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(interviewId);
      toast.success("Link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      toast.error("Failed to copy");
    }
  };

  const prepareView = async (interview: Interview) => {
    setIsViewDialogOpen(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedInterview({ ...interview, questions: data.data.questions || [] });
      }
    } catch (e) {
      toast.error("Error loading details");
    }
  };

  const getSubjectColor = (subject: string) =>
    subjectColors[subject] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };

  return (
    <div className="min-h-screen bg-[#020202] text-foreground selection:bg-indigo-500/20">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "13px",
            borderRadius: "12px",
          },
          duration: 3000,
        }}
      />

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/[0.04] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 lg:px-10 lg:py-10">
        
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <AudioWaveform className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-[28px] font-bold tracking-[-0.04em] text-white">
                  Evaluations
                </h1>
              </div>
              <p className="text-zinc-500 text-[14px]">
                Deploy and manage AI-powered technical interview pipelines.
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 h-10 px-5 rounded-[11px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[13px] font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Evaluation
                </motion.button>
              </DialogTrigger>

              {/* CREATE DIALOG */}
              <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0a0a0a] border border-white/[0.1] text-foreground shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-[28px] p-0 selection:bg-indigo-500/30">
                {/* Modal Header */}
                <div className="relative overflow-hidden pt-8 pb-6 px-8 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                          <Plus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <DialogTitle className="text-[22px] font-black tracking-tight text-white">
                          New Evaluation Pipeline
                        </DialogTitle>
                      </div>
                      <p className="text-[14px] text-zinc-500 font-medium">
                        Configure elite AI interviewing parameters and calibrate your technical question bank.
                      </p>
                    </div>
                  </div>
                  {/* Subtle decorative background */}
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/[0.03] blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Configuration */}
                    <div className="lg:col-span-4 space-y-8">
                      <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> 
                          Base Configuration
                        </h3>
                        
                        <div className="space-y-5">
                          {/* Name Input */}
                          <div className="space-y-2.5">
                            <Label htmlFor="interview-name" className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                              Internal Name
                            </Label>
                            <Input
                              id="interview-name"
                              placeholder="e.g. Senior Backend Systems"
                              value={currentInterview.name || ""}
                              className="bg-zinc-900/50 border-white/[0.08] focus:border-indigo-500/50 h-11 rounded-2xl text-[14px] text-white placeholder:text-zinc-600 transition-all font-medium"
                              onChange={(e) => setCurrentInterview((p) => ({ ...p, name: e.target.value }))}
                            />
                          </div>

                          {/* Domain Selection */}
                          <div className="space-y-2.5">
                            <Label htmlFor="subject" className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                              Expertise Domain
                            </Label>
                            <Select
                              value={currentInterview.subject || ""}
                              onValueChange={(val) => setCurrentInterview((p) => ({ ...p, subject: val }))}
                            >
                              <SelectTrigger className="bg-zinc-900/50 border-white/[0.08] focus:ring-1 focus:ring-indigo-500/50 h-11 rounded-2xl text-[14px] text-zinc-300 font-medium">
                                <SelectValue placeholder="Select expertise domain" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#111] border-white/[0.1] text-white rounded-2xl p-1.5">
                                {subjects.map((s) => (
                                  <SelectItem key={s} value={s} className="text-[13px] font-medium py-2.5 focus:bg-indigo-500/15 focus:text-indigo-300 rounded-xl cursor-pointer">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Time Limit */}
                          <div className="space-y-2.5">
                            <Label htmlFor="time-limit" className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                               Session Limit (minutes)
                            </Label>
                            <div className="relative group">
                              <Input
                                id="time-limit"
                                type="number"
                                min={5}
                                max={180}
                                value={currentInterview.timeLimit}
                                className="bg-zinc-900/50 border-white/[0.08] focus:border-indigo-500/50 h-11 rounded-2xl text-[14px] text-white font-mono"
                                onChange={(e) =>
                                  setCurrentInterview((p) => ({ ...p, timeLimit: parseInt(e.target.value) || 30 }))
                                }
                              />
                              <Clock className="absolute right-4 top-3 w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* AI Accelerator CTA */}
                      <section className="bg-indigo-500/[0.03] border border-indigo-500/15 rounded-[24px] p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2.5 mb-2">
                             <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Sparkles className="w-4 h-4" />
                             </div>
                             <h4 className="text-[13px] font-black text-white uppercase tracking-wider">AI Accelerator</h4>
                          </div>
                          <p className="text-[12px] text-zinc-500 leading-relaxed mb-5 font-medium">
                            Generate 5 high-fidelity technical questions calibrated for {currentInterview.subject || 'your domain'}.
                          </p>
                          <Button
                            onClick={generateAIQuestions}
                            disabled={aiLoading || !currentInterview.subject}
                            className="w-full bg-white text-black hover:bg-zinc-200 h-10 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] disabled:opacity-20"
                          >
                            {aiLoading ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                            ) : (
                              <><Zap className="h-4 w-4 mr-2 fill-current" /> Auto-Generate</>
                            )}
                          </Button>
                        </div>
                      </section>
                    </div>

                    {/* Right Column: Question Bank */}
                    <div className="lg:col-span-8 flex flex-col min-h-[500px]">
                      <h3 className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                        Curated Question Bank
                      </h3>

                      <div className="flex-1 flex flex-col rounded-[28px] border border-white/[0.08] bg-black/40 overflow-hidden backdrop-blur-md">
                        {/* Empty/List View */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/5">
                          {(!currentInterview.questions || currentInterview.questions.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                              <div className="w-16 h-16 rounded-[22px] bg-zinc-900 border border-white/[0.04] flex items-center justify-center mb-6 shadow-inner">
                                <FolderDot className="h-7 w-7 text-zinc-700" />
                              </div>
                              <p className="text-[16px] font-bold text-white mb-1.5">No Questions Calibrated</p>
                              <p className="text-[13px] text-zinc-500 max-w-[240px] font-medium">
                                Use the AI Accelerator or manual entry to build your interview pool.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <AnimatePresence mode="popLayout">
                                {currentInterview.questions.map((q, i) => (
                                  <motion.div
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/20 hover:bg-indigo-500/[0.01] transition-all"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-zinc-900/80 border border-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                                       <span className="text-zinc-600 font-black text-[10px] uppercase">Q{i + 1}</span>
                                    </div>
                                    <p className="flex-1 text-[14px] text-zinc-300 font-medium leading-[1.6]">{q.text}</p>
                                    <button
                                      onClick={() => removeQuestion(q.id)}
                                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>

                        {/* Manual Insertion Strip */}
                        <div className="p-6 bg-white/[0.02] border-t border-white/[0.06]">
                          <div className="flex gap-4">
                            <div className="flex-1 relative">
                              <Textarea
                                placeholder="Introduce a custom technical question..."
                                value={currentQuestion.text}
                                className="bg-zinc-900/40 border-white/[0.08] min-h-[44px] max-h-[120px] py-3 px-4 rounded-2xl resize-none focus:border-indigo-500/30 text-[14px] text-white placeholder:text-zinc-600 transition-all font-medium pr-12"
                                onChange={(e) => setCurrentQuestion({ text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    addQuestion();
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                onClick={addQuestion}
                                disabled={!currentQuestion.text.trim()}
                                className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-zinc-800 hover:bg-indigo-500 text-zinc-400 hover:text-white transition-all disabled:opacity-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between px-1">
                             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Manual Insertion Active</p>
                             <span className="text-[11px] font-black text-indigo-400/80 tracking-tighter uppercase">
                               {currentInterview.questions?.length || 0} Calibrated
                             </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grounded Modal Footer */}
                <div className="flex items-center justify-between p-8 border-t border-white/[0.08] bg-black/40 backdrop-blur-2xl">
                   <div className="flex items-center gap-2 text-zinc-500 group cursor-default">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[12px] font-bold uppercase tracking-widest">Deployment Pipeline Ready</span>
                   </div>
                   <div className="flex gap-4">
                      <Button
                        variant="ghost"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="hover:bg-white/[0.05] h-11 px-8 rounded-2xl text-[13px] font-black text-zinc-500 hover:text-white uppercase tracking-widest"
                      >
                        Abort
                      </Button>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveInterview}
                        className="h-11 px-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[13px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                      >
                        Deploy Interview
                      </motion.button>
                   </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stat strip */}
          {!loading && interviews.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-4 mt-8"
            >
              {[
                { label: "Total Interviews", value: interviews.length, icon: AudioWaveform, color: "from-indigo-600/15 to-violet-600/15", border: "border-indigo-500/15", iconColor: "text-indigo-400", iconBg: "bg-indigo-500/15" },
                { label: "Total Candidates", value: interviews.reduce((a, b) => a + (b.candidatesCount || 0), 0), icon: Users, color: "from-emerald-600/15 to-cyan-600/15", border: "border-emerald-500/15", iconColor: "text-emerald-400", iconBg: "bg-emerald-500/15" },
                { label: "Avg. Questions", value: Math.round(interviews.reduce((a, b) => a + (b.questionCount || 0), 0) / (interviews.length || 1)), icon: TrendingUp, color: "from-pink-600/15 to-rose-600/15", border: "border-pink-500/15", iconColor: "text-pink-400", iconBg: "bg-pink-500/15" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-[16px] border ${stat.border} bg-gradient-to-br ${stat.color} p-5 flex items-center gap-4`}
                  >
                    <div className={`w-10 h-10 rounded-[10px] ${stat.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-white tracking-tight">{stat.value}</p>
                      <p className="text-[12px] text-zinc-500">{stat.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            </div>
            <p className="text-zinc-500 text-[13px] font-medium">Loading evaluations...</p>
          </div>
        ) : interviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 rounded-[20px] border border-dashed border-white/[0.06] bg-white/[0.01]"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-600/15 border border-indigo-500/20 flex items-center justify-center mb-5">
              <AudioWaveform className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-[18px] font-bold text-white mb-2">No evaluations yet</h2>
            <p className="text-zinc-500 text-[14px] mb-7 text-center max-w-xs">
              Create your first AI-powered interview template to get started.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 h-10 px-6 rounded-[11px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[13px] font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            >
              <Plus className="w-4 h-4" />
              Create First Interview
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {interviews.map((interview, i) => {
              const colors = getSubjectColor(interview.subject);
              return (
                <motion.div
                  key={interview.id}
                  variants={fadeUp}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="group relative rounded-[18px] border border-white/[0.07] bg-[#0a0a0a] hover:border-white/[0.14] transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top accent gradient */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="p-5 flex flex-col flex-1 gap-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {interview.subject}
                      </span>
                      <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {interview.timeLimit}m
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3
                        className="text-[16px] font-bold text-white mb-1.5 cursor-pointer hover:text-indigo-300 transition-colors tracking-tight"
                        onClick={() => prepareView(interview)}
                      >
                        {interview.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[12px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {interview.questionCount} questions
                        </span>
                        <span className="w-[3px] h-[3px] rounded-full bg-zinc-600" />
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {interview.candidatesCount} candidates
                        </span>
                      </div>
                    </div>

                    {/* Created date */}
                    <div className="text-[11px] text-zinc-600">
                      Created {interview.createdAt}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-auto border-t border-white/[0.04] grid grid-cols-3 gap-2">
                      <button
                        onClick={() => copyInterviewLink(interview.id)}
                        className="flex items-center justify-center gap-1.5 h-8 rounded-[8px] text-[12px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        {copiedId === interview.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === interview.id ? "Copied!" : "Link"}
                      </button>
                      <button
                        onClick={() => router.push(`/interview/${interview.id}/results`)}
                        className="flex items-center justify-center gap-1.5 h-8 rounded-[8px] text-[12px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Results
                      </button>
                      <button
                        onClick={() => prepareView(interview)}
                        className="flex items-center justify-center gap-1.5 h-8 rounded-[8px] text-[12px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* VIEW DIALOG */}
      <AnimatePresence>
        {isViewDialogOpen && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-[500px] bg-[#0a0a0a] border border-white/[0.08] text-foreground shadow-2xl rounded-[20px] p-0">
              {selectedInterview && (
                <div className="flex flex-col">
                  <div className="p-6 border-b border-white/[0.06]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border mb-3 ${getSubjectColor(selectedInterview.subject).bg} ${getSubjectColor(selectedInterview.subject).text} ${getSubjectColor(selectedInterview.subject).border}`}>
                          {selectedInterview.subject}
                        </div>
                        <h2 className="text-[20px] font-bold text-white tracking-tight">{selectedInterview.name}</h2>
                        <div className="flex gap-4 mt-2 text-[13px] text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {selectedInterview.timeLimit} minutes
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {selectedInterview.candidatesCount} candidates
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteInterview(selectedInterview.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Questions ({selectedInterview.questions?.length})
                      </h3>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {selectedInterview.questions?.length ? (
                        selectedInterview.questions.map((q, i) => (
                          <div
                            key={q.id}
                            className="p-3.5 rounded-[12px] border border-white/[0.05] bg-white/[0.02] flex items-start gap-3"
                          >
                            <span className="text-zinc-600 font-mono text-[12px] font-bold mt-0.5 shrink-0">
                              {String(i + 1).padStart(2, "0")}.
                            </span>
                            <p className="text-[13px] text-zinc-300 leading-relaxed">{q.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-zinc-600 border border-white/[0.04] border-dashed rounded-[12px] text-[13px]">
                          No questions found.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-t border-white/[0.06] bg-black/20 flex gap-3">
                    <button
                      onClick={() => copyInterviewLink(selectedInterview.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.07] transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => router.push(`/interview/${selectedInterview.id}/results`)}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[10px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      View Results
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
