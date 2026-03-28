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
  ChevronRight, Copy, Eye, ArrowUpRight, Search, Filter,
  LayoutGrid, List, Activity, Settings2, ShieldCheck, Globe
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
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

const subjectThemes: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
  "Software Engineering": { bg: "bg-indigo-500/10", text: "text-indigo-400", ring: "ring-indigo-500/20", iconBg: "bg-indigo-500/20" },
  "Cloud Computing": { bg: "bg-cyan-500/10", text: "text-cyan-400", ring: "ring-cyan-500/20", iconBg: "bg-cyan-500/20" },
  "Data Science": { bg: "bg-violet-500/10", text: "text-violet-400", ring: "ring-violet-500/20", iconBg: "bg-violet-500/20" },
  "System Design": { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/20", iconBg: "bg-amber-500/20" },
  "Frontend Development": { bg: "bg-pink-500/10", text: "text-pink-400", ring: "ring-pink-500/20", iconBg: "bg-pink-500/20" },
};

export default function InterviewPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      } else toast.error("Failed to load assessments");
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
    if (!currentInterview.subject) return toast.error("Select deep domain first.");
    setAiLoading(true);
    try {
      const res = await fetch("/api/interviews/ai-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: currentInterview.subject, count: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AI calibrated 5 questions.");
        const newQs = data.data.map((q: any) => ({ ...q, id: `ai_${Math.random()}` }));
        setCurrentInterview(p => ({ ...p, questions: [...(p.questions || []), ...newQs] }));
      } else toast.error(data.error || "AI busy.");
    } catch { toast.error("AI connection failed."); }
    finally { setAiLoading(false); }
  };

  const saveInterview = async () => {
    if (!currentInterview.name || !currentInterview.subject || !currentInterview.questions?.length) {
      return toast.error("Pipeline incomplete. Calibration required.");
    }
    try {
      const payload = { ...currentInterview, createdBy: userId, questions: currentInterview.questions.map(q => ({ text: q.text, subject: q.subject })) };
      const res = await fetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("Pipeline deployed.");
        setCurrentInterview({ name: "", subject: "", timeLimit: 30, questions: [] });
        setIsCreateDialogOpen(false);
        fetchInterviews(userId);
      } else toast.error("Deployment failed.");
    } catch { toast.error("Critical deployment error."); }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm("Decommission this pipeline? Data loss is permanent.")) return;
    try {
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Pipeline decommissioned.");
        setIsViewDialogOpen(false);
        fetchInterviews(userId);
      } else toast.error("Command failed.");
    } catch { toast.error("Critical error."); }
  };

  const copyInterviewLink = async (id: string) => {
    const link = `${window.location.origin}/interviewee/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.error("Copy failed."); }
  };

  const prepareView = async (interview: Interview) => {
    setIsViewDialogOpen(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}`);
      const data = await res.json();
      if (data.success) setSelectedInterview({ ...interview, questions: data.data.questions || [] });
    } catch { toast.error("Session error."); }
  };

  const filteredInterviews = interviews.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <Toaster position="bottom-right" />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[60%] h-[500px] bg-indigo-600/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[400px] bg-emerald-600/[0.02] blur-[120px] rounded-full" />
        <div className="absolute inset-x-0 top-0 h-[1000px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.02),transparent)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-10 lg:py-12">
        
        {/* Superior Header */}
        <header className="mb-12">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div variants={fadeUp} className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-xl">
                     <AudioWaveform className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h1 className="text-[34px] font-black tracking-tight text-white leading-none">Evaluations</h1>
               </div>
               <p className="text-[15px] text-zinc-500 font-medium max-w-lg leading-relaxed">
                  Manage high-fidelity AI interview templates and track candidate performance in real-time.
               </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
               <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search pipelines..." 
                    className="h-10 pl-10 pr-4 bg-zinc-900/40 border border-white/5 rounded-xl text-[13px] font-medium focus:ring-1 focus:ring-indigo-500/50 w-full sm:w-[240px] transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               
               <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <motion.button 
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(99,102,241,0.4)" }} 
                      whileTap={{ scale: 0.98 }}
                      className="h-10 px-6 rounded-xl bg-white text-black text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap w-full sm:w-auto flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2 inline-block mb-0.5" />
                      New Pipeline
                    </motion.button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto bg-[#080808] border border-white/10 shadow-2xl rounded-[32px] p-0 flex flex-col">
                    <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01]">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[20px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                             <Activity className="w-6 h-6" />
                          </div>
                          <div>
                             <DialogTitle className="text-[20px] sm:text-[22px] font-black text-white leading-none mb-1">Deployment Center</DialogTitle>
                             <p className="text-[13px] sm:text-[14px] text-zinc-500 font-medium">Configure and calibrate your technical agent.</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 overflow-hidden shrink-0">
                       <div className="lg:col-span-5 space-y-8">
                          <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Protocol Parameters</h3>
                            <div className="grid grid-cols-1 gap-6">
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Template Name</Label>
                                  <Input 
                                    placeholder="e.g. Core Engineering" 
                                    className="h-12 bg-zinc-900 border-white/5 rounded-2xl focus:border-indigo-500/50 text-[14px] font-medium"
                                    value={currentInterview.name}
                                    onChange={e => setCurrentInterview(p => ({...p, name: e.target.value}))}
                                  />
                               </div>
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Domain</Label>
                                  <Select onValueChange={v => setCurrentInterview(p => ({...p, subject: v}))} value={currentInterview.subject}>
                                    <SelectTrigger className="h-12 bg-zinc-900 border-white/5 rounded-2xl text-[14px] font-medium">
                                       <SelectValue placeholder="Select domain" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111] border-white/10 rounded-2xl p-1.5">
                                       {subjects.map(s => (
                                          <SelectItem key={s} value={s} className="rounded-xl py-3 font-medium cursor-pointer">{s}</SelectItem>
                                       ))}
                                    </SelectContent>
                                  </Select>
                               </div>
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Session Duration (min)</Label>
                                  <Input 
                                    type="number" 
                                    className="h-12 bg-zinc-900 border-white/5 rounded-2xl text-[14px] font-mono"
                                    value={currentInterview.timeLimit}
                                    onChange={e => setCurrentInterview(p => ({...p, timeLimit: parseInt(e.target.value) || 30}))}
                                  />
                               </div>
                            </div>
                          </div>

                          <div className="p-6 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 space-y-4">
                             <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-[12px] font-black uppercase text-white tracking-wider">AI Accelerator</span>
                             </div>
                             <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">Auto-generate 5 calibrated questions for the selected domain.</p>
                             <Button 
                                onClick={generateAIQuestions}
                                disabled={aiLoading || !currentInterview.subject}
                                className="w-full bg-indigo-500 text-white hover:bg-indigo-400 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
                             >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Generate"}
                             </Button>
                          </div>
                       </div>

                       <div className="lg:col-span-7 flex flex-col min-h-[400px]">
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Calibrated Pool</h3>
                             <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
                               {currentInterview.questions?.length || 0} Calibrated
                             </span>
                          </div>

                          <div className="flex-1 bg-black border border-white/5 rounded-[28px] overflow-hidden flex flex-col">
                             <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[350px] sm:max-h-[450px]">
                                {(!currentInterview.questions || currentInterview.questions.length === 0) ? (
                                   <div className="h-full flex flex-col items-center justify-center opacity-40 py-20 px-4 text-center">
                                      <FolderDot className="w-8 h-8 mb-4 text-zinc-700" />
                                      <p className="text-[13px] font-black uppercase tracking-widest text-zinc-600">Pool Empty</p>
                                   </div>
                                ) : (
                                   <AnimatePresence mode="popLayout">
                                      {currentInterview.questions.map((q, i) => (
                                         <motion.div 
                                           key={q.id} 
                                           layout
                                           initial={{ opacity: 0, y: 10 }}
                                           animate={{ opacity: 1, y: 0 }}
                                           exit={{ opacity: 0, scale: 0.9 }}
                                           className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 group transition-colors hover:border-white/10"
                                         >
                                            <span className="text-[10px] font-black text-zinc-600 uppercase mt-1 shrink-0">#{i+1}</span>
                                            <p className="flex-1 text-[13px] sm:text-[14px] text-zinc-400 leading-relaxed font-medium">{q.text}</p>
                                            <button onClick={() => removeQuestion(q.id)} className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                               <Trash2 className="w-4 h-4" />
                                            </button>
                                         </motion.div>
                                      ))}
                                   </AnimatePresence>
                                )}
                             </div>
                             
                             <div className="p-4 bg-zinc-900/40 border-t border-white/5">
                                <div className="relative group">
                                   <Textarea 
                                      placeholder="Manual insertion text..." 
                                      className="bg-black/80 border-white/5 rounded-2xl min-h-[50px] max-h-[120px] focus:border-indigo-500/30 text-[14px] py-3 pl-4 pr-12 transition-all font-medium"
                                      value={currentQuestion.text}
                                      onChange={e => setCurrentQuestion({text: e.target.value})}
                                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuestion(); }}}
                                   />
                                   <button 
                                      onClick={addQuestion} 
                                      disabled={!currentQuestion.text.trim()}
                                      className="absolute right-2 bottom-2 w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-0"
                                   >
                                      <Plus className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 sm:p-8 border-t border-white/5 bg-black flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.2em]">Agent Ready for Deployment</span>
                       </div>
                       <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="h-12 flex-1 sm:flex-none px-8 rounded-2xl text-[12px] font-black uppercase text-zinc-500">Abort</Button>
                          <Button onClick={saveInterview} className="h-12 flex-1 sm:flex-none px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10">Deploy</Button>
                       </div>
                    </div>
                  </DialogContent>
               </Dialog>
            </motion.div>
          </motion.div>
        </header>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="w-12 h-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin" />
             <p className="text-[14px] text-zinc-600 font-bold uppercase tracking-widest">Hydrating Pipelines</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="py-32 rounded-[40px] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center text-center px-6">
             <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-8">
                <Globe className="w-10 h-10 text-zinc-700" />
             </div>
             <h2 className="text-[24px] font-black text-white mb-3">No Active Channels</h2>
             <p className="text-[15px] text-zinc-500 max-w-sm mb-10 leading-relaxed font-medium">Create your first evaluation pipeline to start conducting AI-automated technical assessments.</p>
             <Button onClick={() => setIsCreateDialogOpen(true)} className="h-12 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest">Initialize Sequence</Button>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredInterviews.map((item, i) => {
               const theme = subjectThemes[item.subject] || subjectThemes["Software Engineering"];
               return (
                  <motion.div 
                    key={item.id} 
                    variants={fadeUp} 
                    className="group relative flex flex-col bg-zinc-900/30 border border-white/[0.06] rounded-[32px] p-6 transition-all duration-500 hover:bg-zinc-900/60 hover:border-white/10 hover:shadow-2xl hover:shadow-black h-full"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                     
                     <div className="relative z-10 flex flex-col gap-6 h-full">
                        <div className="flex items-center justify-between">
                           <div className={`px-4 py-1.5 rounded-xl border ${theme.ring} ${theme.bg} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                              {item.subject}
                           </div>
                           <span className="text-[11px] font-mono text-zinc-600 font-bold">{item.timeLimit}m limit</span>
                        </div>

                        <div>
                           <h3 onClick={() => prepareView(item)} className="text-[18px] font-black text-white leading-tight mb-2 cursor-pointer group-hover:text-indigo-400 transition-colors uppercase tracking-tight break-words">
                              {item.name}
                           </h3>
                           <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-zinc-500 text-[12px] font-bold">
                              <span className="flex items-center gap-1.5">
                                 <Plus className="w-3.5 h-3.5 text-zinc-700 group-hover:text-amber-500 transition-colors" /> {item.questionCount} Q
                              </span>
                              <div className="hidden sm:block w-1 h-1 rounded-full bg-zinc-800" />
                              <span className="flex items-center gap-1.5 text-indigo-400/80">
                                 <Users className="w-3.5 h-3.5" /> {item.candidatesCount} Applied
                              </span>
                           </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-2 group/link cursor-pointer" onClick={() => copyInterviewLink(item.id)}>
                              <div className={`w-9 h-9 rounded-xl ${copiedId === item.id ? 'bg-emerald-500/10' : 'bg-white/5'} flex items-center justify-center transition-all group-hover/link:bg-indigo-500/10 border border-transparent group-hover/link:border-indigo-500/20`}>
                                 {copiedId === item.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4 text-zinc-600 group-hover/link:text-indigo-400" />}
                              </div>
                              <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${copiedId === item.id ? 'text-emerald-400' : 'text-zinc-600 group-hover/link:text-indigo-400'} transition-all hidden sm:block`}>
                                 {copiedId === item.id ? 'Ready' : 'Share'}
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button onClick={() => prepareView(item)} className="p-2.5 rounded-xl bg-white/5 text-zinc-600 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/5">
                                 <Eye className="w-5 h-5" />
                              </button>
                              <button onClick={() => router.push(`/interview/${item.id}/results`)} className="p-2.5 rounded-xl bg-white/5 text-zinc-600 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/5">
                                 <BarChart3 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               );
             })}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
         {isViewDialogOpen && (
           <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
             <DialogContent className="max-w-[550px] w-[95vw] bg-[#080808] border border-white/10 rounded-[40px] p-0 shadow-2xl overflow-hidden selection:bg-indigo-500/20">
               {selectedQuestionsView(selectedInterview, deleteInterview, copyInterviewLink, router, copiedId)}
             </DialogContent>
           </Dialog>
         )}
      </AnimatePresence>
    </div>
  );
}

