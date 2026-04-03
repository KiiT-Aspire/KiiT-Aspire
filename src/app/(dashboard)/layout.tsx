import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "EchoGrade | Faculty Dashboard",
  description: "EchoGrade – AI Oral Interview Platform for KIIT University",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

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
