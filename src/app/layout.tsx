import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "EchoGrade | AI Interviews",
  description: "Next-gen autonomous AI interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${outfit.className} bg-background text-foreground antialiased selection:bg-indigo-500/30 overflow-x-hidden`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

