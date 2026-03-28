"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  Eye,
  TrendingUp,
} from "lucide-react";

interface ResponseData {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  timeTaken: number | null; // in seconds
}

interface Statistics {
  totalResponses: number;
  completedCount: number;
  inProgressCount: number;
  abandonedCount: number;
  averageScore: number | null;
  completionRate: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [interviewName, setInterviewName] = useState<string>("");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
      fetchResponses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, statusFilter, sortBy, currentPage]);

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`);
      const data = await response.json();
      if (data.success) {
        setInterviewName(data.data.name);
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
    }
  };

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/interviews/${interviewId}/responses?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        const mappedResponses = (data.data || []).map((r: any) => ({
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
        }));

        setResponses(mappedResponses);
        setStatistics({
          totalResponses: data.statistics?.totalResponses || 0,
          completedCount: data.statistics?.completedCount || 0,
          inProgressCount: data.statistics?.inProgressCount || 0,
          abandonedCount: data.statistics?.abandonedCount || 0,
          averageScore: data.statistics?.averageScore 
            ? parseFloat(data.statistics.averageScore) 
            : 0,
          completionRate: data.statistics?.totalResponses
            ? (data.statistics.completedCount / data.statistics.totalResponses) * 100
            : 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || "Failed to load results");
      }
    } catch (error) {
      toast.error("Error loading results");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" /> In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
            <XCircle className="h-3 w-3 mr-1" /> Abandoned
          </Badge>
        );
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

  const exportToCSV = () => {
    if (!responses.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Student Name", "Email", "Score", "Status", "Started At", "Completed At", "Time Taken (seconds)"
    ];
    const csvRows = [
      headers.join(","),
      ...responses.map((r) =>
        [
          r.studentName,
          r.studentEmail,
          r.score ?? "N/A",
          r.status,
          new Date(r.startedAt).toLocaleString(),
          r.completedAt ? new Date(r.completedAt).toLocaleString() : "N/A",
          r.timeTaken ?? "N/A",
        ].join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${interviewId}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported successfully!");
  };

  const sortedResponses = [...responses].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return (b.score ?? 0) - (a.score ?? 0);
      case "date":
      default:
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 sm:p-10">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-20" />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push("/interview")}
              className="mb-6 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              Performance Dashboard
            </h1>
            <p className="text-slate-400">{interviewName || "Loading..."}</p>
          </div>
          <Button onClick={exportToCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Total Attempts</CardDescription>
                <CardTitle className="text-4xl text-slate-100 font-mono">
                  {statistics.totalResponses}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Average Score</CardDescription>
                <CardTitle className="text-4xl text-emerald-400 font-mono flex items-center">
                  {typeof statistics.averageScore === 'number' && !isNaN(statistics.averageScore) && statistics.averageScore > 0
                    ? statistics.averageScore.toFixed(1)
                    : "--"}
                  {typeof statistics.averageScore === 'number' && !isNaN(statistics.averageScore) && statistics.averageScore > 0 && (
                    <TrendingUp className="h-6 w-6 ml-2 text-emerald-500 opacity-50" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Completion Rate</CardDescription>
                <CardTitle className="text-4xl text-cyan-400 font-mono">
                  {typeof statistics.completionRate === 'number' && !isNaN(statistics.completionRate)
                    ? statistics.completionRate.toFixed(0)
                    : "0"}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Status Snapshot</CardDescription>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-emerald-400">Completed</span>
                    <span className="font-mono text-slate-300">{statistics.completedCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-indigo-400">In Progress</span>
                    <span className="font-mono text-slate-300">{statistics.inProgressCount}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">Abandoned</span>
                    <span className="font-mono text-slate-300">{statistics.abandonedCount}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-4 border border-slate-800 rounded-xl backdrop-blur-sm">
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2 block mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-950 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 sm:flex-none">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2 block mb-1">Sort</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-950 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
             <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        ) : sortedResponses.length === 0 ? (
          <Card className="py-20 text-center bg-slate-900/40 border-slate-800 border-dashed rounded-3xl">
            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-medium text-slate-200 mb-2">No data available</h3>
            <p className="text-slate-500">No candidates have taken this interview yet.</p>
          </Card>
        ) : (
          <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
               <CardTitle className="text-lg text-slate-200">Candidate Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4 font-medium">Candidate</th>
                      <th className="p-4 font-medium">Contact</th>
                      <th className="p-4 font-medium text-center">Score</th>
                      <th className="p-4 font-medium text-center">Status</th>
                      <th className="p-4 font-medium">Timeline</th>
                      <th className="p-4 font-medium text-center">Duration</th>
                      <th className="p-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {sortedResponses.map((response) => (
                      <tr
                        key={response.id}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                        onClick={() => router.push(`/interview/${interviewId}/results/${response.id}`)}
                      >
                        <td className="p-4 flex items-center gap-3 text-slate-200 font-medium">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          {response.studentName}
                        </td>
                        <td className="p-4 text-slate-400">{response.studentEmail}</td>
                        <td className="p-4 text-center">
                          {response.score !== null ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 font-mono">
                              <Award className="h-3 w-3 mr-1" />
                              {response.score}
                            </Badge>
                          ) : (
                            <span className="text-slate-600 font-mono">--</span>
                          )}
                        </td>
                        <td className="p-4 text-center">{getStatusBadge(response.status)}</td>
                        <td className="p-4">
                          <div className="text-slate-400 font-mono text-xs space-y-1">
                            <div className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(response.startedAt).toLocaleDateString()}</div>
                            <div className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(response.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-slate-400 font-mono text-xs">
                           {formatDuration(response.timeTaken)}
                        </td>
                        <td className="p-4 text-center">
                          <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-slate-900/50 text-slate-400">
                  <span className="text-xs">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                    <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
