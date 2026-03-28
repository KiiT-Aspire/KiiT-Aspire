"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 min-h-screen bg-[#020202] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-[28px] font-bold text-white mb-2 tracking-tight">System Fault</h1>
        <p className="text-zinc-500 text-[15px] mb-10 leading-relaxed">
          The dashboard encountered an unexpected error. This has been logged and we're looking into it.
        </p>
        
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[14px] bg-white text-black font-bold text-[15px] transition-all hover:bg-zinc-200 shadow-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Retry System
          </motion.button>
          
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white/5 border border-white/10 text-white font-semibold text-[14px] transition-all hover:bg-white/10">
                <Home className="w-4 h-4" />
                Landing
              </button>
            </Link>
            <Link href="/interview" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-white/5 border border-white/10 text-white font-semibold text-[14px] transition-all hover:bg-white/10">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-[11px] font-mono text-zinc-700 tracking-tighter uppercase whitespace-normal break-all line-clamp-1 opacity-50">
          Error Hash: {error.digest || "UNRECOVERABLE_CORE_CRASH"}
        </div>
      </div>
    </div>
  );
}
