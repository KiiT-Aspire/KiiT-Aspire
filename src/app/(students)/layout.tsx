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
    <html lang="en">
      <body className="h-full relative">
        <div className="">{children}</div>
      </body>
    </html>
  );
}
