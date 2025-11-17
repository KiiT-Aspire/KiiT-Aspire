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
    <div className="relative">
      <Sidebar />
      <div className="md:ml-68 ml-20 mt-2 mr-2 bg-gray-100 p-2 rounded-xl min-h-screen">
        {children}
      </div>
    </div>
  );
}
