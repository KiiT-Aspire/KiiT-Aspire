"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import {
  BsRobot,
  BsMicFill,
  BsGraphUpArrow,
  BsLightning,
  BsShieldCheck,
  BsPeopleFill,
} from "react-icons/bs";
import { FiFileText, FiCheckCircle, FiClock } from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-green-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/kiit-logo.jpg"
                alt="KiiT Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-green-800">
                EchoGrade
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/interview">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/interviewee">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Start Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 font-medium">
              <BsLightning className="text-yellow-500" />
              <span>AI-Powered Interview Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
              Transform Your Interview
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                Experience with AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Conduct adaptive, intelligent interviews with real-time speech
              recognition, AI-generated questions, and comprehensive evaluation
              reports.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/interview">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                  <BsRobot className="mr-2" size={24} />
                  Create Interview
                </Button>
              </Link>
              <Link href="/interviewee">
                <Button
                  variant="outline"
                  className="border-2 border-green-600 text-green-700 hover:bg-green-50 px-8 py-6 text-lg rounded-xl"
                >
                  <BsMicFill className="mr-2" size={20} />
                  Take Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for modern interview management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <BsRobot className="text-green-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  AI-Powered Questions
                </h3>
                <p className="text-gray-600">
                  Leverage Google GenAI to generate contextual, adaptive
                  interview questions that match candidate responses in
                  real-time.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <BsMicFill className="text-blue-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Speech Recognition
                </h3>
                <p className="text-gray-600">
                  Advanced audio recording and speech-to-text capabilities for
                  seamless voice-based interviews with real-time transcription.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <BsGraphUpArrow className="text-purple-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Adaptive Flow
                </h3>
                <p className="text-gray-600">
                  Dynamic interview paths that adjust difficulty and topics
                  based on candidate performance and expertise level.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 border-yellow-100 hover:border-yellow-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <FiFileText className="text-yellow-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Comprehensive Reports
                </h3>
                <p className="text-gray-600">
                  Detailed evaluation reports with scores, feedback, and
                  performance analytics for every interview session.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 border-red-100 hover:border-red-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <BsShieldCheck className="text-red-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Secure & Private
                </h3>
                <p className="text-gray-600">
                  Enterprise-grade security with user authentication, role-based
                  access, and encrypted data storage using PostgreSQL.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-xl">
              <CardContent className="pt-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <BsPeopleFill className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Multi-User Support
                </h3>
                <p className="text-gray-600">
                  Manage multiple candidates, track interview sessions, and
                  organize assessments by subject areas and roles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiFileText className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Create Interview
              </h3>
              <p className="text-gray-600">
                Set up your interview with custom questions, subjects, and
                evaluation criteria.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiClock className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Conduct Session
              </h3>
              <p className="text-gray-600">
                AI guides the interview with adaptive questions based on
                candidate responses.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Get Results
              </h3>
              <p className="text-gray-600">
                Receive detailed evaluation reports with scores and
                comprehensive feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Interviews?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join EchoGrade today and experience the future of intelligent
            interviewing.
          </p>
          <Link href="/interview">
            <Button className="bg-white text-green-700 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/kiit-logo.jpg"
                  alt="KiiT Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-2xl font-bold text-white">EchoGrade</span>
              </div>
              <p className="text-gray-400">
                AI-powered interview platform for modern recruitment and
                assessment.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/interview"
                    className="hover:text-green-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/interviewee"
                    className="hover:text-green-400 transition-colors"
                  >
                    Take Interview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/results"
                    className="hover:text-green-400 transition-colors"
                  >
                    Results
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Next.js 15</li>
                <li>Google GenAI</li>
                <li>Speech Recognition</li>
                <li>PostgreSQL</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
