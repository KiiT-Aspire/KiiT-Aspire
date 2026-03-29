"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, FileText, BarChart3, Home,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

const menuItems = [
  { icon: Home, label: "Overview", href: "/", isExternal: true },
  { icon: FileText, label: "Interviews", href: "/interview" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 flex flex-col h-full bg-[#f0faf0] border-r border-green-200 z-50 transition-all duration-300 ${
        collapsed ? "w-16" : "w-[220px]"
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-green-200 bg-white/60">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(22,163,74,0.3)]">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[15px] font-bold text-gray-800 whitespace-nowrap overflow-hidden"
              >
                KIIT<span className="text-green-600">Aspire</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-6 h-6 items-center justify-center rounded-[6px] text-gray-400 hover:text-green-700 hover:bg-green-100 transition-all shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto bg-[#f0faf0]">
        {/* Section label */}
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-semibold uppercase tracking-widest text-green-700/40 px-3 pb-2 pt-1"
          >
            Navigation
          </motion.p>
        )}

        {menuItems.map((item, i) => {
          const isActive = pathname === item.href || (
            item.href !== "/" && pathname.startsWith(item.href)
          );
          const Icon = item.icon;

          return (
            <Link key={i} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "text-gray-500 hover:text-gray-800 hover:bg-green-50"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-green-500"
                  />
                )}

                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-700"
                  }`}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`text-[13px] font-medium whitespace-nowrap overflow-hidden ${
                        isActive ? "text-green-700" : ""
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white border border-green-200 rounded-[8px] text-[12px] text-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Bottom section — Clerk UserButton */}
      <div className="p-3 border-t border-green-200 bg-[#f0faf0]">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-white border border-green-200"
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-[12px] font-medium text-gray-800 truncate">
                {user?.fullName ?? user?.firstName ?? "Teacher"}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {user?.primaryEmailAddress?.emailAddress ?? "kiit.ac.in"}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex justify-center py-1">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}


