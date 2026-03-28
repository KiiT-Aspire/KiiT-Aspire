"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit3,
  Users,
  BookOpen,
  Link2,
  BarChart3,
  Loader2,
  Clock,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  Trash2,
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

export default function InterviewPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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
    "Frontend Development"
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast.error("Please select a subject first!");
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
        toast.success("AI generated questions successfully!");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newQuestions = data.data.map((q: any) => ({
          ...q,
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setCurrentInterview((prev) => ({
          ...prev,
          questions: [...(prev.questions || []), ...newQuestions],
        }));
      } else {
        toast.error(data.error || "Failed to generate AI questions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating questions");
    } finally {
      setAiLoading(false);
    }
  };

  const saveInterview = async () => {
    if (!currentInterview.name || !currentInterview.subject || !currentInterview.questions?.length || !userId) {
      toast.error("Please fill all required fields and add questions.");
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
        toast.success("Interview created successfully!");
        setCurrentInterview({ name: "", subject: "", timeLimit: 30, questions: [] });
        setIsCreateDialogOpen(false);
        fetchInterviews(userId);
      } else {
        toast.error(data.message || "Failed to create interview");
      }
    } catch (error) {
      toast.error("Error creating interview: " + (error as Error).message);
    }
  };

  const updateInterview = async () => {
    if (!currentInterview.name || !currentInterview.subject || !currentInterview.questions?.length || !currentInterview.id) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch(`/api/interviews/${currentInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentInterview.name,
          subject: currentInterview.subject,
          timeLimit: currentInterview.timeLimit,
          questions: currentInterview.questions.map((q) => ({ text: q.text, subject: q.subject })),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Interview updated successfully!");
        setCurrentInterview({ name: "", subject: "", timeLimit: 30, questions: [] });
        setIsEditDialogOpen(false);
        fetchInterviews(userId);
      } else {
        toast.error(data.message || "Failed to update interview");
      }
    } catch (error) {
      toast.error("Error updating interview");
    }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm("Are you sure? This will delete all student responses attached to it.")) return;
    try {
      const response = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Interview deleted successfully!");
        setIsViewDialogOpen(false);
        fetchInterviews(userId);
      } else {
        toast.error("Failed to delete interview");
      }
    } catch (err) {
      toast.error("Error deleting interview");
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

  const prepareEdit = async (interview: Interview) => {
    try {
      const res = await fetch(`/api/interviews/${interview.id}`);
      const data = await res.json();
      if (data.success) {
        setCurrentInterview({
          ...interview,
          questions: data.data.questions || [],
        });
        setIsEditDialogOpen(true);
      }
    } catch (e) {
      toast.error("Error loading interview details");
    }
  };

  const prepareView = async (interview: Interview) => {
    try {
      const res = await fetch(`/api/interviews/${interview.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedInterview({ ...interview, questions: data.data.questions || [] });
        setIsViewDialogOpen(true);
      }
    } catch (e) {
      toast.error("Error preparing view details");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 sm:p-10 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Interviews Hub
            </h1>
            <p className="text-slate-400 text-lg">Create, manage, and analyze your AI-powered candidate interviews.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all rounded-full px-6 h-12">
                <PlusCircle className="mr-2 h-5 w-5" />
                New Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create New Interview</DialogTitle>
                <DialogDescription className="text-slate-400">Configure parameters and utilize AI to generate relevant questions.</DialogDescription>
              </DialogHeader>

              <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="interview-name" className="text-slate-300">Interview Name</Label>
                    <Input
                      id="interview-name"
                      placeholder="e.g. Mid-Level Frontend React"
                      value={currentInterview.name || ""}
                      className="bg-slate-950 border-slate-800 focus:border-indigo-500"
                      onChange={(e) => setCurrentInterview(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-slate-300">Subject / Category</Label>
                    <Select value={currentInterview.subject || ""} onValueChange={(val) => setCurrentInterview(p => ({ ...p, subject: val }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-limit" className="text-slate-300">Time Limit (mins)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      min={5}
                      max={180}
                      value={currentInterview.timeLimit}
                      className="bg-slate-950 border-slate-800 focus:border-indigo-500"
                      onChange={(e) => setCurrentInterview(p => ({ ...p, timeLimit: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Generator / Adder */}
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-5 shadow-inner">
                      <div className="flex items-center space-x-2 text-indigo-400 mb-4">
                        <Sparkles className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">AI Assistant</h3>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">Let our AI generate 5 tailored questions based on the selected subject.</p>
                      <Button 
                        onClick={generateAIQuestions} 
                        disabled={aiLoading || !currentInterview.subject}
                        className="w-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/40"
                      >
                        {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                        Generate AI Questions
                      </Button>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                      <h3 className="font-semibold text-slate-300 mb-4">Manual Addition</h3>
                      <Textarea
                        placeholder="Write your custom question here..."
                        value={currentQuestion.text}
                        className="bg-slate-900 border-slate-700 min-h-[100px] mb-4"
                        onChange={(e) => setCurrentQuestion({ text: e.target.value })}
                      />
                      <Button onClick={addQuestion} className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                        Add Question Manually
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: List of selected questions */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col">
                    <h3 className="font-semibold text-slate-300 mb-4 flex justify-between items-center">
                      <span>Selected Questions</span>
                      <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
                        {currentInterview.questions?.length || 0}
                      </Badge>
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2 custom-scrollbar">
                      {(!currentInterview.questions || currentInterview.questions.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                          <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                          <p>No questions added yet.</p>
                        </div>
                      ) : (
                        currentInterview.questions.map((q, i) => (
                          <div key={q.id} className="group relative bg-slate-800 border border-slate-700 p-4 rounded-lg flex gap-3 transition-all hover:border-slate-600">
                            <span className="text-indigo-400 font-mono text-sm mt-0.5">{String(i + 1).padStart(2, '0')}.</span>
                            <p className="flex-1 text-sm text-slate-300 leading-relaxed">{q.text}</p>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeQuestion(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="hover:bg-slate-800">Cancel</Button>
                <Button onClick={saveInterview} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">Save Interview</Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {interviews.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center">
                <Sparkles className="h-16 w-16 text-indigo-500/50 mb-6" />
                <h2 className="text-2xl font-bold text-slate-200 mb-2">No Interviews Found</h2>
                <p className="text-slate-500 mb-6">You haven&apos;t created any AI mock interviews yet.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-full">
                  Create First Interview
                </Button>
              </div>
            ) : (
              interviews.map(interview => (
                <Card key={interview.id} className="bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group flex flex-col overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700">{interview.subject}</Badge>
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {interview.timeLimit}m
                      </div>
                    </div>
                    <CardTitle className="text-xl text-slate-100 font-semibold line-clamp-1">{interview.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end px-6 pb-6 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800/50">
                        <p className="text-sm text-slate-400 mb-1">Questions</p>
                        <p className="text-xl font-mono font-medium text-slate-200">{interview.questionCount}</p>
                      </div>
                      <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800/50">
                        <p className="text-sm text-slate-400 mb-1">Candidates</p>
                        <p className="text-xl font-mono font-medium text-cyan-400">{interview.candidatesCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20"
                          onClick={() => prepareView(interview)}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="w-10 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-indigo-400"
                          onClick={() => prepareEdit(interview)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800"
                          onClick={() => copyInterviewLink(interview.id)}
                        >
                          {copiedId === interview.id ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> : <Link2 className="w-4 h-4 mr-2" />}
                          {copiedId === interview.id ? "Copied" : "Copy Link"}
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-cyan-400"
                          onClick={() => router.push(`/interview/${interview.id}/results`)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reusable View/Edit logic mapped exactly to new UI styling... */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {/* Simple mapping for view dialog in Dark Mode... */}
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader><DialogTitle>Interview Context</DialogTitle></DialogHeader>
          {selectedInterview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div><p className="text-slate-500 text-sm">Target Subject</p><p className="font-semibold text-indigo-400">{selectedInterview.subject}</p></div>
                  <div><p className="text-slate-500 text-sm">Time Target</p><p className="font-semibold">{selectedInterview.timeLimit} Minutes</p></div>
                  <div><p className="text-slate-500 text-sm">Created</p><p>{selectedInterview.createdAt}</p></div>
                  <div><p className="text-slate-500 text-sm">Submissions</p><p className="text-cyan-400">{selectedInterview.candidatesCount}</p></div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-slate-400">Knowledge Checks</h3>
                {selectedInterview.questions?.map((q, i) => (
                  <div key={q.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 text-sm text-slate-300">
                    <span className="text-indigo-500 mr-2 opacity-60">Q{i+1}.</span>{q.text}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-800">
                 <Button variant="destructive" onClick={() => deleteInterview(selectedInterview.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Delete Sandbox</Button>
                 <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsViewDialogOpen(false); prepareEdit(selectedInterview); }}>Modify Template</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
