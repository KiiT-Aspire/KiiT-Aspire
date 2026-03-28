"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence, Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mic, ArrowRight, Sparkles, Zap, Shield, BarChart3,
  ChevronRight, Check, Play, Star, Users, TrendingUp,
  Brain, Globe, Lock, Activity, AudioWaveform, MessagesSquare, Plus, Menu, X
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

// Animated counter
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const duration = 1800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Orbiting dots background
function OrbDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/[0.04]"
          style={{
            width: `${400 + i * 250}px`,
            height: `${400 + i * 250}px`,
            top: "50%",
            left: "50%",
            x: "-50%",
            y: "-50%",
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 30 + i * 15, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute w-2 h-2 rounded-full bg-indigo-500/40"
            style={{ top: "0%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </motion.div>
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
      className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient} rounded-2xl`} />
      
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} mb-5 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[17px] font-semibold text-white mb-2.5 tracking-tight">{title}</h3>
        <p className="text-zinc-400 text-[14px] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Stat card
function StatCard({ number, suffix, label }: { number: number; suffix: string; label: string }) {
  return (
    <motion.div variants={scaleIn} className="text-center">
      <div className="text-4xl font-bold text-white mb-1 tracking-tight">
        <AnimatedCounter value={number} suffix={suffix} />
      </div>
      <p className="text-zinc-500 text-[13px]">{label}</p>
    </motion.div>
  );
}

// Floating audio waveform visual
function WaveformVisual() {
  const bars = [3, 5, 8, 12, 8, 14, 10, 6, 9, 13, 7, 11, 5, 8, 4];
  return (
    <div className="flex items-center gap-[3px] h-8">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-indigo-500 to-violet-400"
          animate={{ height: [`${h * 2}px`, `${h * 3.5}px`, `${h * 2}px`] }}
          transition={{ duration: 1.2 + i * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Context-Aware AI",
      description: "Dynamically generates questions tailored to each candidate's resume, role, and seniority level in real-time.",
      gradient: "from-indigo-600/10 to-violet-600/10",
    },
    {
      icon: AudioWaveform,
      title: "Sub-Second Latency",
      description: "Optimized speech-to-text pipeline ensures fluid, natural conversation flow with imperceptible delays.",
      gradient: "from-cyan-600/10 to-blue-600/10",
    },
    {
      icon: BarChart3,
      title: "Deterministic Scoring",
      description: "Objective rubric-based evaluation eliminates bias. Every response scored through structured JSON pipelines.",
      gradient: "from-emerald-600/10 to-teal-600/10",
    },
    {
      icon: Globe,
      title: "Multi-Domain Support",
      description: "Covers software engineering, system design, cloud, data science, and frontend with specialized question banks.",
      gradient: "from-orange-600/10 to-amber-600/10",
    },
    {
      icon: MessagesSquare,
      title: "Adaptive Follow-ups",
      description: "AI listens, understands answers, and probes deeper — just like a seasoned senior engineer would.",
      gradient: "from-pink-600/10 to-rose-600/10",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "SOC2 compliant infrastructure. All interview recordings encrypted at rest and in transit.",
      gradient: "from-purple-600/10 to-indigo-600/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-foreground overflow-x-hidden selection:bg-indigo-500/30">
      {/* Cursor glow */}
      <motion.div
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          x: mousePos.x - 200,
          y: mousePos.y - 200,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      {/* Background grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Static gradient orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/[0.08] blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-600/[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-cyan-600/[0.05] blur-[100px] rounded-full" />
      </div>

      {/* NAV */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/40 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300">
              <AudioWaveform className="h-4 w-4 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-white">
              Echo<span className="text-indigo-400">Grade</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {["Features", "How it Works", "Security", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/interview" className="hidden sm:block text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/interview">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="h-9 px-4 rounded-[10px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[13px] font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-200 flex items-center gap-1.5"
              >
                Get Started
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            >
              <Menu className="h-5 w-5" />
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
              className="md:hidden border-t border-white/[0.06] bg-black/95 px-6 py-8 space-y-6"
            >
              {["Features", "How it Works", "Security", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[17px] font-semibold text-zinc-400 hover:text-white"
                >
                  {item}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                <Link href="/interview" onClick={() => setIsMobileMenuOpen(false)} className="text-[17px] font-semibold text-white">
                  Get Started
                </Link>
                <Link href="/interview" onClick={() => setIsMobileMenuOpen(false)} className="text-[17px] font-semibold text-zinc-500">
                  Sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 min-h-[calc(100vh-60px)] flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">
        <OrbDots />

        <motion.style initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {`@keyframes pulse-glow {
            0%,100%{box-shadow:0 0 30px rgba(99,102,241,0.4),0 0 80px rgba(99,102,241,0.15);}
            50%{box-shadow:0 0 50px rgba(99,102,241,0.6),0 0 120px rgba(99,102,241,0.25);}
          }`}
        </motion.style>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-8">
            <div className="relative flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/[0.08] px-4 py-2 text-[13px] font-medium text-indigo-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              EchoGrade v2.0 · Now with Adaptive Follow-ups
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] font-bold tracking-[-0.04em] leading-[0.95] text-white mb-6"
          >
            AI-Powered
            <br />
            <span
              className="font-extrabold"
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #e879f9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Technical
            </span>{" "}
            <span className="text-white/80">Interviews</span>
          </motion.h1>

          {/* Sub caption */}
          <motion.p
            variants={fadeUp}
            className="text-[1.125rem] sm:text-[1.25rem] text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal tracking-tight"
          >
            Deploy autonomous AI interviewers that adapt to each candidate. Real-time speech processing,
            deterministic scoring, and deep technical evaluation — at any scale.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/interview">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="group relative h-[52px] px-8 rounded-[14px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] transition-all duration-200 flex items-center gap-2.5 overflow-hidden"
              >
                <span className="relative z-10">Start for free</span>
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
                className="h-[52px] px-8 rounded-[14px] border border-white/10 bg-white/[0.03] text-[15px] font-medium text-white hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 flex items-center gap-2.5 backdrop-blur-sm"
              >
                <Mic className="w-4 h-4 text-zinc-400" />
                Try Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 mt-12">
            <div className="flex items-center -space-x-2">
              {["bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-black/80 ${c} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {["A","B","C","D"][i]}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-zinc-500">
              <span className="text-white font-semibold">2,400+</span> teams trust EchoGrade
            </p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[13px] text-zinc-500 ml-1">4.9/5</span>
            </div>
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
          <div className="absolute inset-x-10 top-10 bottom-0 bg-indigo-600/10 blur-[60px] rounded-full" />

          {/* Card */}
          <div className="relative rounded-[24px] border border-white/[0.08] bg-[#080808] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
            {/* Browser bar */}
            <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-7 w-72 bg-black/60 border border-white/[0.06] rounded-[8px] flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full border border-white/20" />
                  <div className="text-[11px] text-zinc-600">app.echograde.ai/dashboard</div>
                </div>
              </div>
              <div className="w-24 flex justify-end gap-1.5">
                {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded bg-white/[0.04]" />)}
              </div>
            </div>

            {/* App content */}
            <div className="flex h-[480px]">
              {/* Sidebar */}
              <div className="w-[200px] border-r border-white/[0.05] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3">
                  <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <AudioWaveform className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-white">EchoGrade</span>
                </div>
                {[
                  { label: "Dashboard", active: false },
                  { label: "Evaluations", active: true },
                  { label: "Results", active: false },
                  { label: "Settings", active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-[8px] text-[12px] font-medium ${
                      item.active
                        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                        : "text-zinc-500"
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-5 w-40 bg-white/80 rounded-[6px] mb-1.5" />
                    <div className="h-3 w-56 bg-white/15 rounded-[4px]" />
                  </div>
                  <div className="h-8 w-28 bg-gradient-to-r from-indigo-500/40 to-violet-600/40 rounded-[8px]" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Interviews", value: "128", color: "from-indigo-600/20 to-violet-600/20" },
                    { label: "Avg Score", value: "84%", color: "from-emerald-600/20 to-cyan-600/20" },
                    { label: "Candidates", value: "341", color: "from-pink-600/20 to-rose-600/20" },
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-[12px] border border-white/[0.06] bg-gradient-to-br ${stat.color} p-4`}>
                      <div className="h-3 w-20 bg-white/20 rounded mb-2.5" />
                      <div className="h-6 w-14 bg-white/80 rounded-[4px]" />
                    </div>
                  ))}
                </div>

                {/* Interview cards */}
                <div className="space-y-2.5">
                  {[
                    { w: "w-32", c: "bg-indigo-400/60" },
                    { w: "w-44", c: "bg-violet-400/60" },
                    { w: "w-36", c: "bg-cyan-400/60" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 rounded-[10px] border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className={`w-8 h-8 rounded-full ${item.c} opacity-40 shrink-0`} />
                      <div className="flex-1 flex items-center gap-4">
                        <div className={`h-3 ${item.w} bg-white/30 rounded`} />
                        <div className="h-3 w-20 bg-white/15 rounded" />
                      </div>
                      <div className="h-6 w-16 rounded-[6px] bg-emerald-500/20 border border-emerald-500/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* STATS */}
      <section className="relative z-10 border-y border-white/[0.05] py-16 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
          >
            <StatCard number={2400} suffix="+" label="Companies using EchoGrade" />
            <StatCard number={98} suffix="%" label="Interviewer accuracy rate" />
            <StatCard number={50} suffix="ms" label="Average response latency" />
            <StatCard number={10} suffix="x" label="Faster than manual interviews" />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-1.5 text-[12px] font-medium text-indigo-400 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Capabilities
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-[2.5rem] sm:text-[3.5rem] font-bold tracking-[-0.04em] text-white mb-5">
            Everything you need to
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c084fc 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              hire brilliantly.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-400 text-[17px] max-w-2xl mx-auto leading-relaxed">
            EchoGrade gives your team an unfair advantage with AI that thinks, listens, and evaluates like your best interviewer.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-3 py-1.5 text-[12px] font-medium text-violet-400 mb-5">
              <Zap className="w-3.5 h-3.5" />
              How It Works
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-[2.5rem] sm:text-[3.5rem] font-bold tracking-[-0.04em] text-white">
              Up and running in minutes.
            </motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-indigo-500/40 via-violet-500/40 to-transparent -translate-x-1/2" />

            <div className="space-y-16">
              {[
                {
                  step: "01",
                  title: "Create an Evaluation",
                  description: "Define the role, select your domain, set time limits, and either write custom questions or let AI generate a calibrated question bank.",
                  icon: Plus,
                },
                {
                  step: "02",
                  title: "Share the Link",
                  description: "Send candidates a unique interview link. They join from any browser — no downloads, no friction, zero setup required.",
                  icon: Globe,
                },
                {
                  step: "03",
                  title: "AI Conducts the Interview",
                  description: "EchoGrade's AI handles the full conversation — asking questions, following up on gaps, and evaluating answers in real-time.",
                  icon: Brain,
                },
                {
                  step: "04",
                  title: "Review Detailed Results",
                  description: "Get full transcripts, per-question scores, strengths & weaknesses, and a final hiring recommendation in your dashboard.",
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
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center z-10 relative">
                      <span className="text-[13px] font-bold text-indigo-400">{step.step}</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-[22px] font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-zinc-400 text-[15px] leading-relaxed max-w-lg">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="relative z-10 py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <motion.div variants={fadeUp} className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-[12px] font-medium text-emerald-400 mb-5">
                <Shield className="w-3.5 h-3.5" />
                Enterprise Security
              </div>
              <h2 className="text-[2.5rem] font-bold tracking-[-0.04em] text-white mb-5">
                Built for enterprise.<br />
                <span className="text-zinc-400 font-medium">Trusted by all.</span>
              </h2>
              <p className="text-zinc-400 text-[15px] leading-relaxed mb-8">
                EchoGrade is built with security at its core. All data is encrypted, access-controlled,
                and compliant with global standards.
              </p>
              <div className="space-y-3">
                {[
                  "SOC 2 Type II Compliant",
                  "GDPR & CCPA Ready",
                  "End-to-end encrypted recordings",
                  "Role-based access controls",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-zinc-300 text-[14px]">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={scaleIn} className="flex-1 flex justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/10 animate-pulse" />
                <div className="absolute inset-6 rounded-full bg-emerald-500/8 border border-emerald-500/15 animate-pulse" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA / PRICING */}
      <section id="pricing" className="relative z-10 py-32 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <AudioWaveform className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-[3rem] sm:text-[4rem] font-bold tracking-[-0.04em] text-white mb-5"
            >
              Ready to transform
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #818cf8 0%, #c084fc 60%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                how you hire?
              </span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-zinc-400 text-[17px] mb-10 max-w-xl mx-auto">
              Join thousands of engineering teams who've already cut interview time by 10x without sacrificing quality.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/interview">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(99,102,241,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="h-[52px] px-10 rounded-[14px] bg-gradient-to-r from-indigo-500 to-violet-600 text-[15px] font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.35)] transition-all duration-200 flex items-center gap-2"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/interviewee">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-[52px] px-8 rounded-[14px] border border-white/10 bg-white/[0.03] text-[15px] font-medium text-white hover:bg-white/[0.07] transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch demo
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <AudioWaveform className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-white/80">
              Echo<span className="text-indigo-400">Grade</span>
            </span>
          </div>
          <p className="text-zinc-600 text-[13px]">
            © 2025 EchoGrade. All rights reserved. Built relentlessly.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Status"].map((link) => (
              <a key={link} href="#" className="text-[13px] text-zinc-500 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
