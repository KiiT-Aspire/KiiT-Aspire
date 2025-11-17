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

const ResultsPage = () => {
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

      console.log("API Response:", data);

      if (data.success) {
        // Map the response data to match the expected format
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

        console.log("📊 Statistics from API:", data.statistics);
        console.log("📈 Average Score:", data.statistics?.averageScore);
        console.log("✅ Completed Count:", data.statistics?.completedCount);
        console.log("🔄 In Progress:", data.statistics?.inProgressCount);
        console.log("❌ Abandoned:", data.statistics?.abandonedCount);

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
      console.error("Error fetching responses:", error);
      toast.error("Error loading results");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Abandoned
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const viewResponseDetails = (responseId: string) => {
    router.push(`/interview/${interviewId}/results/${responseId}`);
  };

  const exportToCSV = () => {
    if (!responses.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Score",
      "Status",
      "Started At",
      "Completed At",
      "Time Taken (seconds)",
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

  // Sort responses
  const sortedResponses = [...responses].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return (b.score ?? 0) - (a.score ?? 0);
      case "date":
      default:
        return (
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/interview")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Interview Results
              </h1>
              <p className="text-gray-600 mt-1">{interviewName}</p>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Attempts</CardDescription>
                <CardTitle className="text-3xl">
                  {statistics.totalResponses}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {typeof statistics.averageScore === 'number' && !isNaN(statistics.averageScore)
                    ? statistics.averageScore.toFixed(1)
                    : "N/A"}
                  {typeof statistics.averageScore === 'number' && 
                   !isNaN(statistics.averageScore) && 
                   statistics.averageScore > 0 && (
                    <TrendingUp className="h-5 w-5 ml-2 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completion Rate</CardDescription>
                <CardTitle className="text-3xl">
                  {typeof statistics.completionRate === 'number' && !isNaN(statistics.completionRate)
                    ? statistics.completionRate.toFixed(0)
                    : "0"}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Status Breakdown</CardDescription>
                <div className="text-sm space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-green-600">Completed:</span>
                    <span className="font-medium">
                      {statistics.completedCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">In Progress:</span>
                    <span className="font-medium">
                      {statistics.inProgressCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abandoned:</span>
                    <span className="font-medium">
                      {statistics.abandonedCount}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <div>
              <label className="text-sm text-gray-600 mr-2">
                Filter by Status:
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">Sort by:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading results...</p>
            </div>
          </div>
        ) : sortedResponses.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No responses yet
            </h3>
            <p className="text-gray-600">
              Students haven't taken this interview yet
            </p>
          </Card>
        ) : (
          <>
            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>Student Responses</CardTitle>
                <CardDescription>
                  Click on a row to view detailed response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-gray-600">
                          Student
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">
                          Email
                        </th>
                        <th className="text-center p-3 text-sm font-medium text-gray-600">
                          Score
                        </th>
                        <th className="text-center p-3 text-sm font-medium text-gray-600">
                          Status
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">
                          Started
                        </th>
                        <th className="text-center p-3 text-sm font-medium text-gray-600">
                          Time Taken
                        </th>
                        <th className="text-center p-3 text-sm font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResponses.map((response) => (
                        <tr
                          key={response.id}
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => viewResponseDetails(response.id)}
                        >
                          <td className="p-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium">
                                {response.studentName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {response.studentEmail}
                          </td>
                          <td className="p-3 text-center">
                            {response.score !== null ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <Award className="h-3 w-3 mr-1" />
                                {response.score}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(response.status)}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(response.startedAt).toLocaleDateString()}
                              <br />
                              <Clock className="h-3 w-3 mr-1 ml-2" />
                              {new Date(response.startedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="p-3 text-center text-sm text-gray-600">
                            <div className="flex items-center justify-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(response.timeTaken)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewResponseDetails(response.id);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
