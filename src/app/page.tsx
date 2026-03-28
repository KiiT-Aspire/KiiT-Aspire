"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import {
  BrainCircuit,
  Mic,
  BarChart3,
  Zap,
  ShieldCheck,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
         <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full point-events-none" />
         <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-cyan-600/20 blur-[120px] rounded-full point-events-none" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Aspire
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <Link href="/interview">
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-full"
                  >
                    Teacher Portal
                  </Button>
                </Link>
                <Link href="/interviewee">
                  <Button className="bg-white text-slate-950 hover:bg-slate-200 rounded-full font-semibold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Take Interview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 font-medium text-sm animate-fade-in-up">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Next-Gen AI Interview Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1]">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Evaluation Process.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
              Conduct adaptive oral interviews powered by real-time speech
              recognition, generative AI context switching, and automated technical scoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-8">
              <Link href="/interview">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-14 text-lg rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] transition-all group">
                  <BrainCircuit className="w-5 h-5 mr-no group-hover:rotate-12 transition-transform" />
                  Explore the Dashboard
                </Button>
              </Link>
              <Link href="/interviewee">
                <Button
                  variant="outline"
                  className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-14 text-lg rounded-full group"
                >
                  <Mic className="w-5 h-5 mr-2 group-hover:text-cyan-400 transition-colors" />
                  Try Sandbox Mode
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Dashboard Preview (Visual pure css mock) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-32 relative">
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
           <div className="w-full aspect-video rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex relative">
              {/* Fake Sidebar */}
              <div className="w-64 border-r border-slate-800/50 p-6 space-y-4 hidden md:block">
                 <div className="h-8 w-32 bg-slate-800 rounded-lg mb-8" />
                 <div className="h-4 w-full bg-indigo-500/20 rounded" />
                 <div className="h-4 w-3/4 bg-slate-800 rounded" />
                 <div className="h-4 w-5/6 bg-slate-800 rounded" />
              </div>
              {/* Fake Main Content */}
              <div className="flex-1 p-8">
                 <div className="flex justify-between mb-8">
                   <div className="h-10 w-48 bg-slate-800 rounded-xl" />
                   <div className="h-10 w-32 bg-indigo-600/50 rounded-xl" />
                 </div>
                 <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50" />
                    <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50" />
                    <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50" />
                 </div>
                 <div className="h-64 bg-slate-800/30 rounded-2xl border border-slate-700/50" />
              </div>
           </div>
        </div>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Engineered for <span className="text-indigo-400">Excellence</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Discover a suite of powerful tools designed to simplify and accelerate technical and behavioral candidate assessments.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: BrainCircuit, 
                  title: "Dynamic AI Questions",
                  desc: "Leverage advanced Generative AI to craft bespoke, contextual prompts that adapt naturally to candidate expertise levels.",
                  color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(79,70,229,0.2)]"
                },
                { 
                  icon: Mic, 
                  title: "Real-Time NLP",
                  desc: "Streamlined audio capture integrated directly into the browser. Captures nuance, speech patterns, and technical depth.",
                  color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                },
                { 
                  icon: BarChart3, 
                  title: "Predictive Analytics",
                  desc: "Watch metrics update live as candidates complete sessions. Review scoring benchmarks and cohort analysis instantly.",
                  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]"
                },
                { 
                  icon: FileText, 
                  title: "Automated Syntheses",
                  desc: "Receive holistic, paragraph-length evaluations summarizing strengths, weaknesses, and potential red flags completely hands-free.",
                  color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                },
                { 
                  icon: ShieldCheck, 
                  title: "Enterprise Grade",
                  desc: "Built on resilient, serverless infrastructure with strict data isolation, ensuring compliance and extreme scalability.",
                  color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                },
                { 
                  icon: Users, 
                  title: "Cohort Management",
                  desc: "Organize thousands of candidates via magic links. Set bulk time limits and monitor mass concurrency seamlessly.",
                  color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", glow: "group-hover:shadow-[0_0_30px_rgba(217,70,239,0.2)]"
                }
              ].map((feature, i) => (
                <Card key={i} className={`bg-slate-900/40 border-slate-800 hover:${feature.border} transition-all duration-300 group overflow-hidden relative ${feature.glow}`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl rounded-full ${feature.bg} -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform`} />
                  <CardContent className="p-8 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${feature.border} ${feature.bg}`}>
                      <feature.icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-slate-900 absolute -z-10 rounded-[100%] blur-[100px]" />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Streamlined Deployment
              </h2>
              <p className="text-xl text-slate-400">
                Setup your autonomous pipeline in less than 60 seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              {[
                 { step: "01", icon: FileText, title: "Initialize Sandbox", desc: "Designate subjects and inject AI prompts to construct the baseline evaluation matrix." },
                 { step: "02", icon: Clock, title: "Deploy Telemetry", desc: "Generate secure cryptographic links distributed with configurable time-limit protocols." },
                 { step: "03", icon: CheckCircle2, title: "Review Synthesis", desc: "Access the central command to view automated gradings, transcriptions, and deep analytics." }
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xl font-black text-indigo-400 mb-6 shadow-xl relative mt-4">
                     <span className="absolute -top-3 -bg-slate-900 px-2 text-xs text-slate-500">{item.step}</span>
                     <item.icon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm max-w-[280px]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 mt-10 mb-20">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-[40px] bg-gradient-to-r from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-xl">
              {/* Radial flare overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 relative z-10">
                Ready to Upgrade?
              </h2>
              <p className="text-xl md:text-2xl text-indigo-200/70 mb-10 max-w-2xl mx-auto relative z-10 font-light">
                Join advanced engineering teams scaling their interview processes autonomously.
              </p>
              <Link href="/interview">
                <Button className="bg-white text-indigo-950 hover:bg-slate-200 px-10 h-16 text-xl rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all font-bold group relative z-10">
                  Deploy Now
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <BrainCircuit className="w-6 h-6 text-indigo-500" />
              <span className="text-xl font-bold text-white">Aspire Framework</span>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Aspire Inc. Next.js 15 + Google GenAI Reference Architecture.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
