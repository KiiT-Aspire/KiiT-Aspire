"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex-1 min-h-screen bg-[#020202] flex items-center justify-center p-10">
      <div className="w-full max-w-[1000px] space-y-8 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-white/5 rounded-lg" />
            <div className="h-4 w-64 bg-white/5 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-white/5 rounded-lg" />
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 bg-white/5 rounded-2xl border border-white/5" />
          <div className="h-28 bg-white/5 rounded-2xl border border-white/5" />
          <div className="h-28 bg-white/5 rounded-2xl border border-white/5" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
      
      {/* Floating Spinner */}
      <div className="fixed bottom-8 right-8">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    </div>
  );
}
