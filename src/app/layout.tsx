import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "EchoGrade",
  description: "Welcome to EchoGrade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-full">{children}</body>
    </html>
  );
}
