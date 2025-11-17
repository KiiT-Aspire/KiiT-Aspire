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
  FileText,
  Volume2,
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

const ResponseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const responseId = params.responseId as string;

  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (interviewId && responseId) {
      fetchResponseDetails();
    }
  }, [interviewId, responseId]);

  // Cleanup audio on unmount
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
      const res = await fetch(
        `/api/interviews/${interviewId}/responses/${responseId}`
      );
      const data = await res.json();

      console.log("API Response:", data);

      if (data.success) {
        // Map the API response to match the expected structure
        const mappedResponse: ResponseDetails = {
          id: data.data.id,
          studentName: data.data.student?.name || "Unknown",
          studentEmail: data.data.student?.email || "N/A",
          score: data.data.score,
          evaluation: data.data.evaluation,
          status: data.data.status,
          startedAt: data.data.startedAt,
          completedAt: data.data.completedAt,
          timeTaken: data.data.timeTaken,
          questionAnswers: (data.data.answers || []).map((answer: any) => ({
            questionText: answer.questionText,
            audioUrl: answer.audioUrl,
            audioDuration: answer.audioDuration,
            questionOrder: answer.questionOrder,
            answeredAt: answer.answeredAt,
          })),
        };
        setResponse(mappedResponse);
      } else {
        toast.error("Failed to load response details");
      }
    } catch (error) {
      console.error("Error fetching response details:", error);
      toast.error("Error loading response details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <AlertCircle className="h-4 w-4 mr-1" />
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            <XCircle className="h-4 w-4 mr-1" />
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

  const playAudio = (audioUrl: string) => {
    // Stop currently playing audio if any
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // If clicking the same audio that's playing, just stop it
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      setAudioElement(null);
      return;
    }

    // Play new audio
    setPlayingAudio(audioUrl);
    const audio = new Audio(audioUrl);
    setAudioElement(audio);
    
    audio.play().catch(error => {
      console.error("Error playing audio:", error);
      toast.error("Failed to play audio");
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading response details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push(`/interview/${interviewId}/results`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Response not found
            </h3>
            <p className="text-gray-600">
              The response you're looking for doesn't exist
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/interview/${interviewId}/results`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">Response Details</h1>
          <p className="text-gray-600 mt-1">
            Detailed view of student's interview attempt
          </p>
        </div>

        {/* Student Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-medium text-lg">{response.studentName}</p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{response.studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">{getStatusBadge(response.status)}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Started At</p>
                    <p className="font-medium">
                      {new Date(response.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {response.completedAt && (
                  <div className="flex items-center mb-4">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Completed At</p>
                      <p className="font-medium">
                        {new Date(response.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Time Taken</p>
                    <p className="font-medium">
                      {formatDuration(response.timeTaken)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score and Evaluation Card */}
        {response.status === "completed" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Score & Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center">
                    <Award className="h-8 w-8 mr-3 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Final Score</p>
                      <p className="text-4xl font-bold text-green-600">
                        {response.score ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Overall Evaluation</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm">
                      {response.evaluation || "No evaluation provided"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions and Answers */}
        <Card>
          <CardHeader>
            <CardTitle>Questions & Answers</CardTitle>
            <CardDescription>
              Total questions answered: {response.questionAnswers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response.questionAnswers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions answered yet
              </div>
            ) : (
              <div className="space-y-6">
                {response.questionAnswers
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((qa, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-5 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-medium mr-3">
                              Q{qa.questionOrder}
                            </span>
                            <h4 className="font-medium text-gray-900">
                              Question
                            </h4>
                          </div>
                          <p className="text-gray-700 ml-11">{qa.questionText}</p>
                        </div>
                      </div>

                      <div className="ml-11 mt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Audio Answer
                            </p>
                            {qa.audioUrl ? (
                              <div className="flex items-center space-x-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => playAudio(qa.audioUrl!)}
                                  className="flex items-center"
                                >
                                  <Volume2 className="h-4 w-4 mr-2" />
                                  {playingAudio === qa.audioUrl
                                    ? "Playing..."
                                    : "Play Audio"}
                                </Button>
                                {qa.audioDuration && (
                                  <span className="text-sm text-gray-500">
                                    Duration: {qa.audioDuration}s
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                No audio recorded
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">Answered at</p>
                            <p className="text-sm text-gray-700">
                              {new Date(qa.answeredAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponseDetailPage;
