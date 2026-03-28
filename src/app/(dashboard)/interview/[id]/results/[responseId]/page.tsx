"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Volume2,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  Play
} from "lucide-react";

interface QuestionAnswer {
  questionText: string;
  audioUrl: string | null;
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

export default function ResponseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const responseId = params.responseId as string;

  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (interviewId && responseId) fetchResponseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, responseId]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  const fetchResponseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interviews/${interviewId}/responses/${responseId}`);
      const data = await res.json();

      if (data.success) {
        setResponse({
          id: data.data.id,
          studentName: data.data.student?.name || "Unknown",
          studentEmail: data.data.student?.email || "N/A",
          score: data.data.score,
          evaluation: data.data.evaluation,
          status: data.data.status,
          startedAt: data.data.startedAt,
          completedAt: data.data.completedAt,
          timeTaken: data.data.timeTaken,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questionAnswers: (data.data.answers || []).map((answer: any) => ({
            questionText: answer.questionText,
            audioUrl: answer.audioUrl,
            audioDuration: answer.audioDuration,
            questionOrder: answer.questionOrder,
            answeredAt: answer.answeredAt,
          })),
        });
      } else {
        toast.error("Failed to load response details");
      }
    } catch (error) {
      toast.error("Error loading response details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "abandoned":
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20"><XCircle className="h-3 w-3 mr-1" />Abandoned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const playAudio = (audioUrl: string) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      setAudioElement(null);
      return;
    }
    setPlayingAudio(audioUrl);
    const audio = new Audio(audioUrl);
    setAudioElement(audio);

    audio.play().catch(() => {
      toast.error("Failed to play audio blob");
      setPlayingAudio(null);
      setAudioElement(null);
    });
    audio.onended = () => {
      setPlayingAudio(null);
      setAudioElement(null);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
         <p className="text-lg font-medium animate-pulse">Retrieving Assessment Data...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-rose-500">Telemetry Lost</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-400 space-y-6">
            <p>The evaluation payload could not be located in the database layer.</p>
            <Button variant="outline" onClick={() => router.push(`/interview/${interviewId}/results`)} className="bg-slate-950 border-slate-700 w-full text-slate-300">
              Return to Submissions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 sm:p-10 relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6 relative z-10">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push(`/interview/${interviewId}/results`)}
              className="mb-6 bg-slate-900/80 backdrop-blur border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-full h-10 px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cohort Overview
            </Button>
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  <User className="w-6 h-6" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                   {response.studentName}
                 </h1>
                 <p className="text-cyan-400 text-sm font-mono flex items-center gap-2">
                   <Mail className="w-4 h-4" /> {response.studentEmail}
                 </p>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 backdrop-blur">
             <div className="text-right">
               <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Status</p>
               {getStatusBadge(response.status)}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* Main Assessment Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                 <MessageSquare className="w-5 h-5 text-indigo-400" /> Interaction Log
              </h2>
              <Badge variant="outline" className="border-slate-800 text-slate-400 bg-slate-900">
                {response.questionAnswers.length} Prompts Total
              </Badge>
            </div>

            {response.questionAnswers.length === 0 ? (
              <Card className="bg-slate-900/40 border-slate-800 border-dashed text-center py-20">
                <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">No telemetry recorded for this assessment yet.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {response.questionAnswers
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((qa, index) => (
                    <Card key={index} className="bg-slate-900/80 border-slate-800 shadow-xl relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
                      <CardContent className="p-6 sm:p-8">
                        
                        <div className="flex gap-4 items-start mb-6">
                           <div className="shrink-0 mt-1">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center border border-slate-700">
                                {String(qa.questionOrder).padStart(2, '0')}
                              </div>
                           </div>
                           <div>
                             <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">Evaluator AI</p>
                             <h4 className="text-lg font-medium text-slate-200 leading-snug">"{qa.questionText}"</h4>
                           </div>
                        </div>

                        <div className="ml-12 pl-6 border-l-2 border-slate-800 relative">
                           <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                             <Mic className="w-3 h-3" /> Candidate Audio Payload
                             <span className="text-slate-600 font-mono font-normal ml-auto text-[10px]">{new Date(qa.answeredAt).toLocaleTimeString()}</span>
                           </p>
                           
                           {qa.audioUrl ? (
                             <div className="flex flex-wrap items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                               <Button
                                 onClick={() => playAudio(qa.audioUrl!)}
                                 variant="outline"
                                 className={`rounded-full h-12 px-6 gap-2 transition-all ${
                                   playingAudio === qa.audioUrl 
                                     ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' 
                                     : 'bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                                 }`}
                               >
                                 {playingAudio === qa.audioUrl ? (
                                   <><Volume2 className="h-4 w-4" /> Playing Buffer...</>
                                 ) : (
                                   <><Play className="h-4 w-4 fill-current" /> Play Transmission</>
                                 )}
                               </Button>
                               
                               {qa.audioDuration && (
                                 <div className="flex items-center gap-2 text-slate-400 text-sm font-mono bg-slate-900 px-3 py-1.5 rounded-lg">
                                   <Clock className="w-4 h-4 text-slate-500" />
                                   {qa.audioDuration}s Runtime
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="flex items-center justify-center p-6 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
                               <p className="text-sm text-slate-500 flex items-center gap-2">
                                 <AlertCircle className="w-4 h-4" /> Audio stream dropped or bypassed.
                               </p>
                             </div>
                           )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Metadata */}
          <div className="space-y-6">
            
            {response.status === "completed" && (
               <Card className="bg-slate-900/80 border-slate-800 overflow-hidden relative shadow-2xl">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-500" />
                 <CardHeader className="pb-4">
                   <CardDescription className="uppercase tracking-wider font-semibold text-emerald-500 flex items-center gap-2 text-xs">
                     <Award className="w-4 h-4" /> Aggregated Telemetry Output
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-baseline mb-6 font-mono">
                     <span className="text-6xl font-black text-white">{response.score ?? "--"}</span>
                     <span className="text-xl text-slate-500 ml-2">/ 100</span>
                   </div>
                   
                   <div className="space-y-2">
                     <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> AI Synthesis Summary
                     </p>
                     <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/20">
                       <p className="text-sm text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                         {response.evaluation || "No abstract synthesis was written for this session."}
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader className="pb-4 border-b border-slate-800/50">
                <CardTitle className="text-lg text-slate-200">Execution Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                     <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Session Init</p>
                    <p className="text-slate-300 font-mono text-sm">{new Date(response.startedAt).toLocaleString()}</p>
                  </div>
                </div>

                {response.completedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Session Terminated</p>
                      <p className="text-slate-300 font-mono text-sm">{new Date(response.completedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                     <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Active Duration</p>
                    <p className="text-slate-300 font-mono text-sm">{formatDuration(response.timeTaken)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
}