function selectedQuestionsView(selectedInterview: Interview | null, deleteInterview: Function, copyInterviewLink: Function, router: any, copiedId: string | null) {
   if (!selectedInterview) return null;
   const theme = subjectThemes[selectedInterview.subject] || subjectThemes["Software Engineering"];
   
   return (
      <div className="flex flex-col h-full max-h-[90vh]">
         {/* Top Header */}
         <div className="p-6 sm:p-10 pb-6 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] opacity-60 rounded-full" />
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-6">
                  <div className={`px-4 py-1.5 rounded-xl border ${theme.ring} ${theme.bg} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                     {selectedInterview.subject}
                  </div>
                  <button onClick={() => deleteInterview(selectedInterview.id)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
               <h2 className="text-[24px] sm:text-[32px] font-black text-white tracking-tight leading-[1.1] mb-4 uppercase break-words">{selectedInterview.name}</h2>
               <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400/50" /> {selectedInterview.timeLimit}m limit</span>
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400/50" /> {selectedInterview.candidatesCount} applied</span>
               </div>
            </div>
         </div>

         {/* Content Area */}
         <div className="p-6 sm:p-10 pb-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 space-y-8">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Expert Question Pool</h3>
               <div className="space-y-4">
                  {selectedInterview.questions?.map((q, i) => (
                     <div key={q.id || i} className="p-5 sm:p-6 rounded-[28px] bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] hover:border-white/10">
                        <div className="flex items-start gap-4">
                           <span className="text-[11px] font-black text-indigo-400 uppercase mt-1 shrink-0">#{i+1}</span>
                           <p className="text-[14px] sm:text-[15px] font-medium text-zinc-300 leading-relaxed">{q.text}</p>
                        </div>
                     </div>
                  ))}
                  {!selectedInterview.questions?.length && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[32px]">
                       <FolderDot className="w-10 h-10 mx-auto mb-4 text-zinc-800" />
                       <p className="text-[12px] font-black uppercase tracking-widest text-zinc-600">No calibration found</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Grounded Action Bar */}
         <div className="p-6 sm:p-10 pt-4 flex flex-col gap-4">
            <Button 
               onClick={() => copyInterviewLink(selectedInterview.id)} 
               className={`h-12 w-full rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${copiedId === selectedInterview.id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
               {copiedId === selectedInterview.id ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Protocol Hub Linked</> : <><Copy className="w-4 h-4 mr-2" /> Share Protocol Hub</>}
            </Button>
            <Button onClick={() => router.push(`/interview/${selectedInterview.id}/results`)} className="h-14 w-full rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/10 transition-all hover:scale-[1.01]">
               View Performance Hub
            </Button>
         </div>
      </div>
   );
}
