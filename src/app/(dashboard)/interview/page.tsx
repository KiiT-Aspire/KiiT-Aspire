"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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

const subjectThemes: Record<string, { bg: string; text: string; ring: string }> = {
  "Software Engineering": { bg: "bg-indigo-100", text: "text-indigo-700", ring: "border-indigo-200" },
  "Cloud Computing": { bg: "bg-cyan-100", text: "text-cyan-700", ring: "border-cyan-200" },
  "Data Science": { bg: "bg-violet-100", text: "text-violet-700", ring: "border-violet-200" },
  "System Design": { bg: "bg-amber-100", text: "text-amber-700", ring: "border-amber-200" },
  "Frontend Development": { bg: "bg-pink-100", text: "text-pink-700", ring: "border-pink-200" },
};

export default function InterviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const userId = user?.id ?? "";
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
    if (!userId) return;
    const initializePage = async () => {
      try {
        await fetchInterviews(userId);
      } catch (error) {
        console.error("Failed to initialize:", error);
        setLoading(false);
      }
    };
    initializePage();
  }, [userId]);

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
      return toast.error("Please fill in all fields and add at least one question.");
    }
    try {
      const payload = { ...currentInterview, createdBy: userId, questions: currentInterview.questions.map(q => ({ text: q.text, subject: q.subject })) };
      const res = await fetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("Interview created successfully.");
        setCurrentInterview({ name: "", subject: "", timeLimit: 30, questions: [] });
        setIsCreateDialogOpen(false);
        fetchInterviews(userId);
      } else toast.error("Failed to create interview.");
    } catch { toast.error("Something went wrong. Please try again."); }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm("Delete this interview? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Interview deleted.");
        setIsViewDialogOpen(false);
        fetchInterviews(userId);
      } else toast.error("Failed to delete interview.");
    } catch { toast.error("Something went wrong."); }
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
    <div className="min-h-screen bg-[#f8faf8] text-gray-900 selection:bg-green-200 overflow-x-hidden">
      <Toaster position="bottom-right" />
      
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[60%] h-[500px] bg-green-300/[0.08] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[400px] bg-emerald-300/[0.06] blur-[120px] rounded-full" />
        <div className="absolute inset-x-0 top-0 h-[1000px] bg-[radial-gradient(ellipse_at_top,rgba(22,163,74,0.03),transparent)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-10 lg:py-12">
        
        {/* Superior Header */}
        <header className="mb-12">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div variants={fadeUp} className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-100 border border-green-300 flex items-center justify-center">
                     <AudioWaveform className="w-5 h-5 text-green-700" />
                  </div>
                  <h1 className="text-[30px] font-black tracking-tight text-gray-900 leading-none">Evaluations</h1>
               </div>
               <p className="text-[15px] text-gray-500 font-medium max-w-lg leading-relaxed">
                  Create and manage AI interview sessions for your students, and track their results in real-time.
               </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
               <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search interviews..." 
                    className="h-10 pl-10 pr-4 bg-white border border-green-200 rounded-xl text-[13px] font-medium text-gray-700 placeholder:text-gray-400 focus:ring-1 focus:ring-green-400 focus:border-green-400 w-full sm:w-[240px] transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               
               <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <motion.button 
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(99,102,241,0.4)" }} 
                      whileTap={{ scale: 0.98 }}
                      className="h-10 px-6 rounded-xl bg-green-600 text-white text-[13px] font-bold transition-all whitespace-nowrap w-full sm:w-auto flex items-center justify-center hover:bg-green-700 shadow-md shadow-green-200"
                    >
                      <Plus className="w-4 h-4 mr-2 inline-block mb-0.5" />
                      Set Up Interview
                    </motion.button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto bg-white border border-green-200 shadow-2xl rounded-[32px] p-0 flex flex-col">
                    <div className="p-6 sm:p-8 border-b border-green-100 bg-green-50">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[20px] bg-green-100 flex items-center justify-center text-green-700 border border-green-200 shrink-0">
                             <Activity className="w-6 h-6" />
                          </div>
                          <div>
                             <DialogTitle className="text-[20px] sm:text-[22px] font-black text-gray-900 leading-none mb-1">Create New Interview</DialogTitle>
                             <p className="text-[13px] sm:text-[14px] text-gray-500 font-medium">Configure your interview session and add questions.</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 overflow-hidden shrink-0">
                       <div className="lg:col-span-5 space-y-8">
                          <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Interview Details</h3>
                            <div className="grid grid-cols-1 gap-6">
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest ml-1">Interview Name</Label>
                                  <Input 
                                    placeholder="e.g. Core Engineering" 
                                    className="h-12 bg-white border-green-200 rounded-2xl focus:border-green-400 focus:ring-1 focus:ring-green-400 text-[14px] font-medium text-gray-900 placeholder:text-gray-400"
                                    value={currentInterview.name}
                                    onChange={e => setCurrentInterview(p => ({...p, name: e.target.value}))}
                                  />
                               </div>
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest ml-1">Subject</Label>
                                  <Select onValueChange={v => setCurrentInterview(p => ({...p, subject: v}))} value={currentInterview.subject}>
                                    <SelectTrigger className="h-12 bg-white border-green-200 rounded-2xl text-[14px] font-medium text-gray-900">
                                       <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-green-200 rounded-2xl p-1.5 shadow-xl">
                                       {subjects.map(s => (
                                          <SelectItem key={s} value={s} className="rounded-xl py-3 font-medium cursor-pointer text-gray-800">{s}</SelectItem>
                                       ))}
                                    </SelectContent>
                                  </Select>
                               </div>
                               <div className="space-y-2.5">
                                  <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest ml-1">Time Limit (minutes)</Label>
                                  <Input 
                                    type="number" 
                                    className="h-12 bg-white border-green-200 rounded-2xl text-[14px] font-mono text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400"
                                    value={currentInterview.timeLimit}
                                    onChange={e => setCurrentInterview(p => ({...p, timeLimit: parseInt(e.target.value) || 30}))}
                                  />
                               </div>
                            </div>
                          </div>

                          <div className="p-6 rounded-3xl bg-green-50 border border-green-200 space-y-4">
                             <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-green-700" />
                                <span className="text-[12px] font-black uppercase text-green-800 tracking-wider">AI Accelerator</span>
                             </div>
                             <p className="text-[12px] text-gray-600 leading-relaxed font-medium">Auto-generate 5 AI-suggested questions for the selected subject.</p>
                             <Button 
                                onClick={generateAIQuestions}
                                disabled={aiLoading || !currentInterview.subject}
                                className="w-full bg-green-600 text-white hover:bg-green-700 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                             >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Questions"}
                             </Button>
                          </div>
                       </div>

                       <div className="lg:col-span-7 flex flex-col min-h-[400px]">
                          <div className="flex items-center justify-between mb-4">
                             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Question List</h3>
                             <span className="text-[11px] font-black text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                               {currentInterview.questions?.length || 0} Questions
                             </span>
                          </div>

                          <div className="flex-1 bg-gray-50 border border-green-200 rounded-[28px] overflow-hidden flex flex-col">
                             <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[350px] sm:max-h-[450px]">
                                {(!currentInterview.questions || currentInterview.questions.length === 0) ? (
                                   <div className="h-full flex flex-col items-center justify-center opacity-60 py-20 px-4 text-center">
                                      <FolderDot className="w-8 h-8 mb-4 text-gray-400" />
                                      <p className="text-[13px] font-semibold text-gray-400">No questions added yet</p>
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
                                           className="p-4 rounded-2xl bg-white border border-green-200 flex gap-4 group transition-colors hover:border-green-300 shadow-sm"
                                         >
                                            <span className="text-[10px] font-black text-green-600 uppercase mt-1 shrink-0">#{i+1}</span>
                                            <p className="flex-1 text-[13px] sm:text-[14px] text-gray-700 leading-relaxed font-medium">{q.text}</p>
                                            <button onClick={() => removeQuestion(q.id)} className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                               <Trash2 className="w-4 h-4" />
                                            </button>
                                         </motion.div>
                                      ))}
                                   </AnimatePresence>
                                )}
                             </div>
                             
                             <div className="p-4 bg-white border-t border-green-200">
                                <div className="relative group">
                                   <Textarea 
                                      placeholder="Type your question here..." 
                                      className="bg-gray-50 border-green-200 rounded-2xl min-h-[50px] max-h-[120px] focus:border-green-400 focus:ring-1 focus:ring-green-400 text-[14px] py-3 pl-4 pr-12 transition-all font-medium text-gray-800"
                                      value={currentQuestion.text}
                                      onChange={e => setCurrentQuestion({text: e.target.value})}
                                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuestion(); }}}
                                   />
                                   <button 
                                      onClick={addQuestion} 
                                      disabled={!currentQuestion.text.trim()}
                                      className="absolute right-2 bottom-2 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all disabled:opacity-30"
                                   >
                                      <Plus className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 sm:p-8 border-t border-green-100 bg-green-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-[0.2em]">Ready to Create</span>
                       </div>
                       <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="h-12 flex-1 sm:flex-none px-8 rounded-2xl text-[12px] font-bold uppercase text-gray-500 hover:text-gray-800 hover:bg-gray-100">Cancel</Button>
                          <Button onClick={saveInterview} className="h-12 flex-1 sm:flex-none px-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-200">Create Interview</Button>
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
             <p className="text-[14px] text-zinc-600 font-bold uppercase tracking-widest">Loading Interviews</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="py-32 rounded-[40px] border border-dashed border-green-200 bg-green-50/50 flex flex-col items-center text-center px-6">
             <div className="w-20 h-20 rounded-3xl bg-green-100 border border-green-200 flex items-center justify-center mb-8">
                <Globe className="w-10 h-10 text-green-400" />
             </div>
             <h2 className="text-[24px] font-black text-gray-900 mb-3">No Interviews Yet</h2>
             <p className="text-[15px] text-gray-500 max-w-sm mb-10 leading-relaxed font-medium">Create your first interview session to start evaluating your students with AI.</p>
             <Button onClick={() => setIsCreateDialogOpen(true)} className="h-12 px-10 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700">Set Up Interview</Button>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredInterviews.map((item, i) => {
               const theme = subjectThemes[item.subject] || subjectThemes["Software Engineering"];
               return (
                  <motion.div 
                    key={item.id} 
                    variants={fadeUp} 
                    className="group relative flex flex-col bg-white border border-green-200 rounded-[28px] p-6 transition-all duration-300 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 h-full"
                  >
                     <div className="relative z-10 flex flex-col gap-5 h-full">
                        <div className="flex items-center justify-between">
                           <div className={`px-3 py-1.5 rounded-xl border ${theme.ring} ${theme.bg} ${theme.text} text-[10px] font-bold uppercase tracking-widest`}>
                              {item.subject}
                           </div>
                           <span className="text-[11px] font-mono text-gray-400 font-semibold">{item.timeLimit}m limit</span>
                        </div>

                        <div>
                           <h3 onClick={() => prepareView(item)} className="text-[18px] font-black text-gray-900 leading-tight mb-2 cursor-pointer hover:text-green-700 transition-colors tracking-tight break-words">
                              {item.name}
                           </h3>
                           <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 text-[12px] font-semibold">
                              <span className="flex items-center gap-1.5">
                                 <Plus className="w-3.5 h-3.5 text-gray-400" /> {item.questionCount} Q
                              </span>
                              <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
                              <span className="flex items-center gap-1.5 text-green-600">
                                 <Users className="w-3.5 h-3.5" /> {item.candidatesCount} Applied
                              </span>
                           </div>
                        </div>

                        <div className="mt-auto pt-5 border-t border-green-100 flex items-center justify-between">
                           <div className="flex items-center gap-2 group/link cursor-pointer" onClick={() => copyInterviewLink(item.id)}>
                              <div className={`w-9 h-9 rounded-xl ${copiedId === item.id ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-200'} flex items-center justify-center transition-all border hover:bg-green-100 hover:border-green-300`}>
                                 {copiedId === item.id ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4 text-gray-500 group-hover/link:text-green-600" />}
                              </div>
                              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${copiedId === item.id ? 'text-green-600' : 'text-gray-400 group-hover/link:text-green-600'} transition-all hidden sm:block`}>
                                 {copiedId === item.id ? 'Copied!' : 'Share'}
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteInterview(item.id); }} 
                                className="p-2.5 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all border border-gray-200 hover:border-red-200"
                                title="Delete Interview"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => prepareView(item)} className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 transition-all border border-gray-200 hover:border-green-300">
                                 <Eye className="w-5 h-5" />
                              </button>
                              <button onClick={() => router.push(`/interview/${item.id}/results`)} className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 transition-all border border-gray-200 hover:border-green-300">
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
             <DialogContent className="max-w-[550px] w-[95vw] bg-white border border-green-200 rounded-[40px] p-0 shadow-2xl overflow-hidden">
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
         <div className="p-6 sm:p-10 pb-6 border-b border-green-100 bg-green-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-200/30 blur-[80px] opacity-60 rounded-full" />
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-6">
                  <div className={`px-4 py-1.5 rounded-xl border ${theme.ring} ${theme.bg} ${theme.text} text-[10px] font-bold uppercase tracking-widest`}>
                     {selectedInterview.subject}
                  </div>
                  <button onClick={() => deleteInterview(selectedInterview.id)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all border border-red-100">
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
               <h2 className="text-[24px] sm:text-[30px] font-black text-gray-900 tracking-tight leading-[1.1] mb-4 break-words">{selectedInterview.name}</h2>
               <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-green-500" /> {selectedInterview.timeLimit}m limit</span>
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-green-500" /> {selectedInterview.candidatesCount} applied</span>
               </div>
            </div>
         </div>

         {/* Content Area */}
         <div className="p-6 sm:p-10 pb-4 flex-1 overflow-y-auto space-y-8">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Interview Questions</h3>
               <div className="space-y-3">
                  {selectedInterview.questions?.map((q, i) => (
                     <div key={q.id || i} className="p-5 sm:p-6 rounded-[20px] bg-gray-50 border border-green-100 hover:border-green-200 transition-all">
                        <div className="flex items-start gap-4">
                           <span className="text-[11px] font-black text-green-600 uppercase mt-1 shrink-0">#{i+1}</span>
                           <p className="text-[14px] sm:text-[15px] font-medium text-gray-800 leading-relaxed">{q.text}</p>
                        </div>
                     </div>
                  ))}
                  {!selectedInterview.questions?.length && (
                    <div className="py-16 text-center border border-dashed border-green-200 rounded-[24px] bg-green-50/50">
                       <FolderDot className="w-10 h-10 mx-auto mb-4 text-green-300" />
                       <p className="text-[13px] font-semibold text-gray-400">No questions added</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Action Bar */}
         <div className="p-6 sm:p-10 pt-4 flex flex-col gap-4 border-t border-green-100 bg-white">
            <Button 
               onClick={() => copyInterviewLink(selectedInterview.id)} 
               className={`h-12 w-full rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all ${
                 copiedId === selectedInterview.id 
                   ? 'bg-green-100 text-green-700 border-green-300 border' 
                   : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-700 hover:border-green-300'
               }`}
            >
               {copiedId === selectedInterview.id ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Link Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Student Link</>}
            </Button>
            <Button onClick={() => router.push(`/interview/${selectedInterview.id}/results`)} className="h-14 w-full rounded-[24px] bg-green-600 hover:bg-green-700 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-200 transition-all">
               View Results
            </Button>
         </div>
      </div>
   );
}
