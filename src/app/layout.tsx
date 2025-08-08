import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "KiiT Aspire",
  description: "Welcome to KiiT Aspire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
