import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KIITAspire | Faculty Dashboard",
  description: "KIITAspire – AI Oral Interview Platform for KIIT University",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex bg-[#f8faf8] text-foreground min-h-screen">
      <Sidebar />
      {/* Main content - offset for sidebar (220px expanded, 64px collapsed) */}
      <div className="flex-1 ml-[220px] min-h-screen bg-[#f8faf8] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
