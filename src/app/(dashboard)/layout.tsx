import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "EchoGrade | Dashboard",
  description: "EchoGrade Dashboard",
};
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex bg-slate-950 min-h-screen font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <div className="flex-1 md:ml-64 ml-16 bg-slate-950">
        {children}
      </div>
    </div>
  );
}
