import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoGrade | Dashboard",
  description: "EchoGrade – AI Interview Intelligence Platform",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex bg-[#020202] text-foreground min-h-screen">
      <Sidebar />
      {/* Main content - offset for sidebar (220px expanded, 64px collapsed) */}
      <div className="flex-1 ml-[220px] min-h-screen bg-[#020202] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
