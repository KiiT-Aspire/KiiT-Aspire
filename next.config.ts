import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent Next.js from trying to SSR these browser-only WebRTC packages.
  // They use browser APIs (RTCPeerConnection, MediaStream, etc.) that don't
  // exist on the server, so they must only run client-side.
  serverExternalPackages: [
    "@cloudflare/realtimekit",
    "@cloudflare/realtimekit-react",
  ],
};

export default nextConfig;
