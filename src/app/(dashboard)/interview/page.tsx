"use client";

import { useState } from "react";
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
import { PlusCircle, Edit3, Users, BookOpen } from "lucide-react";

interface Question {
  id: string;
  text: string;
  subject: string;
}

interface Interview {
  id: string;
  name: string;
  subject: string;
  questions: Question[];
  candidatesCount: number;
  createdAt: string;
}

const InterviewPage = () => {
  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: "1",
      name: "Software Engineering Fundamentals",
      subject: "Software Engineering",
      questions: [
        {
          id: "q1",
          text: "What is the Software Development Life Cycle?",
          subject: "Software Engineering",
        },
        {
          id: "q2",
          text: "Explain the difference between Agile and Waterfall methodologies.",
          subject: "Software Engineering",
        },
      ],
      candidatesCount: 15,
      createdAt: "2024-08-01",
    },
    {
      id: "2",
      name: "Cloud Computing Basics",
      subject: "Cloud Computing",
      questions: [
        {
          id: "q3",
          text: "What are the main service models in cloud computing?",
          subject: "Cloud Computing",
        },
        {
          id: "q4",
          text: "Explain the concept of elasticity in cloud computing.",
          subject: "Cloud Computing",
        },
      ],
      candidatesCount: 8,
      createdAt: "2024-08-05",
    },
  ]);

  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [currentInterview, setCurrentInterview] = useState<Partial<Interview>>({
    name: "",
    subject: "",
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
  }>({
    text: "",
  });

  const questionSuggestions: Question[] = [
    // Software Engineering Questions
    {
      id: "sq1",
      text: "What is object-oriented programming?",
      subject: "Software Engineering",
    },
    {
      id: "sq2",
      text: "Explain design patterns and their importance.",
      subject: "Software Engineering",
    },
    {
      id: "sq3",
      text: "What is microservices architecture?",
      subject: "Software Engineering",
    },
    {
      id: "sq4",
      text: "Describe the MVC (Model-View-Controller) pattern.",
      subject: "Software Engineering",
    },
    {
      id: "sq5",
      text: "What is Test-Driven Development (TDD)?",
      subject: "Software Engineering",
    },
    {
      id: "sq6",
      text: "Explain the concept of RESTful APIs.",
      subject: "Software Engineering",
    },
    {
      id: "sq7",
      text: "What is version control and why is it important?",
      subject: "Software Engineering",
    },
    {
      id: "sq8",
      text: "Describe the difference between unit testing and integration testing.",
      subject: "Software Engineering",
    },
    // Cloud Computing Questions
    {
      id: "sq9",
      text: "What is Infrastructure as a Service (IaaS)?",
      subject: "Cloud Computing",
    },
    {
      id: "sq10",
      text: "Explain containerization and its benefits.",
      subject: "Cloud Computing",
    },
    {
      id: "sq11",
      text: "What is serverless computing?",
      subject: "Cloud Computing",
    },
    {
      id: "sq12",
      text: "Describe the differences between public, private, and hybrid clouds.",
      subject: "Cloud Computing",
    },
    {
      id: "sq13",
      text: "What is auto-scaling in cloud computing?",
      subject: "Cloud Computing",
    },
    {
      id: "sq14",
      text: "Explain the concept of load balancing.",
      subject: "Cloud Computing",
    },
    {
      id: "sq15",
      text: "What are the benefits of using cloud storage?",
      subject: "Cloud Computing",
    },
    {
      id: "sq16",
      text: "Describe the shared responsibility model in cloud security.",
      subject: "Cloud Computing",
    },
  ];

  const subjects = ["Software Engineering", "Cloud Computing"];

  const addQuestion = () => {
    if (currentQuestion.text && currentInterview.subject) {
      const newQuestion: Question = {
        id: `q${Date.now()}`,
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

  const addSuggestedQuestion = (question: Question) => {
    if (currentInterview.subject === question.subject) {
      setCurrentInterview((prev) => ({
        ...prev,
        questions: [
          ...(prev.questions || []),
          { ...question, id: `q${Date.now()}` },
        ],
      }));
    }
  };

  const removeQuestion = (questionId: string) => {
    setCurrentInterview((prev) => ({
      ...prev,
      questions: prev.questions?.filter((q) => q.id !== questionId) || [],
    }));
  };

  const saveInterview = () => {
    if (
      currentInterview.name &&
      currentInterview.subject &&
      currentInterview.questions?.length
    ) {
      const newInterview: Interview = {
        id: `int${Date.now()}`,
        name: currentInterview.name,
        subject: currentInterview.subject,
        questions: currentInterview.questions,
        candidatesCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setInterviews((prev) => [...prev, newInterview]);
      setCurrentInterview({
        name: "",
        subject: "",
        questions: [],
      });
      setIsCreateDialogOpen(false);
    }
  };

  const cancelInterview = () => {
    setCurrentInterview({
      name: "",
      subject: "",
      questions: [],
    });
    setIsCreateDialogOpen(false);
  };

  const viewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsViewDialogOpen(true);
  };

  const editInterview = (interview: Interview) => {
    setCurrentInterview({
      id: interview.id,
      name: interview.name,
      subject: interview.subject,
      questions: interview.questions,
      candidatesCount: interview.candidatesCount,
      createdAt: interview.createdAt,
    });
    setIsEditDialogOpen(true);
  };

  const updateInterview = () => {
    if (
      currentInterview.name &&
      currentInterview.subject &&
      currentInterview.questions?.length &&
      currentInterview.id
    ) {
      const updatedInterview: Interview = {
        id: currentInterview.id,
        name: currentInterview.name,
        subject: currentInterview.subject,
        questions: currentInterview.questions,
        candidatesCount: currentInterview.candidatesCount || 0,
        createdAt:
          currentInterview.createdAt || new Date().toISOString().split("T")[0],
      };

      setInterviews((prev) =>
        prev.map((interview) =>
          interview.id === currentInterview.id ? updatedInterview : interview
        )
      );
      setCurrentInterview({
        name: "",
        subject: "",
        questions: [],
      });
      setIsEditDialogOpen(false);
    }
  };

  const cancelEdit = () => {
    setCurrentInterview({
      name: "",
      subject: "",
      questions: [],
    });
    setIsEditDialogOpen(false);
  };

  const deleteInterview = (interviewId: string) => {
    setInterviews((prev) =>
      prev.filter((interview) => interview.id !== interviewId)
    );
    setIsViewDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Subject Filter and Create Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Label
              htmlFor="subject-filter"
              className="text-lg font-medium text-gray-700"
            >
              Filter by Subject:
            </Label>
            <Select
              value={selectedSubjectFilter}
              onValueChange={setSelectedSubjectFilter}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Interview</DialogTitle>
                <DialogDescription>
                  Set up a new mock interview with custom questions and
                  suggested questions to choose from.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Interview Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interview-name">Interview Name</Label>
                    <Input
                      id="interview-name"
                      placeholder="Enter interview name"
                      value={currentInterview.name || ""}
                      onChange={(e) =>
                        setCurrentInterview((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={currentInterview.subject || ""}
                      onValueChange={(value) =>
                        setCurrentInterview((prev) => ({
                          ...prev,
                          subject: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Custom Question */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3">
                    Add Custom Question
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="question-text">Question</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Enter your question"
                        value={currentQuestion.text}
                        onChange={(e) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex justify-end items-end">
                      <Button
                        onClick={addQuestion}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Question
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Question Suggestions */}
                {currentInterview.subject && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-800 mb-3">
                      Question Suggestions for {currentInterview.subject}
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {questionSuggestions
                        .filter((q) => q.subject === currentInterview.subject)
                        .map((question) => (
                          <div
                            key={question.id}
                            className="flex items-center justify-between bg-white p-3 rounded border hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm">{question.text}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addSuggestedQuestion(question)}
                              className="ml-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      {questionSuggestions.filter(
                        (q) => q.subject === currentInterview.subject
                      ).length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No suggestions available for this subject.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Questions */}
                {currentInterview.questions &&
                  currentInterview.questions.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Selected Questions ({currentInterview.questions.length})
                      </h3>
                      <div className="space-y-2">
                        {currentInterview.questions.map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                Q{index + 1}: {question.text}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeQuestion(question.id)}
                              className="ml-3"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={cancelInterview}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveInterview}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={
                      !currentInterview.name ||
                      !currentInterview.subject ||
                      !currentInterview.questions?.length
                    }
                  >
                    Save Interview
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Interview Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Interview Details</DialogTitle>
              <DialogDescription>
                View interview questions and manage interview settings.
              </DialogDescription>
            </DialogHeader>

            {selectedInterview && (
              <div className="space-y-6">
                {/* Interview Info */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Interview Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{selectedInterview.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Subject:</span>
                      <p className="font-medium">{selectedInterview.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Questions:</span>
                      <p className="font-medium">
                        {selectedInterview.questions.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Candidates:</span>
                      <p className="font-medium text-green-600">
                        {selectedInterview.candidatesCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <p className="font-medium">
                        {selectedInterview.createdAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Questions
                  </h3>
                  <div className="space-y-3">
                    {selectedInterview.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="bg-gray-50 p-3 rounded border"
                      >
                        <p className="text-sm font-medium">
                          Q{index + 1}: {question.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() =>
                      selectedInterview && deleteInterview(selectedInterview.id)
                    }
                  >
                    Delete Interview
                  </Button>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        if (selectedInterview) {
                          editInterview(selectedInterview);
                        }
                      }}
                    >
                      Edit Interview
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Interview Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Interview</DialogTitle>
              <DialogDescription>
                Modify interview details and questions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Interview Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-interview-name">Interview Name</Label>
                  <Input
                    id="edit-interview-name"
                    placeholder="Enter interview name"
                    value={currentInterview.name || ""}
                    onChange={(e) =>
                      setCurrentInterview((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Select
                    value={currentInterview.subject || ""}
                    onValueChange={(value) =>
                      setCurrentInterview((prev) => ({
                        ...prev,
                        subject: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Custom Question */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-3">
                  Add Custom Question
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-question-text">Question</Label>
                    <Textarea
                      id="edit-question-text"
                      placeholder="Enter your question"
                      value={currentQuestion.text}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex justify-end items-end">
                    <Button
                      onClick={addQuestion}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              </div>

              {/* Question Suggestions */}
              {currentInterview.subject && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-blue-800 mb-3">
                    Question Suggestions for {currentInterview.subject}
                  </h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {questionSuggestions
                      .filter((q) => q.subject === currentInterview.subject)
                      .map((question) => (
                        <div
                          key={question.id}
                          className="flex items-center justify-between bg-white p-3 rounded border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm">{question.text}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addSuggestedQuestion(question)}
                            className="ml-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Selected Questions */}
              {currentInterview.questions &&
                currentInterview.questions.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Selected Questions ({currentInterview.questions.length})
                    </h3>
                    <div className="space-y-2">
                      {currentInterview.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Q{index + 1}: {question.text}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeQuestion(question.id)}
                            className="ml-3"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  onClick={updateInterview}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={
                    !currentInterview.name ||
                    !currentInterview.subject ||
                    !currentInterview.questions?.length
                  }
                >
                  Update Interview
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Interviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews
            .filter(
              (interview) =>
                selectedSubjectFilter === "all" ||
                interview.subject === selectedSubjectFilter
            )
            .map((interview) => (
              <Card
                key={interview.id}
                className="bg-white shadow-sm border border-green-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <CardHeader className="pb-3 flex-none">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900">
                      {interview.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span>{interview.subject}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">
                        {interview.questions.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Candidates:</span>
                      </span>
                      <span className="font-medium text-green-600">
                        {interview.candidatesCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{interview.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => viewInterview(interview)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center"
                      onClick={() => editInterview(interview)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {interviews.filter(
          (interview) =>
            selectedSubjectFilter === "all" ||
            interview.subject === selectedSubjectFilter
        ).length === 0 && (
          <div className="text-center py-12">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedSubjectFilter === "all"
                ? "No interviews yet"
                : `No interviews found for ${selectedSubjectFilter}`}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedSubjectFilter === "all"
                ? "Create your first mock interview to get started"
                : `Create a new interview for ${selectedSubjectFilter} or change the filter`}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Interview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
