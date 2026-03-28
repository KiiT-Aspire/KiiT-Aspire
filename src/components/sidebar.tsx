"use client";

import { BrainCircuit, Settings, FileText, BarChart3, LogOut, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: <Home size={20} />, label: "Overview", href: "/", isExternal: true },
    { icon: <FileText size={20} />, label: "Interviews", href: "/interview", isExternal: false },
    { icon: <BarChart3 size={20} />, label: "Results", href: "/results", isExternal: false },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings", isExternal: false },
  ];

  return (
    <div className="fixed top-0 left-0 flex-col h-full bg-slate-950 w-16 md:w-64 border-r border-slate-800 z-50 flex justify-between">
      
      {/* Top Section */}
      <div>
        <div className="p-4 md:p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-800/50 mb-4 h-20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="hidden md:block text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Aspire
          </span>
        </div>

        {/* Menu items */}
        <div className="flex flex-col px-3 md:px-4 space-y-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                href={item.href}
                key={index}
                className={`flex items-center justify-center md:justify-start gap-3 p-3 w-full rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"}
                `}
              >
                <div className={`${isActive ? "text-indigo-400" : "group-hover:text-indigo-400 transition-colors"}`}>
                  {item.icon}
                </div>
                <span className="hidden md:inline font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 md:p-4 border-t border-slate-800/50">
        <Link
          href="#"
          className="flex items-center justify-center md:justify-start gap-3 p-3 w-full rounded-xl transition-all duration-300 group text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={20} className="group-hover:text-rose-400 transition-colors shrink-0" />
          <span className="hidden md:inline font-medium text-sm">Sign Out</span>
        </Link>
      </div>

    </div>
  );
};

export default Sidebar;
