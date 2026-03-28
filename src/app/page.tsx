"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence, Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic, ArrowRight, Sparkles, Zap, Shield, BarChart3,
  ChevronRight, Play, Brain, Globe, Lock, Activity,
  AudioWaveform, MessagesSquare, Plus as PlusIcon, Menu, X,
  BookOpen, ClipboardList, GraduationCap, FileCheck, CheckCircle
} from "lucide-react";

// Animation variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

// Floating audio waveform visual
function WaveformVisual() {
  const bars = [3, 5, 8, 12, 8, 14, 10, 6, 9, 13, 7, 11, 5, 8, 4];
  return (
    <div className="flex items-center gap-[3px] h-8">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-green-600 to-emerald-400"
          animate={{ height: [`${h * 2}px`, `${h * 3.5}px`, `${h * 2}px`] }}
          transition={{ duration: 1.2 + i * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0
}: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
      className="group relative rounded-2xl border border-green-200 bg-white p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient} rounded-2xl`} />
      
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} mb-5 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[17px] font-semibold text-gray-900 mb-2.5 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-[14px] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Questioning",
      description: "The AI dynamically adapts questions based on each student's responses, probing deeper where needed and guiding them with targeted follow-ups.",
      gradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      icon: AudioWaveform,
      title: "Voice-Based Responses",
      description: "Students answer verbally — the AI transcribes, processes, and evaluates spoken answers in real-time, simulating a real oral examination.",
      gradient: "from-teal-500/10 to-cyan-500/10",
    },
    {
      icon: BarChart3,
      title: "Detailed Score Reports",
      description: "Faculty receive per-question transcripts, individual scores, and a comprehensive AI-generated evaluation for every student who completes an interview.",
      gradient: "from-emerald-500/10 to-green-600/10",
    },
    {
      icon: BookOpen,
      title: "Custom Question Banks",
      description: "Faculty can compose their own questions or use AI suggestions. Each interview is unique to the subject and topic being assessed.",
      gradient: "from-lime-500/10 to-green-500/10",
    },
    {
      icon: MessagesSquare,
      title: "Adaptive Follow-ups",
      description: "If a student's answer is incomplete, the AI provides one guided follow-up opportunity before moving to the next question.",
      gradient: "from-green-500/10 to-teal-500/10",
    },
    {
      icon: FileCheck,
      title: "Shareable Interview Links",
      description: "Once an interview is set up, faculty share a unique link with students. No account creation needed — students join directly from their browser.",
      gradient: "from-emerald-500/10 to-lime-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf8] text-gray-900 overflow-x-hidden selection:bg-green-200">

      {/* Background subtle pattern */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(22,163,74,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Static gradient orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-green-300/[0.12] blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-teal-300/[0.06] blur-[100px] rounded-full" />
      </div>

      {/* NAV */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full border-b border-green-200 bg-white/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(22,163,74,0.35)] group-hover:shadow-[0_0_30px_rgba(22,163,74,0.50)] transition-all duration-300">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-gray-900">
              KIIT<span className="text-green-600">Aspire</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {["Features", "How it Works", "For Students", "For Faculty"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[13px] font-medium text-gray-500 hover:text-green-700 transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/interview" className="hidden sm:block text-[13px] font-medium text-gray-500 hover:text-green-700 transition-colors">
              Faculty Login
            </Link>
            <Link href="/interview">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-9 px-4 rounded-[10px] bg-gradient-to-r from-green-500 to-emerald-600 text-[13px] font-semibold text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.45)] transition-all duration-200 flex items-center gap-1.5"
              >
                Set Up Interview
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-[10px] border border-green-200 text-gray-400 hover:text-green-700 hover:bg-green-50"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-green-100 bg-white px-6 py-8 space-y-6"
            >
              {["Features", "How it Works", "For Students", "For Faculty"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[17px] font-semibold text-gray-500 hover:text-green-700"
                >
                  {item}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                <Link href="/interview" onClick={() => setIsMobileMenuOpen(false)} className="text-[17px] font-semibold text-green-700">
                  Set Up Interview
                </Link>
                <Link href="/interview" onClick={() => setIsMobileMenuOpen(false)} className="text-[17px] font-semibold text-gray-500">
                  Faculty Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 min-h-[calc(100vh-60px)] flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-8">
            <div className="relative flex items-center gap-2 rounded-full border border-green-400/40 bg-green-50 px-4 py-2 text-[13px] font-medium text-green-700 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              AI-Powered Oral Interview System — KIIT University
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[3.5rem] sm:text-[5rem] lg:text-[6rem] font-bold tracking-[-0.04em] leading-[0.95] text-gray-900 mb-6"
          >
            Smarter Oral
            <br />
            <span
              className="font-extrabold"
              style={{
                background: "linear-gradient(135deg, #15803d 0%, #16a34a 40%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Examinations
            </span>{" "}
            <span className="text-gray-600">for KIIT</span>
          </motion.h1>

          {/* Sub caption */}
          <motion.p
            variants={fadeUp}
            className="text-[1.125rem] sm:text-[1.25rem] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10 font-normal tracking-tight"
          >
            Faculty set up interview sessions with custom questions. Students are evaluated by an AI interviewer that listens, adapts, and scores their verbal responses in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/interview">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(22,163,74,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="group relative h-[52px] px-8 rounded-[14px] bg-gradient-to-r from-green-500 to-emerald-600 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(22,163,74,0.3)] transition-all duration-200 flex items-center gap-2.5 overflow-hidden"
              >
                <span className="relative z-10">Faculty Dashboard</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
              </motion.button>
            </Link>

            <Link href="/interviewee">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="h-[52px] px-8 rounded-[14px] border border-green-300 bg-white text-[15px] font-medium text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200 flex items-center gap-2.5"
              >
                <Mic className="w-4 h-4 text-green-500" />
                Try as Student
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-6xl mx-auto px-6 pb-32"
      >
        <div className="relative">
          {/* Glow behind card */}
          <div className="absolute inset-x-10 top-10 bottom-0 bg-green-500/[0.07] blur-[60px] rounded-full" />

          {/* Card */}
          <div className="relative rounded-[24px] border border-green-200 bg-white overflow-hidden shadow-[0_20px_80px_rgba(22,163,74,0.1)]">
            {/* Browser bar */}
            <div className="flex items-center gap-4 px-5 py-3.5 border-b border-green-100 bg-green-50/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-7 w-72 bg-white border border-green-200 rounded-[8px] flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full border border-green-300" />
                  <div className="text-[11px] text-gray-400">kiit-aspire.edu/dashboard</div>
                </div>
              </div>
              <div className="w-24 flex justify-end gap-1.5">
                {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded bg-green-100" />)}
              </div>
            </div>

            {/* App content */}
            <div className="flex h-[480px]">
              {/* Sidebar */}
              <div className="w-[200px] border-r border-green-100 p-4 flex flex-col gap-3 bg-green-50/30">
                <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3">
                  <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <GraduationCap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-800">KIITAspire</span>
                </div>
                {[
                  { label: "Dashboard", active: false },
                  { label: "Interviews", active: true },
                  { label: "Results", active: false },
                  { label: "Settings", active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-[8px] text-[12px] font-medium ${
                      item.active
                        ? "bg-green-500/15 text-green-700 border border-green-500/20"
                        : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 overflow-hidden bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-5 w-40 bg-gray-200 rounded-[6px] mb-1.5" />
                    <div className="h-3 w-56 bg-gray-100 rounded-[4px]" />
                  </div>
                  <div className="h-8 w-36 bg-gradient-to-r from-green-500/30 to-emerald-600/30 rounded-[8px]" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Interviews", value: "12", color: "from-green-100 to-emerald-100" },
                    { label: "Avg Score", value: "78%", color: "from-teal-100 to-cyan-100" },
                    { label: "Students", value: "47", color: "from-emerald-100 to-green-100" },
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-[12px] border border-green-100 bg-gradient-to-br ${stat.color} p-4`}>
                      <div className="h-3 w-20 bg-green-200/60 rounded mb-2.5" />
                      <div className="h-6 w-14 bg-green-700/20 rounded-[4px]" />
                    </div>
                  ))}
                </div>

                {/* Interview cards */}
                <div className="space-y-2.5">
                  {[
                    { w: "w-32", c: "bg-green-400/60" },
                    { w: "w-44", c: "bg-emerald-400/60" },
                    { w: "w-36", c: "bg-teal-400/60" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 rounded-[10px] border border-green-100 bg-green-50/40 hover:bg-green-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${item.c} opacity-50 shrink-0`} />
                      <div className="flex-1 flex items-center gap-4">
                        <div className={`h-3 ${item.w} bg-gray-200 rounded`} />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                      <div className="h-6 w-16 rounded-[6px] bg-green-100 border border-green-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Capabilities
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-[2.5rem] sm:text-[3.5rem] font-bold tracking-[-0.04em] text-gray-900 mb-5">
            What KIITAspire
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #15803d 0%, #16a34a 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              delivers for you.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 text-[17px] max-w-2xl mx-auto leading-relaxed">
            A complete oral interview system built for KIIT University — enabling faculty to assess students at scale while maintaining academic rigor.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-32 border-t border-green-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700 mb-5">
              <Zap className="w-3.5 h-3.5" />
              How It Works
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-[2.5rem] sm:text-[3.5rem] font-bold tracking-[-0.04em] text-gray-900">
              Up and running in minutes.
            </motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-green-400/60 via-emerald-400/40 to-transparent -translate-x-1/2" />

            <div className="space-y-16">
              {[
                {
                  step: "01",
                  title: "Set Up an Interview",
                  description: "Faculty define the subject, add custom questions (or use AI suggestions), and set a time limit. Everything is configured in one clean form.",
                  icon: PlusIcon,
                },
                {
                  step: "02",
                  title: "Share the Student Link",
                  description: "A unique interview link is generated. Faculty share it with students — no app download, no account creation required for students.",
                  icon: Globe,
                },
                {
                  step: "03",
                  title: "AI Conducts the Interview",
                  description: "The AI interviewer asks each question verbally, listens to student responses, and provides a guided follow-up if an answer needs improvement.",
                  icon: Brain,
                },
                {
                  step: "04",
                  title: "Review Results in the Dashboard",
                  description: "Faculty access transcripts, per-question scores, and an AI-generated performance summary for each student — all in one place.",
                  icon: BarChart3,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`flex gap-8 items-start ${i % 2 !== 0 ? "md:flex-row-reverse md:text-right" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 flex items-center justify-center z-10 relative">
                      <span className="text-[13px] font-bold text-green-700">{step.step}</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-[22px] font-bold text-gray-900 mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed max-w-lg">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOR STUDENTS */}
      <section id="for-students" className="relative z-10 py-24 border-t border-green-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <motion.div variants={fadeUp} className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700 mb-5">
                <GraduationCap className="w-3.5 h-3.5" />
                For Students
              </div>
              <h2 className="text-[2.5rem] font-bold tracking-[-0.04em] text-gray-900 mb-5">
                Practice your answers.<br />
                <span className="text-gray-500 font-medium">No stress, no panic.</span>
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                Students receive a link, enter their name and email, and begin speaking their answers. The AI guides them through each question with patience and clarity.
              </p>
              <div className="space-y-3">
                {[
                  "Hold spacebar to record your verbal answer",
                  "Receive a guided follow-up if your first answer is incomplete",
                  "Get a final performance score at the end",
                  "No login or app installation required",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-600 text-[14px]">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={scaleIn} className="flex-1 flex justify-center">
              <div className="relative w-72 h-72 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-green-100/60 border border-green-200 animate-pulse" />
                <div className="absolute inset-6 rounded-full bg-green-100/40 border border-green-200 animate-pulse" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-12 rounded-full bg-green-100/30 border border-green-300 animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(22,163,74,0.25)]">
                  <Mic className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOR FACULTY */}
      <section id="for-faculty" className="relative z-10 py-24 border-t border-green-100 bg-green-50/40">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row-reverse items-center gap-16"
          >
            <motion.div variants={fadeUp} className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-white px-3 py-1.5 text-[12px] font-medium text-green-700 mb-5">
                <ClipboardList className="w-3.5 h-3.5" />
                For Faculty
              </div>
              <h2 className="text-[2.5rem] font-bold tracking-[-0.04em] text-gray-900 mb-5">
                Conduct oral exams<br />
                <span className="text-gray-500 font-medium">at your own pace.</span>
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                Faculty create interview sessions with specific questions and share the link with their students. Results are automatically collected for every submission.
              </p>
              <div className="space-y-3">
                {[
                  "Create interview sessions with custom questions",
                  "Use AI to automatically suggest subject-relevant questions",
                  "Set a time limit per interview session",
                  "View all results and scores from one dashboard",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-600 text-[14px]">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={scaleIn} className="flex-1 flex justify-center">
              <div className="relative w-72 h-72 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-green-100/60 border border-green-200 animate-pulse" />
                <div className="absolute inset-6 rounded-full bg-green-100/40 border border-green-200 animate-pulse" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-12 rounded-full bg-green-100/30 border border-green-300 animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(22,163,74,0.25)]">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 border-t border-green-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-green-400/20 blur-3xl rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(22,163,74,0.35)]">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-[3rem] sm:text-[4rem] font-bold tracking-[-0.04em] text-gray-900 mb-5"
            >
              Ready to modernize
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #15803d 0%, #16a34a 60%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                your oral exams?
              </span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-gray-500 text-[17px] mb-10 max-w-xl mx-auto">
              Set up your first AI interview session in under 5 minutes. Faculty login is all you need to get started.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/interview">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(22,163,74,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="h-[52px] px-10 rounded-[14px] bg-gradient-to-r from-green-500 to-emerald-600 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(22,163,74,0.3)] transition-all duration-200 flex items-center gap-2"
                >
                  Set Up an Interview
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/interviewee">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-[52px] px-8 rounded-[14px] border border-green-300 bg-white text-[15px] font-medium text-green-700 hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Try as Student
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-green-100 py-10 bg-green-50/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-700">
              KIIT<span className="text-green-600">Aspire</span>
            </span>
          </div>
          <p className="text-gray-400 text-[13px]">
            © 2025 KIITAspire — AI Interview Platform for KIIT University.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Support"].map((link) => (
              <a key={link} href="#" className="text-[13px] text-gray-400 hover:text-green-700 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
